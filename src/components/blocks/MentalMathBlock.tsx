import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { MentalMathExercise } from '../../types';
import { Button } from '../ui/Button';
import { EvidenceNote } from '../ui/EvidenceNote';

interface Props {
  exercise: MentalMathExercise;
  onDone: (answers: number[]) => void;
}

export function MentalMathBlock({ exercise, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const answers = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const problem = exercise.problems[index];
  const total = exercise.problems.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  function submit() {
    const n = value.trim() === '' ? NaN : Number(value);
    answers.current = [...answers.current, n];
    setValue('');
    if (index + 1 >= total) {
      onDone(answers.current);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small text-muted">Warmup · {index + 1} of {total}</p>
        <h2 className="text-h2 text-ink">Mental Math</h2>
      </header>

      <motion.div
        key={index}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="rounded border border-line bg-surface p-8 text-center shadow-1"
      >
        <p className="tnum text-display font-medium text-ink">{problem.prompt}</p>
      </motion.div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-3"
      >
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your answer"
          aria-label="Your answer"
          className="tnum w-full rounded-sm border border-line bg-surface px-4 py-3 text-center text-h2 text-ink outline-none focus:border-accent"
        />
        <Button type="submit" full>
          {index + 1 >= total ? 'Finish warmup' : 'Next'}
        </Button>
      </form>

      <EvidenceNote moduleId="mentalMath" />
    </div>
  );
}
