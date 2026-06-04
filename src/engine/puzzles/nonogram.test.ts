import { describe, expect, it } from 'vitest';
import { countSolutions, deriveClues, deriveLineClue, rowCandidates } from './nonogram';
import { generateNonogram } from '../modules/nonogram';
import { makeRng } from '../../lib/rng';

describe('nonogram solver', () => {
  it('derives run-length clues correctly', () => {
    expect(deriveLineClue([true, true, false, true])).toEqual([2, 1]);
    expect(deriveLineClue([false, false])).toEqual([0]);
    expect(deriveLineClue([true, true, true])).toEqual([3]);
  });

  it('row candidates all match their clue', () => {
    const cands = rowCandidates([2, 1], 5);
    expect(cands.length).toBeGreaterThan(0);
    for (const row of cands) {
      expect(deriveLineClue(row)).toEqual([2, 1]);
      expect(row).toHaveLength(5);
    }
  });

  it('counts a known unique puzzle as exactly one', () => {
    const grid = [
      [true, false, true],
      [true, true, false],
      [false, true, true],
    ];
    const { rows, cols } = deriveClues(grid);
    expect(countSolutions(rows, cols, 3, 2)).toBe(1);
  });
});

describe('nonogram generator', () => {
  it('always produces a uniquely-solvable puzzle (50 seeds)', () => {
    for (let s = 0; s < 50; s++) {
      const ex = generateNonogram(makeRng(`nono:${s}`), 0.3);
      expect(countSolutions(ex.puzzle.rows, ex.puzzle.cols, ex.puzzle.size, 2)).toBe(1);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateNonogram(makeRng('nono:fixed'), 0.5);
    const b = generateNonogram(makeRng('nono:fixed'), 0.5);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});
