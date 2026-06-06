// ── Shared type definitions for ClearMind ──────────────────────────────────

export type RNG = () => number; // returns a float in [0, 1)

export type ThemeMode = 'light' | 'dark';

export type SkillId =
  | 'mentalMath'
  | 'nback'
  | 'calibration'
  | 'estimation';

export type ModuleId = SkillId | 'intention' | 'reflection';

export type ReflectionStyle =
  | 'stoic'
  | 'socratic'
  | 'gratitude'
  | 'decision-review';

// ── Result of scoring a single block ───────────────────────────────────────

export interface BlockResult {
  /** Whether the block (or its dominant item) was answered correctly, when binary. */
  correct?: boolean;
  /** Signal in [0,1] fed into the adaptive rating (1 = strong, 0 = weak). */
  ratingSignal: number;
  /** Module-specific extras (Brier contribution, interval hit, etc.). */
  payload?: Record<string, unknown>;
}

// ── The module contract every exercise implements ──────────────────────────

export interface ExerciseModule<TExercise, TAnswer> {
  id: ModuleId;
  title: string;
  tier: 'core' | 'skill' | 'warmup';
  estimateSeconds: number;
  generate(rng: RNG, difficulty: number): TExercise; // difficulty 0..1
  score(ex: TExercise, answer: TAnswer): BlockResult;
}

// ── Per-module exercise / answer shapes ────────────────────────────────────

export type MathOp = '+' | '-' | '×' | '÷' | '%';

export interface MathProblem {
  prompt: string;
  answer: number;
  op: MathOp;
}
export interface MentalMathExercise {
  problems: MathProblem[];
  secondsPerProblem: number;
}
export type MentalMathAnswer = number[];

export type NBackKind = 'position' | 'letter';
export interface NBackExercise {
  kind: NBackKind;
  n: number;
  /** Sequence of stimuli; for 'position' these are 0..8 grid cells, for 'letter' char codes. */
  stimuli: number[];
  /** Indices in `stimuli` that are true matches (equal to item n steps back). */
  matches: number[];
}
/** Indices the user flagged as a match. */
export type NBackAnswer = number[];

export interface CalibrationItem {
  id: string;
  statement: string;
  answer: boolean;
  category: string;
  sourceHint: string;
}
export interface CalibrationExercise {
  items: CalibrationItem[];
}
export interface CalibrationResponse {
  choice: boolean; // user's True/False pick
  confidence: number; // 50..100
  consideredOpposite: boolean;
}
export type CalibrationAnswer = CalibrationResponse[];

export interface EstimationFact {
  id: string;
  question: string;
  value: number;
  unit: string;
  category: string;
  sourceHint: string;
}
export interface EstimationExercise {
  facts: EstimationFact[];
}
export interface EstimationResponse {
  low: number;
  high: number;
}
export type EstimationAnswer = EstimationResponse[];

export interface IntentionExercise {
  /** A gentle, seed-chosen framing line shown above the form. */
  framing: string;
}
export interface IntentionAnswer {
  what: string;
  when: string;
}

export interface ReflectionPrompt {
  id: string;
  prompt: string;
  style: ReflectionStyle;
}
export interface ReflectionExercise {
  prompt: ReflectionPrompt;
}
export interface ReflectionAnswer {
  text: string;
}

// ── Session model ──────────────────────────────────────────────────────────

export interface SessionBlock {
  /** Registry module id (stable). */
  moduleId: string;
  title: string;
  /** Difficulty (0..1) the instance was generated at — pulled from user rating. */
  difficulty: number;
  /**
   * The generated instance: { puzzle, solution, options? }. Stored as unknown
   * here to keep the session model module-agnostic; the runner casts via the
   * registry module's own types.
   */
  generated: unknown;
}

export interface DailySession {
  dateKey: string;
  seed: string;
  blocks: SessionBlock[];
}

// ── Persisted records ──────────────────────────────────────────────────────

export interface BrierRecord {
  dateKey: string;
  /** Mean Brier score for the day's calibration block (0 best, 1 worst). */
  brier: number;
  /** Per-bucket {confidence, correct} pairs for the reliability diagram. */
  points: { confidence: number; correct: boolean }[];
}

export interface EstimationRecord {
  dateKey: string;
  hits: number;
  total: number;
}

export interface SavedIntention {
  dateKey: string;
  what: string;
  when: string;
  /** Evening follow-through check: null = not yet checked. */
  kept: boolean | null;
}

export interface SavedReflection {
  dateKey: string;
  promptId: string;
  prompt: string;
  style: ReflectionStyle;
  text: string;
}

/** A module-agnostic per-block summary line, contributed by each module. */
export interface BlockSummary {
  moduleId: string;
  title: string;
  category: string;
  /** Short emoji glyph(s) for the share string, e.g. "🟩🟩⬜". */
  glyphs?: string;
  /** Human label, e.g. "4/5" or "in range". */
  label?: string;
  correct?: boolean;
}

export interface SessionSummary {
  dateKey: string;
  blocks: BlockSummary[];
  // Legacy convenience fields (still populated by the relevant modules).
  mathCorrect?: number;
  mathTotal?: number;
  nbackCorrect?: number;
  nbackTotal?: number;
  calibrationCorrect?: number;
  calibrationTotal?: number;
  brier?: number;
  estimationHits?: number;
  estimationTotal?: number;
}

export type ChallengeLevel = 'relaxed' | 'balanced' | 'challenging';

export interface UserSettings {
  theme: ThemeMode;
  reducedMotion: boolean;
  onboarded: boolean;
  /** Sound-effect chimes on answers. */
  sound: boolean;
  /** Spoken feedback via speech synthesis. */
  voice: boolean;
  /** Biases generated difficulty up or down on top of adaptive rating. */
  challenge: ChallengeLevel;
}

export interface UserState {
  schemaVersion: number;
  streak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  followThroughStreak: number;
  sessionsCompleted: number;
  ratings: Record<string, number>; // 0..1 per skill (keyed by module skillId)
  ratingHistory: Record<string, number[]>;
  brierHistory: BrierRecord[];
  estimationHistory: EstimationRecord[];
  intentions: SavedIntention[];
  reflections: SavedReflection[];
  recentReflectionIds: string[]; // for no-repeat-within-30-days
  summaries: SessionSummary[];
  achievements: string[]; // unlocked achievement ids
  settings: UserSettings;
}
