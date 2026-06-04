import { describe, expect, it } from 'vitest';
import { generateMentalMath, mentalMath } from './mentalMath';
import { makeRng } from '../../lib/rng';

describe('mentalMath generator', () => {
  it('is deterministic for a given seed and difficulty', () => {
    const a = generateMentalMath(makeRng('day:1'), 0.5);
    const b = generateMentalMath(makeRng('day:1'), 0.5);
    expect(a).toEqual(b);
  });

  it('the solution equals the computed answer of every problem', () => {
    const ex = generateMentalMath(makeRng('verify'), 0.7);
    expect(ex.solution).toHaveLength(ex.puzzle.problems.length);
    ex.puzzle.problems.forEach((p, i) => expect(ex.solution[i]).toBe(p.answer));
  });

  it('verifies a perfect answer set as fully correct', () => {
    const ex = generateMentalMath(makeRng('score'), 0.4);
    const result = mentalMath.verify(ex, ex.solution);
    expect(result.correct).toBe(true);
    expect(result.ratingSignal).toBe(1);
  });

  it('verifies all-wrong answers as zero signal', () => {
    const ex = generateMentalMath(makeRng('score2'), 0.4);
    const result = mentalMath.verify(ex, ex.solution.map(() => 999999));
    expect(result.ratingSignal).toBe(0);
    expect(result.correct).toBe(false);
  });
});
