import { test } from '@playwright/test';
import { hasText, hidden, MOBILE, visible } from './helpers';

test.use({ viewport: MOBILE });

test('privacy notice opens from My page and says Google Analytics is not used when no id is built in', async ({
  page
}, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#nav-tab-mypage').click();
  await page.locator('#mypage-privacy-btn').click();

  const modal = page.locator('#privacy-notice-modal');
  await visible('안내 화면 표시', modal);
  await hasText('저장 위치 안내: 이 기기의 브라우저에만 저장', modal, '이 기기의 브라우저에만 저장됩니다');
  await hasText('사진 인식이 Google AI로 전달됨을 밝힘', modal, 'Gemini');
  await hasText('공유 링크에 이름이 들어 있음을 밝힘', modal, '공유 링크 안에는');
  await hasText(
    'Google Analytics 미사용 문구 (측정 ID 없는 빌드)',
    modal,
    '이 버전에서는 Google Analytics를 사용하지 않습니다'
  );
  await hasText('이름·점수 등을 통계로 보내지 않는다고 밝힘', modal, '통계로 보내지 않습니다');
  await page.screenshot({ path: testInfo.outputPath('privacy-notice.png') });

  await page.locator('#privacy-notice-close-btn').click();
  await hidden('닫기 버튼으로 닫힘', modal);
});
