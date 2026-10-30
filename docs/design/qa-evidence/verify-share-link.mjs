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
// Separate contexts = separate IndexedDB/localStorage, i.e. three different phones.
const device = async () => {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  const dialogs = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    d.dismiss();
  });
  return { ctx, page, errors, dialogs };
};
const readPlays = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const uid = JSON.parse(localStorage.getItem('boardlog_active_user')).uid;
        const req = indexedDB.open('board_log_db_v1');
        req.onsuccess = () => {
          const tx = req.result.transaction(['games', 'plays'], 'readonly');
          const out = {};
          let left = 2;
          for (const s of ['games', 'plays']) {
            const r = tx.objectStore(s).getAll();
            r.onsuccess = () => {
              out[s] = r.result.filter((x) => x.userId === uid);
              if (--left === 0) resolve(out);
            };
          }
        };
      })
  );

// ════════ 철수: record and share ════════
const A = await device();
await A.page.goto(BASE, { waitUntil: 'networkidle' });
const ov = A.page.locator('#play-record-modal-overlay');
await A.page.locator('#dashboard-add-play-cta').click();
await A.page.locator('#play-game-search-input').fill('카탄');
await ov.getByText('카탄', { exact: true }).first().click();
const names = ov.locator('input[placeholder="이름"]');
await names.nth(1).fill('영희');
await A.page.getByRole('button', { name: '참여자 추가' }).click();
await names.nth(2).fill('민수');
const scores = ov.locator('input[placeholder="점수"]');
await scores.nth(0).fill('8');
await scores.nth(1).fill('10');
await scores.nth(2).fill('6');
await ov.locator('button[title="승자 토글"]').nth(1).click();
await A.page.locator('#play-form-save-btn').click();
await A.page.locator('#play-share-sheet').waitFor();

check('게스트는 이름 없이 공유 불가', await A.page.locator('#play-share-copy-btn').isDisabled());
await A.page.locator('#play-share-name-input').fill('철수');
check('이름 입력 후 공유 가능', await A.page.locator('#play-share-copy-btn').isEnabled());
const sheetText = await A.page.locator('#play-share-sheet pre').innerText();
check("문구에서 '나' 대신 이름", sheetText.includes('👥 참여: 철수, 영희, 민수') && sheetText.includes('👑 승자: 영희'));
await A.page.locator('#play-share-copy-btn').click();
const clip = await A.page.evaluate(() => navigator.clipboard.readText());
const link = (clip.match(/https?:\/\/\S+#play=\S+/) || [])[0];
check('복사된 문구에 기록 링크 포함', !!link, link ? `${link.length}자` : '');
check('링크 길이 1000자 이하', link && link.length <= 1000);
const aPlay = (await readPlays(A.page)).plays[0];

// ════════ 영희: first-time user opens the link ════════
const B = await device();
await B.page.goto(link, { waitUntil: 'networkidle' });
const modal = B.page.locator('#shared-play-modal');
await modal.waitFor({ timeout: 5000 }).catch(() => {});
check('링크로 열면 공유 기록 화면', await modal.isVisible());
check('공유한 사람 이름 표시', await modal.getByText('철수님이 공유한 기록').isVisible());
check('주소창에서 기록 제거', !(await B.page.evaluate(() => location.hash)).includes('play='));
check('나를 고르기 전엔 추가 불가', await B.page.locator('#shared-play-add-btn').isDisabled());
await modal.getByRole('radio', { name: /영희/ }).click();
check('영희 선택 → 내 결과 승리', await modal.getByText('내 결과:').locator('strong').innerText() === '승리');
await B.page.screenshot({ path: `${DIR}/shared-play-modal.png` });
await B.page.locator('#shared-play-add-btn').click();
await B.page.getByText('내 기록에 추가했어요').waitFor({ timeout: 5000 }).catch(() => {});
check('추가 완료 안내', await B.page.getByText('내 기록에 추가했어요').isVisible());
const bData = await readPlays(B.page);
const bPlay = bData.plays[0];
check('영희 기기에 기록 1건', bData.plays.length === 1);
check("참여자: 철수 · 나 · 민수", JSON.stringify(bPlay.participants.map((p) => p.name)) === '["철수","나","민수"]');
check("'나'(영희)가 승자", bPlay.participants.find((p) => p.name === '나').isWinner === true && bPlay.myResult === '승리');
check('점수 유지', JSON.stringify(bPlay.participants.map((p) => p.score)) === '[8,10,6]');
check('새 id 발급 (철수 기록 id와 다름)', bPlay.id !== aPlay.id);
check('평점·후기·사진은 안 넘어옴', bPlay.rating === 0 && bPlay.review === '' && bPlay.photos.length === 0);
const winRate = (await B.page.getByText('승률', { exact: true }).locator('..').innerText()).replace(/\s+/g, ' ');
check('영희 홈 승률 100%', winRate.includes('100%'), winRate);

await B.page.goto(link, { waitUntil: 'networkidle' });
await modal.getByRole('radio', { name: /영희/ }).click();
await B.page.locator('#shared-play-add-btn').click();
await B.page.getByText('이미 내 기록에 있는 게임이에요').waitFor({ timeout: 5000 }).catch(() => {});
check('같은 링크 재추가 → 중복 안내', await B.page.getByText('이미 내 기록에 있는 게임이에요').isVisible());
check('중복 저장 안 됨', (await readPlays(B.page)).plays.length === 1);

// ════════ 민수: owns 카탄 already ════════
const C = await device();
await C.page.goto(BASE, { waitUntil: 'networkidle' });
await C.page.evaluate(() => new Promise((resolve) => {
  const uid = JSON.parse(localStorage.getItem('boardlog_active_user')).uid;
  const req = indexedDB.open('board_log_db_v1');
  req.onsuccess = () => {
    const tx = req.result.transaction('games', 'readwrite');
    tx.objectStore('games').put({ id: 'game_minsu_catan', userId: uid, order: 1, title: '카탄', titleEn: 'Catan', imageUrl: '', genre: [], minPlayers: 3, maxPlayers: 4, bestPlayers: '', recommendedAge: 10, playTime: 60, weight: 2.3, publisher: '', purchaseDate: '', purchasePrice: 0, originalPrice: 0, marketPrice: 0, storageLocation: '', condition: '상', tags: [], notes: '', ownershipStatus: '보유중', playCount: 2, priceMeta: { source: '', verifiedDate: '', isManual: false }, createdAt: '', updatedAt: '' });
    tx.oncomplete = () => resolve(true);
  };
}));
await C.page.goto(link, { waitUntil: 'networkidle' });
await C.page.locator('#shared-play-modal').getByRole('radio', { name: /민수/ }).click();
check('민수 선택 → 내 결과 패배', await C.page.locator('#shared-play-modal').getByText('내 결과:').locator('strong').innerText() === '패배');
await C.page.locator('#shared-play-add-btn').click();
await C.page.getByText('내 기록에 추가했어요').waitFor({ timeout: 5000 }).catch(() => {});
const cData = await readPlays(C.page);
check('소장 중인 카탄에 연결', cData.plays[0]?.gameId === 'game_minsu_catan');
check('카탄 플레이 수 2 → 3', cData.games.find((g) => g.id === 'game_minsu_catan').playCount === 3);

// ════════ Hostile and broken links ════════
const toB64 = (obj) => Buffer.from(JSON.stringify(obj), 'utf-8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const hostile = {
  v: 1, by: '<img src=x onerror=alert(1)>', g: '<script>alert(2)</script>', d: '2026.10.29', st: '19:00', et: '20:00', dm: 99999, l: '', t: 0, x: '', r: '승리',
  p: Array.from({ length: 25 }, (_, i) => ({ n: i === 0 ? '<b onmouseover=alert(3)>해커</b>' : `p${i}`, s: null, k: null, w: 0 }))
};
const D = await device();
await D.page.goto(`${BASE}/#play=${toB64(hostile)}`, { waitUntil: 'networkidle' });
const dm = D.page.locator('#shared-play-modal');
await dm.waitFor({ timeout: 5000 }).catch(() => {});
check('HTML 이름은 글자로만 표시', await dm.getByText('<img src=x onerror=alert(1)>님이 공유한 기록').isVisible());
check('참여자 20명으로 제한', (await dm.getByRole('radio').count()) === 20);
await dm.getByRole('radio').first().hover();
check('스크립트 실행 안 됨 (alert 0회)', D.dialogs.length === 0, D.dialogs.join(' | '));
check('플레이 시간 상한 적용', !(await dm.innerText()).includes('1666시간'));

const E = await device();
await E.page.goto(`${BASE}/#play=%%%not-base64%%%`, { waitUntil: 'networkidle' });
await E.page.getByText('공유 링크가 손상되어').waitFor({ timeout: 5000 }).catch(() => {});
check('깨진 링크 → 안내, 화면 안 뜸', (await E.page.getByText('공유 링크가 손상되어').isVisible()) && !(await E.page.locator('#shared-play-modal').isVisible()));

const allErrors = [...A.errors, ...B.errors, ...C.errors, ...D.errors, ...E.errors];
check('페이지 런타임 에러 없음', allErrors.length === 0, allErrors.join(' | '));
await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n총 ${results.length}건 · 통과 ${results.length - failed} · 실패 ${failed}`);
process.exit(failed ? 1 : 0);
