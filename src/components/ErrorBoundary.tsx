import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

const RELOAD_FLAG = 'cm:boundary-reload';

function isChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /dynamically imported module|Loading chunk|Importing a module script failed|ChunkLoadError/i.test(
    msg,
  );
}

/** Catches render errors so a single broken block never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ClearMind error boundary caught:', error, info);
    // A stale-chunk failure (common after a new deploy) recovers with one reload.
    if (isChunkError(error) && typeof window !== 'undefined') {
      if (!window.sessionStorage.getItem(RELOAD_FLAG)) {
        window.sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
      }
    }
  }

  hardReload = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(RELOAD_FLAG);
      window.location.reload();
    }
  };

  resetData = () => {
    try {
      window.localStorage.removeItem('clearmind:user:v1');
    } catch {
      /* ignore */
    }
    this.hardReload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-dvh max-w-column flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-h2 text-ink">Something went sideways</h1>
          <p className="text-body text-ink-soft">
            Your progress is saved on this device. Reloading usually fixes it.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={this.hardReload}
              className="min-h-[44px] rounded-sm bg-accent px-5 py-3 font-medium text-white"
            >
              Reload
            </button>
            <button
              onClick={this.resetData}
              className="min-h-[44px] rounded-sm px-5 py-3 text-small text-muted hover:text-ink"
            >
              Reset this device’s data &amp; reload
            </button>
          </div>
          {this.state.message && (
            <p className="mt-2 max-w-xs break-words text-small text-muted">
              <span className="opacity-60">Details:</span> {this.state.message}
            </p>
          )}
        </main>
      );
    }
    return this.props.children;
  }
}
