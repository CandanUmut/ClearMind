import type {
  ExerciseModule,
  NBackAnswer,
  NBackExercise,
  NBackKind,
  RNG,
} from '../../types';
import { int } from '../../lib/rng';

const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];

/** n scales 1→3 with difficulty; sequence length and match density are tuned for ~70-85% hit. */
export const nback: ExerciseModule<NBackExercise, NBackAnswer> = {
  id: 'nback',
  title: 'N-Back',
  tier: 'warmup',
  estimateSeconds: 80,
  generate(rng: RNG, difficulty: number): NBackExercise {
    const n = difficulty > 0.66 ? 3 : difficulty > 0.33 ? 2 : 1;
    const kind: NBackKind = difficulty > 0.5 ? 'letter' : 'position';
    const length = 12 + Math.round(difficulty * 8); // 12..20
    const symbolCount = kind === 'position' ? 9 : LETTERS.length;

    const stimuli: number[] = [];
    const matches: number[] = [];
    // Target roughly 30% match rate.
    for (let i = 0; i < length; i++) {
      if (i >= n && rng() < 0.3) {
        stimuli.push(stimuli[i - n]); // force a match
        matches.push(i);
      } else {
        let s = int(rng, 0, symbolCount - 1);
        // Avoid an accidental match when we intended a non-match.
        if (i >= n && s === stimuli[i - n]) {
          s = (s + 1) % symbolCount;
        }
        stimuli.push(s);
      }
    }
    return { kind, n, stimuli, matches };
  },
  score(ex, answer) {
    const flagged = new Set(answer);
    const truth = new Set(ex.matches);
    let hits = 0;
    let falseAlarms = 0;
    for (const idx of flagged) {
      if (truth.has(idx)) hits += 1;
      else falseAlarms += 1;
    }
    const misses = ex.matches.length - hits;
    const possible = ex.matches.length || 1;
    // Signal rewards hits, penalizes false alarms, normalized to [0,1].
    const raw = (hits - falseAlarms * 0.5) / possible;
    const ratingSignal = Math.max(0, Math.min(1, raw));
    return {
      correct: misses === 0 && falseAlarms === 0,
      ratingSignal,
      payload: { hits, misses, falseAlarms, total: ex.matches.length },
    };
  },
};

export { LETTERS };
