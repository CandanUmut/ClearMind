import type {
  BlockResult,
  EstimationFact,
  EstimationResponse,
  RNG,
  SessionSummary,
  UserState,
} from '../../types';
import { sample } from '../../lib/rng';
import { estimationFacts } from '../../content/estimationFacts';
import { generateComputationalEstimates } from './estimationGen';
import {
  register,
  type CommitContext,
  type ExerciseModule,
  type GeneratedExercise,
} from '../registry';
import { EstimationBlock } from '../../components/blocks/EstimationBlock';

interface EstPuzzle {
  facts: EstimationFact[];
}

// One curated factual Fermi item + one computational (self-verifying) item.
export function generateEstimation(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<EstPuzzle, EstimationResponse[], number[]> {
  const curated = sample(rng, estimationFacts, 1);
  const computed = generateComputationalEstimates(rng, difficulty, 1);
  const facts = [...curated, ...computed];
  return { puzzle: { facts }, solution: facts.map((f) => f.value) };
}

function verifyEstimation(
  ex: GeneratedExercise<EstPuzzle, EstimationResponse[], number[]>,
  answer: EstimationResponse[],
): BlockResult {
  let hits = 0;
  const perItem = ex.puzzle.facts.map((fact, i) => {
    const resp = answer[i];
    if (!resp) return false;
    const lo = Math.min(resp.low, resp.high);
    const hi = Math.max(resp.low, resp.high);
    const hit = fact.value >= lo && fact.value <= hi;
    if (hit) hits += 1;
    return hit;
  });
  const total = ex.puzzle.facts.length;
  return {
    correct: hits === total,
    ratingSignal: total ? hits / total : 0,
    payload: { hits, total, perItem },
  };
}

export const estimation: ExerciseModule<EstPuzzle, EstimationResponse[], number[]> = {
  id: 'estimation',
  title: 'Estimation',
  blurb: 'Give a 90% range you’re confident contains the true value.',
  category: 'judgment',
  skillId: 'estimation',
  evidence: {
    trains: 'Trains honest uncertainty: ranges wide enough to be right ~90% of the time, curbing overconfidence.',
    doesNotClaim: 'It will not raise your intelligence. It does sharpen a directly useful real-world judgment skill.',
    citation: 'Most 90% intervals capture the truth far less than 90% of the time; feedback helps. (Moore & Healy, 2008.)',
  },
  estimateSeconds: 70,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateEstimation,
  verify: verifyEstimation,
  Component: ({ puzzle, onAnswer }) => <EstimationBlock exercise={puzzle} onDone={onAnswer} />,
  commit: (
    prev: UserState,
    ctx: CommitContext<EstPuzzle, EstimationResponse[], number[]>,
  ): UserState => {
    const hits = ctx.result.payload?.hits as number;
    const total = ctx.result.payload?.total as number;
    return {
      ...prev,
      estimationHistory: [
        ...prev.estimationHistory.filter((e) => e.dateKey !== ctx.dateKey),
        { dateKey: ctx.dateKey, hits, total },
      ].slice(-120),
    };
  },
  summarize: (_ex, _answer, result, summary: SessionSummary) => {
    const hits = (result.payload?.hits as number) ?? 0;
    const total = (result.payload?.total as number) ?? 0;
    summary.estimationHits = hits;
    summary.estimationTotal = total;
    const squares = Array.from({ length: total }, (_, i) => (i < hits ? '🎯' : '⬜')).join('');
    summary.blocks.push({
      moduleId: 'estimation',
      title: 'Estimates',
      category: 'judgment',
      label: `${hits}/${total}`,
      glyphs: squares,
      correct: result.correct,
    });
  },
};

register(estimation);
