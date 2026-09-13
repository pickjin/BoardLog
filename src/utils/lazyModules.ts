/**
 * Lazily loaded heavy export dependencies.
 *
 * jspdf and html2canvas are only needed when the user explicitly exports a
 * PDF or an image card. Importing them statically pulled ~700kB into the
 * initial bundle, so they are code-split behind memoized dynamic imports.
 * Memoizing the promise keeps duplicate clicks from fetching the chunk twice.
 */

export class ExportModuleLoadError extends Error {
  constructor(moduleName: string, cause: unknown) {
    super(`Failed to load export module "${moduleName}"`);
    this.name = 'ExportModuleLoadError';
    this.cause = cause;
  }
}

function memoize<T>(moduleName: string, load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = load().catch((error) => {
        // Reset so a transient network failure can be retried on the next click.
        pending = null;
        throw new ExportModuleLoadError(moduleName, error);
      });
    }
    return pending;
  };
}

export const loadHtml2Canvas = memoize('html2canvas', async () => {
  const mod = await import('html2canvas');
  return mod.default;
});

export const loadJsPdf = memoize('jspdf', async () => {
  const mod = await import('jspdf');
  return mod.default;
});
