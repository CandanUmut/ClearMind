import { describe, expect, it } from 'vitest';
import { completeDailySession, isCompletedToday, liveStreak } from './streak';
import { defaultState } from './storage';
import type { SessionSummary } from '../types';

const summary = (dateKey: string): SessionSummary => ({ dateKey });

describe('streak transitions', () => {
  it('first completion sets streak to 1', () => {
    const s = completeDailySession(defaultState(), '2026-06-03', summary('2026-06-03'));
    expect(s.streak).toBe(1);
    expect(s.sessionsCompleted).toBe(1);
    expect(s.lastCompletedDate).toBe('2026-06-03');
  });

  it('consecutive days increment the streak', () => {
    let s = completeDailySession(defaultState(), '2026-06-03', summary('2026-06-03'));
    s = completeDailySession(s, '2026-06-04', summary('2026-06-04'));
    expect(s.streak).toBe(2);
    expect(s.sessionsCompleted).toBe(2);
  });

  it('a gap of more than a day resets the streak to 1', () => {
    let s = completeDailySession(defaultState(), '2026-06-03', summary('2026-06-03'));
    s = completeDailySession(s, '2026-06-06', summary('2026-06-06'));
    expect(s.streak).toBe(1);
  });

  it('completing again the same day is idempotent for streak and count', () => {
    let s = completeDailySession(defaultState(), '2026-06-03', summary('2026-06-03'));
    s = completeDailySession(s, '2026-06-03', summary('2026-06-03'));
    expect(s.streak).toBe(1);
    expect(s.sessionsCompleted).toBe(1);
  });

  it('tracks the longest streak', () => {
    let s = completeDailySession(defaultState(), '2026-06-01', summary('2026-06-01'));
    s = completeDailySession(s, '2026-06-02', summary('2026-06-02'));
    s = completeDailySession(s, '2026-06-03', summary('2026-06-03'));
    s = completeDailySession(s, '2026-06-10', summary('2026-06-10')); // reset
    expect(s.streak).toBe(1);
    expect(s.longestStreak).toBe(3);
  });

  it('isCompletedToday reflects the last completed date', () => {
    const s = completeDailySession(defaultState(), '2026-06-03', summary('2026-06-03'));
    expect(isCompletedToday(s, '2026-06-03')).toBe(true);
    expect(isCompletedToday(s, '2026-06-04')).toBe(false);
  });

  it('liveStreak reports 0 after a missed day', () => {
    const s = completeDailySession(defaultState(), '2026-06-03', summary('2026-06-03'));
    expect(liveStreak(s, '2026-06-04')).toBe(1); // yesterday, still alive
    expect(liveStreak(s, '2026-06-05')).toBe(0); // missed a full day
  });
});
