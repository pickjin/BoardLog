import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const DIR = '/tmp/claude-0/-home-user-BoardLog/8d61d76d-5c37-57cc-ba15-ae0d1a3a525e/scratchpad';
const results = [];
const check = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await context.newPage();
const pageErrors = [];
const failedRequests = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('response', (r) => {
  if (r.status() >= 400 && r.url().startsWith(BASE)) failedRequests.push(`${r.status()} ${r.url()}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });

const kpi = async (label) => (await page.getByText(label, { exact: true }).locator('..').innerText()).replace(/\s+/g, ' ');
const activeUid = () => page.evaluate(() => JSON.parse(localStorage.getItem('boardlog_active_user') || 'null')?.uid);
const idb = (fn, arg) =>
  page.evaluate(
    ([fnSrc, a]) =>
      new Promise((resolve) => {
        const req = indexedDB.open('board_log_db_v1');
        req.onsuccess = () => resolve(new Function('db', 'arg', `return (${fnSrc})(db, arg)`)(req.result, a));
      }),
    [fn.toString(), arg]
  );
const readAll = () =>
  idb(
    (db) =>
      new Promise((resolve) => {
        const tx = db.transaction(['games', 'plays'], 'readonly');
        const out = {};
        let left = 2;
        for (const s of ['games', 'plays']) {
          const r = tx.objectStore(s).getAll();
          r.onsuccess = () => {
            out[s] = r.result;
            if (--left === 0) resolve(out);
          };
        }
      })
  );

// ════════ 1. Brand-new user starts empty ════════
const uidA = await activeUid();
const fresh = await readAll();
check('새 게스트: 게임 0개', fresh.games.filter((g) => g.userId === uidA).length === 0);
check('새 게스트: 기록 0개', fresh.plays.filter((p) => p.userId === uidA).length === 0);
check('홈 총 플레이 0', (await kpi('총 플레이')).includes('0'), await kpi('총 플레이'));
check('홈 승률 0%', (await kpi('승률')).includes('0%'), await kpi('승률'));
check('빈 화면 안내 문구', await page.getByText('누가 이겼는지만 남겨도 충분해요', { exact: false }).isVisible());
check('예시 지우기 배너 없음', !(await page.locator('#dashboard-remove-sample-btn').isVisible()));
await page.screenshot({ path: `${DIR}/home-empty.png` });

await page.locator('#dashboard-add-play-cta').click();
await page.locator('#play-form-save-btn').waitFor();
check('첫 기록 폼에 가짜 동행자 칩 없음', !(await page.getByText('최근 함께한 사람').isVisible()));
await page.locator('#play-form-cancel-btn').click();

// ════════ 2. Legacy user with old demo data (account A) + another account B ════════
const uidB = 'user_other_account';
await idb(
  (db, { a, b }) =>
    new Promise((resolve) => {
      const tx = db.transaction(['games', 'plays'], 'readwrite');
      const g = tx.objectStore('games');
      const p = tx.objectStore('plays');
      const game = (id, uid, title, playCount) => ({ id, userId: uid, order: 1, title, titleEn: '', imageUrl: '', genre: [], minPlayers: 2, maxPlayers: 4, bestPlayers: '', recommendedAge: 10, playTime: 30, weight: 2, publisher: '', purchaseDate: '', purchasePrice: 0, originalPrice: 0, marketPrice: 0, storageLocation: '', condition: '상', tags: [], notes: '', ownershipStatus: '보유중', playCount, priceMeta: { source: '', verifiedDate: '', isManual: false }, createdAt: '', updatedAt: '' });
      const play = (id, uid, gameId, title, won) => ({ id, userId: uid, order: 2, gameId, gameTitle: title, gameImageUrl: '', date: '2026.10.01', startTime: '19:00', endTime: '20:00', durationMinutes: 60, location: '', participants: [{ id: 'p_me', name: '나', score: null, rank: null, isWinner: won }, { id: 'p2', name: won ? '민수' : '수진', score: null, rank: null, isWinner: !won }], winnerNames: [], myResult: won ? '승리' : '패배', isTeamPlay: false, hasExpansion: false, expansionName: '', rating: 5, review: '', photos: [], createdAt: '', updatedAt: '' });
      // A: two demo games, one demo win, and one REAL loss logged on demo game 1.
      g.put(game(`sample-game-1-${a}`, a, '스플렌더', 2));
      g.put(game(`sample-game-2-${a}`, a, '카탄', 0));
      p.put(play(`sample-play-1-${a}`, a, `sample-game-1-${a}`, '스플렌더', true));
      p.put(play('play_real_A', a, `sample-game-1-${a}`, '스플렌더', false));
      // B: its own demo data that must survive A's cleanup.
      g.put(game(`sample-game-1-${b}`, b, '스플렌더', 1));
      p.put(play(`sample-play-1-${b}`, b, `sample-game-1-${b}`, '스플렌더', true));
      tx.oncomplete = () => resolve(true);
    }),
  { a: uidA, b: uidB }
);
await page.reload({ waitUntil: 'networkidle' });
check('예시 데이터 있으면 배너 표시', await page.locator('#dashboard-remove-sample-btn').isVisible());
check('정리 전 승률 50% (예시 승 + 실제 패)', (await kpi('승률')).includes('50%'), await kpi('승률'));
const bBefore = JSON.stringify((await readAll()).games.concat((await readAll()).plays).filter((r) => r.userId === uidB));
await page.screenshot({ path: `${DIR}/home-sample-banner.png` });

await page.locator('#dashboard-remove-sample-btn').click();
await page.getByText('예시 기록 1개, 예시 게임 1개를 지웠습니다', { exact: false }).waitFor({ timeout: 5000 }).catch(() => {});
check('정리 완료 안내 (기록 1, 게임 1)', await page.getByText('예시 기록 1개, 예시 게임 1개를 지웠습니다', { exact: false }).isVisible());

const after = await readAll();
const aGames = after.games.filter((g) => g.userId === uidA);
const aPlays = after.plays.filter((p) => p.userId === uidA);
check('예시 기록 삭제', !aPlays.some((p) => p.id.startsWith('sample-')));
check('실제 기록은 유지', aPlays.some((p) => p.id === 'play_real_A'));
check('실제 기록이 걸린 예시 게임은 유지', aGames.some((g) => g.id === `sample-game-1-${uidA}`));
check('안 쓴 예시 게임은 삭제', !aGames.some((g) => g.id === `sample-game-2-${uidA}`));
const kept = aGames.find((g) => g.id === `sample-game-1-${uidA}`);
check('남은 게임 플레이 수 2 → 1', kept?.playCount === 1, String(kept?.playCount));
const bAfter = JSON.stringify(after.games.concat(after.plays).filter((r) => r.userId === uidB));
check('다른 계정(B)의 예시 데이터는 그대로', bAfter === bBefore && bAfter.includes('sample-play-1-'));
check('정리 후 승률 0% (실제 패배만)', (await kpi('승률')).includes('0%') && !(await kpi('승률')).includes('50%'), await kpi('승률'));
check('정리 후 배너 사라짐', !(await page.locator('#dashboard-remove-sample-btn').isVisible()));

// ════════ 3. Installable app (manifest + icons) ════════
const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
check('manifest 링크', manifestHref === '/manifest.webmanifest');
const manifest = await page.evaluate(async (href) => {
  const r = await fetch(href);
  return { status: r.status, body: await r.json() };
}, manifestHref);
check('manifest 200 + JSON', manifest.status === 200 && manifest.body.short_name === '보드로그');
check('display standalone', manifest.body.display === 'standalone');
const iconChecks = await page.evaluate(async (srcs) => {
  const out = [];
  for (const src of srcs) {
    const r = await fetch(src);
    const blob = await r.blob();
    const bmp = await createImageBitmap(blob);
    out.push({ src, status: r.status, type: blob.type, w: bmp.width, h: bmp.height });
  }
  return out;
}, [...manifest.body.icons.map((i) => i.src), '/apple-touch-icon.png', '/favicon-32.png']);
const declared = Object.fromEntries(manifest.body.icons.map((i) => [i.src, i.sizes]));
check(
  '아이콘 전부 200 PNG, 선언 크기와 실제 크기 일치',
  iconChecks.every((i) => i.status === 200 && i.type === 'image/png' && (!declared[i.src] || declared[i.src] === `${i.w}x${i.h}`)),
  iconChecks.map((i) => `${i.src.slice(1)} ${i.w}x${i.h}`).join(', ')
);
check('maskable 아이콘 포함', manifest.body.icons.some((i) => i.purpose === 'maskable'));
check('theme-color 메타', (await page.locator('meta[name="theme-color"]').getAttribute('content')) === '#4834D4');

check('같은 출처 요청 중 4xx/5xx 없음 (favicon 404 해소)', failedRequests.length === 0, failedRequests.join(' | '));
check('페이지 런타임 에러 없음', pageErrors.length === 0, pageErrors.join(' | '));

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n총 ${results.length}건 · 통과 ${results.length - failed} · 실패 ${failed}`);
process.exit(failed ? 1 : 0);
