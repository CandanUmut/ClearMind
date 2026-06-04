import { lazy, Suspense, useMemo, useState, type ReactElement } from 'react';
import type { DailySession, SessionSummary } from './types';
import { useUserState } from './hooks/useUserState';
import { dailyKey } from './lib/seed';
import { buildPracticeSession, buildSession } from './engine/session';
import { completeDailySession } from './lib/streak';
import { Home } from './components/Home';
import { Onboarding } from './components/Onboarding';
import { SessionRunner } from './components/SessionRunner';
import { Results } from './components/Results';
import { SeedInspector } from './components/SeedInspector';

// Code-split the heavier, less-frequently-visited screens.
const Stats = lazy(() => import('./components/Stats').then((m) => ({ default: m.Stats })));
const About = lazy(() => import('./components/About').then((m) => ({ default: m.About })));
const Explore = lazy(() => import('./components/Explore').then((m) => ({ default: m.Explore })));
const EndlessPractice = lazy(() =>
  import('./components/EndlessPractice').then((m) => ({ default: m.EndlessPractice })),
);

type View = 'home' | 'session' | 'results' | 'stats' | 'about' | 'explore' | 'practiceModule';

export default function App() {
  const { state, update } = useUserState();
  const [view, setView] = useState<View>('home');
  const [session, setSession] = useState<DailySession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [practice, setPractice] = useState(false);
  const [practiceModuleId, setPracticeModuleId] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const todayKey = useMemo(() => dailyKey(), []);
  const debugEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      new URLSearchParams(window.location.search).has('debug') ||
      window.localStorage.getItem('clearmind:debug') === '1'
    );
  }, []);
  const reducedMotion =
    state.settings.reducedMotion ||
    (typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ||
    false;

  if (!state.settings.onboarded) {
    return (
      <Onboarding
        onDone={() => update((p) => ({ ...p, settings: { ...p.settings, onboarded: true } }))}
      />
    );
  }

  function startDaily() {
    setPractice(false);
    setSession(buildSession(todayKey, state));
    setView('session');
  }

  function startPractice() {
    setPractice(true);
    setSession(buildPracticeSession(state, `${Date.now()}:${Math.floor(Math.random() * 1e9)}`));
    setView('session');
  }

  function handleComplete(s: SessionSummary) {
    if (!practice) {
      update((prev) => completeDailySession(prev, todayKey, s));
    }
    setSummary(s);
    setView('results');
  }

  function toggleTheme() {
    update((p) => ({
      ...p,
      settings: { ...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light' },
    }));
  }

  function eveningCheck() {
    const kept = window.confirm('Did you follow through on your intention today?');
    update((prev) => ({
      ...prev,
      intentions: prev.intentions.map((i) =>
        i.dateKey === todayKey ? { ...i, kept } : i,
      ),
      followThroughStreak: kept ? prev.followThroughStreak + 1 : 0,
    }));
  }

  const loading = <div className="flex min-h-dvh items-center justify-center text-muted">…</div>;

  let screen: ReactElement;
  switch (view) {
    case 'session':
      screen = session ? (
        <SessionRunner
          session={session}
          update={update}
          practice={practice}
          reducedMotion={reducedMotion}
          onComplete={handleComplete}
          onExit={() => setView('home')}
        />
      ) : (
        loading
      );
      break;

    case 'results':
      screen = summary ? (
        <Results
          summary={summary}
          streak={state.streak}
          practice={practice}
          onHome={() => setView('home')}
          onStats={() => setView('stats')}
        />
      ) : (
        loading
      );
      break;

    case 'stats':
      screen = (
        <Suspense fallback={loading}>
          <Stats user={state} onHome={() => setView('home')} />
        </Suspense>
      );
      break;

    case 'about':
      screen = (
        <Suspense fallback={loading}>
          <About onBack={() => setView('home')} />
        </Suspense>
      );
      break;

    case 'explore':
      screen = (
        <Suspense fallback={loading}>
          <Explore
            user={state}
            onBack={() => setView('home')}
            onPractice={(id) => {
              setPracticeModuleId(id);
              setView('practiceModule');
            }}
          />
        </Suspense>
      );
      break;

    case 'practiceModule':
      screen = practiceModuleId ? (
        <Suspense fallback={loading}>
          <EndlessPractice
            moduleId={practiceModuleId}
            startDifficulty={0.5}
            reducedMotion={reducedMotion}
            onExit={() => setView('explore')}
          />
        </Suspense>
      ) : (
        loading
      );
      break;

    default:
      screen = (
        <Home
          user={state}
          onStart={startDaily}
          onPractice={startPractice}
          onExplore={() => setView('explore')}
          onStats={() => setView('stats')}
          onAbout={() => setView('about')}
          onToggleTheme={toggleTheme}
          onEveningCheck={eveningCheck}
        />
      );
  }

  return (
    <>
      {screen}
      {debugEnabled && (
        <button
          onClick={() => setDebugOpen(true)}
          className="fixed bottom-3 right-3 z-40 rounded-full bg-ink/80 px-3 py-2 text-small text-bg shadow-2"
          aria-label="Open Seed Inspector"
        >
          🔬 seed
        </button>
      )}
      {debugEnabled && debugOpen && (
        <SeedInspector session={session} dateKey={todayKey} onClose={() => setDebugOpen(false)} />
      )}
    </>
  );
}
