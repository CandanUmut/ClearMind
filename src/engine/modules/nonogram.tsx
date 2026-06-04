import { useState } from 'react';
import type { BlockResult, RNG } from '../../types';
import { register, type BlockProps, type ExerciseModule, type GeneratedExercise } from '../registry';
import { countSolutions, deriveClues, type Grid } from '../puzzles/nonogram';
import { Button } from '../../components/ui/Button';
import { ModuleEvidence } from '../../components/ui/ModuleEvidence';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   size: 5 (<0.5) → 6 (<0.8) → 7 ; fill density ~0.5. Each instance is solved
//   to confirm a UNIQUE solution; non-unique grids are rejected and regenerated.
// ─────────────────────────────────────────────────────────────────────────────

interface NonoPuzzle {
  size: number;
  rows: number[][];
  cols: number[][];
}

export function generateNonogram(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<NonoPuzzle, Grid, Grid> {
  const size = difficulty < 0.5 ? 5 : difficulty < 0.8 ? 6 : 7;
  const density = 0.45 + difficulty * 0.1;

  for (let attempt = 0; attempt < 40; attempt++) {
    const grid: Grid = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rng() < density),
    );
    // Avoid fully empty rows/cols (degenerate clues).
    if (grid.some((r) => r.every((c) => !c))) continue;
    const { rows, cols } = deriveClues(grid);
    if (countSolutions(rows, cols, size, 2) === 1) {
      return { puzzle: { size, rows, cols }, solution: grid };
    }
  }
  throw new Error('nonogram: no unique puzzle found at this difficulty');
}

function gridsEqual(a: Grid, b: Grid): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function verify(ex: GeneratedExercise<NonoPuzzle, Grid, Grid>, answer: Grid): BlockResult {
  const correct = gridsEqual(answer, ex.solution);
  const size = ex.puzzle.size;
  let match = 0;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) if (answer[r]?.[c] === ex.solution[r][c]) match += 1;
  return { correct, ratingSignal: correct ? 1 : match / (size * size) > 0.9 ? 0.6 : 0, payload: { correct } };
}

function NonogramBlock({ puzzle, solution, onAnswer, practice }: BlockProps<NonoPuzzle, Grid>) {
  const { size, rows, cols } = puzzle;
  const [grid, setGrid] = useState<Grid>(() =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => false)),
  );
  const [revealed, setRevealed] = useState(false);
  const sol = solution as Grid | undefined;

  function toggle(r: number, c: number) {
    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? !v : v)) : row)));
  }

  const cell = 40;
  const clueCols = Math.max(...rows.map((r) => r.length));
  const clueRows = Math.max(...cols.map((c) => c.length));

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-small text-muted">Logic · deduction</p>
        <h2 className="text-h2 text-ink">Nonogram</h2>
        <p className="text-small text-muted">Fill cells so each run matches its row and column clues.</p>
      </header>

      <div className="overflow-auto">
        <div className="mx-auto w-fit" role="group" aria-label={`Nonogram ${size} by ${size}. Row clues: ${rows.map((r) => r.join(' ')).join('; ')}. Column clues: ${cols.map((c) => c.join(' ')).join('; ')}.`}>
          {/* Column clues */}
          <div className="flex" style={{ marginLeft: clueCols * 14 }}>
            {cols.map((c, ci) => (
              <div key={ci} className="flex flex-col items-center justify-end" style={{ width: cell, height: clueRows * 16 }}>
                {c.map((n, i) => <span key={i} className="tnum text-small text-ink-soft">{n}</span>)}
              </div>
            ))}
          </div>
          {/* Rows */}
          {grid.map((row, r) => (
            <div key={r} className="flex items-center">
              <div className="flex justify-end gap-1 pr-1" style={{ width: clueCols * 14 }}>
                {rows[r].map((n, i) => <span key={i} className="tnum text-small text-ink-soft">{n}</span>)}
              </div>
              {row.map((v, c) => {
                const showSol = revealed && sol;
                const fill = showSol ? sol![r][c] : v;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => !revealed && toggle(r, c)}
                    aria-label={`Row ${r + 1} column ${c + 1}${v ? ' filled' : ' empty'}`}
                    aria-pressed={v}
                    className="border border-line transition-colors"
                    style={{
                      width: cell, height: cell,
                      background: fill ? 'var(--accent)' : 'var(--surface)',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button full onClick={() => onAnswer(grid)}>Submit</Button>
        {practice && !revealed && (
          <Button variant="ghost" full onClick={() => setRevealed(true)}>Show solution</Button>
        )}
      </div>

      <ModuleEvidence note={nonogram.evidence} />
    </div>
  );
}

export const nonogram: ExerciseModule<NonoPuzzle, Grid, Grid> = {
  id: 'nonogram',
  title: 'Nonogram',
  blurb: 'Deduce the hidden picture from row and column run-length clues.',
  category: 'logic',
  skillId: 'nonogram',
  evidence: {
    trains: 'Trains constraint reasoning and systematic deduction — combining clues to eliminate possibilities.',
    doesNotClaim: 'A specific puzzle skill; expect to get better at nonograms. No IQ or general-intelligence claims.',
    citation: 'Puzzle practice improves puzzle-specific performance. (Sala & Gobet, 2017.)',
  },
  estimateSeconds: 120,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateNonogram,
  verify,
  Component: NonogramBlock,
  summarize: (_ex, _answer, result, summary) => {
    summary.blocks.push({
      moduleId: 'nonogram',
      title: 'Nonogram',
      category: 'logic',
      label: result.correct ? 'solved' : 'incomplete',
      glyphs: result.correct ? '🟩' : '⬜',
      correct: result.correct,
    });
  },
};

register(nonogram);
