import type { BlockResult, RNG } from '../../types';
import { int, pick, shuffle } from '../../lib/rng';
import { register, type ExerciseModule, type GeneratedExercise } from '../registry';
import { CellGlyph, describeCell, SHAPE_KINDS, type CellSpec } from '../../components/svg/Cell';
import { ChoiceBlock } from '../../components/blocks/ChoiceBlock';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   number of simultaneous rules: 1 (<0.34) → 2 (<0.67) → 3
//   distractors are near-misses (perturb exactly one attribute) so exactly one
//   option is fully rule-consistent.
// ─────────────────────────────────────────────────────────────────────────────

const SIZES = [0.7, 0.85, 1.0];
const ROTATIONS = [0, 90, 180, 270];

type Rule = (base: CellSpec, row: number, col: number) => Partial<CellSpec>;

const RULES: Record<string, Rule> = {
  countByCol: (b, _r, c) => ({ count: Math.min(3, Math.max(1, b.count + c)) }),
  rotateByRow: (b, r) => ({ rotation: (b.rotation + 90 * r) % 360 }),
  shadeByCol: (b, _r, c) => ({ shade: (((b.shade + c) % 3) as 0 | 1 | 2) }),
  sizeByRow: (_b, r) => ({ size: SIZES[r] }),
  kindByRow: (b, r) => {
    const start = SHAPE_KINDS.indexOf(b.kind);
    return { kind: SHAPE_KINDS[(start + r) % 3] };
  },
};

interface MatrixPuzzle {
  grid: (CellSpec | null)[][]; // [2][2] is null (the missing cell)
}

function applyRules(base: CellSpec, rules: Rule[], r: number, c: number): CellSpec {
  let cell: CellSpec = { ...base };
  for (const rule of rules) cell = { ...cell, ...rule(cell, r, c) };
  return cell;
}

function makeNearMiss(rng: RNG, correct: CellSpec): CellSpec {
  const attr = pick(rng, ['count', 'rotation', 'shade', 'size', 'kind'] as const);
  const m: CellSpec = { ...correct };
  switch (attr) {
    case 'count':
      m.count = pick(rng, [1, 2, 3].filter((x) => x !== correct.count));
      break;
    case 'rotation':
      m.rotation = pick(rng, ROTATIONS.filter((x) => x !== correct.rotation));
      break;
    case 'shade':
      m.shade = pick(rng, ([0, 1, 2] as const).filter((x) => x !== correct.shade));
      break;
    case 'size':
      m.size = pick(rng, SIZES.filter((x) => x !== correct.size));
      break;
    case 'kind':
      m.kind = pick(rng, SHAPE_KINDS.filter((x) => x !== correct.kind));
      break;
  }
  return m;
}

export function generatePatternMatrix(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<MatrixPuzzle, CellSpec, CellSpec> {
  const nRules = difficulty < 0.34 ? 1 : difficulty < 0.67 ? 2 : 3;
  const ruleNames = shuffle(rng, Object.keys(RULES)).slice(0, nRules);
  const rules = ruleNames.map((n) => RULES[n]);

  const base: CellSpec = {
    kind: pick(rng, SHAPE_KINDS.slice(0, 3)),
    count: int(rng, 1, 2),
    rotation: 0,
    shade: pick(rng, [0, 1, 2] as const),
    size: SIZES[0],
  };

  const grid: (CellSpec | null)[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: (CellSpec | null)[] = [];
    for (let c = 0; c < 3; c++) row.push(applyRules(base, rules, r, c));
    grid.push(row);
  }
  const correct = grid[2][2] as CellSpec;
  grid[2][2] = null;

  // Five distinct near-misses, none equal to the correct cell.
  const seen = new Set([JSON.stringify(correct)]);
  const distractors: CellSpec[] = [];
  let guard = 0;
  while (distractors.length < 5 && guard++ < 200) {
    const d = makeNearMiss(rng, correct);
    const key = JSON.stringify(d);
    if (!seen.has(key)) {
      seen.add(key);
      distractors.push(d);
    }
  }
  // If degenerate (couldn't find 5), throw so generateValid retries at lower difficulty.
  if (distractors.length < 5) throw new Error('patternMatrix: insufficient distractors');

  const options = shuffle(rng, [correct, ...distractors]);
  return { puzzle: { grid }, solution: correct, options };
}

function verify(
  ex: GeneratedExercise<MatrixPuzzle, CellSpec, CellSpec>,
  answer: CellSpec,
): BlockResult {
  const correct = JSON.stringify(answer) === JSON.stringify(ex.solution);
  return { correct, ratingSignal: correct ? 1 : 0, payload: { correct } };
}

function MatrixPrompt({ grid }: MatrixPuzzle) {
  return (
    <div className="mx-auto grid w-fit grid-cols-3 gap-2 rounded border border-line bg-surface p-3 shadow-1">
      {grid.flat().map((cell, i) => (
        <div key={i} className="flex h-[80px] w-[80px] items-center justify-center rounded-sm bg-surface-2/40">
          {cell ? <CellGlyph spec={cell} /> : <span className="text-display text-muted">?</span>}
        </div>
      ))}
    </div>
  );
}

export const patternMatrix: ExerciseModule<MatrixPuzzle, CellSpec, CellSpec> = {
  id: 'patternMatrix',
  title: 'Pattern Matrix',
  blurb: 'Find the rule across rows and columns; complete the 3×3 grid.',
  category: 'visual',
  skillId: 'patternMatrix',
  evidence: {
    trains: 'Trains rule-induction over visual patterns — spotting how features change across rows and columns.',
    doesNotClaim:
      'These resemble fluid-reasoning (IQ-style) items. Expect to get better at these puzzles; we make no claim about raising IQ or general intelligence.',
    citation: 'Practice improves matrix-puzzle performance specifically, with limited transfer. (te Nijenhuis et al., 2007.)',
  },
  estimateSeconds: 60,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generatePatternMatrix,
  verify,
  Component: ({ puzzle, options, solution, onAnswer, reducedMotion }) => (
    <ChoiceBlock<CellSpec>
      category="Visual reasoning"
      title="Complete the pattern"
      prompt={<MatrixPrompt grid={(puzzle as MatrixPuzzle).grid} />}
      ariaDescription={`A 3 by 3 grid of shapes with the bottom-right missing. ${(puzzle as MatrixPuzzle).grid
        .flat()
        .map((c, i) => (c ? `cell ${i + 1}: ${describeCell(c)}` : 'cell 9: missing'))
        .join('. ')}. Choose the option that completes the pattern.`}
      options={options ?? []}
      renderOption={(opt) => <CellGlyph spec={opt} px={64} />}
      optionLabel={(opt) => describeCell(opt)}
      solution={solution as CellSpec}
      onAnswer={onAnswer}
      reducedMotion={reducedMotion}
      evidence={patternMatrix.evidence}
      columns={3}
    />
  ),
  summarize: (_ex, _answer, result, summary) => {
    summary.blocks.push({
      moduleId: 'patternMatrix',
      title: 'Pattern',
      category: 'visual',
      label: result.correct ? 'solved' : 'missed',
      glyphs: result.correct ? '🟩' : '⬜',
      correct: result.correct,
    });
  },
};

register(patternMatrix);
