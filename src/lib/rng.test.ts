import { describe, expect, it } from 'vitest';
import { int, makeRng, pick, shuffle } from './rng';

describe('seeded RNG determinism', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = makeRng('clearmind:2026-06-03');
    const b = makeRng('clearmind:2026-06-03');
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng('clearmind:2026-06-03');
    const b = makeRng('clearmind:2026-06-04');
    expect(a()).not.toEqual(b());
  });

  it('returns floats in [0, 1)', () => {
    const r = makeRng('x');
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() stays within inclusive bounds', () => {
    const r = makeRng('bounds');
    for (let i = 0; i < 1000; i++) {
      const v = int(r, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('shuffle is deterministic and preserves elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = shuffle(makeRng('s'), arr);
    const s2 = shuffle(makeRng('s'), arr);
    expect(s1).toEqual(s2);
    expect([...s1].sort((a, b) => a - b)).toEqual(arr);
  });

  it('pick returns an element of the array', () => {
    const arr = ['a', 'b', 'c'];
    const r = makeRng('p');
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(pick(r, arr));
    }
  });
});
