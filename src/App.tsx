import { Suspense, useEffect, useMemo, useState, type ReactElement } from 'react';
import type { DailySession, SessionSummary } from './types';
import { useUserState } from './hooks/useUserState';
import { dailyKey } from './lib/seed';
import { buildPracticeSession, buildSession } from './engine/session';
import { completeDailySession } from './lib/streak';
import { sound } from './lib/sound';
import { clearChunkReloadGuard, lazyRetry } from './lib/lazyRetry';
import { newlyEarned, type Achievement } from './lib/achievements';
import { Home } from './components/Home';
import { Onboarding } from './components/Onboarding';
import { SessionRunner } from './components/SessionRunner';
import { Results } from './components/Results';
import { SeedInspector } from './components/SeedInspector';

// Code-split the heavier, less-frequently-visited screens. lazyRetry recovers
// from stale-chunk 404s (after a new deploy) by reloading once.
const Stats = lazyRetry(() => import('./components/Stats').then((m) => ({ default: m.Stats })));
const About = lazyRetry(() => import('./components/About').then((m) => ({ default: m.About })));
const Explore = lazyRetry(() => import('./components/Explore').then((m) => ({ default: m.Explore })));
const EndlessPractice = lazyRetry(() =>
  import('./components/EndlessPractice').then((m) => ({ default: m.EndlessPractice })),
);
const Settings = lazyRetry(() => import('./components/Settings').then((m) => ({ default: m.Settings })));

type View = 'home' | 'session' | 'results' | 'stats' | 'about' | 'explore' | 'practiceModule' | 'settings';

export default function App() {
  const { state, update } = useUserState();
  const [view, setView] = useState<View>('home');
  const [session, setSession] = useState<DailySession | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [practice, setPractice] = useState(false);
  const [practiceModuleId, setPracticeModuleId] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

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

  // App has rendered successfully — re-arm chunk-reload recovery for next time.
  useEffect(() => {
    clearChunkReloadGuard();
  }, []);

  // Keep the audio engine in sync with the user's sound/voice preferences.
  useEffect(() => {
    sound.configure({ sound: state.settings.sound, voice: state.settings.voice });
  }, [state.settings.sound, state.settings.voice]);

  // Unlock achievements reactively once state has settled (after per-block
  // commits + the session completion flush). newlyEarned returns [] once stored,
  // so this never loops; the dedup guards a transient double-fire.
  useEffect(() => {
    const fresh = newlyEarned(state);
    if (fresh.length === 0) return;
    update((p) => ({ ...p, achievements: [...new Set([...p.achievements, ...fresh.map((a) => a.id)])] }));
    setUnlocked((prev) => {
      const ids = new Set(prev.map((a) => a.id));
      return [...prev, ...fresh.filter((a) => !ids.has(a.id))];
    });
  }, [state, update]);

  // Cycle: muted → chimes → chimes + voice → muted.
  function cycleAudio() {
    update((p) => {
      const { sound: s, voice: v } = p.settings;
      const next = !s ? { sound: true, voice: false } : !v ? { sound: true, voice: true } : { sound: false, voice: false };
      // Confirm the new mode audibly/spoken.
      sound.configure(next);
      if (next.sound) sound.correct();
      if (next.voice) sound.say('Voice on');
      return { ...p, settings: { ...p.settings, ...next } };
    });
  }

  if (!state.settings.onboarded) {
    return (
      <Onboarding
        onDone={() => update((p) => ({ ...p, settings: { ...p.settings, onboarded: true } }))}
      />
    );
  }

  function startDaily() {
    setPractice(false);
    setUnlocked([]);
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
          unlocked={unlocked}
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

    case 'settings':
      screen = (
        <Suspense fallback={loading}>
          <Settings
            user={state}
            update={update}
            onBack={() => setView('home')}
            onAbout={() => setView('about')}
            onResetData={() => {
              try {
                window.localStorage.removeItem('clearmind:user:v1');
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          />
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
          onSettings={() => setView('settings')}
          onToggleTheme={toggleTheme}
          onCycleAudio={cycleAudio}
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
