import type { BlockResult, RNG } from '../../types';
import { int, pick, shuffle } from '../../lib/rng';
import { register, type ExerciseModule, type GeneratedExercise } from '../registry';
import { ChoiceBlock } from '../../components/blocks/ChoiceBlock';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   rule family widens with difficulty: arithmetic/geometric → +second-difference
//   → +fibonacci-like/interleaved. Operand magnitude grows too. The generator
//   *knows* the rule, so the next term is exact.
// ─────────────────────────────────────────────────────────────────────────────

interface SeqPuzzle {
  terms: number[];
  hint: string;
}

type Builder = (rng: RNG, difficulty: number) => { terms: number[]; next: number; hint: string };

const arithmetic: Builder = (rng, d) => {
  const a = int(rng, 1, 9);
  const step = int(rng, 2, 4 + Math.round(d * 8));
  const terms = Array.from({ length: 5 }, (_, i) => a + i * step);
  return { terms, next: a + 5 * step, hint: 'add a constant each step' };
};

const geometric: Builder = (rng, _d) => {
  const a = int(rng, 1, 4);
  const r = int(rng, 2, 3);
  const terms = Array.from({ length: 5 }, (_, i) => a * r ** i);
  return { terms, next: a * r ** 5, hint: 'multiply by a constant each step' };
};

const secondDiff: Builder = (rng, d) => {
  const a = int(rng, 1, 6);
  const d1 = int(rng, 1, 3);
  const d2 = int(rng, 1, 2 + Math.round(d * 3));
  const terms: number[] = [a];
  let diff = d1;
  for (let i = 1; i < 5; i++) {
    terms.push(terms[i - 1] + diff);
    diff += d2;
  }
  return { terms, next: terms[4] + diff, hint: 'the gap grows by a constant' };
};

const fibonacci: Builder = (rng, _d) => {
  const a = int(rng, 1, 4);
  const b = int(rng, 2, 6);
  const terms = [a, b];
  for (let i = 2; i < 5; i++) terms.push(terms[i - 1] + terms[i - 2]);
  return { terms, next: terms[4] + terms[3], hint: 'each term is the sum of the two before it' };
};

const interleaved: Builder = (rng, _d) => {
  const a1 = int(rng, 1, 6);
  const s1 = int(rng, 2, 5);
  const a2 = int(rng, 10, 20);
  const s2 = int(rng, 2, 5);
  // a1, a2, a1+s1, a2+s2, a1+2s1, (next = a2+2s2)
  const terms = [a1, a2, a1 + s1, a2 + s2, a1 + 2 * s1];
  return { terms, next: a2 + 2 * s2, hint: 'two simple sequences are interleaved' };
};

function builders(difficulty: number): Builder[] {
  const list: Builder[] = [arithmetic, geometric];
  if (difficulty > 0.33) list.push(secondDiff);
  if (difficulty > 0.6) list.push(fibonacci, interleaved);
  return list;
}

export function generateNumberSequence(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<SeqPuzzle, number, number> {
  const build = pick(rng, builders(difficulty));
  const { terms, next, hint } = build(rng, difficulty);

  // Distractors: plausible near-misses and an off-by-pattern value.
  const seen = new Set([next]);
  const distractors: number[] = [];
  const candidates = [next + 1, next - 1, next + 2, next - 2, terms[4] + (terms[4] - terms[3]), Math.round(next * 1.5)];
  for (const c of shuffle(rng, candidates)) {
    if (!seen.has(c) && c > 0) {
      seen.add(c);
      distractors.push(c);
    }
    if (distractors.length === 3) break;
  }
  let guard = 0;
  while (distractors.length < 3 && guard++ < 50) {
    const c = next + int(rng, 3, 12) * (rng() < 0.5 ? -1 : 1);
    if (!seen.has(c) && c > 0) {
      seen.add(c);
      distractors.push(c);
    }
  }

  const options = shuffle(rng, [next, ...distractors]);
  return { puzzle: { terms, hint }, solution: next, options };
}

function verify(
  ex: GeneratedExercise<SeqPuzzle, number, number>,
  answer: number,
): BlockResult {
  const correct = answer === ex.solution;
  return { correct, ratingSignal: correct ? 1 : 0, payload: { correct } };
}

export const numberSequence: ExerciseModule<SeqPuzzle, number, number> = {
  id: 'numberSequence',
  title: 'Number Sequence',
  blurb: 'Spot the rule and pick the next number in the series.',
  category: 'logic',
  skillId: 'numberSequence',
  evidence: {
    trains: 'Trains pattern detection in numeric sequences — inferring a generating rule from examples.',
    doesNotClaim: 'A specific reasoning task; expect to improve at it. No claims about IQ or general intelligence.',
    citation: 'Series-completion skill is trainable and task-specific. (Sala & Gobet, 2017.)',
  },
  estimateSeconds: 45,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateNumberSequence,
  verify,
  Component: ({ puzzle, options, solution, onAnswer, reducedMotion }) => {
    const p = puzzle as SeqPuzzle;
    return (
      <ChoiceBlock<number>
        category="Logic"
        title="What comes next?"
        prompt={
          <div className="rounded border border-line bg-surface p-6 text-center shadow-1">
            <p className="tnum text-h1 text-ink">{p.terms.join(',  ')},  ?</p>
          </div>
        }
        ariaDescription={`Number sequence ${p.terms.join(', ')}. Choose the next number.`}
        options={options ?? []}
        renderOption={(n) => <span className="tnum text-h3 text-ink">{n}</span>}
        optionLabel={(n) => `${n}`}
        solution={solution as number}
        onAnswer={onAnswer}
        reducedMotion={reducedMotion}
        evidence={numberSequence.evidence}
        columns={2}
      />
    );
  },
  summarize: (_ex, _answer, result, summary) => {
    summary.blocks.push({
      moduleId: 'numberSequence',
      title: 'Sequence',
      category: 'logic',
      label: result.correct ? 'solved' : 'missed',
      glyphs: result.correct ? '🟩' : '⬜',
      correct: result.correct,
    });
  },
};

register(numberSequence);
