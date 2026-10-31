import {
  type AnalyticsEventName,
  type AnalyticsEventParams,
  isMeasurementId,
  safePageLocation,
  validateEvent
} from '../utils/analyticsEvents';

type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

let started = false;

const measurementId = (): string | undefined => {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  return isMeasurementId(id) ? id : undefined;
};

/** True only when a valid GA4 id was built in; the privacy notice mentions Google Analytics only then. */
export const isGoogleAnalyticsEnabled = (): boolean => measurementId() !== undefined;

/**
 * Starts GA4 when, and only when, a measurement id is configured; otherwise nothing is loaded and
 * no request is made (FR-MEAS-01). The page view is sent by hand so the address can be cleaned first.
 */
export function initAnalytics(): void {
  const id = measurementId();
  if (!id || started || typeof window === 'undefined') return;
  started = true;

  try {
    const w = window as GtagWindow;
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function gtag() {
      // biome-ignore lint/complexity/noArguments: gtag.js only recognises Arguments objects in the data layer, not arrays, so a rest parameter would not work
      w.dataLayer?.push(arguments);
    };

    const pageLocation = safePageLocation(window.location.href);
    w.gtag('js', new Date());
    w.gtag('config', id, {
      send_page_view: false,
      // Advertising features are not used; keep Google from linking visits to ad profiles.
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Without this, every later event would carry the live address, fragment included.
      page_location: pageLocation
    });
    w.gtag('event', 'page_view', { page_location: pageLocation });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  } catch {
    // Statistics must never break the app.
  }
}

/** Reports one feature use. Unknown events and unlisted parameter values are dropped, never sent. */
export function track<K extends AnalyticsEventName>(
  name: K,
  ...args: AnalyticsEventParams[K] extends undefined ? [] : [AnalyticsEventParams[K]]
): void {
  if (!started) return;
  try {
    const event = validateEvent(name, args[0] as Record<string, unknown> | undefined);
    if (!event) return;
    (window as GtagWindow).gtag?.('event', event.name, event.params);
  } catch {
    // Statistics must never break the app.
  }
}
