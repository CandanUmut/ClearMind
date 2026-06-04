import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import type { EvidenceNote } from '../../engine/registry';
import { Button } from '../ui/Button';
import { ModuleEvidence } from '../ui/ModuleEvidence';

interface Props<T> {
  category: string;
  title: string;
  /** The puzzle presentation (text, SVG, etc.). */
  prompt: ReactNode;
  /** An accessible text description of the puzzle for screen readers. */
  ariaDescription: string;
  options: T[];
  renderOption: (opt: T, index: number) => ReactNode;
  /** Optional per-option screen-reader label. */
  optionLabel?: (opt: T, index: number) => string;
  solution: T;
  equals?: (a: T, b: T) => boolean;
  onAnswer: (answer: T) => void;
  evidence: EvidenceNote;
  reducedMotion: boolean;
  /** Columns in the option grid (default 3). */
  columns?: number;
}

const defaultEquals = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A reusable choice-based block: a puzzle prompt plus a grid of options. Shows
 * gentle correct/incorrect feedback (never color-only — uses ✓/✗ glyphs and a
 * border), reveals the correct option, then advances. Fully keyboard-navigable.
 */
export function ChoiceBlock<T>({
  category,
  title,
  prompt,
  ariaDescription,
  options,
  renderOption,
  optionLabel,
  solution,
  equals = defaultEquals,
  onAnswer,
  evidence,
  reducedMotion,
  columns = 3,
}: Props<T>) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;
  const pickedCorrect = revealed && equals(options[picked], solution);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small text-muted">{category}</p>
        <h2 className="text-h2 text-ink">{title}</h2>
      </header>

      <div role="group" aria-label={ariaDescription}>
        <p className="sr-only">{ariaDescription}</p>
        {prompt}
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt, i) => {
          const isCorrect = equals(opt, solution);
          const isPicked = picked === i;
          let ring = 'border-line';
          if (revealed && isCorrect) ring = 'border-correct';
          else if (revealed && isPicked && !isCorrect) ring = 'border-incorrect';
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              disabled={revealed}
              onClick={() => setPicked(i)}
              aria-label={optionLabel ? optionLabel(opt, i) : `Option ${i + 1}`}
              aria-pressed={isPicked}
              className={`relative flex min-h-[64px] items-center justify-center rounded-sm border-2 ${ring} bg-surface p-3 transition-colors disabled:opacity-100`}
            >
              {renderOption(opt, i)}
              {revealed && isCorrect && (
                <span className="absolute right-1 top-1 text-correct" aria-hidden>✓</span>
              )}
              {revealed && isPicked && !isCorrect && (
                <span className="absolute right-1 top-1 text-incorrect" aria-hidden>✗</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {revealed && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3"
        >
          <p
            className="rounded-sm px-4 py-3 text-center text-body font-semibold"
            style={{
              background: pickedCorrect
                ? 'color-mix(in srgb, var(--correct) 14%, transparent)'
                : 'color-mix(in srgb, var(--incorrect) 14%, transparent)',
              color: pickedCorrect ? 'var(--correct)' : 'var(--incorrect)',
            }}
          >
            {pickedCorrect ? 'Correct' : 'Not this time — the highlighted one fits.'}
          </p>
          <Button full onClick={() => onAnswer(options[picked])}>
            Continue
          </Button>
        </motion.div>
      )}

      <ModuleEvidence note={evidence} />
    </div>
  );
}
