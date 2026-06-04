import type {
  BlockResult,
  IntentionAnswer,
  IntentionExercise,
  RNG,
  SessionSummary,
  UserState,
} from '../../types';
import { pick } from '../../lib/rng';
import {
  register,
  type CommitContext,
  type ExerciseModule,
  type GeneratedExercise,
} from '../registry';
import { IntentionBlock } from '../../components/blocks/IntentionBlock';

const FRAMINGS = [
  'Implementation intentions — “I will do X at time/place Y” — are among the best-evidenced tools for actually following through.',
  'Name one thing that would make today count. Tie it to a moment, so it has a trigger.',
  'Decide in advance: what is the one thing, and exactly when will you start it?',
  'A plan with a “when” beats a wish. Pick the thing and pin it to a time.',
];

export function generateIntention(
  rng: RNG,
  _difficulty: number,
): GeneratedExercise<IntentionExercise, IntentionAnswer, null> {
  return { puzzle: { framing: pick(rng, FRAMINGS) }, solution: null };
}

function verifyIntention(
  _ex: GeneratedExercise<IntentionExercise, IntentionAnswer, null>,
  answer: IntentionAnswer,
): BlockResult {
  const filled = answer.what.trim().length > 0;
  return { correct: filled, ratingSignal: filled ? 1 : 0, payload: { filled } };
}

export const intention: ExerciseModule<IntentionExercise, IntentionAnswer, null> = {
  id: 'intention',
  title: 'Daily Intention',
  blurb: 'Set one thing that matters and pin it to a moment.',
  category: 'judgment',
  skillId: null,
  evidence: {
    trains:
      'Implementation intentions — "I will do X at time/place Y" — are among the best-evidenced tools for following through on plans.',
    doesNotClaim: 'It is not a cognitive enhancer; it is a simple, reliable behavior-change technique.',
    citation: 'Robust medium-to-large effect on goal attainment. (Gollwitzer & Sheeran, 2006.)',
  },
  estimateSeconds: 35,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateIntention,
  verify: verifyIntention,
  Component: ({ puzzle, onAnswer }) => <IntentionBlock exercise={puzzle} onDone={onAnswer} />,
  commit: (
    prev: UserState,
    ctx: CommitContext<IntentionExercise, IntentionAnswer, null>,
  ): UserState => {
    if (!ctx.answer.what) return prev;
    return {
      ...prev,
      intentions: [
        ...prev.intentions.filter((i) => i.dateKey !== ctx.dateKey),
        { dateKey: ctx.dateKey, what: ctx.answer.what, when: ctx.answer.when, kept: null },
      ],
    };
  },
  summarize: (_ex, answer, _result, summary: SessionSummary) => {
    summary.blocks.push({
      moduleId: 'intention',
      title: 'Intention',
      category: 'judgment',
      label: answer.what ? 'set' : 'skipped',
      glyphs: '🎯',
    });
  },
};

register(intention);
