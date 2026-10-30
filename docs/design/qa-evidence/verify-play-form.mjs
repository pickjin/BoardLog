import { chromium } from 'playwright-core';

const SHOTS = '/tmp/claude-0/-home-user-BoardLog/8d61d76d-5c37-57cc-ba15-ae0d1a3a525e/scratchpad';
const results = [];
const check = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

await page.goto(process.argv[2] || 'http://localhost:3000', { waitUntil: 'networkidle' });

async function openForm() {
  await page.locator('#dashboard-add-play-cta').click();
  await page.locator('#play-form-save-btn').waitFor();
}

async function pickGame(query) {
  const input = page.locator('#play-game-search-input');
  if (!(await input.isVisible())) await page.getByText('게임 검색', { exact: false }).first().click();
  await input.fill(query);
  await page.locator('#play-record-modal-overlay').getByText(query, { exact: true }).first().click();
}

const resultBtn = (label) =>
  page.locator('#play-record-modal-overlay button', { hasText: label }).filter({ hasText: new RegExp(`^\\s*(👑 )?${label}\\s*$`) });
const isSelected = async (label) => ((await resultBtn(label).first().getAttribute('class')) || '').includes('text-white');

// ── 1. New form starts with no result, saving is blocked ──
await openForm();
await pickGame('스플렌더');
check('결과 미선택 시 안내 문구 표시', await page.getByText('승자를 탭하면 자동으로 정해져요').isVisible());
check('기본값 승리 선택 안 됨', !(await isSelected('승리')));
await page.locator('#play-form-save-btn').click();
check('결과 없이 저장 차단', await page.getByText('승자를 탭하거나 나의 결과를 골라 주세요.').isVisible());

// ── 2. Friend wins → my result auto-derives to 패배 ──
const names = page.locator('#play-record-modal-overlay input[placeholder="이름"]');
await names.nth(1).fill('민수');
await page.getByRole('button', { name: '참여자 추가' }).click();
await names.nth(2).fill('지영');
await page.locator('#play-record-modal-overlay button[title="승자 토글"]').nth(2).click();
check('친구 승자 지정 → 내 결과 패배 자동', await isSelected('패배'));
check('안내 문구 사라짐', !(await page.getByText('승자를 탭하면 자동으로 정해져요').isVisible()));
await page.screenshot({ path: `${SHOTS}/form-friend-wins.png`, fullPage: false });
await page.locator('#play-form-save-btn').click();
await page.locator('#play-form-save-btn').waitFor({ state: 'detached' });
await page.getByRole('button', { name: '다음에 할게요' }).click();
await page.locator('#play-share-sheet').waitFor({ state: 'detached' });

const winRateText = await page.getByText('승률').locator('..').innerText();
check('홈 승률 0% (예시 데이터 없이 실제 1패만)', /(^|\D)0%/.test(winRateText) && !winRateText.includes('50%'), winRateText.replace(/\s+/g, ' '));

// ── 3. Second record: recent game first + companion chips ──
await openForm();
const firstItem = page.locator('#play-record-modal-overlay').locator('text=최근').first();
check('검색 전 목록에 최근 배지 표시', await firstItem.isVisible());
const firstTitle = await page
  .locator('#play-record-modal-overlay span.font-black.truncate')
  .first()
  .innerText();
check('검색 전 첫 항목이 지난번 게임', firstTitle.trim() === '스플렌더', firstTitle);
await page.screenshot({ path: `${SHOTS}/form-recent-game.png`, fullPage: false });

await page.locator('#play-record-modal-overlay span.font-black.truncate', { hasText: '스플렌더' }).first().click();
check('최근 함께한 사람 칩 표시', await page.getByText('최근 함께한 사람').isVisible());
await page.locator('#play-record-modal-overlay button', { hasText: '민수' }).click();
check('칩 탭 → 동행 1 자리 채움', (await names.nth(1).inputValue()) === '민수');
check('칩 탭 후 행 수 유지(2)', (await names.count()) === 2);
await page.locator('#play-record-modal-overlay button', { hasText: '지영' }).click();
check('두 번째 칩 → 새 행 추가', (await names.count()) === 3 && (await names.nth(2).inputValue()) === '지영');
const remaining = await page.locator('#play-record-modal-overlay button:has(svg) >> text=/./').evaluateAll(() => []);
const chipNames = await page.getByText('최근 함께한 사람').locator('..').locator('button').allInnerTexts().catch(() => []);
check('사용한 칩(민수·지영)은 목록에서 사라짐', !chipNames.some((n) => ['민수', '지영'].includes(n.trim())), `남은 칩: ${JSON.stringify(chipNames.map((n) => n.trim()))}`);

// ── 4. I win → 승리 ──
await page.locator('#play-record-modal-overlay button[title="승자 토글"]').nth(0).click();
check('내가 승자 → 승리 자동', await isSelected('승리'));
await page.screenshot({ path: `${SHOTS}/form-chips.png`, fullPage: false });

check('페이지 런타임 에러 없음', pageErrors.length === 0, pageErrors.join(' | '));
await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n총 ${results.length}건 · 통과 ${results.length - failed} · 실패 ${failed}`);
process.exit(failed ? 1 : 0);
