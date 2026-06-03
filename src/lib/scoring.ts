import type { CalibrationResponse } from '../types';

/**
 * Brier score for a single binary forecast.
 * forecastProb = probability assigned to the event that actually happened-or-not;
 * here we pass the probability the user assigned to their *chosen* answer and
 * whether that choice was correct. Score ∈ [0,1], lower is better.
 */
export function brierItem(forecastProbForChoice: number, choiceCorrect: boolean): number {
  const outcome = choiceCorrect ? 1 : 0;
  return (forecastProbForChoice - outcome) ** 2;
}

/** Mean Brier across a calibration block. confidence is 50..100 (percent). */
export function brierFromResponses(
  responses: CalibrationResponse[],
  correctness: boolean[],
): number {
  if (responses.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < responses.length; i++) {
    const p = responses[i].confidence / 100;
    sum += brierItem(p, correctness[i]);
  }
  return sum / responses.length;
}

/** Reliability-diagram points: confidence (0..1) paired with the binary outcome. */
export function reliabilityPoints(
  responses: CalibrationResponse[],
  correctness: boolean[],
): { confidence: number; correct: boolean }[] {
  return responses.map((r, i) => ({
    confidence: r.confidence / 100,
    correct: correctness[i],
  }));
}

/**
 * Bucket reliability points into bins for a calibration curve.
 * Returns, per bin: the bin's mid confidence and the observed accuracy.
 */
export function calibrationCurve(
  points: { confidence: number; correct: boolean }[],
  bins: number[] = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
): { predicted: number; observed: number; count: number }[] {
  const out = bins.map((b) => ({ predicted: b, observed: 0, count: 0, _sum: 0 }));
  for (const p of points) {
    // Snap to nearest bin centre.
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < bins.length; i++) {
      const d = Math.abs(bins[i] - p.confidence);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    out[best].count += 1;
    out[best]._sum += p.correct ? 1 : 0;
  }
  return out.map((o) => ({
    predicted: o.predicted,
    observed: o.count > 0 ? o._sum / o.count : 0,
    count: o.count,
  }));
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}
