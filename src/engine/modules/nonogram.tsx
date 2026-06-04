import { useState } from 'react';
import type { BlockResult, RNG } from '../../types';
import { register, type BlockProps, type ExerciseModule, type GeneratedExercise } from '../registry';
import { countSolutions, deriveClues, type Grid } from '../puzzles/nonogram';
import { sound } from '../../lib/sound';
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
    if (revealed) return;
    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? !v : v)) : row)));
    sound.tick();
  }

  // ── Responsive SVG layout ──────────────────────────────────────────────
  // Everything is drawn in a single viewBox that scales to the column width,
  // so clues + grid are always fully visible on any screen.
  const clueCols = Math.max(...rows.map((r) => r.length)); // width (in cells) of the row-clue gutter
  const clueRows = Math.max(...cols.map((c) => c.length)); // height (in cells) of the col-clue gutter
  const U = 10; // internal cell unit
  const offX = clueCols * U;
  const offY = clueRows * U;
  const W = offX + size * U;
  const H = offY + size * U;
  const submitted = revealed;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-small font-medium" style={{ color: 'var(--cat-logic)' }}>Logic · deduction</p>
        <h2 className="text-h2 text-ink">Nonogram</h2>
        <p className="text-small text-muted">Tap cells so each run matches its row and column clues.</p>
      </header>

      <div className="rounded border border-line bg-surface p-3 shadow-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block h-auto w-full"
          style={{ maxWidth: Math.min(440, W * 8) }}
          role="group"
          aria-label={`Nonogram ${size} by ${size}. Row clues: ${rows.map((r) => r.join(' ')).join('; ')}. Column clues: ${cols.map((c) => c.join(' ')).join('; ')}.`}
        >
          {/* Column clues */}
          {cols.map((clue, c) =>
            clue.map((n, i) => (
              <text
                key={`c${c}-${i}`}
                x={offX + c * U + U / 2}
                y={offY - (clue.length - 1 - i) * U - U * 0.3}
                fontSize={U * 0.55}
                textAnchor="middle"
                fill="var(--ink-soft)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {n}
              </text>
            )),
          )}
          {/* Row clues */}
          {rows.map((clue, r) =>
            clue.map((n, i) => (
              <text
                key={`r${r}-${i}`}
                x={offX - (clue.length - 1 - i) * U - U * 0.5}
                y={offY + r * U + U * 0.68}
                fontSize={U * 0.55}
                textAnchor="middle"
                fill="var(--ink-soft)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {n}
              </text>
            )),
          )}
          {/* Cells */}
          {grid.map((row, r) =>
            row.map((v, c) => {
              const fill = submitted && sol ? sol[r][c] : v;
              return (
                <rect
                  key={`${r}-${c}`}
                  x={offX + c * U}
                  y={offY + r * U}
                  width={U}
                  height={U}
                  rx={1}
                  fill={fill ? 'var(--cat-logic)' : 'var(--surface-2)'}
                  stroke="var(--line)"
                  strokeWidth={0.4}
                  style={{ cursor: submitted ? 'default' : 'pointer' }}
                  onClick={() => toggle(r, c)}
                  aria-label={`Row ${r + 1} column ${c + 1}${v ? ' filled' : ' empty'}`}
                />
              );
            }),
          )}
          {/* Block separators every 5 cells for readability */}
          {Array.from({ length: Math.floor((size - 1) / 5) }, (_, k) => (
            <g key={`sep${k}`}>
              <line x1={offX + (k + 1) * 5 * U} y1={0} x2={offX + (k + 1) * 5 * U} y2={H} stroke="var(--ink-soft)" strokeWidth={0.5} opacity={0.4} />
              <line x1={0} y1={offY + (k + 1) * 5 * U} x2={W} y2={offY + (k + 1) * 5 * U} stroke="var(--ink-soft)" strokeWidth={0.5} opacity={0.4} />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        {!submitted ? (
          <>
            <Button full onClick={() => { const ok = !!sol && gridsEqual(grid, sol); sound.feedback(ok, ok ? 'Solved' : 'Not solved'); onAnswer(grid); }}>
              Submit
            </Button>
            {practice && (
              <Button variant="ghost" full onClick={() => setRevealed(true)}>Show solution</Button>
            )}
          </>
        ) : (
          <Button full onClick={() => onAnswer(grid)}>Continue</Button>
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
