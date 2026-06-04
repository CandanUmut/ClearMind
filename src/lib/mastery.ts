// Honest, calm mastery tiers derived from a skill's adaptive rating. These are
// difficulty bands, not a leaderboard — no pressure, no dark patterns.

export const MASTERY_TIERS = ['Novice', 'Apprentice', 'Skilled', 'Adept', 'Master'] as const;
export type MasteryTier = (typeof MASTERY_TIERS)[number];

export function masteryLevel(rating: number): number {
  if (rating < 0.3) return 0;
  if (rating < 0.5) return 1;
  if (rating < 0.7) return 2;
  if (rating < 0.85) return 3;
  return 4;
}

export function masteryTier(rating: number): MasteryTier {
  return MASTERY_TIERS[masteryLevel(rating)];
}

/** Progress (0..1) toward the next tier, for a small ring. */
export function tierProgress(rating: number): number {
  const bounds = [0, 0.3, 0.5, 0.7, 0.85, 1];
  const lvl = masteryLevel(rating);
  const lo = bounds[lvl];
  const hi = bounds[lvl + 1];
  return Math.max(0, Math.min(1, (rating - lo) / (hi - lo || 1)));
}
