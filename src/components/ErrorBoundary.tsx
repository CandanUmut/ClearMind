import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/** Catches render errors so a single broken block never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry by design — log locally for debugging only.
    console.error('ClearMind error boundary caught:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-dvh max-w-column flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-h2 text-ink">Something went sideways</h1>
          <p className="text-body text-ink-soft">
            Your data is safe on this device. Try reloading.
          </p>
          <button
            onClick={() => {
              this.reset();
              window.location.reload();
            }}
            className="min-h-[44px] rounded-sm bg-accent px-5 py-3 font-medium text-white"
          >
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
