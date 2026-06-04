import type { EstimationFact, RNG } from '../../types';
import { int, pick } from '../../lib/rng';

// Computational estimation: multi-step quantities ClearMind computes exactly,
// so they are self-verifying and infinite. The user gives a 90% interval and we
// check whether the exact value lands inside.

type Family = (rng: RNG, difficulty: number, id: string) => EstimationFact;

const timeConvert: Family = (rng, difficulty, id) => {
  const unit = pick(rng, ['seconds', 'minutes', 'hours'] as const);
  const weeks = int(rng, 2, 4 + Math.round(difficulty * 10));
  const perWeek = unit === 'seconds' ? 604800 : unit === 'minutes' ? 10080 : 168;
  return {
    id,
    question: `About how many ${unit} are in ${weeks} weeks?`,
    value: weeks * perWeek,
    unit,
    category: 'Time',
    sourceHint: `${weeks} × ${perWeek} ${unit}/week`,
  };
};

const percentOf: Family = (rng, difficulty, id) => {
  const p = int(rng, 5, 95);
  const base = int(rng, 200, 200 + Math.round(difficulty * 9800));
  return {
    id,
    question: `About what is ${p}% of ${base.toLocaleString()}?`,
    value: Math.round((p / 100) * base),
    unit: '',
    category: 'Percentage',
    sourceHint: `${p}% × ${base}`,
  };
};

const product: Family = (rng, difficulty, id) => {
  const a = int(rng, 12, 12 + Math.round(difficulty * 90));
  const b = int(rng, 12, 12 + Math.round(difficulty * 90));
  return {
    id,
    question: `About what is ${a} × ${b}?`,
    value: a * b,
    unit: '',
    category: 'Arithmetic',
    sourceHint: `${a} × ${b}`,
  };
};

const compound: Family = (rng, difficulty, id) => {
  const principal = int(rng, 100, 100 + Math.round(difficulty * 900)) * 10;
  const rate = pick(rng, [3, 5, 7, 10]);
  const years = int(rng, 3, 12);
  const value = Math.round(principal * (1 + rate / 100) ** years);
  return {
    id,
    question: `${principal.toLocaleString()} growing at ${rate}% per year for ${years} years becomes about…?`,
    value,
    unit: '',
    category: 'Growth',
    sourceHint: `${principal} × (1 + ${rate}%)^${years}`,
  };
};

const unitConvert: Family = (rng, _difficulty, id) => {
  const kind = pick(rng, ['km-miles', 'kg-lbs', 'm-ft'] as const);
  const n = int(rng, 5, 200);
  if (kind === 'km-miles') return { id, question: `About how many miles is ${n} km?`, value: Math.round(n * 0.621371), unit: 'miles', category: 'Conversion', sourceHint: `${n} × 0.621` };
  if (kind === 'kg-lbs') return { id, question: `About how many pounds is ${n} kg?`, value: Math.round(n * 2.20462), unit: 'lbs', category: 'Conversion', sourceHint: `${n} × 2.205` };
  return { id, question: `About how many feet is ${n} meters?`, value: Math.round(n * 3.28084), unit: 'feet', category: 'Conversion', sourceHint: `${n} × 3.281` };
};

const FAMILIES: Family[] = [timeConvert, percentOf, product, compound, unitConvert];

export function generateComputationalEstimates(
  rng: RNG,
  difficulty: number,
  count: number,
): EstimationFact[] {
  const facts: EstimationFact[] = [];
  for (let i = 0; i < count; i++) {
    const fam = pick(rng, FAMILIES);
    const id = `eg-${i}-${Math.floor(rng() * 1e9).toString(36)}`;
    facts.push(fam(rng, difficulty, id));
  }
  return facts;
}
