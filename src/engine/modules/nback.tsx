import type { BlockResult, NBackExercise, NBackKind, RNG, SessionSummary } from '../../types';
import { int } from '../../lib/rng';
import { register, type ExerciseModule, type GeneratedExercise } from '../registry';
import { NBackBlock } from '../../components/blocks/NBackBlock';

const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   n: 1 (<0.33) → 2 (<0.66) → 3 ; kind: position (<0.5) → letter
//   sequence length 12 → 20 ; target ~30% match density
// ─────────────────────────────────────────────────────────────────────────────

export function generateNBack(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<NBackExercise, number[], number[]> {
  const n = difficulty > 0.66 ? 3 : difficulty > 0.33 ? 2 : 1;
  const kind: NBackKind = difficulty > 0.5 ? 'letter' : 'position';
  const length = 12 + Math.round(difficulty * 8);
  const symbolCount = kind === 'position' ? 9 : LETTERS.length;

  const stimuli: number[] = [];
  const matches: number[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= n && rng() < 0.3) {
      stimuli.push(stimuli[i - n]);
      matches.push(i);
    } else {
      let s = int(rng, 0, symbolCount - 1);
      if (i >= n && s === stimuli[i - n]) s = (s + 1) % symbolCount;
      stimuli.push(s);
    }
  }
  return { puzzle: { kind, n, stimuli, matches }, solution: matches };
}

function verifyNBack(
  ex: GeneratedExercise<NBackExercise, number[], number[]>,
  answer: number[],
): BlockResult {
  const flagged = new Set(answer);
  const truth = new Set(ex.puzzle.matches);
  let hits = 0;
  let falseAlarms = 0;
  for (const idx of flagged) {
    if (truth.has(idx)) hits += 1;
    else falseAlarms += 1;
  }
  const misses = ex.puzzle.matches.length - hits;
  const possible = ex.puzzle.matches.length || 1;
  const ratingSignal = Math.max(0, Math.min(1, (hits - falseAlarms * 0.5) / possible));
  return {
    correct: misses === 0 && falseAlarms === 0,
    ratingSignal,
    payload: { hits, misses, falseAlarms, total: ex.puzzle.matches.length },
  };
}

export const nback: ExerciseModule<NBackExercise, number[], number[]> = {
  id: 'nback',
  title: 'N-Back',
  blurb: 'A working-memory warmup: spot when a stimulus repeats N steps back.',
  category: 'warmup',
  skillId: 'nback',
  evidence: {
    trains: 'A classic working-memory task. Expect to get noticeably better at this specific task.',
    doesNotClaim:
      'N-back does not reliably raise general intelligence — a well-studied, largely negative result. Enjoy it as a warmup.',
    citation: 'Working-memory training shows little far transfer. (Melby-Lervåg et al., 2016.)',
  },
  estimateSeconds: 80,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateNBack,
  verify: verifyNBack,
  Component: ({ puzzle, onAnswer }) => <NBackBlock exercise={puzzle} onDone={onAnswer} />,
  summarize: (_ex, _answer, result, summary: SessionSummary) => {
    const hits = (result.payload?.hits as number) ?? 0;
    const total = (result.payload?.total as number) ?? 0;
    summary.nbackCorrect = hits;
    summary.nbackTotal = total;
    summary.blocks.push({
      moduleId: 'nback',
      title: 'N-Back',
      category: 'warmup',
      label: `${hits}/${total}`,
      glyphs: '🧠',
      correct: result.correct,
    });
  },
};

register(nback);

export { LETTERS };
