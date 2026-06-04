import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { DailySession, SessionSummary, UserState } from '../types';
import { getModule, type GeneratedExercise } from '../engine/registry';
import { updateRating } from '../lib/rating';
import { Progress } from './ui/Progress';

interface Props {
  session: DailySession;
  update: (fn: (prev: UserState) => UserState) => void;
  practice: boolean;
  reducedMotion: boolean;
  onComplete: (summary: SessionSummary) => void;
  onExit: () => void;
}

/**
 * Generic session orchestrator. It knows nothing about specific modules: it
 * looks each block's module up in the registry, renders its Component, then on
 * answer runs verify → rating update → commit → summarize. Adding a module
 * requires no changes here.
 */
export function SessionRunner({
  session,
  update,
  practice,
  reducedMotion,
  onComplete,
  onExit,
}: Props) {
  const [index, setIndex] = useState(0);
  const summary = useRef<SessionSummary>({ dateKey: session.dateKey, blocks: [] });
  const block = session.blocks[index];
  const module = getModule(block.moduleId);

  function advance() {
    if (index + 1 >= session.blocks.length) onComplete(summary.current);
    else setIndex(index + 1);
  }

  function handleAnswer(answer: unknown) {
    if (!module) {
      advance();
      return;
    }
    const ex = block.generated as GeneratedExercise;
    const result = module.verify(ex, answer);

    // Module contributes its summary/share line.
    module.summarize?.(ex, answer, result, summary.current);

    if (!practice) {
      update((prev) => {
        let next = prev;
        if (module.skillId) {
          const skill = module.skillId;
          const nextRating = updateRating(prev.ratings[skill] ?? 0.4, result.ratingSignal);
          next = {
            ...next,
            ratings: { ...next.ratings, [skill]: nextRating },
            ratingHistory: {
              ...next.ratingHistory,
              [skill]: [...(next.ratingHistory[skill] ?? []), nextRating].slice(-60),
            },
          };
        }
        next = module.commit?.(next, { dateKey: session.dateKey, ex, answer, result }) ?? next;
        return next;
      });
    }

    advance();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-column flex-col px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onExit} aria-label="Exit session" className="text-small text-muted hover:text-ink">
          ← Exit
        </button>
        <div className="flex-1">
          <Progress value={index / session.blocks.length} label="Session progress" />
        </div>
        <span className="tnum text-small text-muted">
          {index + 1}/{session.blocks.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={reducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1"
        >
          {module ? (
            <module.Component
              puzzle={(block.generated as GeneratedExercise).puzzle}
              options={(block.generated as GeneratedExercise).options}
              solution={(block.generated as GeneratedExercise).solution}
              onAnswer={handleAnswer}
              practice={practice}
              reducedMotion={reducedMotion}
            />
          ) : (
            <p className="text-muted">Unknown module: {block.moduleId}</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
