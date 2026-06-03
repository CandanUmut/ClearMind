// Adaptive difficulty: a single 0..1 rating per skill, nudged toward recent
// performance with an EWMA. We aim to keep the user near their edge (~70–85%
// success) by treating the rating itself as the difficulty knob.

const LEARNING_RATE = 0.18;
const TARGET_SUCCESS = 0.78;

/**
 * Update a skill rating given a performance signal in [0,1].
 * A signal above the target nudges difficulty up; below nudges it down.
 */
export function updateRating(current: number, signal: number): number {
  const clampedSignal = clamp01(signal);
  // Error relative to target: positive = doing better than target → make it harder.
  const error = clampedSignal - TARGET_SUCCESS;
  const next = current + LEARNING_RATE * error;
  return clamp01(next);
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Convenience: map a fraction-correct to a rating signal (identity, but explicit). */
export function fractionToSignal(correct: number, total: number): number {
  if (total <= 0) return TARGET_SUCCESS;
  return correct / total;
}
