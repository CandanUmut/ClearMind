import { describe, expect, it } from 'vitest';
import { mentalMath } from './mentalMath';
import { makeRng } from '../../lib/rng';

describe('mentalMath generator', () => {
  it('is deterministic for a given seed and difficulty', () => {
    const a = mentalMath.generate(makeRng('day:1'), 0.5);
    const b = mentalMath.generate(makeRng('day:1'), 0.5);
    expect(a).toEqual(b);
  });

  it('every generated problem has a correct computed answer', () => {
    const ex = mentalMath.generate(makeRng('verify'), 0.7);
    for (const p of ex.problems) {
      expect(Number.isFinite(p.answer)).toBe(true);
    }
  });

  it('scores a perfect answer set as fully correct', () => {
    const ex = mentalMath.generate(makeRng('score'), 0.4);
    const answers = ex.problems.map((p) => p.answer);
    const result = mentalMath.score(ex, answers);
    expect(result.correct).toBe(true);
    expect(result.ratingSignal).toBe(1);
  });

  it('scores wrong answers proportionally', () => {
    const ex = mentalMath.generate(makeRng('score2'), 0.4);
    const answers = ex.problems.map(() => 999999); // all wrong
    const result = mentalMath.score(ex, answers);
    expect(result.ratingSignal).toBe(0);
    expect(result.correct).toBe(false);
  });
});
