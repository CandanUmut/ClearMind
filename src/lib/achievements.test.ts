import { describe, expect, it } from 'vitest';
import { earnedAchievementIds, newlyEarned } from './achievements';
import { sessionInsight, streakMilestone } from './insight';
import { defaultState } from './storage';
import type { SessionSummary, UserState } from '../types';

function state(patch: Partial<UserState>): UserState {
  return { ...defaultState(), ...patch };
}

describe('achievements', () => {
  it('awards first-session after one session', () => {
    expect(earnedAchievementIds(state({ sessionsCompleted: 1 }))).toContain('first-session');
  });

  it('awards streak milestones from the longest streak', () => {
    const ids = earnedAchievementIds(state({ longestStreak: 30 }));
    expect(ids).toContain('streak-7');
    expect(ids).toContain('streak-30');
    expect(ids).not.toContain('streak-100');
  });

  it('newlyEarned excludes already-stored achievements', () => {
    const u = state({ sessionsCompleted: 1, achievements: ['first-session'] });
    expect(newlyEarned(u).map((a) => a.id)).not.toContain('first-session');
  });

  it('rewards a well-calibrated day', () => {
    const u = state({ brierHistory: [{ dateKey: '2026-06-01', brier: 0.1, points: [] }] });
    expect(earnedAchievementIds(u)).toContain('well-calibrated');
  });
});

describe('insight', () => {
  const base: SessionSummary = { dateKey: '2026-06-01', blocks: [] };

  it('praises sharp calibration', () => {
    const s = { ...base, brier: 0.1, calibrationCorrect: 5, calibrationTotal: 5 };
    expect(sessionInsight(s)).toMatch(/Sharp judgment/);
  });

  it('flags narrow estimation ranges', () => {
    const s = { ...base, estimationHits: 0, estimationTotal: 2 };
    expect(sessionInsight(s)).toMatch(/too narrow/);
  });

  it('streakMilestone fires only on milestone days', () => {
    expect(streakMilestone(7)).toBeTruthy();
    expect(streakMilestone(8)).toBeNull();
  });
});
