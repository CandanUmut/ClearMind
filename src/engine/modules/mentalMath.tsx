import type {
  BlockResult,
  MathOp,
  MathProblem,
  MentalMathExercise,
  RNG,
  SessionSummary,
} from '../../types';
import { int, pick } from '../../lib/rng';
import { register, type ExerciseModule, type GeneratedExercise } from '../registry';
import { MentalMathBlock } from '../../components/blocks/MentalMathBlock';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   0.00–0.33 : + and −, two-digit operands
//   0.33–0.60 : adds ×
//   0.60–0.80 : adds ÷ (clean), larger operands
//   0.80–1.00 : adds % ; time pressure tightens 10s → 6s/problem
// ─────────────────────────────────────────────────────────────────────────────

const PROBLEM_COUNT = 6;

function makeProblem(rng: RNG, difficulty: number): MathProblem {
  let ops: MathOp[] = ['+', '-'];
  if (difficulty > 0.33) ops = ['+', '-', '×'];
  if (difficulty > 0.6) ops = ['+', '-', '×', '÷'];
  if (difficulty > 0.8) ops = ['+', '-', '×', '÷', '%'];

  const op = pick(rng, ops);
  const big = Math.round(10 + difficulty * 90);
  const small = Math.round(4 + difficulty * 11);

  switch (op) {
    case '+': {
      const a = int(rng, big, big * 2);
      const b = int(rng, big, big * 2);
      return { prompt: `${a} + ${b}`, answer: a + b, op };
    }
    case '-': {
      const a = int(rng, big, big * 2);
      const b = int(rng, big, a);
      return { prompt: `${a} − ${b}`, answer: a - b, op };
    }
    case '×': {
      const a = int(rng, small, small + Math.round(difficulty * 12));
      const b = int(rng, 2, small);
      return { prompt: `${a} × ${b}`, answer: a * b, op };
    }
    case '÷': {
      const b = int(rng, 2, small);
      const answer = int(rng, 2, small + Math.round(difficulty * 8));
      const a = answer * b;
      return { prompt: `${a} ÷ ${b}`, answer, op };
    }
    case '%': {
      const pcts = [10, 20, 25, 50, 75];
      const p = pick(rng, pcts);
      const a = pick(rng, [20, 40, 60, 80, 120, 200]);
      return { prompt: `${p}% of ${a}`, answer: Math.round((p / 100) * a), op };
    }
  }
}

export function generateMentalMath(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<MentalMathExercise, number[], number[]> {
  const problems: MathProblem[] = [];
  for (let i = 0; i < PROBLEM_COUNT; i++) problems.push(makeProblem(rng, difficulty));
  const secondsPerProblem = Math.round(10 - difficulty * 4);
  return {
    puzzle: { problems, secondsPerProblem },
    solution: problems.map((p) => p.answer),
  };
}

function verifyMentalMath(
  ex: GeneratedExercise<MentalMathExercise, number[], number[]>,
  answer: number[],
): BlockResult {
  let correct = 0;
  ex.solution.forEach((a, i) => {
    if (answer[i] === a) correct += 1;
  });
  const total = ex.solution.length;
  return {
    correct: correct === total,
    ratingSignal: total > 0 ? correct / total : 0,
    payload: { correct, total },
  };
}

export const mentalMath: ExerciseModule<MentalMathExercise, number[], number[]> = {
  id: 'mentalMath',
  title: 'Mental Math',
  blurb: 'Quick arithmetic to warm up — +, −, ×, ÷, %.',
  category: 'warmup',
  skillId: 'mentalMath',
  evidence: {
    trains: 'Builds speed and fluency at arithmetic itself — a genuinely useful everyday skill.',
    doesNotClaim: 'It does not make you generally smarter or raise IQ. Treat it as an enjoyable warmup.',
    citation: 'Practice yields near transfer, not broad cognitive gains. (Sala & Gobet, 2017.)',
  },
  estimateSeconds: 75,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateMentalMath,
  verify: verifyMentalMath,
  Component: ({ puzzle, onAnswer }) => <MentalMathBlock exercise={puzzle} onDone={onAnswer} />,
  summarize: (_ex, _answer, result, summary: SessionSummary) => {
    const correct = (result.payload?.correct as number) ?? 0;
    const total = (result.payload?.total as number) ?? 0;
    summary.mathCorrect = correct;
    summary.mathTotal = total;
    summary.blocks.push({
      moduleId: 'mentalMath',
      title: 'Mental Math',
      category: 'warmup',
      label: `${correct}/${total}`,
      glyphs: '🧮',
      correct: result.correct,
    });
  },
};

register(mentalMath);
