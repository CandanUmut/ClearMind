import type {
  CalibrationAnswer,
  CalibrationExercise,
  ExerciseModule,
  RNG,
} from '../../types';
import { sample } from '../../lib/rng';
import { calibrationFacts } from '../../content/calibrationFacts';
import { brierFromResponses } from '../../lib/scoring';

const ITEM_COUNT = 5;

export const calibration: ExerciseModule<CalibrationExercise, CalibrationAnswer> = {
  id: 'calibration',
  title: 'Calibration',
  tier: 'core',
  estimateSeconds: 95,
  generate(rng: RNG, _difficulty: number): CalibrationExercise {
    // Difficulty is intentionally not used to bias selection — the daily item
    // set is the same for everyone; calibration is about honesty, not speed.
    const items = sample(rng, calibrationFacts, ITEM_COUNT);
    return { items };
  },
  score(ex, answer) {
    const correctness = ex.items.map((item, i) => answer[i]?.choice === item.answer);
    const correct = correctness.filter(Boolean).length;
    const brier = brierFromResponses(answer, correctness);
    // Rating signal: blend accuracy with calibration quality (1 - brier).
    const accuracy = correctness.length ? correct / correctness.length : 0;
    const ratingSignal = 0.5 * accuracy + 0.5 * (1 - brier);
    return {
      correct: correct === ex.items.length,
      ratingSignal,
      payload: { correct, total: ex.items.length, brier, correctness },
    };
  },
};
