import type { Page } from '@playwright/test';

/** Records a 카탄 play (영희 wins) as 철수 and copies the share text; returns the link inside it. */
export async function savePlayAndCopyShareLink(page: Page): Promise<string> {
  const overlay = page.locator('#play-record-modal-overlay');
  await page.locator('#dashboard-add-play-cta').click();
  await page.locator('#play-game-search-input').fill('카탄');
  await overlay.getByText('카탄', { exact: true }).first().click();
  const names = overlay.locator('input[placeholder="이름"]');
  await names.nth(1).fill('영희');
  await page.getByRole('button', { name: '참여자 추가' }).click();
  await names.nth(2).fill('민수');
  await overlay.locator('button[title="승자 토글"]').nth(1).click();
  await page.locator('#play-form-save-btn').click();
  await page.locator('#play-share-sheet').waitFor();
  await page.locator('#play-share-name-input').fill('철수');
  await page.locator('#play-share-copy-btn').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  const link = clip.match(/https?:\/\/\S+#play=\S+/)?.[0];
  if (!link) throw new Error('No share link in the copied text');
  return link;
}
