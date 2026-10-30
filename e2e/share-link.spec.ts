import { type Browser, test } from '@playwright/test';
import { BASE_URL, check, gameRow, hidden, MOBILE, putRows, readStores, requireUid, visible } from './helpers';

// Separate contexts = separate IndexedDB/localStorage, i.e. different phones.
async function device(browser: Browser) {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: MOBILE,
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();
  const errors: string[] = [];
  const dialogs: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    void d.dismiss();
  });
  return { context, page, errors, dialogs };
}

const toBase64Url = (value: unknown) =>
  Buffer.from(JSON.stringify(value), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

test('a play shared by link is added to a friend’s own log, and hostile links are harmless', async ({
  browser
}, testInfo) => {
  // ════════ 철수: record and share ════════
  const A = await device(browser);
  await A.page.goto('/', { waitUntil: 'networkidle' });
  const overlay = A.page.locator('#play-record-modal-overlay');
  await A.page.locator('#dashboard-add-play-cta').click();
  await A.page.locator('#play-game-search-input').fill('카탄');
  await overlay.getByText('카탄', { exact: true }).first().click();
  const names = overlay.locator('input[placeholder="이름"]');
  await names.nth(1).fill('영희');
  await A.page.getByRole('button', { name: '참여자 추가' }).click();
  await names.nth(2).fill('민수');
  const scores = overlay.locator('input[placeholder="점수"]');
  await scores.nth(0).fill('8');
  await scores.nth(1).fill('10');
  await scores.nth(2).fill('6');
  await overlay.locator('button[title="승자 토글"]').nth(1).click();
  await A.page.locator('#play-form-save-btn').click();
  await A.page.locator('#play-share-sheet').waitFor();

  check('게스트는 이름 없이 공유 불가', await A.page.locator('#play-share-copy-btn').isDisabled());
  await A.page.locator('#play-share-name-input').fill('철수');
  check('이름 입력 후 공유 가능', await A.page.locator('#play-share-copy-btn').isEnabled());
  // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
  const sheetText = await A.page.locator('#play-share-sheet pre').innerText();
  check(
    "문구에서 '나' 대신 이름",
    sheetText.includes('👥 참여: 철수, 영희, 민수') && sheetText.includes('👑 승자: 영희')
  );
  await A.page.locator('#play-share-copy-btn').click();
  const clip = await A.page.evaluate(() => navigator.clipboard.readText());
  const link = clip.match(/https?:\/\/\S+#play=\S+/)?.[0] ?? '';
  check('복사된 문구에 기록 링크 포함', link !== '', link ? `${link.length}자` : '');
  check('링크 길이 1000자 이하', link !== '' && link.length <= 1000);
  const aPlay = (await readStores(A.page, true)).plays[0];

  // ════════ 영희: first-time user opens the link ════════
  const B = await device(browser);
  await B.page.goto(link, { waitUntil: 'networkidle' });
  const modal = B.page.locator('#shared-play-modal');
  await visible('링크로 열면 공유 기록 화면', modal);
  await visible('공유한 사람 이름 표시', modal.getByText('철수님이 공유한 기록'));
  check('주소창에서 기록 제거', !(await B.page.evaluate(() => location.hash)).includes('play='));
  check('나를 고르기 전엔 추가 불가', await B.page.locator('#shared-play-add-btn').isDisabled());
  await modal.getByRole('radio', { name: /영희/ }).click();
  // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
  check('영희 선택 → 내 결과 승리', (await modal.getByText('내 결과:').locator('strong').innerText()) === '승리');
  await B.page.screenshot({ path: testInfo.outputPath('shared-play-modal.png') });
  await B.page.locator('#shared-play-add-btn').click();
  await visible('추가 완료 안내', B.page.getByText('내 기록에 추가했어요'));
  const bData = await readStores(B.page, true);
  const bPlay = bData.plays[0];
  const bParticipants = bPlay.participants ?? [];
  check('영희 기기에 기록 1건', bData.plays.length === 1);
  check('참여자: 철수 · 나 · 민수', JSON.stringify(bParticipants.map((p) => p.name)) === '["철수","나","민수"]');
  check(
    "'나'(영희)가 승자",
    bParticipants.find((p) => p.name === '나')?.isWinner === true && bPlay.myResult === '승리'
  );
  check('점수 유지', JSON.stringify(bParticipants.map((p) => p.score)) === '[8,10,6]');
  check('새 id 발급 (철수 기록 id와 다름)', bPlay.id !== aPlay.id);
  check('평점·후기·사진은 안 넘어옴', bPlay.rating === 0 && bPlay.review === '' && bPlay.photos?.length === 0);
  // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
  const winRate = (await B.page.getByText('승률', { exact: true }).locator('..').innerText()).replace(/\s+/g, ' ');
  check('영희 홈 승률 100%', winRate.includes('100%'), winRate);

  await B.page.goto(link, { waitUntil: 'networkidle' });
  await modal.getByRole('radio', { name: /영희/ }).click();
  await B.page.locator('#shared-play-add-btn').click();
  await visible('같은 링크 재추가 → 중복 안내', B.page.getByText('이미 내 기록에 있는 게임이에요'));
  check('중복 저장 안 됨', (await readStores(B.page, true)).plays.length === 1);

  // ════════ 민수: owns 카탄 already ════════
  const C = await device(browser);
  await C.page.goto('/', { waitUntil: 'networkidle' });
  const uidC = await requireUid(C.page);
  await putRows(C.page, [
    {
      store: 'games',
      row: gameRow({
        id: 'game_minsu_catan',
        userId: uidC,
        title: '카탄',
        titleEn: 'Catan',
        minPlayers: 3,
        playTime: 60,
        weight: 2.3,
        playCount: 2
      })
    }
  ]);
  await C.page.goto(link, { waitUntil: 'networkidle' });
  const cModal = C.page.locator('#shared-play-modal');
  await cModal.getByRole('radio', { name: /민수/ }).click();
  // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
  check('민수 선택 → 내 결과 패배', (await cModal.getByText('내 결과:').locator('strong').innerText()) === '패배');
  await C.page.locator('#shared-play-add-btn').click();
  await visible('민수 추가 완료 안내', C.page.getByText('내 기록에 추가했어요'));
  const cData = await readStores(C.page, true);
  check('소장 중인 카탄에 연결', cData.plays[0]?.gameId === 'game_minsu_catan');
  check('카탄 플레이 수 2 → 3', cData.games.find((g) => g.id === 'game_minsu_catan')?.playCount === 3);

  // ════════ Hostile and broken links ════════
  const hostile = {
    v: 1,
    by: '<img src=x onerror=alert(1)>',
    g: '<script>alert(2)</script>',
    d: '2026.10.29',
    st: '19:00',
    et: '20:00',
    dm: 99999,
    l: '',
    t: 0,
    x: '',
    r: '승리',
    p: Array.from({ length: 25 }, (_, i) => ({
      n: i === 0 ? '<b onmouseover=alert(3)>해커</b>' : `p${i}`,
      s: null,
      k: null,
      w: 0
    }))
  };
  const D = await device(browser);
  await D.page.goto(`/#play=${toBase64Url(hostile)}`, { waitUntil: 'networkidle' });
  const dModal = D.page.locator('#shared-play-modal');
  await visible('HTML 이름은 글자로만 표시', dModal.getByText('<img src=x onerror=alert(1)>님이 공유한 기록'));
  check('참여자 20명으로 제한', (await dModal.getByRole('radio').count()) === 20);
  await dModal.getByRole('radio').first().hover();
  check('스크립트 실행 안 됨 (alert 0회)', D.dialogs.length === 0, D.dialogs.join(' | '));
  // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
  check('플레이 시간 상한 적용', !(await dModal.innerText()).includes('1666시간'));

  const E = await device(browser);
  await E.page.goto('/#play=%%%not-base64%%%', { waitUntil: 'networkidle' });
  await visible('깨진 링크 → 안내', E.page.getByText('공유 링크가 손상되어'));
  await hidden('깨진 링크 → 공유 화면은 안 뜸', E.page.locator('#shared-play-modal'));

  const allErrors = [...A.errors, ...B.errors, ...C.errors, ...D.errors, ...E.errors];
  check('페이지 런타임 에러 없음', allErrors.length === 0, allErrors.join(' | '));
  await Promise.all([A, B, C, D, E].map((d) => d.context.close()));
});
