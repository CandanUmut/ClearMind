import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { SessionSummary } from '../types';
import { buildShareText, copyToClipboard } from '../lib/share';
import { categoryColor } from '../lib/categories';
import { sound } from '../lib/sound';
import { sessionInsight, streakMilestone } from '../lib/insight';
import type { Achievement } from '../lib/achievements';
import type { ModuleCategory } from '../engine/registry';
import { useCountUp } from '../hooks/useCountUp';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  summary: SessionSummary;
  streak: number;
  practice: boolean;
  unlocked: Achievement[];
  onHome: () => void;
  onStats: () => void;
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-sm border px-3 py-4 text-center"
      style={{
        borderColor: color ? `color-mix(in srgb, ${color} 35%, var(--line))` : 'var(--line)',
        background: color ? `color-mix(in srgb, ${color} 7%, var(--surface))` : 'var(--surface-2)',
      }}
    >
      <span className="tnum text-h2 text-ink">{value}</span>
      <span className="mt-1 text-small text-muted">{label}</span>
      {sub && <span className="text-small text-muted">{sub}</span>}
    </div>
  );
}

export function Results({ summary, streak, practice, unlocked, onHome, onStats }: Props) {
  const [copied, setCopied] = useState(false);
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const streakCount = useCountUp(streak, 700, !reduce && !practice);
  const milestone = !practice ? streakMilestone(streak) : null;
  const insight = sessionInsight(summary);

  useEffect(() => {
    sound.complete();
    if (!practice) sound.say(milestone ? `${milestone}` : `Done. ${streak} day streak.`);
    if (unlocked.length) window.setTimeout(() => sound.correct(), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function share() {
    const ok = await copyToClipboard(buildShareText(summary, streak));
    setCopied(ok);
  }

  const scored = summary.blocks.filter(
    (b) => b.label && !['set', 'skipped', 'written', 'reflected'].includes(b.label),
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-column flex-col px-5 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
        <header className="cm-hero rounded border border-line p-6 text-center shadow-1">
          <p className="text-small text-muted">{practice ? 'Practice complete' : 'Session complete'}</p>
          <h1 className="mt-1 text-h1 text-ink">{milestone ? '🎉 Milestone!' : 'Nicely done.'}</h1>
          {!practice && (
            <p className="mt-2 text-body text-ink-soft">
              {milestone ? (
                <span className="font-semibold text-reward">{milestone}</span>
              ) : (
                <>
                  That’s a <span className="tnum font-semibold text-reward">{Math.round(streakCount)}-day</span> streak. Five minutes, well spent.
                </>
              )}
            </p>
          )}
        </header>

        {insight && !practice && (
          <Card className="border-l-4" style={{ borderLeftColor: categoryColor('judgment') }}>
            <p className="text-small text-ink-soft"><span className="font-semibold text-ink">Today’s takeaway: </span>{insight}</p>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          {scored.map((b, i) => (
            <Stat
              key={i}
              label={`${b.glyphs ?? ''} ${b.title}`.trim()}
              value={b.label ?? ''}
              color={categoryColor(b.category as ModuleCategory)}
            />
          ))}
          {typeof summary.brier === 'number' && (
            <Stat label="Brier score" value={summary.brier.toFixed(2)} sub="lower is better" color={categoryColor('judgment')} />
          )}
        </div>

        {unlocked.length > 0 && (
          <Card>
            <p className="mb-2 text-small font-semibold text-ink">New achievement{unlocked.length > 1 ? 's' : ''} unlocked</p>
            <div className="flex flex-col gap-2">
              {unlocked.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-h2" aria-hidden>{a.icon}</span>
                  <div>
                    <p className="text-body font-medium text-ink">{a.title}</p>
                    <p className="text-small text-muted">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!practice && (
          <Card>
            <p className="text-small text-ink-soft">
              The two parts that genuinely transfer to real life are your <strong>calibration</strong>{' '}
              (confidence matching reality) and the <strong>intention</strong> you set. The games are
              warmups — enjoyable, but they won’t make you generally smarter, and we won’t pretend they do.
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {!practice && (
            <Button full onClick={share}>
              {copied ? 'Copied to clipboard ✓' : 'Share result'}
            </Button>
          )}
          <Button variant="secondary" full onClick={onStats}>View progress</Button>
          <Button variant="ghost" full onClick={onHome}>Back home</Button>
        </div>
      </motion.div>
    </main>
  );
}
