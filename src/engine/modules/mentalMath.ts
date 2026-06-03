import type {
  ExerciseModule,
  MathOp,
  MathProblem,
  MentalMathAnswer,
  MentalMathExercise,
  RNG,
} from '../../types';
import { int, pick } from '../../lib/rng';

const PROBLEM_COUNT = 6;

/** Choose operand ranges and operation mix from difficulty 0..1. */
function makeProblem(rng: RNG, difficulty: number): MathProblem {
  // Operation set widens with difficulty.
  let ops: MathOp[] = ['+', '-'];
  if (difficulty > 0.33) ops = ['+', '-', '×'];
  if (difficulty > 0.6) ops = ['+', '-', '×', '÷'];
  if (difficulty > 0.8) ops = ['+', '-', '×', '÷', '%'];

  const op = pick(rng, ops);
  // Operand magnitude scales with difficulty.
  const big = Math.round(10 + difficulty * 90); // 10..100
  const small = Math.round(4 + difficulty * 11); // 4..15

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
      const a = answer * b; // ensures clean division
      return { prompt: `${a} ÷ ${b}`, answer, op };
    }
    case '%': {
      const pcts = [10, 20, 25, 50, 75];
      const p = pick(rng, pcts);
      const baseMul = pick(rng, [20, 40, 60, 80, 120, 200]);
      const a = baseMul;
      return { prompt: `${p}% of ${a}`, answer: Math.round((p / 100) * a), op };
    }
  }
}

export const mentalMath: ExerciseModule<MentalMathExercise, MentalMathAnswer> = {
  id: 'mentalMath',
  title: 'Mental Math',
  tier: 'warmup',
  estimateSeconds: 75,
  generate(rng, difficulty) {
    const problems: MathProblem[] = [];
    for (let i = 0; i < PROBLEM_COUNT; i++) {
      problems.push(makeProblem(rng, difficulty));
    }
    // Time pressure tightens with difficulty (10s → 6s per problem).
    const secondsPerProblem = Math.round(10 - difficulty * 4);
    return { problems, secondsPerProblem };
  },
  score(ex, answer) {
    let correct = 0;
    ex.problems.forEach((p, i) => {
      if (answer[i] === p.answer) correct += 1;
    });
    const total = ex.problems.length;
    return {
      correct: correct === total,
      ratingSignal: total > 0 ? correct / total : 0,
      payload: { correct, total },
    };
  },
};
