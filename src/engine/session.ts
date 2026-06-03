import type { DailySession, SessionBlock, UserState } from '../types';
import { blockSeed, daysBetween, sessionSeed } from '../lib/seed';
import { makeRng } from '../lib/rng';
import { mentalMath } from './modules/mentalMath';
import { nback } from './modules/nback';
import { calibration } from './modules/calibration';
import { estimation } from './modules/estimation';
import { intention } from './modules/intention';
import { makeReflection } from './modules/reflection';

const EPOCH = '2024-01-01';

/** Warmup alternates Mental Math (even days) / N-back (odd days). */
function warmupForDay(dateKey: string): typeof mentalMath | typeof nback {
  const offset = Math.abs(daysBetween(EPOCH, dateKey));
  return offset % 2 === 0 ? mentalMath : nback;
}

/**
 * Build the ordered daily session. The block *set* is identical for everyone on
 * a date; difficulty is pulled from the user's per-skill rating so it adapts.
 */
export function buildSession(dateKey: string, user: UserState): DailySession {
  const blocks: SessionBlock[] = [];

  // 1. Warmup (math or n-back)
  const warmup = warmupForDay(dateKey);
  const warmupDifficulty = user.ratings[warmup.id as 'mentalMath' | 'nback'];
  blocks.push({
    moduleId: warmup.id,
    title: warmup.title,
    tier: warmup.tier,
    estimateSeconds: warmup.estimateSeconds,
    exercise: warmup.generate(makeRng(blockSeed(dateKey, warmup.id)), warmupDifficulty),
  });

  // 2. Calibration (flagship)
  blocks.push({
    moduleId: calibration.id,
    title: calibration.title,
    tier: calibration.tier,
    estimateSeconds: calibration.estimateSeconds,
    exercise: calibration.generate(
      makeRng(blockSeed(dateKey, calibration.id)),
      user.ratings.calibration,
    ),
  });

  // 3. Estimation
  blocks.push({
    moduleId: estimation.id,
    title: estimation.title,
    tier: estimation.tier,
    estimateSeconds: estimation.estimateSeconds,
    exercise: estimation.generate(
      makeRng(blockSeed(dateKey, estimation.id)),
      user.ratings.estimation,
    ),
  });

  // 4. Intention
  blocks.push({
    moduleId: intention.id,
    title: intention.title,
    tier: intention.tier,
    estimateSeconds: intention.estimateSeconds,
    exercise: intention.generate(makeRng(blockSeed(dateKey, intention.id)), 0.5),
  });

  // 5. Reflection (respects 30-day no-repeat window via user.recentReflectionIds)
  blocks.push({
    moduleId: 'reflection',
    title: 'Reflection',
    tier: 'core',
    estimateSeconds: 45,
    exercise: makeReflection(
      makeRng(blockSeed(dateKey, 'reflection')),
      user.recentReflectionIds,
    ),
  });

  return {
    dateKey,
    seed: sessionSeed(dateKey),
    blocks,
  };
}

/** Build a practice (unscored, off-seed) session using the current clock as entropy. */
export function buildPracticeSession(user: UserState): DailySession {
  const entropy = `practice:${Date.now()}:${Math.random()}`;
  const warmup = mentalMath;
  const blocks: SessionBlock[] = [
    {
      moduleId: warmup.id,
      title: warmup.title,
      tier: warmup.tier,
      estimateSeconds: warmup.estimateSeconds,
      exercise: warmup.generate(makeRng(`${entropy}:math`), user.ratings.mentalMath),
    },
    {
      moduleId: calibration.id,
      title: calibration.title,
      tier: calibration.tier,
      estimateSeconds: calibration.estimateSeconds,
      exercise: calibration.generate(makeRng(`${entropy}:cal`), user.ratings.calibration),
    },
    {
      moduleId: estimation.id,
      title: estimation.title,
      tier: estimation.tier,
      estimateSeconds: estimation.estimateSeconds,
      exercise: estimation.generate(makeRng(`${entropy}:est`), user.ratings.estimation),
    },
  ];
  return { dateKey: 'practice', seed: entropy, blocks };
}
