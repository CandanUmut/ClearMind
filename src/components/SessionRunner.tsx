import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  BlockResult,
  CalibrationAnswer,
  CalibrationExercise,
  DailySession,
  EstimationAnswer,
  EstimationExercise,
  IntentionAnswer,
  IntentionExercise,
  MentalMathExercise,
  NBackExercise,
  ReflectionAnswer,
  ReflectionExercise,
  SessionSummary,
  UserState,
} from '../types';
import { mentalMath } from '../engine/modules/mentalMath';
import { nback } from '../engine/modules/nback';
import { calibration } from '../engine/modules/calibration';
import { estimation } from '../engine/modules/estimation';
import { intention } from '../engine/modules/intention';
import { reflection } from '../engine/modules/reflection';
import { updateRating } from '../lib/rating';
import { reliabilityPoints } from '../lib/scoring';
import { Progress } from './ui/Progress';
import { MentalMathBlock } from './blocks/MentalMathBlock';
import { NBackBlock } from './blocks/NBackBlock';
import { CalibrationBlock } from './blocks/CalibrationBlock';
import { EstimationBlock } from './blocks/EstimationBlock';
import { IntentionBlock } from './blocks/IntentionBlock';
import { ReflectionBlock } from './blocks/ReflectionBlock';

interface Props {
  session: DailySession;
  update: (fn: (prev: UserState) => UserState) => void;
  practice: boolean;
  onComplete: (summary: SessionSummary) => void;
  onExit: () => void;
}

export function SessionRunner({ session, update, practice, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const results = useRef<Record<string, BlockResult>>({});
  const summary = useRef<SessionSummary>({ dateKey: session.dateKey });
  // Captured calibration responses (for reliability diagram) and intention/reflection.
  const block = session.blocks[index];

  function commitResult(moduleId: string, result: BlockResult) {
    results.current[moduleId] = result;
  }

  function applyRating(skillId: 'mentalMath' | 'nback' | 'calibration' | 'estimation', signal: number) {
    if (practice) return;
    update((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, [skillId]: updateRating(prev.ratings[skillId], signal) },
      ratingHistory: {
        ...prev.ratingHistory,
        [skillId]: [...(prev.ratingHistory[skillId] ?? []), updateRating(prev.ratings[skillId], signal)].slice(-60),
      },
    }));
  }

  function advance() {
    if (index + 1 >= session.blocks.length) {
      onComplete(summary.current);
    } else {
      setIndex(index + 1);
    }
  }

  // ── Per-block completion handlers ────────────────────────────────────
  function finishMath(answers: number[]) {
    const ex = block.exercise as MentalMathExercise;
    const r = mentalMath.score(ex, answers);
    commitResult('mentalMath', r);
    summary.current.mathCorrect = r.payload?.correct as number;
    summary.current.mathTotal = r.payload?.total as number;
    applyRating('mentalMath', r.ratingSignal);
    advance();
  }

  function finishNBack(flagged: number[]) {
    const ex = block.exercise as NBackExercise;
    const r = nback.score(ex, flagged);
    commitResult('nback', r);
    summary.current.nbackCorrect = r.payload?.hits as number;
    summary.current.nbackTotal = r.payload?.total as number;
    applyRating('nback', r.ratingSignal);
    advance();
  }

  function finishCalibration(responses: CalibrationAnswer) {
    const ex = block.exercise as CalibrationExercise;
    const r = calibration.score(ex, responses);
    commitResult('calibration', r);
    const brier = r.payload?.brier as number;
    const correctness = r.payload?.correctness as boolean[];
    summary.current.calibrationCorrect = r.payload?.correct as number;
    summary.current.calibrationTotal = r.payload?.total as number;
    summary.current.brier = brier;
    applyRating('calibration', r.ratingSignal);
    if (!practice) {
      update((prev) => ({
        ...prev,
        brierHistory: [
          ...prev.brierHistory.filter((b) => b.dateKey !== session.dateKey),
          { dateKey: session.dateKey, brier, points: reliabilityPoints(responses, correctness) },
        ].slice(-120),
      }));
    }
    advance();
  }

  function finishEstimation(responses: EstimationAnswer) {
    const ex = block.exercise as EstimationExercise;
    const r = estimation.score(ex, responses);
    commitResult('estimation', r);
    const hits = r.payload?.hits as number;
    const total = r.payload?.total as number;
    summary.current.estimationHits = hits;
    summary.current.estimationTotal = total;
    applyRating('estimation', r.ratingSignal);
    if (!practice) {
      update((prev) => ({
        ...prev,
        estimationHistory: [
          ...prev.estimationHistory.filter((e) => e.dateKey !== session.dateKey),
          { dateKey: session.dateKey, hits, total },
        ].slice(-120),
      }));
    }
    advance();
  }

  function finishIntention(answer: IntentionAnswer) {
    const ex = block.exercise as IntentionExercise;
    commitResult('intention', intention.score(ex, answer));
    if (!practice && answer.what) {
      update((prev) => ({
        ...prev,
        intentions: [
          ...prev.intentions.filter((i) => i.dateKey !== session.dateKey),
          { dateKey: session.dateKey, what: answer.what, when: answer.when, kept: null },
        ],
      }));
    }
    advance();
  }

  function finishReflection(answer: ReflectionAnswer) {
    const ex = block.exercise as ReflectionExercise;
    commitResult('reflection', reflection.score(ex, answer));
    if (!practice) {
      update((prev) => ({
        ...prev,
        reflections: answer.text
          ? [
              ...prev.reflections.filter((rf) => rf.dateKey !== session.dateKey),
              {
                dateKey: session.dateKey,
                promptId: ex.prompt.id,
                prompt: ex.prompt.prompt,
                style: ex.prompt.style,
                text: answer.text,
              },
            ]
          : prev.reflections,
        recentReflectionIds: [ex.prompt.id, ...prev.recentReflectionIds].slice(0, 30),
      }));
    }
    advance();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-column flex-col px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onExit}
          aria-label="Exit session"
          className="text-small text-muted hover:text-ink"
        >
          ← Exit
        </button>
        <div className="flex-1">
          <Progress value={(index) / session.blocks.length} label="Session progress" />
        </div>
        <span className="tnum text-small text-muted">
          {index + 1}/{session.blocks.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1"
        >
          {block.moduleId === 'mentalMath' && (
            <MentalMathBlock exercise={block.exercise as MentalMathExercise} onDone={finishMath} />
          )}
          {block.moduleId === 'nback' && (
            <NBackBlock exercise={block.exercise as NBackExercise} onDone={finishNBack} />
          )}
          {block.moduleId === 'calibration' && (
            <CalibrationBlock exercise={block.exercise as CalibrationExercise} onDone={finishCalibration} />
          )}
          {block.moduleId === 'estimation' && (
            <EstimationBlock exercise={block.exercise as EstimationExercise} onDone={finishEstimation} />
          )}
          {block.moduleId === 'intention' && (
            <IntentionBlock exercise={block.exercise as IntentionExercise} onDone={finishIntention} />
          )}
          {block.moduleId === 'reflection' && (
            <ReflectionBlock exercise={block.exercise as ReflectionExercise} onDone={finishReflection} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
