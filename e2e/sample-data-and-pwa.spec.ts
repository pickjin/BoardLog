import { test } from '@playwright/test';
import {
  activeUid,
  BASE_URL,
  check,
  gameRow,
  hidden,
  MOBILE,
  owned,
  playRow,
  putRows,
  readStores,
  visible
} from './helpers';

test.use({ viewport: MOBILE });

test('new accounts start empty, sample data is removed per account, the app is installable', async ({
  page
}, testInfo) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE_URL)) failedRequests.push(`${r.status()} ${r.url()}`);
  });
  await page.goto('/', { waitUntil: 'networkidle' });

  const kpi = async (label: string) =>
    // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
    (await page.getByText(label, { exact: true }).locator('..').innerText()).replace(/\s+/g, ' ');
  const removeSampleBtn = page.locator('#dashboard-remove-sample-btn');

  // ════════ 1. Brand-new user starts empty ════════
  const uidA = (await activeUid(page)) ?? '';
  check('활성 계정 있음', uidA !== '');
  const fresh = await readStores(page);
  check('새 게스트: 게임 0개', owned(fresh.games, uidA).length === 0);
  check('새 게스트: 기록 0개', owned(fresh.plays, uidA).length === 0);
  check('홈 총 플레이 0', (await kpi('총 플레이')).includes('0'), await kpi('총 플레이'));
  check('홈 승률 0%', (await kpi('승률')).includes('0%'), await kpi('승률'));
  await visible('빈 화면 안내 문구', page.getByText('누가 이겼는지만 남겨도 충분해요', { exact: false }));
  await hidden('예시 지우기 배너 없음', removeSampleBtn);
  await page.screenshot({ path: testInfo.outputPath('home-empty.png') });

  await page.locator('#dashboard-add-play-cta').click();
  await page.locator('#play-form-save-btn').waitFor();
  await hidden('첫 기록 폼에 가짜 동행자 칩 없음', page.getByText('최근 함께한 사람'));
  await page.locator('#play-form-cancel-btn').click();

  // ════════ 2. Legacy user with old demo data (account A) + another account B ════════
  const uidB = 'user_other_account';
  const demoGameA = `sample-game-1-${uidA}`;
  await putRows(page, [
    // A: two demo games, one demo win, and one REAL loss logged on demo game 1.
    { store: 'games', row: gameRow({ id: demoGameA, userId: uidA, title: '스플렌더', playCount: 2 }) },
    { store: 'games', row: gameRow({ id: `sample-game-2-${uidA}`, userId: uidA, title: '카탄', playCount: 0 }) },
    { store: 'plays', row: playRow(`sample-play-1-${uidA}`, uidA, demoGameA, '스플렌더', true) },
    { store: 'plays', row: playRow('play_real_A', uidA, demoGameA, '스플렌더', false) },
    // B: its own demo data that must survive A's cleanup.
    { store: 'games', row: gameRow({ id: `sample-game-1-${uidB}`, userId: uidB, title: '스플렌더', playCount: 1 }) },
    { store: 'plays', row: playRow(`sample-play-1-${uidB}`, uidB, `sample-game-1-${uidB}`, '스플렌더', true) }
  ]);
  await page.reload({ waitUntil: 'networkidle' });
  await visible('예시 데이터 있으면 배너 표시', removeSampleBtn);
  check('정리 전 승률 50% (예시 승 + 실제 패)', (await kpi('승률')).includes('50%'), await kpi('승률'));
  const beforeStores = await readStores(page);
  const bBefore = JSON.stringify(owned([...beforeStores.games, ...beforeStores.plays], uidB));
  await page.screenshot({ path: testInfo.outputPath('home-sample-banner.png') });

  await removeSampleBtn.click();
  await visible(
    '정리 완료 안내 (기록 1, 게임 1)',
    page.getByText('예시 기록 1개, 예시 게임 1개를 지웠습니다', { exact: false })
  );

  const after = await readStores(page);
  const aGames = owned(after.games, uidA);
  const aPlays = owned(after.plays, uidA);
  check('예시 기록 삭제', !aPlays.some((p) => p.id.startsWith('sample-')));
  check(
    '실제 기록은 유지',
    aPlays.some((p) => p.id === 'play_real_A')
  );
  check(
    '실제 기록이 걸린 예시 게임은 유지',
    aGames.some((g) => g.id === demoGameA)
  );
  check('안 쓴 예시 게임은 삭제', !aGames.some((g) => g.id === `sample-game-2-${uidA}`));
  const kept = aGames.find((g) => g.id === demoGameA);
  check('남은 게임 플레이 수 2 → 1', kept?.playCount === 1, String(kept?.playCount));
  const bAfter = JSON.stringify(owned([...after.games, ...after.plays], uidB));
  check('다른 계정(B)의 예시 데이터는 그대로', bAfter === bBefore && bAfter.includes('sample-play-1-'));
  const rateAfter = await kpi('승률');
  check('정리 후 승률 0% (실제 패배만)', rateAfter.includes('0%') && !rateAfter.includes('50%'), rateAfter);
  await hidden('정리 후 배너 사라짐', removeSampleBtn);

  // ════════ 3. Installable app (manifest + icons) ════════
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  check('manifest 링크', manifestHref === '/manifest.webmanifest');
  const manifest = await page.evaluate(async (href) => {
    const r = await fetch(href);
    return {
      status: r.status,
      body: (await r.json()) as {
        short_name: string;
        display: string;
        icons: { src: string; sizes?: string; purpose?: string }[];
      }
    };
  }, manifestHref ?? '');
  check('manifest 200 + JSON', manifest.status === 200 && manifest.body.short_name === '보드로그');
  check('display standalone', manifest.body.display === 'standalone');
  const iconChecks = await page.evaluate(
    async (srcs) => {
      const out: { src: string; status: number; type: string; w: number; h: number }[] = [];
      for (const src of srcs) {
        const r = await fetch(src);
        const blob = await r.blob();
        const bmp = await createImageBitmap(blob);
        out.push({ src, status: r.status, type: blob.type, w: bmp.width, h: bmp.height });
      }
      return out;
    },
    [...manifest.body.icons.map((i) => i.src), '/apple-touch-icon.png', '/favicon-32.png']
  );
  const declared = Object.fromEntries(manifest.body.icons.map((i) => [i.src, i.sizes]));
  check(
    '아이콘 전부 200 PNG, 선언 크기와 실제 크기 일치',
    iconChecks.every(
      (i) => i.status === 200 && i.type === 'image/png' && (!declared[i.src] || declared[i.src] === `${i.w}x${i.h}`)
    ),
    iconChecks.map((i) => `${i.src.slice(1)} ${i.w}x${i.h}`).join(', ')
  );
  check(
    'maskable 아이콘 포함',
    manifest.body.icons.some((i) => i.purpose === 'maskable')
  );
  check('theme-color 메타', (await page.locator('meta[name="theme-color"]').getAttribute('content')) === '#4834D4');

  check('같은 출처 요청 중 4xx/5xx 없음 (favicon 404 해소)', failedRequests.length === 0, failedRequests.join(' | '));
  check('페이지 런타임 에러 없음', pageErrors.length === 0, pageErrors.join(' | '));
});
