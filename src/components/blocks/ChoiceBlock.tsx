import { type ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { EvidenceNote } from '../../engine/registry';
import { sound } from '../../lib/sound';
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
  /** CSS color (var) used to tint the category label. */
  accent?: string;
  /** A short worked "why" shown after answering — turns the test into a lesson. */
  explanation?: ReactNode;
}

const defaultEquals = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A reusable choice-based block: a puzzle prompt plus a grid of options. Shows
 * gentle correct/incorrect feedback (never color-only — uses ✓/✗ glyphs and a
 * border), an optional explanation, then advances. Fully keyboard-navigable
 * (number keys 1–9 pick an option; Enter continues) with a live region for
 * screen readers.
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
  accent = 'var(--accent)',
  explanation,
}: Props<T>) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;
  const pickedCorrect = revealed && equals(options[picked], solution);
  const continueRef = useRef<HTMLButtonElement>(null);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    sound.feedback(equals(options[i], solution));
  }

  // Keyboard: 1–9 select an option; Enter/Space continues once revealed.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!revealed) {
        const n = Number(e.key);
        if (n >= 1 && n <= options.length) {
          e.preventDefault();
          choose(n - 1);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onAnswer(options[picked]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, picked, options]);

  // Move focus to Continue when the answer is revealed.
  useEffect(() => {
    if (revealed) continueRef.current?.focus();
  }, [revealed]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small font-medium" style={{ color: accent }}>{category}</p>
        <h2 className="text-h2 text-ink">{title}</h2>
      </header>

      <div role="group" aria-label={ariaDescription}>
        <p className="sr-only">{ariaDescription}. Press 1 to {options.length} to choose.</p>
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
          let anim = '';
          if (revealed && isCorrect) { ring = 'border-correct'; anim = reducedMotion ? '' : 'cm-pop'; }
          else if (revealed && isPicked && !isCorrect) { ring = 'border-incorrect'; anim = reducedMotion ? '' : 'cm-shake'; }
          return (
            <motion.button
              key={i}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              disabled={revealed}
              onClick={() => choose(i)}
              aria-label={`${i + 1}. ${optionLabel ? optionLabel(opt, i) : `Option ${i + 1}`}`}
              aria-pressed={isPicked}
              className={`relative flex min-h-[64px] items-center justify-center rounded-sm border-2 ${ring} ${anim} p-3 transition-colors disabled:opacity-100`}
              style={{
                background:
                  revealed && isCorrect
                    ? 'color-mix(in srgb, var(--correct) 12%, var(--surface))'
                    : revealed && isPicked && !isCorrect
                      ? 'color-mix(in srgb, var(--incorrect) 12%, var(--surface))'
                      : 'var(--surface)',
              }}
            >
              <span
                className="tnum absolute left-1.5 top-1 text-small text-muted"
                aria-hidden
              >
                {i + 1}
              </span>
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

      <div aria-live="polite" className="contents">
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
            {explanation && (
              <div className="rounded-sm border border-line bg-surface-2/60 px-4 py-3 text-small text-ink-soft">
                <span className="font-semibold text-ink">Why: </span>
                {explanation}
              </div>
            )}
            <Button ref={continueRef} full onClick={() => onAnswer(options[picked])}>
              Continue
            </Button>
          </motion.div>
        )}
      </div>

      <ModuleEvidence note={evidence} />
    </div>
  );
}
