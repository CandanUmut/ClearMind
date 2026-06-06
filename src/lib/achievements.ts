import type { UserState } from '../types';
import { mean } from './scoring';

// Honest, calm achievements — milestones worth noticing, never manipulative
// pressure. Each has a pure `earned(user)` check evaluated after each session.

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: (u: UserState) => boolean;
}

function recentBrier(u: UserState, n: number): number[] {
  return u.brierHistory.slice(-n).map((b) => b.brier);
}
function estimationRate(u: UserState, n: number): number {
  const recent = u.estimationHistory.slice(-n);
  const hits = recent.reduce((a, e) => a + e.hits, 0);
  const total = recent.reduce((a, e) => a + e.total, 0);
  return total ? hits / total : 0;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-session', title: 'First step', description: 'Complete your first session.', icon: '🌱', earned: (u) => u.sessionsCompleted >= 1 },
  { id: 'sessions-10', title: 'Finding the rhythm', description: 'Complete 10 sessions.', icon: '🎵', earned: (u) => u.sessionsCompleted >= 10 },
  { id: 'sessions-50', title: 'Part of the routine', description: 'Complete 50 sessions.', icon: '🧭', earned: (u) => u.sessionsCompleted >= 50 },
  { id: 'streak-7', title: 'A week of clarity', description: 'Reach a 7-day streak.', icon: '🔥', earned: (u) => u.longestStreak >= 7 },
  { id: 'streak-30', title: 'A month of thinking', description: 'Reach a 30-day streak.', icon: '🌙', earned: (u) => u.longestStreak >= 30 },
  { id: 'streak-100', title: 'Centurion', description: 'Reach a 100-day streak.', icon: '💯', earned: (u) => u.longestStreak >= 100 },
  { id: 'well-calibrated', title: 'Well calibrated', description: 'Finish a day with a Brier score of 0.15 or better.', icon: '🎯', earned: (u) => u.brierHistory.some((b) => b.brier <= 0.15) },
  { id: 'calibrated-week', title: 'Sharp judgment', description: 'Average a Brier of 0.18 or better over 7 days.', icon: '⚖️', earned: (u) => recentBrier(u, 7).length >= 7 && mean(recentBrier(u, 7)) <= 0.18 },
  { id: 'honest-ranges', title: 'Honest uncertainty', description: 'Hit 80%+ of your estimation ranges over 10 days.', icon: '📏', earned: (u) => u.estimationHistory.length >= 10 && estimationRate(u, 10) >= 0.8 },
  { id: 'follow-through-7', title: 'True to your word', description: 'Keep 7 daily intentions in a row.', icon: '✅', earned: (u) => u.followThroughStreak >= 7 },
  { id: 'reflective', title: 'Examined life', description: 'Write 10 reflections in your journal.', icon: '🪞', earned: (u) => u.reflections.length >= 10 },
];

/** All achievement ids the user currently qualifies for. */
export function earnedAchievementIds(u: UserState): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(u)).map((a) => a.id);
}

/** Newly-earned achievements given the user's previously-stored set. */
export function newlyEarned(u: UserState): Achievement[] {
  const have = new Set(u.achievements);
  return ACHIEVEMENTS.filter((a) => a.earned(u) && !have.has(a.id));
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
