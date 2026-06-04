/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType } from 'react';

// When we ship a new build, hashed chunk filenames change. A user who still has
// an older index.html open will 404 on the old chunk when they navigate, and
// React.lazy throws → the app shows the error screen. This wraps lazy() so that
// the FIRST such failure triggers one hard reload (fetching the fresh
// index.html with valid chunk names), which silently recovers. A sessionStorage
// flag prevents reload loops if the failure is genuine.

const RELOAD_FLAG = 'cm:chunk-reload';

function isChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /dynamically imported module|Loading chunk|Importing a module script failed|ChunkLoadError|error loading dynamically imported/i.test(
    msg,
  );
}

export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy<T>(() =>
    factory().catch((err: unknown): Promise<{ default: T }> => {
      if (isChunkError(err) && typeof window !== 'undefined') {
        const alreadyTried = window.sessionStorage.getItem(RELOAD_FLAG);
        if (!alreadyTried) {
          window.sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          // Keep the promise pending while the page reloads.
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }),
  );
}

/** Clear the reload guard once the app has settled, re-enabling future recovery. */
export function clearChunkReloadGuard(): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => window.sessionStorage.removeItem(RELOAD_FLAG), 4000);
}
