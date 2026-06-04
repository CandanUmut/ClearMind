import type {
  BlockResult,
  CalibrationItem,
  CalibrationResponse,
  RNG,
  SessionSummary,
  UserState,
} from '../../types';
import { sample } from '../../lib/rng';
import { calibrationFacts } from '../../content/calibrationFacts';
import { generateComputableFacts } from './calibrationGen';
import { brierFromResponses, reliabilityPoints } from '../../lib/scoring';
import {
  register,
  type CommitContext,
  type ExerciseModule,
  type GeneratedExercise,
} from '../registry';
import { CalibrationBlock } from '../../components/blocks/CalibrationBlock';

const ITEM_COUNT = 5;
const CURATED_PER_BLOCK = 2;

interface CalPuzzle {
  items: CalibrationItem[];
}

// Phase 8: the daily block mixes a couple of curated real-world facts with
// several COMPUTABLE propositions whose truth ClearMind derives itself —
// guaranteeing correctness and an infinite supply. (calibrationGen.ts)
export function generateCalibration(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<CalPuzzle, CalibrationResponse[], boolean[]> {
  const curated = sample(rng, calibrationFacts, CURATED_PER_BLOCK);
  const computed = generateComputableFacts(rng, difficulty, ITEM_COUNT - curated.length);
  // Interleave deterministically: curated first feels less "mathy" up front.
  const items = [...curated, ...computed];
  return { puzzle: { items }, solution: items.map((i) => i.answer) };
}

function verifyCalibration(
  ex: GeneratedExercise<CalPuzzle, CalibrationResponse[], boolean[]>,
  answer: CalibrationResponse[],
): BlockResult {
  const correctness = ex.puzzle.items.map((item, i) => answer[i]?.choice === item.answer);
  const correct = correctness.filter(Boolean).length;
  const brier = brierFromResponses(answer, correctness);
  const accuracy = correctness.length ? correct / correctness.length : 0;
  const ratingSignal = 0.5 * accuracy + 0.5 * (1 - brier);
  return {
    correct: correct === ex.puzzle.items.length,
    ratingSignal,
    payload: { correct, total: ex.puzzle.items.length, brier, correctness },
  };
}

export const calibration: ExerciseModule<CalPuzzle, CalibrationResponse[], boolean[]> = {
  id: 'calibration',
  title: 'Calibration',
  blurb: 'Judge true/false and set your confidence — then meet reality.',
  category: 'judgment',
  skillId: 'calibration',
  evidence: {
    trains: 'Calibration training measurably improves judgment — matching confidence to how often you are actually right.',
    doesNotClaim: 'Not a general brain booster; it is a specific, trainable judgment skill that does transfer to real decisions.',
    citation: 'Calibration is trainable and transfers. (Mellers et al., 2014; FTC v. Lumosity, 2016.)',
  },
  estimateSeconds: 95,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateCalibration,
  verify: verifyCalibration,
  Component: ({ puzzle, onAnswer }) => <CalibrationBlock exercise={puzzle} onDone={onAnswer} />,
  commit: (
    prev: UserState,
    ctx: CommitContext<CalPuzzle, CalibrationResponse[], boolean[]>,
  ): UserState => {
    const brier = ctx.result.payload?.brier as number;
    const correctness = ctx.result.payload?.correctness as boolean[];
    return {
      ...prev,
      brierHistory: [
        ...prev.brierHistory.filter((b) => b.dateKey !== ctx.dateKey),
        { dateKey: ctx.dateKey, brier, points: reliabilityPoints(ctx.answer, correctness) },
      ].slice(-120),
    };
  },
  summarize: (_ex, _answer, result, summary: SessionSummary) => {
    const correct = (result.payload?.correct as number) ?? 0;
    const total = (result.payload?.total as number) ?? 0;
    summary.calibrationCorrect = correct;
    summary.calibrationTotal = total;
    summary.brier = result.payload?.brier as number;
    const squares = Array.from({ length: total }, (_, i) => (i < correct ? '🟩' : '⬜')).join('');
    summary.blocks.push({
      moduleId: 'calibration',
      title: 'Judgment',
      category: 'judgment',
      label: `${correct}/${total}`,
      glyphs: squares,
      correct: result.correct,
    });
  },
};

register(calibration);
