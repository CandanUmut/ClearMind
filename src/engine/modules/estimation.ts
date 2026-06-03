import type {
  EstimationAnswer,
  EstimationExercise,
  ExerciseModule,
  RNG,
} from '../../types';
import { sample } from '../../lib/rng';
import { estimationFacts } from '../../content/estimationFacts';

const FACT_COUNT = 2;

export const estimation: ExerciseModule<EstimationExercise, EstimationAnswer> = {
  id: 'estimation',
  title: 'Estimation',
  tier: 'skill',
  estimateSeconds: 70,
  generate(rng: RNG, _difficulty: number): EstimationExercise {
    const facts = sample(rng, estimationFacts, FACT_COUNT);
    return { facts };
  },
  score(ex, answer) {
    let hits = 0;
    const perItem = ex.facts.map((fact, i) => {
      const resp = answer[i];
      if (!resp) return false;
      const lo = Math.min(resp.low, resp.high);
      const hi = Math.max(resp.low, resp.high);
      const hit = fact.value >= lo && fact.value <= hi;
      if (hit) hits += 1;
      return hit;
    });
    const total = ex.facts.length;
    // For a 90% interval, the ideal hit-rate is 0.9 — signal rewards being near it.
    const hitRate = total ? hits / total : 0;
    return {
      correct: hits === total,
      ratingSignal: hitRate,
      payload: { hits, total, perItem },
    };
  },
};
