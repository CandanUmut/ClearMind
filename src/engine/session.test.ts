import { describe, expect, it } from 'vitest';
import { buildSession } from './session';
import { defaultState } from '../lib/storage';
import { getModule } from './registry';

describe('session builder', () => {
  it('assembles an ordered daily session ending in intention + reflection', () => {
    const s = buildSession('2026-06-03', defaultState());
    expect(s.blocks.length).toBeGreaterThanOrEqual(4);
    const ids = s.blocks.map((b) => b.moduleId);
    expect(['mentalMath', 'nback']).toContain(ids[0]);
    expect(['calibration', 'estimation']).toContain(ids[1]);
    expect(ids[ids.length - 2]).toBe('intention');
    expect(ids[ids.length - 1]).toBe('reflection');
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

  it('every block references a registered module and carries a generated instance', () => {
    const s = buildSession('2026-06-03', defaultState());
    for (const b of s.blocks) {
      expect(getModule(b.moduleId)).toBeDefined();
      expect(b.generated).toBeTruthy();
      expect((b.generated as { puzzle: unknown }).puzzle).toBeTruthy();
    }
  });
});
