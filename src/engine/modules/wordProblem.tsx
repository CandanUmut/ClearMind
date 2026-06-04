import type { BlockResult, RNG } from '../../types';
import { int, pick, shuffle } from '../../lib/rng';
import { register, type ExerciseModule, type GeneratedExercise } from '../registry';
import { ChoiceBlock } from '../../components/blocks/ChoiceBlock';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   template pool widens with difficulty; number magnitude and step count grow.
//   Each template computes the EXACT answer and three numerically-close
//   distractors, so problems are real multi-step reasoning, not bare arithmetic.
// ─────────────────────────────────────────────────────────────────────────────

interface WPPuzzle {
  question: string;
  unit: string;
  worked: string;
}

interface Built {
  question: string;
  unit: string;
  answer: number;
  worked: string;
}
type Template = (rng: RNG, d: number) => Built;

const NAMES = ['Mara', 'Devi', 'Owen', 'Lena', 'Theo', 'Aria', 'Sam', 'Noor'];

const distance: Template = (rng) => {
  const speed = int(rng, 40, 90);
  const hours = int(rng, 2, 6);
  const answer = speed * hours;
  const who = pick(rng, NAMES);
  return {
    question: `${who} drives at ${speed} km/h for ${hours} hours. How far do they travel?`,
    unit: 'km',
    answer,
    worked: `distance = speed × time = ${speed} × ${hours} = ${answer} km`,
  };
};

const workRate: Template = (rng) => {
  const a = int(rng, 3, 6);
  const b = int(rng, 3, 6);
  // Two workers; combined time = (a*b)/(a+b) hours, rounded — keep clean by design.
  const lcmish = a * b;
  const answer = Math.round((lcmish / (a + b)) * 10) / 10;
  return {
    question: `One pump fills a tank in ${a} hours, another in ${b} hours. Working together, about how long to fill it?`,
    unit: 'hours',
    answer,
    worked: `1/${a} + 1/${b} per hour → ${a}×${b}/(${a}+${b}) = ${answer} h`,
  };
};

const percentChange: Template = (rng, d) => {
  const base = int(rng, 20, 20 + Math.round(d * 180)) * 5;
  const pct = pick(rng, [10, 15, 20, 25, 30]);
  const up = rng() < 0.5;
  const answer = Math.round(base * (1 + (up ? pct : -pct) / 100));
  return {
    question: `A ${base} item ${up ? 'rises' : 'falls'} by ${pct}%. What is the new amount?`,
    unit: '',
    answer,
    worked: `${base} ${up ? '+' : '−'} ${pct}% = ${answer}`,
  };
};

const ratio: Template = (rng) => {
  const a = int(rng, 2, 5);
  const b = int(rng, 2, 5);
  const total = (a + b) * int(rng, 3, 9);
  const answer = Math.round((total * a) / (a + b));
  return {
    question: `Sweets are shared in the ratio ${a}:${b}. If there are ${total} in total, how many are in the first share?`,
    unit: '',
    answer,
    worked: `${a}/(${a}+${b}) × ${total} = ${answer}`,
  };
};

const simpleInterest: Template = (rng, d) => {
  const principal = int(rng, 10, 10 + Math.round(d * 90)) * 100;
  const rate = pick(rng, [3, 4, 5, 6, 8]);
  const years = int(rng, 2, 6);
  const answer = Math.round((principal * rate * years) / 100);
  return {
    question: `${principal} is invested at ${rate}% simple interest for ${years} years. How much interest is earned?`,
    unit: '',
    answer,
    worked: `P×r×t/100 = ${principal}×${rate}×${years}/100 = ${answer}`,
  };
};

function templates(d: number): Template[] {
  const list: Template[] = [distance, percentChange];
  if (d > 0.3) list.push(ratio, simpleInterest);
  if (d > 0.6) list.push(workRate);
  return list;
}

export function generateWordProblem(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<WPPuzzle, number, number> {
  const t = pick(rng, templates(difficulty));
  const built = t(rng, difficulty);
  const { answer } = built;

  // Distractors: common mistakes / near values, kept distinct.
  const seen = new Set([answer]);
  const distractors: number[] = [];
  const round = (x: number) => Math.round(x * 10) / 10;
  const candidates = [
    round(answer * 1.1),
    round(answer * 0.9),
    answer + (Number.isInteger(answer) ? pick(rng, [-2, -1, 1, 2, 5, 10]) : round(pick(rng, [-1, 1, 0.5]))),
    round(answer / 2),
    round(answer * 2),
  ];
  for (const c of shuffle(rng, candidates)) {
    if (!seen.has(c) && c > 0) {
      seen.add(c);
      distractors.push(c);
    }
    if (distractors.length === 3) break;
  }
  let guard = 0;
  while (distractors.length < 3 && guard++ < 50) {
    const c = round(answer + int(rng, 3, 20) * (rng() < 0.5 ? -1 : 1));
    if (!seen.has(c) && c > 0) { seen.add(c); distractors.push(c); }
  }

  const options = shuffle(rng, [answer, ...distractors]);
  return {
    puzzle: { question: built.question, unit: built.unit, worked: built.worked },
    solution: answer,
    options,
  };
}

function verify(
  ex: GeneratedExercise<WPPuzzle, number, number>,
  answer: number,
): BlockResult {
  const correct = answer === ex.solution;
  return { correct, ratingSignal: correct ? 1 : 0, payload: { correct } };
}

export const wordProblem: ExerciseModule<WPPuzzle, number, number> = {
  id: 'wordProblem',
  title: 'Word Problem',
  blurb: 'Multi-step quantitative reasoning: distance, rates, ratios, interest.',
  category: 'problem',
  skillId: 'wordProblem',
  evidence: {
    trains: 'Trains multi-step quantitative reasoning — translating a situation into a calculation.',
    doesNotClaim: 'A practical reasoning skill; expect to get faster and more accurate. No IQ claims.',
    citation: 'Worked, varied practice improves problem-solving transfer within the domain. (Sweller et al., 2011.)',
  },
  estimateSeconds: 70,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateWordProblem,
  verify,
  Component: ({ puzzle, options, solution, onAnswer, reducedMotion }) => {
    const p = puzzle as WPPuzzle;
    return (
      <ChoiceBlock<number>
        category="Problem solving"
        title="Work it out"
        prompt={
          <div className="rounded border border-line bg-surface p-5 text-body text-ink shadow-1">
            {p.question}
          </div>
        }
        ariaDescription={`Word problem: ${p.question} Choose the correct answer.`}
        options={options ?? []}
        renderOption={(n) => (
          <span className="tnum text-h3 text-ink">
            {n.toLocaleString()}
            {p.unit ? ` ${p.unit}` : ''}
          </span>
        )}
        optionLabel={(n) => `${n} ${p.unit}`}
        solution={solution as number}
        onAnswer={onAnswer}
        reducedMotion={reducedMotion}
        evidence={wordProblem.evidence}
        columns={2}
      />
    );
  },
  summarize: (_ex, _answer, result, summary) => {
    summary.blocks.push({
      moduleId: 'wordProblem',
      title: 'Word problem',
      category: 'problem',
      label: result.correct ? 'solved' : 'missed',
      glyphs: result.correct ? '🟩' : '⬜',
      correct: result.correct,
    });
  },
};

register(wordProblem);
