import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import {
  activeUid,
  check,
  gameRow,
  hidden,
  MOBILE,
  owned,
  putRows,
  readStores,
  requireUid,
  type Row,
  visible
} from './helpers';

test.use({ viewport: MOBILE, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });

interface Backup {
  games: (Row & { title: string })[];
  plays: Row[];
}

test('share sheet after saving, backup export/restore, restore never crosses accounts', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto('/', { waitUntil: 'networkidle' });

  const toast = (text: string) => page.getByText(text, { exact: false }).first();

  // ════════ Part A: share sheet after a new play ════════
  const overlay = page.locator('#play-record-modal-overlay');
  await page.locator('#dashboard-add-play-cta').click();
  await page.locator('#play-game-search-input').fill('카탄');
  await overlay.getByText('카탄', { exact: true }).first().click();
  await overlay.locator('input[placeholder="이름"]').nth(1).fill('민수');
  await overlay.locator('input[placeholder="점수"]').nth(0).fill('7');
  await overlay.locator('input[placeholder="점수"]').nth(1).fill('10');
  await overlay.locator('button[title="승자 토글"]').nth(1).click();
  await page.locator('#play-form-save-btn').click();

  const sheet = page.locator('#play-share-sheet');
  await visible('새 기록 저장 후 공유 시트 표시', sheet);
  await page.locator('#play-share-name-input').fill('테스터');
  // biome-ignore lint/performance/useDomNodeTextContent: Playwright's locator.innerText() (rendered text), not the DOM property
  const sheetText = await sheet.locator('pre').innerText();
  check('공유 문구: 게임명', sheetText.includes('🎲 카탄'));
  check('공유 문구: 승자', sheetText.includes('👑 승자: 민수'));
  check('공유 문구: 참여자 (나 → 이름)', sheetText.includes('👥 참여: 테스터, 민수'));
  check('공유 문구: 점수 내림차순', sheetText.includes('🏆 점수: 민수 10 · 테스터 7'));
  check('공유 문구: 기록 링크', sheetText.includes(`내 기록에 바로 추가 → ${new URL(page.url()).origin}/#play=`));
  await page.screenshot({ path: testInfo.outputPath('share-sheet.png') });
  const hasNativeShare = await page.evaluate(() => typeof navigator.share === 'function');
  testInfo.annotations.push({ type: 'navigator.share supported', description: String(hasNativeShare) });
  check(
    '공유 미지원 브라우저에선 네이티브 버튼 숨김',
    hasNativeShare || !(await page.locator('#play-share-native-btn').isVisible())
  );
  await page.locator('#play-share-copy-btn').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('문구 복사 → 클립보드 내용 일치', clip === sheetText.trim() || clip === sheetText, `${clip.length}자`);
  await hidden('복사 후 시트 닫힘', sheet);

  // ════════ Part B: backup restore inside one account ════════
  const uidA = await requireUid(page);
  // New accounts start empty, so give A one owned game for the restore cases to link against.
  await putRows(page, [
    {
      store: 'games',
      row: gameRow({
        id: 'game_owned_A',
        userId: uidA,
        title: '카탄',
        titleEn: 'Catan',
        minPlayers: 3,
        playTime: 60,
        weight: 2.3,
        playCount: 1
      })
    }
  ]);
  await page.locator('#nav-tab-mypage').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#export-json-btn').click()]);
  const backupPath = testInfo.outputPath('backup-A.json');
  await download.saveAs(backupPath);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8')) as Backup;
  check(
    '백업 내보내기',
    backup.games.length > 0 && backup.plays.length > 0,
    `게임 ${backup.games.length}, 기록 ${backup.plays.length}`
  );

  const before = await readStores(page);
  const aGamesBefore = owned(before.games, uidA);
  const aPlaysBefore = owned(before.plays, uidA);

  // Same file again: everything is already there.
  await page.locator('#import-json-input').setInputFiles(backupPath);
  await visible('같은 백업 재복원 → 중복 없음 안내', toast('새로 추가할 데이터가 없습니다'));

  const existingGame = backup.games[0];
  const collidingPlayId = backup.plays[0].id;
  const crafted = {
    ...backup,
    games: [
      ...backup.games,
      {
        id: 'src_new_game',
        title: '테스트 신규게임',
        imageUrl: 'javascript:alert(1)',
        userId: 'victim',
        order: 1,
        playCount: 1
      },
      {}
    ],
    plays: [
      ...backup.plays,
      {
        id: collidingPlayId,
        gameId: 'src_new_game',
        gameTitle: '테스트 신규게임',
        date: '2026.01.01',
        startTime: '10:00',
        participants: [{ name: '나', isWinner: true }],
        myResult: '승리',
        userId: 'victim'
      },
      {
        id: 'src_play_existing_game',
        gameId: existingGame.id,
        gameTitle: existingGame.title,
        date: '2026.01.02',
        startTime: '11:00',
        participants: [
          { name: '나', isWinner: false },
          { name: '수진', isWinner: true }
        ],
        myResult: '패배'
      },
      { gameTitle: '' }
    ]
  };
  const craftedPath = testInfo.outputPath('backup-crafted.json');
  fs.writeFileSync(craftedPath, JSON.stringify(crafted));
  await page.locator('#import-json-input').setInputFiles(craftedPath);
  await visible(
    '복원 미리보기: 추가 건수',
    page.getByText('게임 1개, 플레이 기록 2개를 추가합니다.', { exact: false })
  );
  await visible('복원 미리보기: 잘못된 항목 2개 제외 안내', page.getByText('형식이 잘못된 항목 2개', { exact: false }));
  await page.screenshot({ path: testInfo.outputPath('import-confirm.png') });
  await page.getByRole('button', { name: '복원하기' }).click();
  await visible('복원 완료 안내', toast('플레이 기록 2개를 복원했습니다'));

  const after = await readStores(page);
  const aGamesAfter = owned(after.games, uidA);
  const aPlaysAfter = owned(after.plays, uidA);
  check(
    '게임 +1, 기록 +2',
    aGamesAfter.length === aGamesBefore.length + 1 && aPlaysAfter.length === aPlaysBefore.length + 2
  );
  check("'victim' 소유 레코드 없음", ![...after.games, ...after.plays].some((r) => r.userId === 'victim'));
  const newGame = aGamesAfter.find((g) => g.title === '테스트 신규게임');
  check('javascript: 이미지 URL 제거', newGame && newGame.imageUrl === '', JSON.stringify(newGame?.imageUrl));
  check('신규 게임은 새 id 발급', newGame && newGame.id !== 'src_new_game');
  const origCollided = after.plays.find((p) => p.id === collidingPlayId);
  const origBefore = before.plays.find((p) => p.id === collidingPlayId);
  check('같은 id의 기존 기록은 덮어쓰지 않음', JSON.stringify(origCollided) === JSON.stringify(origBefore));
  const linkedPlay = aPlaysAfter.find((p) => p.gameTitle === '테스트 신규게임');
  check('플레이가 새 게임 id로 재연결', newGame && linkedPlay && linkedPlay.gameId === newGame.id);
  const exBefore = aGamesBefore.find((g) => g.id === existingGame.id);
  const exAfter = aGamesAfter.find((g) => g.id === existingGame.id);
  check(
    '기존 게임 playCount +1',
    exBefore && exAfter && exAfter.playCount === (exBefore.playCount || 0) + 1,
    `${exBefore?.playCount} → ${exAfter?.playCount}`
  );

  // ════════ Part C: restore A's backup into account B ════════
  const aSnapshot = JSON.stringify({ g: owned(after.games, uidA), p: owned(after.plays, uidA) });
  await page.locator('#header-user-profile-btn').click();
  await page.locator('#auth-modal-backdrop').getByText('회원가입', { exact: true }).click();
  await page.locator('#auth-input-nickname').fill('계정B');
  await page.locator('#auth-input-email').fill(`b${Date.now()}@test.com`);
  await page.locator('#auth-input-password').fill('password123');
  await page.locator('#auth-submit-btn').click();
  await page.waitForFunction(
    (a) => JSON.parse(localStorage.getItem('boardlog_active_user') ?? 'null')?.uid !== a,
    uidA,
    { timeout: 15_000 }
  );
  const uidB = await activeUid(page);
  check('계정 B로 전환', uidB && uidB !== uidA, uidB);

  await page.locator('#nav-tab-mypage').click();
  // The crafted file has a game no seed contains, so a skipped-as-duplicate restore cannot pass this.
  await page.locator('#import-json-input').setInputFiles(craftedPath);
  await page.getByRole('button', { name: '복원하기' }).click();
  await expect(toast('를 복원했습니다')).toBeVisible();

  const final = await readStores(page);
  const aFinal = JSON.stringify({ g: owned(final.games, uidA), p: owned(final.plays, uidA) });
  check('계정 A 데이터 변동 없음 (전 레코드 동일)', aFinal === aSnapshot);
  const aIds = new Set([...owned(final.games, uidA), ...owned(final.plays, uidA)].map((r) => r.id));
  const bRows = [...owned(final.games, uidB ?? ''), ...owned(final.plays, uidB ?? '')];
  check(
    '계정 B 레코드 id가 A와 하나도 안 겹침',
    bRows.length > 0 && bRows.every((r) => !aIds.has(r.id)),
    `B 레코드 ${bRows.length}개`
  );
  const bGame = owned(final.games, uidB ?? '').find((g) => g.title === '테스트 신규게임');
  const bPlay = owned(final.plays, uidB ?? '').find((p) => p.gameTitle === '테스트 신규게임');
  check('계정 B에 신규 게임·기록 실제 복원', bGame && bPlay && bPlay.gameId === bGame.id);
  check(
    'A와 B의 같은 게임이 서로 다른 id',
    bGame && newGame && bGame.id !== newGame.id,
    `${newGame?.id} / ${bGame?.id}`
  );

  check('페이지 런타임 에러 없음', pageErrors.length === 0, pageErrors.join(' | '));
});
