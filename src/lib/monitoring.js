/**
 * Optional Sentry-style hook. Set VITE_SENTRY_DSN to enable browser reporting later.
 * Keeps ErrorBoundary useful without requiring @sentry/react until you install it.
 */
export function reportError(error, context = {}) {
  console.error('[UNICAB]', error, context);
  if (typeof window !== 'undefined' && window.__UNICAB_REPORT_ERROR__) {
    try {
      window.__UNICAB_REPORT_ERROR__(error, context);
    } catch {
      // ignore
    }
  }
}
