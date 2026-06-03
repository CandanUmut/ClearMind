import { describe, expect, it } from 'vitest';
import { buildSession } from './session';
import { defaultState } from '../lib/storage';
import type { CalibrationExercise, EstimationExercise } from '../types';

describe('session builder', () => {
  it('assembles a 5-block daily session in order', () => {
    const s = buildSession('2026-06-03', defaultState());
    expect(s.blocks).toHaveLength(5);
    const ids = s.blocks.map((b) => b.moduleId);
    // Warmup is math or nback, then the fixed core sequence.
    expect(['mentalMath', 'nback']).toContain(ids[0]);
    expect(ids.slice(1)).toEqual(['calibration', 'estimation', 'intention', 'reflection']);
  });

  it('is deterministic for the same date', () => {
    const a = buildSession('2026-06-03', defaultState());
    const b = buildSession('2026-06-03', defaultState());
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('differs across dates', () => {
    const a = buildSession('2026-06-03', defaultState());
    const b = buildSession('2026-06-04', defaultState());
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
  });

  it('calibration block has 5 well-formed items', () => {
    const s = buildSession('2026-06-03', defaultState());
    const cal = s.blocks.find((b) => b.moduleId === 'calibration')!.exercise as CalibrationExercise;
    expect(cal.items).toHaveLength(5);
    for (const item of cal.items) {
      expect(typeof item.statement).toBe('string');
      expect(typeof item.answer).toBe('boolean');
    }
    // No duplicate items within a block.
    const ids = cal.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('estimation block has 2 numeric facts', () => {
    const s = buildSession('2026-06-03', defaultState());
    const est = s.blocks.find((b) => b.moduleId === 'estimation')!.exercise as EstimationExercise;
    expect(est.facts).toHaveLength(2);
    for (const f of est.facts) {
      expect(Number.isFinite(f.value)).toBe(true);
    }
  });
});
