import type { SkillId, UserState } from '../types';

const KEY = 'clearmind:user:v1';
const SCHEMA_VERSION = 1;

const DEFAULT_RATINGS: Record<SkillId, number> = {
  mentalMath: 0.4,
  nback: 0.3,
  calibration: 0.5,
  estimation: 0.5,
};

export function defaultState(): UserState {
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return {
    schemaVersion: SCHEMA_VERSION,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    followThroughStreak: 0,
    sessionsCompleted: 0,
    ratings: { ...DEFAULT_RATINGS },
    ratingHistory: {},
    brierHistory: [],
    estimationHistory: [],
    intentions: [],
    reflections: [],
    recentReflectionIds: [],
    summaries: [],
    settings: {
      theme: prefersDark ? 'dark' : 'light',
      reducedMotion: false,
      onboarded: false,
      sound: true,
      voice: false,
    },
  };
}

/**
 * Migrate a parsed blob to the current schema, filling any missing fields.
 * Defensive: never throws on partial/legacy data.
 */
function migrate(raw: unknown): UserState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<UserState>;
  return {
    ...base,
    ...r,
    schemaVersion: SCHEMA_VERSION,
    ratings: { ...base.ratings, ...(r.ratings ?? {}) },
    ratingHistory: { ...(r.ratingHistory ?? {}) },
    brierHistory: r.brierHistory ?? [],
    estimationHistory: r.estimationHistory ?? [],
    intentions: r.intentions ?? [],
    reflections: r.reflections ?? [],
    recentReflectionIds: r.recentReflectionIds ?? [],
    summaries: r.summaries ?? [],
    settings: { ...base.settings, ...(r.settings ?? {}) },
  };
}

export function loadState(): UserState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state: UserState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or blocked (private mode) — fail silently, app stays usable.
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
