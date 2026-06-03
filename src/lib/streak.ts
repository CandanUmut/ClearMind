import type { SessionSummary, UserState } from '../types';
import { daysBetween } from './seed';

/**
 * Apply a completed daily session to user state, handling streak transitions.
 *
 * Rules:
 *  - Completing again on the same day is idempotent (no double-count, no reset).
 *  - Completing the day after the last → streak + 1.
 *  - A gap of more than one day → streak resets to 1.
 *  - First ever completion → streak 1.
 */
export function completeDailySession(
  prev: UserState,
  dateKey: string,
  summary: SessionSummary,
): UserState {
  const alreadyToday = prev.lastCompletedDate === dateKey;

  let streak = prev.streak;
  if (!alreadyToday) {
    if (prev.lastCompletedDate === null) {
      streak = 1;
    } else {
      const gap = daysBetween(prev.lastCompletedDate, dateKey);
      streak = gap === 1 ? prev.streak + 1 : 1;
    }
  }

  const longestStreak = Math.max(prev.longestStreak, streak);
  const sessionsCompleted = alreadyToday ? prev.sessionsCompleted : prev.sessionsCompleted + 1;

  const summaries = [
    ...prev.summaries.filter((s) => s.dateKey !== dateKey),
    summary,
  ].slice(-180);

  return {
    ...prev,
    streak,
    longestStreak,
    sessionsCompleted,
    lastCompletedDate: dateKey,
    summaries,
  };
}

/** Whether today's daily session has already been completed. */
export function isCompletedToday(user: UserState, dateKey: string): boolean {
  return user.lastCompletedDate === dateKey;
}

/**
 * Recompute whether a stored streak is still "alive" relative to today.
 * If the user missed yesterday (gap ≥ 2 since last completion), the displayed
 * streak should read 0 until they complete again — but we don't mutate stored
 * state here, only report the live value for display.
 */
export function liveStreak(user: UserState, todayKey: string): number {
  if (user.lastCompletedDate === null) return 0;
  const gap = daysBetween(user.lastCompletedDate, todayKey);
  if (gap <= 0) return user.streak; // completed today (0) or clock skew
  if (gap === 1) return user.streak; // yesterday — still alive, today pending
  return 0; // missed at least a full day
}
