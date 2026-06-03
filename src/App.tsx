import { lazy, Suspense, useMemo, useState } from 'react';
import type { DailySession, SessionSummary } from './types';
import { useUserState } from './hooks/useUserState';
import { dailyKey } from './lib/seed';
import { buildPracticeSession, buildSession } from './engine/session';
import { completeDailySession } from './lib/streak';
import { Home } from './components/Home';
import { Onboarding } from './components/Onboarding';
import { SessionRunner } from './components/SessionRunner';
import { Results } from './components/Results';

// Code-split the heavier, less-frequently-visited screens.
const Stats = lazy(() => import('./components/Stats').then((m) => ({ default: m.Stats })));
const About = lazy(() => import('./components/About').then((m) => ({ default: m.About })));

type View = 'home' | 'session' | 'results' | 'stats' | 'about';

export default function App() {
  const { state, update } = useUserState();
  const [view, setView] = useState<View>('home');
  const [session, setSession] = useState<DailySession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [practice, setPractice] = useState(false);

  const todayKey = useMemo(() => dailyKey(), []);

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
    setSession(buildPracticeSession(state));
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

  switch (view) {
    case 'session':
      return session ? (
        <SessionRunner
          session={session}
          update={update}
          practice={practice}
          onComplete={handleComplete}
          onExit={() => setView('home')}
        />
      ) : (
        loading
      );

    case 'results':
      return summary ? (
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

    case 'stats':
      return (
        <Suspense fallback={loading}>
          <Stats user={state} onHome={() => setView('home')} />
        </Suspense>
      );

    case 'about':
      return (
        <Suspense fallback={loading}>
          <About onBack={() => setView('home')} />
        </Suspense>
      );

    default:
      return (
        <Home
          user={state}
          onStart={startDaily}
          onPractice={startPractice}
          onStats={() => setView('stats')}
          onAbout={() => setView('about')}
          onToggleTheme={toggleTheme}
          onEveningCheck={eveningCheck}
        />
      );
  }
}
