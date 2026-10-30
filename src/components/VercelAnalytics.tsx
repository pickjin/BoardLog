import { Analytics } from '@vercel/analytics/react';
import type React from 'react';
import { isLocalHost, safePageLocation } from '../utils/analyticsEvents';

/**
 * Visit trend from Vercel Web Analytics (FR-MEAS-04, no cookies). Skipped on local servers, where the
 * script does not exist, and the address is sent without its #fragment.
 */
export const VercelAnalytics: React.FC = () => {
  if (isLocalHost(window.location.hostname)) return null;
  return <Analytics beforeSend={(event) => ({ ...event, url: safePageLocation(event.url) })} />;
};
