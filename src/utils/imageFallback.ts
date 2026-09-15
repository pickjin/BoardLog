import type React from 'react';

/**
 * Inline so it resolves without a network request. A remote placeholder re-fires
 * `onError` when it fails too, which turns the handler into an endless request loop.
 */
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">' +
      '<rect width="600" height="600" fill="#e7e5e4"/>' +
      '<rect x="203" y="203" width="194" height="194" rx="20" fill="none" stroke="#a8a29e" stroke-width="14"/>' +
      '<circle cx="262" cy="262" r="19" fill="#a8a29e"/>' +
      '<circle cx="338" cy="338" r="19" fill="#a8a29e"/>' +
      '</svg>'
  );

export function applyImageFallback(event: React.SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = FALLBACK_IMAGE;
}
