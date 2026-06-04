import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { EstimationExercise, EstimationResponse } from '../../types';
import { sound } from '../../lib/sound';
import { Button } from '../ui/Button';
import { EvidenceNote } from '../ui/EvidenceNote';

interface Props {
  exercise: EstimationExercise;
  onDone: (responses: EstimationResponse[]) => void;
}

type Phase = 'answer' | 'reveal';

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function EstimationBlock({ exercise, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const [phase, setPhase] = useState<Phase>('answer');
  const responses = useRef<EstimationResponse[]>([]);

  const fact = exercise.facts[index];
  const total = exercise.facts.length;
  const lo = Number(low);
  const hi = Number(high);
  const hit = fact.value >= Math.min(lo, hi) && fact.value <= Math.max(lo, hi);

  function reveal() {
    responses.current = [...responses.current, { low: lo, high: hi }];
    sound.feedback(hit, hit ? 'In range' : 'Outside your range');
    setPhase('reveal');
  }

  function next() {
    if (index + 1 >= total) {
      onDone(responses.current);
      return;
    }
    setIndex(index + 1);
    setLow('');
    setHigh('');
    setPhase('answer');
  }

  const valid = low.trim() !== '' && high.trim() !== '' && !Number.isNaN(lo) && !Number.isNaN(hi);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small font-medium" style={{ color: 'var(--cat-judgment)' }}>Estimation · {index + 1} of {total}</p>
        <h2 className="text-h2 text-ink">90% confidence interval</h2>
      </header>

      <motion.div
        key={index}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded border border-line bg-surface p-6 shadow-1"
      >
        <p className="text-h3 leading-snug text-ink">{fact.question}</p>
        <p className="mt-2 text-small text-muted">
          Give a range you’re 90% sure contains the answer{fact.unit ? ` (in ${fact.unit})` : ''}.
        </p>
      </motion.div>

      {phase === 'answer' ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (valid) reveal(); }}
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-small text-muted">
              Low end
              <input
                type="number" inputMode="decimal" value={low}
                onChange={(e) => setLow(e.target.value)}
                className="tnum rounded-sm border border-line bg-surface px-3 py-3 text-body text-ink outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-small text-muted">
              High end
              <input
                type="number" inputMode="decimal" value={high}
                onChange={(e) => setHigh(e.target.value)}
                className="tnum rounded-sm border border-line bg-surface px-3 py-3 text-body text-ink outline-none focus:border-accent"
              />
            </label>
          </div>
          <Button type="submit" full disabled={!valid}>Reveal</Button>
        </form>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <div
            className="rounded-sm px-4 py-3 text-center text-body font-semibold"
            style={{
              background: hit ? 'color-mix(in srgb, var(--correct) 14%, transparent)' : 'color-mix(in srgb, var(--incorrect) 14%, transparent)',
              color: hit ? 'var(--correct)' : 'var(--incorrect)',
            }}
          >
            {hit ? '🎯 Inside your range' : 'Outside your range'}
          </div>
          <p className="tnum text-center text-h3 text-ink">
            {fmt(fact.value)} {fact.unit}
          </p>
          <p className="text-center text-small text-muted">
            Your range: {fmt(Math.min(lo, hi))} – {fmt(Math.max(lo, hi))}. {fact.sourceHint}.
          </p>
          <Button full onClick={next}>
            {index + 1 >= total ? 'Continue' : 'Next'}
          </Button>
        </motion.div>
      )}

      <EvidenceNote moduleId="estimation" />
    </div>
  );
}
