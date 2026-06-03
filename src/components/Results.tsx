import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { SessionSummary } from '../types';
import { buildShareText, copyToClipboard } from '../lib/share';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  summary: SessionSummary;
  streak: number;
  practice: boolean;
  onHome: () => void;
  onStats: () => void;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center rounded-sm border border-line bg-surface-2/50 px-3 py-4 text-center">
      <span className="tnum text-h2 text-ink">{value}</span>
      <span className="mt-1 text-small text-muted">{label}</span>
      {sub && <span className="text-small text-muted">{sub}</span>}
    </div>
  );
}

export function Results({ summary, streak, practice, onHome, onStats }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function share() {
    const ok = await copyToClipboard(buildShareText(summary, streak));
    setCopied(ok);
  }

  const warmupCorrect = summary.mathCorrect ?? summary.nbackCorrect;
  const warmupTotal = summary.mathTotal ?? summary.nbackTotal;

  return (
    <main className="mx-auto flex min-h-dvh max-w-column flex-col px-5 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
        <header className="text-center">
          <p className="text-small text-muted">{practice ? 'Practice complete' : 'Session complete'}</p>
          <h1 className="mt-1 text-h1 text-ink">Nicely done.</h1>
          {!practice && (
            <p className="mt-2 text-body text-ink-soft">
              That’s a <span className="tnum font-semibold text-reward">{streak}-day</span> streak. Five minutes, well spent.
            </p>
          )}
        </header>

        <div className="grid grid-cols-2 gap-3">
          {typeof warmupCorrect === 'number' && (
            <Stat label="Warmup" value={`${warmupCorrect}/${warmupTotal}`} />
          )}
          {typeof summary.calibrationCorrect === 'number' && (
            <Stat label="Judgment" value={`${summary.calibrationCorrect}/${summary.calibrationTotal}`} />
          )}
          {typeof summary.brier === 'number' && (
            <Stat label="Brier score" value={summary.brier.toFixed(2)} sub="lower is better" />
          )}
          {typeof summary.estimationHits === 'number' && (
            <Stat label="Estimates in range" value={`${summary.estimationHits}/${summary.estimationTotal}`} />
          )}
        </div>

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
