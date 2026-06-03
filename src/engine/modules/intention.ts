import type {
  ExerciseModule,
  IntentionAnswer,
  IntentionExercise,
  RNG,
} from '../../types';
import { pick } from '../../lib/rng';

const FRAMINGS = [
  'Implementation intentions — “I will do X at time/place Y” — are among the best-evidenced tools for actually following through.',
  'Name one thing that would make today count. Tie it to a moment, so it has a trigger.',
  'Decide in advance: what is the one thing, and exactly when will you start it?',
  'A plan with a “when” beats a wish. Pick the thing and pin it to a time.',
];

export const intention: ExerciseModule<IntentionExercise, IntentionAnswer> = {
  id: 'intention',
  title: 'Daily Intention',
  tier: 'core',
  estimateSeconds: 35,
  generate(rng: RNG, _difficulty: number): IntentionExercise {
    return { framing: pick(rng, FRAMINGS) };
  },
  score(_ex, answer) {
    // Completing the intention (non-empty "what") counts as engagement, not correctness.
    const filled = answer.what.trim().length > 0;
    return {
      correct: filled,
      ratingSignal: filled ? 1 : 0,
      payload: { filled },
    };
  },
};
