import type { SessionSummary } from '../types';

/**
 * Build a Wordle-style, link-free shareable result for the day.
 * Uses emoji to encode calibration accuracy and estimation hits, plus the streak.
 */
export function buildShareText(summary: SessionSummary, streak: number): string {
  const lines: string[] = [];
  lines.push(`ClearMind ${summary.dateKey}`);

  if (summary.calibrationTotal && summary.calibrationTotal > 0) {
    const correct = summary.calibrationCorrect ?? 0;
    const total = summary.calibrationTotal;
    const squares = Array.from({ length: total }, (_, i) =>
      i < correct ? '🟩' : '⬜',
    ).join('');
    lines.push(`Judgment ${squares} ${correct}/${total}`);
  }

  if (typeof summary.brier === 'number') {
    lines.push(`Brier ${summary.brier.toFixed(2)}`);
  }

  if (summary.estimationTotal && summary.estimationTotal > 0) {
    const hits = summary.estimationHits ?? 0;
    const total = summary.estimationTotal;
    const squares = Array.from({ length: total }, (_, i) =>
      i < hits ? '🎯' : '⬜',
    ).join('');
    lines.push(`Estimates ${squares} ${hits}/${total}`);
  }

  lines.push(`🔥 ${streak}-day streak`);
  lines.push('clear thinking, not scrolling');
  return lines.join('\n');
}

/** Copy text to clipboard, returning success. Falls back to a textarea hack. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
