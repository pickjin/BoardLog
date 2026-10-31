/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 measurement id (G-XXXX). Unset means no analytics request leaves the browser (FR-MEAS-01). */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}
