import type { DailySession, SessionBlock, UserState } from '../types';
import { blockSeed, daysBetween, sessionSeed } from '../lib/seed';
import { makeRng } from '../lib/rng';
import { getModule, generateValid, modulesByCategory } from './registry';
import './modules'; // ensure all modules are registered

const EPOCH = '2024-01-01';

// ── Weekly rotation ──────────────────────────────────────────────────────────
// Every day: 1 warmup + 1 judgment (calibration/estimation) + 1 rotating
// {visual | logic | problem} + intention + reflection. The rotating slot and
// the "focus skill of the week" advance weekly so days feel different while the
// session stays ~5 minutes. New modules in these categories are picked up
// automatically from the registry — no edits here required.

const WARMUPS = ['mentalMath', 'nback'];
const JUDGMENT = ['calibration', 'estimation'];
const ROTATING_CATEGORIES = ['visual', 'logic', 'problem'] as const;

function dayOffset(dateKey: string): number {
  return Math.abs(daysBetween(EPOCH, dateKey));
}
function weekOffset(dateKey: string): number {
  return Math.floor(dayOffset(dateKey) / 7);
}

/** Pick a registered module id from a category, rotating weekly; null if none. */
function pickFromCategory(category: 'visual' | 'logic' | 'problem', dateKey: string): string | null {
  const ids = modulesByCategory(category)
    .map((m) => m.id)
    .sort(); // stable order for determinism across reloads
  if (ids.length === 0) return null;
  return ids[weekOffset(dateKey) % ids.length];
}

function buildBlock(moduleId: string, dateKey: string, user: UserState): SessionBlock | null {
  const m = getModule(moduleId);
  if (!m) return null;
  const base = m.skillId ? user.ratings[m.skillId] ?? 0.4 : 0.5;
  // Challenge preference nudges generated difficulty up or down on top of rating.
  const bias = user.settings.challenge === 'relaxed' ? -0.12 : user.settings.challenge === 'challenging' ? 0.12 : 0;
  const difficulty = Math.max(0, Math.min(1, base + bias));
  const rng = makeRng(blockSeed(dateKey, moduleId));
  const generated = generateValid(m, rng, difficulty);
  return { moduleId, title: m.title, difficulty, generated };
}

/**
 * Build the ordered daily session. The block *set* is identical for everyone on
 * a date; difficulty is pulled from the user's per-skill rating so it adapts.
 */
export function buildSession(dateKey: string, user: UserState): DailySession {
  const offset = dayOffset(dateKey);
  const warmupId = WARMUPS[offset % WARMUPS.length];
  const judgmentId = JUDGMENT[offset % JUDGMENT.length];

  // Rotating slot: choose a category by day, then a module within it by week.
  const rotatingCategory = ROTATING_CATEGORIES[offset % ROTATING_CATEGORIES.length];
  const rotatingId = pickFromCategory(rotatingCategory, dateKey);

  const order = [warmupId, judgmentId, rotatingId, 'intention', 'reflection'].filter(
    (x): x is string => Boolean(x),
  );

  const blocks: SessionBlock[] = [];
  for (const id of order) {
    const b = buildBlock(id, dateKey, user);
    if (b) blocks.push(b);
  }

  return { dateKey, seed: sessionSeed(dateKey), blocks };
}

/** Which skill is highlighted this week (the rotating module's skill). */
export function focusSkillOfWeek(dateKey: string): string | null {
  const offset = dayOffset(dateKey);
  const rotatingCategory = ROTATING_CATEGORIES[offset % ROTATING_CATEGORIES.length];
  const id = pickFromCategory(rotatingCategory, dateKey);
  return id ? getModule(id)?.skillId ?? id : null;
}

/** Build an unscored practice session for a single module at a chosen difficulty. */
export function buildPracticeBlock(
  moduleId: string,
  difficulty: number,
  entropy: string,
): SessionBlock | null {
  const m = getModule(moduleId);
  if (!m) return null;
  const rng = makeRng(`practice:${moduleId}:${entropy}`);
  const generated = generateValid(m, rng, difficulty);
  return { moduleId, title: m.title, difficulty, generated };
}

/** Build a short, off-seed, unscored practice session (Home "Practice mode").
 *  Entropy is supplied by the caller so the engine stays free of side effects. */
export function buildPracticeSession(user: UserState, entropy: string): DailySession {
  const ids = ['mentalMath', 'calibration', 'estimation'];
  const blocks: SessionBlock[] = [];
  for (const id of ids) {
    const m = getModule(id);
    if (!m) continue;
    const difficulty = m.skillId ? user.ratings[m.skillId] ?? 0.4 : 0.5;
    const generated = generateValid(m, makeRng(`practice:${id}:${entropy}`), difficulty);
    blocks.push({ moduleId: id, title: m.title, difficulty, generated });
  }
  return { dateKey: 'practice', seed: entropy, blocks };
}
