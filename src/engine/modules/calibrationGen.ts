import type { CalibrationItem, RNG } from '../../types';
import { int, pick } from '../../lib/rng';

// Computable true/false propositions: ClearMind derives the truth itself, so
// correctness is guaranteed and supply is infinite. Each family scales with
// difficulty (number magnitude, comparison closeness, premise count).

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}
function isPerfectSquare(n: number): boolean {
  const r = Math.round(Math.sqrt(n));
  return r * r === n;
}

type Family = (rng: RNG, difficulty: number, id: string) => CalibrationItem;

const numberTheory: Family = (rng, difficulty, id) => {
  const kind = pick(rng, ['prime', 'divisible', 'square'] as const);
  const hi = Math.round(40 + difficulty * 460); // 40..500
  if (kind === 'prime') {
    const n = int(rng, 10, hi);
    return { id, statement: `${n} is a prime number.`, answer: isPrime(n), category: 'Number theory', sourceHint: `${n} ${isPrime(n) ? 'has no divisors other than 1 and itself' : 'has a smaller factor'}` };
  }
  if (kind === 'divisible') {
    const b = int(rng, 3, 9 + Math.round(difficulty * 6));
    // Half the time pick a true multiple, half a near-miss.
    const makeTrue = rng() < 0.5;
    const k = int(rng, 3, 20);
    const a = makeTrue ? b * k : b * k + int(rng, 1, b - 1);
    return { id, statement: `${a} is divisible by ${b}.`, answer: a % b === 0, category: 'Number theory', sourceHint: `${a} ÷ ${b} ${a % b === 0 ? 'is exact' : `leaves remainder ${a % b}`}` };
  }
  // perfect square
  const makeTrue = rng() < 0.5;
  const root = int(rng, 4, 8 + Math.round(difficulty * 14));
  const n = makeTrue ? root * root : root * root + int(rng, 1, 2 * root);
  return { id, statement: `${n} is a perfect square.`, answer: isPerfectSquare(n), category: 'Number theory', sourceHint: isPerfectSquare(n) ? `${Math.round(Math.sqrt(n))}² = ${n}` : `between ${Math.floor(Math.sqrt(n))}² and ${Math.ceil(Math.sqrt(n))}²` };
};

const arithmetic: Family = (rng, difficulty, id) => {
  const kind = pick(rng, ['product', 'percent'] as const);
  const mag = Math.round(10 + difficulty * 40);
  if (kind === 'product') {
    const a = int(rng, 6, mag);
    const b = int(rng, 6, mag);
    const prod = a * b;
    // C close to the product so it's a real judgment.
    const delta = int(rng, 1, Math.max(2, Math.round(prod * 0.15)));
    const c = rng() < 0.5 ? prod - delta : prod + delta;
    return { id, statement: `${a} × ${b} is greater than ${c}.`, answer: prod > c, category: 'Arithmetic', sourceHint: `${a} × ${b} = ${prod}` };
  }
  const p = pick(rng, [10, 15, 20, 25, 40, 60]);
  const b = int(rng, 40, 40 + mag * 5);
  const val = (p / 100) * b;
  const delta = int(rng, 1, Math.max(2, Math.round(val * 0.2)));
  const d = rng() < 0.5 ? Math.round(val - delta) : Math.round(val + delta);
  return { id, statement: `${p}% of ${b} is greater than ${d}.`, answer: val > d, category: 'Arithmetic', sourceHint: `${p}% of ${b} = ${val}` };
};

const sequence: Family = (rng, difficulty, id) => {
  const kind = pick(rng, ['arith', 'geom'] as const);
  const start = int(rng, 1, 6);
  const len = 4;
  let terms: number[];
  let next: number;
  if (kind === 'arith') {
    const step = int(rng, 2, 4 + Math.round(difficulty * 6));
    terms = Array.from({ length: len }, (_, i) => start + i * step);
    next = start + len * step;
  } else {
    const ratio = int(rng, 2, 3);
    terms = Array.from({ length: len }, (_, i) => start * ratio ** i);
    next = start * ratio ** len;
  }
  const makeTrue = rng() < 0.5;
  const shown = makeTrue ? next : next + pick(rng, [-2, -1, 1, 2, 3]);
  return { id, statement: `The next term of ${terms.join(', ')}, … is ${shown}.`, answer: shown === next, category: 'Sequence', sourceHint: `the pattern continues to ${next}` };
};

const geometry: Family = (rng, _difficulty, id) => {
  const r = int(rng, 2, 12);
  const s = int(rng, 2, 22);
  const circle = Math.PI * r * r;
  const square = s * s;
  return { id, statement: `A circle of radius ${r} has a greater area than a square of side ${s}.`, answer: circle > square, category: 'Geometry', sourceHint: `circle ≈ ${circle.toFixed(0)}, square = ${square}` };
};

const SYLLOGISMS: { template: string; valid: boolean }[] = [
  { template: 'All {A} are {B}. All {B} are {C}. Therefore, all {A} are {C}.', valid: true },
  { template: 'All {A} are {B}. Some {B} are {C}. Therefore, some {A} are {C}.', valid: false },
  { template: 'No {A} are {B}. All {C} are {B}. Therefore, no {C} are {A}.', valid: true },
  { template: 'Some {A} are {B}. All {B} are {C}. Therefore, some {A} are {C}.', valid: true },
  { template: 'All {A} are {B}. No {B} are {C}. Therefore, some {A} are {C}.', valid: false },
  { template: 'No {A} are {B}. Some {C} are {A}. Therefore, some {C} are not {B}.', valid: true },
];
const NOUNS = ['zogs', 'flims', 'darns', 'wexes', 'plooms', 'trobs', 'ginks', 'morls'];

const syllogism: Family = (rng, _difficulty, id) => {
  const t = pick(rng, SYLLOGISMS);
  const [a, b, c] = (() => {
    const shuffled = [...NOUNS].sort(() => (rng() < 0.5 ? 1 : -1));
    return [shuffled[0], shuffled[1], shuffled[2]];
  })();
  const statement = `This argument is logically valid — ${t.template.replace('{A}', a).replace('{A}', a).replace('{B}', b).replace('{B}', b).replace('{C}', c).replace('{C}', c)}`;
  return { id, statement, answer: t.valid, category: 'Logic', sourceHint: t.valid ? 'the conclusion follows from the premises' : 'the conclusion does not follow' };
};

const FAMILIES: Family[] = [numberTheory, arithmetic, sequence, geometry, syllogism];

/** Generate `count` computable calibration items deterministically. */
export function generateComputableFacts(
  rng: RNG,
  difficulty: number,
  count: number,
): CalibrationItem[] {
  const items: CalibrationItem[] = [];
  for (let i = 0; i < count; i++) {
    const fam = pick(rng, FAMILIES);
    // Deterministic, unique id from a draw of the rng.
    const id = `cg-${i}-${Math.floor(rng() * 1e9).toString(36)}`;
    items.push(fam(rng, difficulty, id));
  }
  return items;
}
