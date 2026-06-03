import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { CalibrationExercise, CalibrationResponse } from '../../types';
import { Button } from '../ui/Button';
import { ConfidenceSlider } from '../ui/ConfidenceSlider';
import { EvidenceNote } from '../ui/EvidenceNote';

interface Props {
  exercise: CalibrationExercise;
  onDone: (responses: CalibrationResponse[]) => void;
}

type Phase = 'answer' | 'reveal';

export function CalibrationBlock({ exercise, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState(70);
  const [consideredOpposite, setConsideredOpposite] = useState(false);
  const [phase, setPhase] = useState<Phase>('answer');
  const responses = useRef<CalibrationResponse[]>([]);

  const item = exercise.items[index];
  const total = exercise.items.length;
  const correct = phase === 'reveal' && choice === item.answer;

  function reveal() {
    if (choice === null) return;
    responses.current = [
      ...responses.current,
      { choice, confidence, consideredOpposite },
    ];
    setPhase('reveal');
  }

  function next() {
    if (index + 1 >= total) {
      onDone(responses.current);
      return;
    }
    setIndex(index + 1);
    setChoice(null);
    setConfidence(70);
    setConsideredOpposite(false);
    setPhase('answer');
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small text-muted">Judgment · {index + 1} of {total}</p>
        <h2 className="text-h2 text-ink">Calibration</h2>
      </header>

      <motion.div
        key={index}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={
          'rounded border p-6 shadow-1 ' +
          (phase === 'reveal'
            ? correct
              ? 'border-correct bg-surface'
              : 'border-incorrect bg-surface'
            : 'border-line bg-surface')
        }
      >
        <p className="text-h3 leading-snug text-ink">{item.statement}</p>
        <p className="mt-2 text-small text-muted">{item.category}</p>
      </motion.div>

      {phase === 'answer' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={choice === true ? 'primary' : 'secondary'}
              onClick={() => setChoice(true)}
              aria-pressed={choice === true}
            >
              True
            </Button>
            <Button
              variant={choice === false ? 'primary' : 'secondary'}
              onClick={() => setChoice(false)}
              aria-pressed={choice === false}
            >
              False
            </Button>
          </div>

          <ConfidenceSlider value={confidence} onChange={setConfidence} />

          {!consideredOpposite ? (
            <button
              type="button"
              onClick={() => setConsideredOpposite(true)}
              className="rounded-sm border border-dashed border-line px-4 py-3 text-small text-info hover:bg-surface-2"
            >
              💭 Consider the opposite — what if your first answer is wrong? Why might it be?
            </button>
          ) : (
            <p className="rounded-sm bg-surface-2 px-4 py-3 text-small text-ink-soft">
              Good — briefly arguing the other side is the single best-evidenced way to
              improve a judgment. Adjust your answer or confidence if it changed your mind.
            </p>
          )}

          <Button full disabled={choice === null} onClick={reveal}>
            Reveal answer
          </Button>
        </>
      )}

      {phase === 'reveal' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-4"
        >
          <div
            className="rounded-sm px-4 py-3 text-center text-body font-semibold"
            style={{
              background: correct ? 'color-mix(in srgb, var(--correct) 14%, transparent)' : 'color-mix(in srgb, var(--incorrect) 14%, transparent)',
              color: correct ? 'var(--correct)' : 'var(--incorrect)',
            }}
          >
            {correct ? 'Correct' : 'Not this time'} — the statement is{' '}
            {item.answer ? 'TRUE' : 'FALSE'}.
          </div>
          <p className="text-small text-muted">
            You said {choice ? 'True' : 'False'} at {confidence}% confidence. {item.sourceHint}.
          </p>
          <Button full onClick={next}>
            {index + 1 >= total ? 'See summary' : 'Next statement'}
          </Button>
        </motion.div>
      )}

      <EvidenceNote moduleId="calibration" />
    </div>
  );
}
