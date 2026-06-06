import type { SessionSummary } from '../types';

// A single, honest, actionable takeaway from the day's session. We surface the
// most useful one — calibration and estimation get priority because those are
// the skills that genuinely transfer.

export function sessionInsight(summary: SessionSummary): string | null {
  // Calibration: over/under-confidence read from the Brier score + accuracy.
  if (typeof summary.brier === 'number' && summary.calibrationTotal) {
    const acc = (summary.calibrationCorrect ?? 0) / summary.calibrationTotal;
    if (summary.brier <= 0.15) {
      return 'Sharp judgment today — your confidence closely matched how often you were right.';
    }
    if (summary.brier >= 0.3) {
      return acc < 0.5
        ? 'You were confident but often wrong today — when unsure, slide your confidence toward 50%.'
        : 'Your confidence and accuracy drifted apart — aim to feel as sure as you actually are.';
    }
  }

  // Estimation: a too-narrow 90% interval is the classic overconfidence tell.
  if (summary.estimationTotal) {
    const hits = summary.estimationHits ?? 0;
    const rate = hits / summary.estimationTotal;
    if (rate < 0.5) {
      return 'Your estimate ranges were too narrow — a true 90% range should feel almost uncomfortably wide.';
    }
    if (rate === 1) {
      return 'Every estimate landed in range — nicely honest about your uncertainty.';
    }
  }

  return 'Small daily reps add up. See you tomorrow.';
}

const MILESTONES = [3, 7, 14, 30, 50, 100, 150, 200, 365];

/** Returns the milestone label if today's streak hits one, else null. */
export function streakMilestone(streak: number): string | null {
  if (!MILESTONES.includes(streak)) return null;
  if (streak >= 365) return 'One year of clear thinking. Extraordinary.';
  if (streak >= 100) return `${streak} days straight — remarkable consistency.`;
  if (streak >= 30) return `${streak}-day streak — this is a real habit now.`;
  return `${streak}-day streak!`;
}
