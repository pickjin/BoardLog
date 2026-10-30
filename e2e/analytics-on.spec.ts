import { type Page, test } from '@playwright/test';
import { savePlayAndCopyShareLink } from './flows';
import { check, hasText, MOBILE, readStores, visible } from './helpers';

// Runs against the build made with a fake GA4 id (`npm run build:ga`, Playwright project "analytics-build").
const GA_ID = 'G-TEST123456';
const ALLOWED_EVENTS = new Set([
  'page_view',
  'play_saved',
  'share_sheet_opened',
  'share_link_opened',
  'share_link_added',
  'game_added',
  'catalog_exported',
  'kakao_list_shared',
  'backup_exported',
  'backup_restored',
  'play_photo_added'
]);

test.use({ viewport: MOBILE, permissions: ['clipboard-read', 'clipboard-write'] });

type Command = unknown[];

/** The commands gtag queued, as plain arrays (the queue holds `arguments` objects). */
const readDataLayer = (page: Page) =>
  page.evaluate(() => {
    const layer = (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [];
    return layer.map((entry) => Array.from(entry));
  }) as Promise<Command[]>;

const eventsOf = (layer: Command[]) =>
  layer
    .filter((c) => c[0] === 'event')
    .map((c) => ({ name: String(c[1]), params: (c[2] ?? {}) as Record<string, unknown> }));

test('with a measurement id: only listed events are sent and the share fragment never is (FR-MEAS-03)', async ({
  browser,
  baseURL
}) => {
  const gaRequests: string[] = [];
  const open = async () => {
    const context = await browser.newContext({
      baseURL,
      viewport: MOBILE,
      permissions: ['clipboard-read', 'clipboard-write']
    });
    // Google is never contacted: the loader is answered locally and anything else is dropped.
    await context.route(/googletagmanager\.com/, (route) => {
      gaRequests.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });
    await context.route(/google-analytics\.com|analytics\.google\.com|doubleclick\.net/, (route) => {
      gaRequests.push(route.request().url());
      return route.abort();
    });
    return { context, page: await context.newPage() };
  };

  // ── Sharer (철수) opens the app and records a play ──
  const sharer = await open();
  await sharer.page.goto('/', { waitUntil: 'networkidle' });
  const link = await savePlayAndCopyShareLink(sharer.page);
  const sharerLayer = await readDataLayer(sharer.page);

  check(
    'gtag 로더 요청이 측정 ID로 나감',
    gaRequests.some((url) => url === `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`),
    gaRequests.join(' | ')
  );
  const config = sharerLayer.find((c) => c[0] === 'config');
  check('config: 측정 ID', config?.[1] === GA_ID);
  const configParams = (config?.[2] ?? {}) as Record<string, unknown>;
  check(
    'config: 자동 page_view 끔, 구글 시그널·광고 개인화 끔',
    configParams.send_page_view === false &&
      configParams.allow_google_signals === false &&
      configParams.allow_ad_personalization_signals === false,
    JSON.stringify(configParams)
  );
  const sharerEvents = eventsOf(sharerLayer).map((e) => e.name);
  check(
    '철수: page_view, play_saved, share_sheet_opened',
    ['page_view', 'play_saved', 'share_sheet_opened'].every((n) => sharerEvents.includes(n)),
    sharerEvents.join(', ')
  );

  // ── Friend (영희) opens the shared link and adds the play ──
  const friend = await open();
  await friend.page.goto(link, { waitUntil: 'networkidle' });
  await friend.page.locator('#shared-play-modal').getByRole('radio', { name: /영희/ }).click();
  await friend.page.locator('#shared-play-add-btn').click();
  await visible('영희: 추가 완료', friend.page.getByText('내 기록에 추가했어요'));
  const friendLayer = await readDataLayer(friend.page);
  const friendEvents = eventsOf(friendLayer).map((e) => e.name);
  check(
    '영희: share_link_opened, share_link_added',
    ['share_link_opened', 'share_link_added'].every((n) => friendEvents.includes(n)),
    friendEvents.join(', ')
  );
  check('영희: 기록이 실제로 저장됨', (await readStores(friend.page, true)).plays.length === 1);

  // ── Privacy: what GA4 would receive ──
  const all = [...sharerLayer, ...friendLayer];
  const everything = JSON.stringify(all);
  check(
    '이벤트 이름이 전부 허용 목록 안',
    all.filter((c) => c[0] === 'event').every((c) => ALLOWED_EVENTS.has(String(c[1])))
  );
  for (const secret of ['철수', '영희', '민수', '카탄', '#play', 'play=']) {
    check(`GA로 가는 데이터에 "${secret}" 없음`, !everything.includes(secret));
  }
  const locations = all.flatMap((c) => {
    const params = (c[0] === 'event' || c[0] === 'config' ? c[c[0] === 'config' ? 2 : 2] : undefined) as
      | Record<string, unknown>
      | undefined;
    return typeof params?.page_location === 'string' ? [params.page_location] : [];
  });
  check(
    'page_location이 있고 전부 # 없음',
    locations.length > 0 && locations.every((l) => !l.includes('#')),
    locations.join(' | ')
  );
  const friendPageView = eventsOf(friendLayer).find((e) => e.name === 'page_view');
  check(
    '공유 링크로 열었을 때도 page_view 주소에 # 없음',
    typeof friendPageView?.params.page_location === 'string' &&
      !(friendPageView.params.page_location as string).includes('#')
  );
  check(
    '분석 서비스로 직접 나간 요청은 로더 하나뿐 (Google에는 아무것도 안 보냄)',
    gaRequests.every((url) => url.startsWith('https://www.googletagmanager.com/gtag/js')),
    gaRequests.join(' | ')
  );

  await sharer.context.close();
  await friend.context.close();
});

test('privacy notice mentions Google Analytics cookies when an id is built in', async ({ page }, testInfo) => {
  await page.route(/googletagmanager\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-mypage').click();
  await page.locator('#mypage-privacy-btn').click();
  const modal = page.locator('#privacy-notice-modal');
  await hasText('Google Analytics 사용·쿠키 명시', modal, 'Google Analytics를 사용하며, 이때 쿠키가 사용됩니다');
  await hasText('Vercel 분석은 쿠키 없음 명시', modal, '쿠키를 사용하지 않습니다');
  await page.screenshot({ path: testInfo.outputPath('privacy-notice-ga.png') });
});
