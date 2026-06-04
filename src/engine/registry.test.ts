import { describe, expect, it } from 'vitest';
import './modules'; // register everything
import { allModules } from './registry';
import { makeRng } from '../lib/rng';

const modules = allModules();

describe('registry', () => {
  it('has registered the core modules', () => {
    const ids = modules.map((m) => m.id);
    for (const id of ['mentalMath', 'nback', 'calibration', 'estimation', 'intention', 'reflection']) {
      expect(ids).toContain(id);
    }
  });

  describe.each(modules.map((m) => [m.id, m] as const))('module: %s', (_id, m) => {
    const difficulties = [m.minDifficulty, (m.minDifficulty + m.maxDifficulty) / 2, m.maxDifficulty];

    it('generates byte-identical instances for identical seed + difficulty', () => {
      for (const d of difficulties) {
        const a = m.generate(makeRng(`seed:${m.id}`), d);
        const b = m.generate(makeRng(`seed:${m.id}`), d);
        expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
      }
    });

    it('produces a puzzle and a solution', () => {
      const ex = m.generate(makeRng(`shape:${m.id}`), m.maxDifficulty);
      expect(ex.puzzle).toBeDefined();
      expect('solution' in ex).toBe(true);
    });

    it('option-based modules have exactly one correct option that verifies', () => {
      if (!m.minDifficulty && !m.maxDifficulty) return;
      for (let s = 0; s < 25; s++) {
        const ex = m.generate(makeRng(`opt:${m.id}:${s}`), m.maxDifficulty);
        if (!ex.options || ex.options.length === 0) return; // not an option module
        const correctCount = ex.options.filter(
          (o) => JSON.stringify(o) === JSON.stringify(ex.solution),
        ).length;
        expect(correctCount).toBe(1);
        // the canonical solution verifies as correct
        expect(m.verify(ex, ex.solution as never).correct).toBe(true);
      }
    });
  });
});
