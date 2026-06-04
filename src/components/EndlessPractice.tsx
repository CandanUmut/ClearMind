import { useMemo, useState } from 'react';
import { getModule, type GeneratedExercise } from '../engine/registry';
import { buildPracticeBlock } from '../engine/session';
import { Button } from './ui/Button';

interface Props {
  moduleId: string;
  startDifficulty: number;
  reducedMotion: boolean;
  onExit: () => void;
}

/**
 * Endless, unscored practice of a single generator — the "expanding" payoff.
 * Each answer regenerates a fresh instance at the chosen difficulty. Nothing
 * here touches the daily streak or ratings.
 */
export function EndlessPractice({ moduleId, startDifficulty, reducedMotion, onExit }: Props) {
  const module = getModule(moduleId);
  const [difficulty, setDifficulty] = useState(startDifficulty);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // New instance whenever round or difficulty changes.
  const block = useMemo(
    () => (module ? buildPracticeBlock(moduleId, difficulty, `${round}`) : null),
    [module, moduleId, difficulty, round],
  );

  if (!module || !block) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-column flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Unknown module.</p>
        <Button onClick={onExit}>Back</Button>
      </main>
    );
  }

  function handleAnswer(answer: unknown) {
    const ex = block!.generated as GeneratedExercise;
    const result = module!.verify(ex, answer);
    setAttempts((a) => a + 1);
    if (result.correct) setSolved((s) => s + 1);
    setRound((r) => r + 1);
  }

  const ex = block.generated as GeneratedExercise;

  return (
    <div className="mx-auto flex min-h-dvh max-w-column flex-col px-5 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button onClick={onExit} aria-label="Exit practice" className="text-small text-muted hover:text-ink">← Done</button>
        <span className="text-small font-medium text-ink">{module.title} · practice</span>
        <span className="tnum text-small text-muted">{solved}/{attempts}</span>
      </div>

      <label className="mb-5 flex items-center gap-3 text-small text-muted">
        Difficulty
        <input
          type="range" min={module.minDifficulty} max={module.maxDifficulty} step={0.05}
          value={difficulty}
          onChange={(e) => { setDifficulty(Number(e.target.value)); setRound((r) => r + 1); }}
          className="flex-1"
          aria-label="Practice difficulty"
        />
        <span className="tnum">{difficulty.toFixed(2)}</span>
      </label>

      <div className="flex-1" key={round}>
        <module.Component
          puzzle={ex.puzzle}
          options={ex.options}
          solution={ex.solution}
          onAnswer={handleAnswer}
          practice
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}
