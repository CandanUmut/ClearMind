import type {
  BlockResult,
  ReflectionAnswer,
  ReflectionExercise,
  RNG,
  SessionSummary,
  UserState,
} from '../../types';
import { pick } from '../../lib/rng';
import { reflectionPrompts } from '../../content/reflectionPrompts';
import {
  register,
  type CommitContext,
  type ExerciseModule,
  type GeneratedExercise,
} from '../registry';
import { ReflectionBlock } from '../../components/blocks/ReflectionBlock';

// Reflection is a prompt block: the daily seed deterministically selects one of
// 60 prompts (most days differ). Recent ids are still tracked for the journal.
export function generateReflection(
  rng: RNG,
  _difficulty: number,
): GeneratedExercise<ReflectionExercise, ReflectionAnswer, null> {
  return { puzzle: { prompt: pick(rng, reflectionPrompts) }, solution: null };
}

function verifyReflection(
  _ex: GeneratedExercise<ReflectionExercise, ReflectionAnswer, null>,
  answer: ReflectionAnswer,
): BlockResult {
  const engaged = answer.text.trim().length > 0;
  return { correct: engaged, ratingSignal: engaged ? 1 : 0, payload: { engaged } };
}

export const reflection: ExerciseModule<ReflectionExercise, ReflectionAnswer, null> = {
  id: 'reflection',
  title: 'Reflection',
  blurb: 'One short prompt — Stoic, Socratic, gratitude, or decision-review.',
  category: 'judgment',
  skillId: null,
  evidence: {
    trains: 'Brief structured reflection supports metacognition — noticing your own thinking.',
    doesNotClaim: 'It does not boost IQ or prevent decline. It is a small habit that supports clearer thinking.',
    citation: 'Structured reflection improves learning. (Di Stefano et al., 2016.)',
  },
  estimateSeconds: 45,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateReflection,
  verify: verifyReflection,
  Component: ({ puzzle, onAnswer }) => <ReflectionBlock exercise={puzzle} onDone={onAnswer} />,
  commit: (
    prev: UserState,
    ctx: CommitContext<ReflectionExercise, ReflectionAnswer, null>,
  ): UserState => {
    const p = ctx.ex.puzzle.prompt;
    return {
      ...prev,
      reflections: ctx.answer.text
        ? [
            ...prev.reflections.filter((rf) => rf.dateKey !== ctx.dateKey),
            { dateKey: ctx.dateKey, promptId: p.id, prompt: p.prompt, style: p.style, text: ctx.answer.text },
          ]
        : prev.reflections,
      recentReflectionIds: [p.id, ...prev.recentReflectionIds].slice(0, 30),
    };
  },
  summarize: (_ex, answer, _result, summary: SessionSummary) => {
    summary.blocks.push({
      moduleId: 'reflection',
      title: 'Reflection',
      category: 'judgment',
      label: answer.text ? 'written' : 'reflected',
      glyphs: '🪞',
    });
  },
};

register(reflection);
