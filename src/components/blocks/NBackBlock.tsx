import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { NBackExercise } from '../../types';
import { LETTERS } from '../../engine/modules/nback';
import { Button } from '../ui/Button';
import { EvidenceNote } from '../ui/EvidenceNote';

interface Props {
  exercise: NBackExercise;
  onDone: (flagged: number[]) => void;
}

const STEP_MS = 2200;

export function NBackBlock({ exercise, onDone }: Props) {
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(-1);
  const flagged = useRef<Set<number>>(new Set());
  const [flashFlag, setFlashFlag] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const stimulus = pos >= 0 ? exercise.stimuli[pos] : -1;

  const advance = useCallback(() => {
    setPos((p) => {
      const next = p + 1;
      if (next >= exercise.stimuli.length) {
        return p; // hold; effect below detects completion
      }
      return next;
    });
  }, [exercise.stimuli.length]);

  useEffect(() => {
    if (!started) return;
    timer.current = window.setInterval(advance, STEP_MS);
    return () => window.clearInterval(timer.current);
  }, [started, advance]);

  useEffect(() => {
    if (started && pos >= exercise.stimuli.length - 1) {
      // Give the last item its full window, then finish.
      const t = window.setTimeout(() => onDone([...flagged.current]), STEP_MS);
      return () => window.clearTimeout(t);
    }
  }, [pos, started, exercise.stimuli.length, onDone]);

  function flagMatch() {
    if (pos < 0) return;
    flagged.current.add(pos);
    setFlashFlag(true);
    window.setTimeout(() => setFlashFlag(false), 180);
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-5">
        <header>
          <p className="text-small text-muted">Warmup</p>
          <h2 className="text-h2 text-ink">{exercise.n}-Back ({exercise.kind})</h2>
        </header>
        <div className="rounded border border-line bg-surface p-5 text-body text-ink-soft shadow-1">
          <p className="mb-3">
            You’ll see a sequence of {exercise.kind === 'position' ? 'highlighted cells' : 'letters'},
            one at a time. Tap <strong>Match</strong> whenever the current one is the same as the one{' '}
            <strong>{exercise.n} step{exercise.n > 1 ? 's' : ''} back</strong>.
          </p>
          <p className="text-muted">Don’t worry about getting them all — just watch the pattern.</p>
        </div>
        <Button full onClick={() => { setStarted(true); setPos(0); }}>
          Start
        </Button>
        <EvidenceNote moduleId="nback" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small text-muted">
          {exercise.n}-Back · {pos + 1} of {exercise.stimuli.length}
        </p>
        <h2 className="text-h2 text-ink">Watch for matches</h2>
      </header>

      {exercise.kind === 'position' ? (
        <div className="mx-auto grid grid-cols-3 gap-2" style={{ width: 240 }}>
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm border border-line transition-colors"
              style={{ background: i === stimulus ? 'var(--accent)' : 'var(--surface-2)' }}
            />
          ))}
        </div>
      ) : (
        <motion.div
          key={pos}
          initial={{ opacity: 0.3, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto flex h-40 w-40 items-center justify-center rounded border border-line bg-surface-2 shadow-1"
        >
          <span className="tnum text-display font-semibold text-ink">{LETTERS[stimulus]}</span>
        </motion.div>
      )}

      <Button
        full
        variant={flashFlag ? 'primary' : 'secondary'}
        onClick={flagMatch}
        aria-pressed={flagged.current.has(pos)}
      >
        Match {flagged.current.has(pos) ? '✓' : ''}
      </Button>
      <p className="text-center text-small text-muted">
        Same as {exercise.n} step{exercise.n > 1 ? 's' : ''} back?
      </p>
    </div>
  );
}
