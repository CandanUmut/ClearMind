import { useMemo, useState } from 'react';
import type { UserState } from '../types';
import { dailyKey } from '../lib/seed';
import { liveStreak } from '../lib/streak';
import { mean, pct } from '../lib/scoring';
import { allModules } from '../engine/registry';
import '../engine/modules';
import { categoryColor } from '../lib/categories';
import { ACHIEVEMENTS, earnedAchievementIds } from '../lib/achievements';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ReliabilityDiagram } from './ui/ReliabilityDiagram';
import { Sparkline } from './ui/Sparkline';
import { Heatmap } from './ui/Heatmap';
import { Journal } from './Journal';

interface Props {
  user: UserState;
  onHome: () => void;
}

// Skill rows are derived from the registry: every scored module (skillId set)
// appears automatically, so new modules need no edits here.
const SKILLS = allModules()
  .filter((m) => m.skillId)
  .map((m) => ({ skillId: m.skillId as string, title: m.title, color: categoryColor(m.category) }));

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col rounded-sm border border-line bg-surface-2/50 px-4 py-3">
      <span className="tnum text-h2 text-ink">{value}</span>
      <span className="text-small text-muted">{label}</span>
      {sub && <span className="text-small text-muted">{sub}</span>}
    </div>
  );
}

export function Stats({ user, onHome }: Props) {
  const [showJournal, setShowJournal] = useState(false);
  const todayKey = dailyKey();

  const completedDays = useMemo(
    () => new Set([...user.summaries.map((s) => s.dateKey), ...(user.lastCompletedDate ? [user.lastCompletedDate] : [])]),
    [user.summaries, user.lastCompletedDate],
  );
  const earnedSet = useMemo(() => new Set(earnedAchievementIds(user)), [user]);

  const allPoints = useMemo(
    () => user.brierHistory.flatMap((b) => b.points),
    [user.brierHistory],
  );
  const brierTrend = useMemo(() => user.brierHistory.map((b) => b.brier), [user.brierHistory]);
  const estTotals = useMemo(() => {
    const hits = user.estimationHistory.reduce((a, e) => a + e.hits, 0);
    const total = user.estimationHistory.reduce((a, e) => a + e.total, 0);
    return { hits, total };
  }, [user.estimationHistory]);

  const intentionsChecked = user.intentions.filter((i) => i.kept !== null);
  const intentionsKept = intentionsChecked.filter((i) => i.kept === true).length;

  if (showJournal) {
    return <Journal user={user} onBack={() => setShowJournal(false)} />;
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onHome} aria-label="Back home" className="text-small text-muted hover:text-ink">← Home</button>
        <h1 className="text-h2 text-ink">Your progress</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Headline metrics */}
        <Card className="md:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Current streak" value={`${liveStreak(user, todayKey)}`} sub="days" />
            <Metric label="Best streak" value={`${user.longestStreak}`} sub="days" />
            <Metric label="Sessions" value={`${user.sessionsCompleted}`} sub="completed" />
          </div>
        </Card>

        {/* Activity heatmap */}
        <Card className="md:col-span-2">
          <h2 className="mb-3 text-h3 text-ink">Activity</h2>
          <Heatmap completed={completedDays} />
        </Card>

        {/* Achievements */}
        <Card className="md:col-span-2">
          <h2 className="mb-3 text-h3 text-ink">
            Achievements <span className="text-small font-normal text-muted">{earnedSet.size}/{ACHIEVEMENTS.length}</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const got = earnedSet.has(a.id);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-sm border p-2"
                  style={{ borderColor: 'var(--line)', opacity: got ? 1 : 0.45 }}
                  title={a.description}
                >
                  <span className="text-h3" aria-hidden style={{ filter: got ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium text-ink">{a.title}</p>
                    <p className="truncate text-small text-muted">{got ? 'Unlocked' : a.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Calibration reliability */}
        <Card>
          <h2 className="mb-1 text-h3 text-ink">Calibration</h2>
          <p className="mb-3 text-small text-muted">
            How your confidence (across) matches how often you were right (up). On the dashed line = perfectly calibrated.
          </p>
          {allPoints.length === 0 ? (
            <p className="py-8 text-center text-small text-muted">Complete a calibration block to see this.</p>
          ) : (
            <div className="flex justify-center">
              <ReliabilityDiagram points={allPoints} />
            </div>
          )}
        </Card>

        {/* Trends */}
        <Card>
          <h2 className="mb-3 text-h3 text-ink">Trends</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-ink">Brier score</p>
                <p className="tnum text-small text-muted">
                  {brierTrend.length ? mean(brierTrend).toFixed(2) : '—'} avg · lower is better
                </p>
              </div>
              <Sparkline values={brierTrend} min={0} max={0.5} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-ink">Estimation hit-rate</p>
                <p className="tnum text-small text-muted">
                  {pct(estTotals.hits, estTotals.total)}% in range · target 90%
                </p>
              </div>
              <Sparkline
                values={user.estimationHistory.map((e) => (e.total ? e.hits / e.total : 0))}
                min={0} max={1}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-small text-ink">Intention follow-through</p>
                <p className="tnum text-small text-muted">
                  {intentionsChecked.length ? `${pct(intentionsKept, intentionsChecked.length)}% kept` : 'no checks yet'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Per-skill ratings */}
        <Card className="md:col-span-2">
          <h2 className="mb-3 text-h3 text-ink">Skill level</h2>
          <p className="mb-3 text-small text-muted">
            Difficulty adapts to keep you near your edge — this is your current setting, not a score.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SKILLS.map(({ skillId, title, color }) => (
              <div key={skillId} className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-small text-ink">{title}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((user.ratings[skillId] ?? 0.4) * 100)}%`, background: color }} />
                  </div>
                </div>
                <Sparkline values={user.ratingHistory[skillId] ?? []} width={70} height={24} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" full onClick={() => setShowJournal(true)}>Open journal</Button>
        <Button variant="ghost" full onClick={onHome}>Back home</Button>
      </div>
    </main>
  );
}
