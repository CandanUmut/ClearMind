import { useEffect, useState } from 'react';
import type { UserState } from '../types';
import { dailyKey } from '../lib/seed';
import { isCompletedToday, liveStreak } from '../lib/streak';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Ring } from './ui/Ring';
import { StreakFlame } from './ui/StreakFlame';
import { ThemeToggle } from './ui/ThemeToggle';

interface Props {
  user: UserState;
  onStart: () => void;
  onPractice: () => void;
  onExplore: () => void;
  onStats: () => void;
  onAbout: () => void;
  onToggleTheme: () => void;
  onEveningCheck: () => void;
}

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeUntilTomorrow(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const ms = tomorrow.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function Home({ user, onStart, onPractice, onExplore, onStats, onAbout, onToggleTheme, onEveningCheck }: Props) {
  const today = new Date();
  const todayKey = dailyKey(today);
  const done = isCompletedToday(user, todayKey);
  const streak = liveStreak(user, todayKey);
  const [countdown, setCountdown] = useState(timeUntilTomorrow());

  useEffect(() => {
    if (!done) return;
    const id = window.setInterval(() => setCountdown(timeUntilTomorrow()), 30_000);
    return () => window.clearInterval(id);
  }, [done]);

  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // Evening follow-through prompt: there is an intention from today not yet checked,
  // and it is now evening.
  const todaysIntention = user.intentions.find((i) => i.dateKey === todayKey);
  const showEveningCheck = done && todaysIntention?.kept === null && today.getHours() >= 17;

  return (
    <main className="mx-auto flex min-h-dvh max-w-column flex-col px-5 py-6">
      <div className="mb-8 flex items-center justify-between">
        <StreakFlame count={streak} />
        <div className="flex items-center gap-1">
          <button onClick={onStats} aria-label="Statistics" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-surface-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" />
            </svg>
          </button>
          <ThemeToggle theme={user.settings.theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6">
        <header className="cm-rise" style={{ animationDelay: '0ms' }}>
          <p className="text-small text-muted">{dateLabel}</p>
          <h1 className="mt-1 text-h1 text-ink">
            {greeting(today)}.
          </h1>
        </header>

        {!done ? (
          <>
            <Card className="cm-rise" interactive style={{ animationDelay: '60ms' }}>
              <div className="flex items-center gap-4">
                <Ring value={0}>
                  <span className="tnum text-small text-muted">5m</span>
                </Ring>
                <div className="flex-1">
                  <h2 className="text-h3 text-ink">Today’s session</h2>
                  <p className="text-small text-muted">
                    Warmup · Calibration · Estimation · Intention · Reflection
                  </p>
                </div>
              </div>
            </Card>

            <div className="cm-rise flex flex-col gap-3" style={{ animationDelay: '120ms' }}>
              <Button full onClick={onStart}>Start today’s 5 minutes</Button>
              <Button variant="ghost" full onClick={onExplore}>Explore all exercises</Button>
              <p className="text-center text-small text-muted">
                Clear thinking and good judgment — instead of scrolling.
              </p>
            </div>
          </>
        ) : (
          <>
            <Card className="cm-rise" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center gap-4">
                <Ring value={1}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </Ring>
                <div className="flex-1">
                  <h2 className="text-h3 text-ink">Done for today</h2>
                  <p className="text-small text-muted">
                    Next session in <span className="tnum">{countdown}</span>. Rest is part of it.
                  </p>
                </div>
              </div>
            </Card>

            {showEveningCheck && (
              <Card className="cm-rise" style={{ animationDelay: '90ms' }}>
                <p className="text-body text-ink">
                  This morning you planned: <em>“{todaysIntention?.what}”</em>
                </p>
                <Button className="mt-3" full variant="secondary" onClick={onEveningCheck}>
                  Did you follow through?
                </Button>
              </Card>
            )}

            <div className="cm-rise flex flex-col gap-3" style={{ animationDelay: '120ms' }}>
              <Button variant="secondary" full onClick={onStats}>See your progress</Button>
              <Button variant="secondary" full onClick={onExplore}>Explore all exercises</Button>
              <Button variant="ghost" full onClick={onPractice}>Practice mode (unscored)</Button>
            </div>
          </>
        )}
      </div>

      <footer className="mt-8 text-center">
        <button onClick={onAbout} className="text-small text-muted underline-offset-2 hover:underline">
          About · The science
        </button>
      </footer>
    </main>
  );
}
