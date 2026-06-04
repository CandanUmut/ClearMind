import { useEffect, useState } from 'react';
import type { BlockResult, RNG } from '../../types';
import { sample } from '../../lib/rng';
import { register, type BlockProps, type ExerciseModule, type GeneratedExercise } from '../registry';
import { sound } from '../../lib/sound';
import { Button } from '../../components/ui/Button';
import { ModuleEvidence } from '../../components/ui/ModuleEvidence';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   grid size: 3 (<0.4) → 4 (<0.7) → 5 ; lit cells: 3 + round(d*4) ;
//   flash duration: 2600ms → 1400ms. Under reduced-motion the pattern stays
//   until the user taps "Hide" (no timed flash).
// ─────────────────────────────────────────────────────────────────────────────

interface RecallPuzzle {
  size: number;
  lit: number[]; // cell indices, sorted
  flashMs: number;
}

export function generateGridRecall(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<RecallPuzzle, number[], number[]> {
  const size = difficulty < 0.4 ? 3 : difficulty < 0.7 ? 4 : 5;
  const total = size * size;
  const litCount = Math.min(total - 1, 3 + Math.round(difficulty * 4));
  const lit = sample(rng, Array.from({ length: total }, (_, i) => i), litCount).sort((a, b) => a - b);
  const flashMs = Math.round(2600 - difficulty * 1200);
  return { puzzle: { size, lit, flashMs }, solution: lit };
}

function verify(
  ex: GeneratedExercise<RecallPuzzle, number[], number[]>,
  answer: number[],
): BlockResult {
  const truth = new Set(ex.solution);
  const picked = new Set(answer);
  let hits = 0;
  for (const i of picked) if (truth.has(i)) hits += 1;
  const total = ex.solution.length;
  const correct = hits === total && picked.size === total;
  // Signal rewards hits, penalizes wrong taps.
  const wrong = picked.size - hits;
  const ratingSignal = Math.max(0, Math.min(1, (hits - wrong) / total));
  return { correct, ratingSignal, payload: { hits, total, correct } };
}

function GridRecallBlock({ puzzle, onAnswer, reducedMotion }: BlockProps<RecallPuzzle, number[]>) {
  const { size, lit, flashMs } = puzzle;
  const total = size * size;
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [picked, setPicked] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (reducedMotion) return; // user dismisses manually
    const t = window.setTimeout(() => setPhase('recall'), flashMs);
    return () => window.clearTimeout(t);
  }, [flashMs, reducedMotion]);

  function toggle(i: number) {
    if (phase !== 'recall') return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < lit.length) next.add(i);
      return next;
    });
  }

  const litSet = new Set(lit);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small font-medium" style={{ color: 'var(--cat-visual)' }}>Visual memory</p>
        <h2 className="text-h2 text-ink">
          {phase === 'show' ? 'Memorise the lit cells' : `Tap the ${lit.length} cells`}
        </h2>
      </header>

      <div
        className="mx-auto grid w-fit gap-2"
        style={{ gridTemplateColumns: `repeat(${size}, 56px)` }}
        role="group"
        aria-label={
          phase === 'show'
            ? `A ${size} by ${size} grid; memorise ${lit.length} highlighted cells.`
            : `Reproduce the ${lit.length} highlighted cells you saw.`
        }
      >
        {Array.from({ length: total }, (_, i) => {
          const showLit = phase === 'show' && litSet.has(i);
          const isPicked = picked.has(i);
          return (
            <button
              key={i}
              type="button"
              disabled={phase === 'show'}
              onClick={() => toggle(i)}
              aria-label={`Cell ${i + 1}${showLit ? ' (lit)' : ''}${isPicked ? ' (selected)' : ''}`}
              aria-pressed={isPicked}
              className="h-14 w-14 rounded-sm border-2 transition-colors"
              style={{
                background: showLit || isPicked ? 'var(--accent)' : 'var(--surface-2)',
                borderColor: isPicked ? 'var(--accent-ink)' : 'var(--line)',
              }}
            />
          );
        })}
      </div>

      {phase === 'show' ? (
        reducedMotion ? (
          <Button full onClick={() => setPhase('recall')}>I’ve got it — hide</Button>
        ) : (
          <p className="text-center text-small text-muted">Watch closely…</p>
        )
      ) : (
        <Button
          full
          disabled={picked.size !== lit.length}
          onClick={() => {
            const ok = litSet.size === picked.size && [...picked].every((i) => litSet.has(i));
            sound.feedback(ok, ok ? 'Correct' : 'Close');
            onAnswer([...picked]);
          }}
        >
          {picked.size === lit.length ? 'Submit' : `Select ${lit.length - picked.size} more`}
        </Button>
      )}

      <ModuleEvidence note={gridRecall.evidence} />
    </div>
  );
}

export const gridRecall: ExerciseModule<RecallPuzzle, number[], number[]> = {
  id: 'gridRecall',
  title: 'Grid Recall',
  blurb: 'A pattern of cells flashes — reproduce it from memory.',
  category: 'visual',
  skillId: 'gridRecall',
  evidence: {
    trains: 'Trains visual short-term memory — holding a spatial pattern briefly and reproducing it.',
    doesNotClaim: 'Like other memory tasks, expect to improve at this specific task; no IQ or far-transfer claims.',
    citation: 'Spatial span (Corsi) training is largely task-specific. (Melby-Lervåg et al., 2016.)',
  },
  estimateSeconds: 45,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateGridRecall,
  verify,
  Component: GridRecallBlock,
  summarize: (_ex, _answer, result, summary) => {
    const hits = (result.payload?.hits as number) ?? 0;
    const total = (result.payload?.total as number) ?? 0;
    summary.blocks.push({
      moduleId: 'gridRecall',
      title: 'Grid recall',
      category: 'visual',
      label: `${hits}/${total}`,
      glyphs: result.correct ? '🟩' : '⬜',
      correct: result.correct,
    });
  },
};

register(gridRecall);
