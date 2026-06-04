import type { FC } from 'react';
import type { BlockResult, RNG, SessionSummary, UserState } from '../types';

// ── The plug-in contract ────────────────────────────────────────────────────
// Every exercise is a parametric GENERATOR + a VERIFIER. Adding a module here
// requires zero changes to the session core or the runner: session.ts and the
// Explore screen both consume MODULES, and SessionRunner renders Component and
// calls verify/commit/summarize generically.

export type ModuleCategory = 'warmup' | 'judgment' | 'visual' | 'logic' | 'problem';

export interface GeneratedExercise<TPuzzle = unknown, TAnswer = unknown, TSolution = unknown> {
  puzzle: TPuzzle;
  solution: TSolution;
  /** For choice-based UIs; omit for free-input modules. */
  options?: TAnswer[];
}

export interface BlockProps<TPuzzle = unknown, TAnswer = unknown> {
  puzzle: TPuzzle;
  options?: TAnswer[];
  /** Submit an answer; the runner verifies it and advances. */
  onAnswer: (answer: TAnswer) => void;
  /** Optional "show solution" payload for practice/learning views. */
  solution?: unknown;
  practice: boolean;
  reducedMotion: boolean;
}

export interface EvidenceNote {
  trains: string;
  doesNotClaim?: string;
  citation?: string;
}

export interface CommitContext<TPuzzle, TAnswer, TSolution> {
  dateKey: string;
  ex: GeneratedExercise<TPuzzle, TAnswer, TSolution>;
  answer: TAnswer;
  result: BlockResult;
}

export interface ExerciseModule<TPuzzle = unknown, TAnswer = unknown, TSolution = unknown> {
  id: string; // stable, e.g. "mentalMath", "patternMatrix"
  title: string;
  blurb: string; // one line shown in Explore
  category: ModuleCategory;
  /** Rating bucket; null for non-scored input blocks (intention, reflection). */
  skillId: string | null;
  evidence: EvidenceNote;
  estimateSeconds: number;
  minDifficulty: number; // 0..1
  maxDifficulty: number;

  generate(rng: RNG, difficulty: number): GeneratedExercise<TPuzzle, TAnswer, TSolution>;
  verify(ex: GeneratedExercise<TPuzzle, TAnswer, TSolution>, answer: TAnswer): BlockResult;
  Component: FC<BlockProps<TPuzzle, TAnswer>>;

  /** Optional extra persistence beyond the rating update (Brier history, etc.). */
  commit?(prev: UserState, ctx: CommitContext<TPuzzle, TAnswer, TSolution>): UserState;
  /** Optional: contribute a line to the day's summary / share string. */
  summarize?(
    ex: GeneratedExercise<TPuzzle, TAnswer, TSolution>,
    answer: TAnswer,
    result: BlockResult,
    summary: SessionSummary,
  ): void;
}

// ── The registry ────────────────────────────────────────────────────────────

export const MODULES: Record<string, ExerciseModule> = {};

export function register<P, A, S>(m: ExerciseModule<P, A, S>): void {
  if (MODULES[m.id]) {
    // Idempotent in HMR/test re-imports; last definition wins.
    if (import.meta.env?.DEV) console.warn(`Module "${m.id}" re-registered`);
  }
  MODULES[m.id] = m as unknown as ExerciseModule;
}

export function getModule(id: string): ExerciseModule | undefined {
  return MODULES[id];
}

export function allModules(): ExerciseModule[] {
  return Object.values(MODULES);
}

export function modulesByCategory(category: ModuleCategory): ExerciseModule[] {
  return allModules().filter((m) => m.category === category);
}

/** Clamp a requested difficulty into a module's supported band. */
export function clampDifficulty(m: ExerciseModule, difficulty: number): number {
  return Math.max(m.minDifficulty, Math.min(m.maxDifficulty, difficulty));
}

/**
 * Generate with reject-and-retry: if a generator throws (its own validity/
 * uniqueness guard giving up), step difficulty down and retry. Generators that
 * always succeed are unaffected.
 */
export function generateValid(
  m: ExerciseModule,
  rng: RNG,
  difficulty: number,
): GeneratedExercise {
  let d = clampDifficulty(m, difficulty);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return m.generate(rng, d);
    } catch {
      d = Math.max(m.minDifficulty, d - 0.15);
    }
  }
  // Last resort at the floor; let it throw if truly broken (surfaced in tests).
  return m.generate(rng, m.minDifficulty);
}
