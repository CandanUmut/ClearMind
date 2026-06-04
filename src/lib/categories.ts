import type { ModuleCategory } from '../engine/registry';

// Shared per-category presentation: a CSS color variable, a label, and an emoji.
// Used across Explore, block headers, About and Results so color is consistent.

export const CATEGORY_META: Record<
  ModuleCategory,
  { label: string; cssVar: string; emoji: string }
> = {
  warmup: { label: 'Warmup', cssVar: 'var(--cat-warmup)', emoji: '🔥' },
  judgment: { label: 'Judgment', cssVar: 'var(--cat-judgment)', emoji: '⚖️' },
  visual: { label: 'Visual reasoning', cssVar: 'var(--cat-visual)', emoji: '◳' },
  logic: { label: 'Logic', cssVar: 'var(--cat-logic)', emoji: '◆' },
  problem: { label: 'Problem solving', cssVar: 'var(--cat-problem)', emoji: '∑' },
};

export function categoryColor(category: ModuleCategory): string {
  return CATEGORY_META[category]?.cssVar ?? 'var(--accent)';
}
