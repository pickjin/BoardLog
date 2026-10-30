import { test } from '@playwright/test';
import { savePlayAndCopyShareLink } from './flows';
import { check, MOBILE } from './helpers';

test.use({ viewport: MOBILE, permissions: ['clipboard-read', 'clipboard-write'] });

// Anything that talks to an analytics service. Same-origin app files never match.
const ANALYTICS_REQUEST =
  /googletagmanager|google-analytics|analytics\.google|doubleclick|_vercel\/insights|vercel-scripts|va\.vercel/i;

test('no measurement id: using the app sends nothing to any analytics service (FR-MEAS-01)', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', (request) => {
    if (ANALYTICS_REQUEST.test(request.url())) analyticsRequests.push(request.url());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await savePlayAndCopyShareLink(page);
  await page.waitForTimeout(500);

  check('분석 서비스로 나가는 요청 0건', analyticsRequests.length === 0, analyticsRequests.join(' | '));
  const globals = await page.evaluate(() => ({
    dataLayer: 'dataLayer' in window,
    gtag: 'gtag' in window
  }));
  check('dataLayer·gtag를 만들지 않음', !globals.dataLayer && !globals.gtag, JSON.stringify(globals));
});
