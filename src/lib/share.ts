import type { SessionSummary } from '../types';

/**
 * Build a Wordle-style, link-free shareable result for the day. Driven by the
 * generic per-block summaries each module contributes, so new modules appear in
 * the share string automatically.
 */
export function buildShareText(summary: SessionSummary, streak: number): string {
  const lines: string[] = [];
  lines.push(`ClearMind ${summary.dateKey}`);

  for (const b of summary.blocks) {
    if (!b.glyphs) continue;
    lines.push(`${b.title} ${b.glyphs}${b.label ? ` ${b.label}` : ''}`.trim());
  }

  if (typeof summary.brier === 'number') {
    lines.push(`Brier ${summary.brier.toFixed(2)} (lower is better)`);
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
