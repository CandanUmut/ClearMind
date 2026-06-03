import type {
  ExerciseModule,
  ReflectionAnswer,
  ReflectionExercise,
  RNG,
} from '../../types';
import { reflectionPrompts } from '../../content/reflectionPrompts';
import { pick } from '../../lib/rng';

/**
 * Picks a prompt avoiding any in `recentIds` (no-repeat-within-30-days).
 * Falls back to the full pool if everything is recent.
 */
export function makeReflection(rng: RNG, recentIds: string[]): ReflectionExercise {
  const recent = new Set(recentIds);
  const fresh = reflectionPrompts.filter((p) => !recent.has(p.id));
  const pool = fresh.length > 0 ? fresh : reflectionPrompts;
  return { prompt: pick(rng, pool) };
}

export const reflection: ExerciseModule<ReflectionExercise, ReflectionAnswer> = {
  id: 'reflection',
  title: 'Reflection',
  tier: 'core',
  estimateSeconds: 45,
  generate(rng: RNG, _difficulty: number): ReflectionExercise {
    // Default generate ignores history; session builder uses makeReflection() to
    // respect the no-repeat window. Kept for contract completeness.
    return { prompt: pick(rng, reflectionPrompts) };
  },
  score(_ex, answer) {
    const engaged = answer.text.trim().length > 0;
    return {
      correct: engaged,
      ratingSignal: engaged ? 1 : 0,
      payload: { engaged },
    };
  },
};
