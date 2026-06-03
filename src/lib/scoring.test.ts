import { describe, expect, it } from 'vitest';
import { brierFromResponses, brierItem, calibrationCurve } from './scoring';
import type { CalibrationResponse } from '../types';

describe('Brier scoring', () => {
  it('is 0 for a perfectly confident correct forecast', () => {
    expect(brierItem(1, true)).toBe(0);
  });

  it('is 1 for a perfectly confident wrong forecast', () => {
    expect(brierItem(1, false)).toBe(1);
  });

  it('is 0.25 for a 50% forecast either way', () => {
    expect(brierItem(0.5, true)).toBeCloseTo(0.25);
    expect(brierItem(0.5, false)).toBeCloseTo(0.25);
  });

  it('averages across a block', () => {
    const responses: CalibrationResponse[] = [
      { choice: true, confidence: 100, consideredOpposite: false },
      { choice: true, confidence: 100, consideredOpposite: false },
    ];
    // first correct (0), second wrong (1) → mean 0.5
    expect(brierFromResponses(responses, [true, false])).toBeCloseTo(0.5);
  });

  it('empty block scores 0', () => {
    expect(brierFromResponses([], [])).toBe(0);
  });
});

describe('calibration curve', () => {
  it('buckets points and reports observed accuracy', () => {
    const points = [
      { confidence: 0.9, correct: true },
      { confidence: 0.9, correct: true },
      { confidence: 0.9, correct: false },
    ];
    const curve = calibrationCurve(points);
    const bin90 = curve.find((c) => c.predicted === 0.9)!;
    expect(bin90.count).toBe(3);
    expect(bin90.observed).toBeCloseTo(2 / 3);
  });
});
