import type { BlockResult, RNG } from '../../types';
import { int, pick, shuffle } from '../../lib/rng';
import { register, type ExerciseModule, type GeneratedExercise } from '../registry';
import { CellGlyph, describeCell, SHAPE_KINDS, type CellSpec } from '../../components/svg/Cell';
import { ChoiceBlock } from '../../components/blocks/ChoiceBlock';

// ── Difficulty mapping ───────────────────────────────────────────────────────
//   count of figures: 4 (<0.5) → 6 ; the odd one violates ONE shared feature.
//   Higher difficulty makes the violated feature subtler (rotation/size before
//   kind/shade) and increases the option count.
// ─────────────────────────────────────────────────────────────────────────────

interface OddPuzzle {
  figures: CellSpec[];
}

const SIZES = [0.7, 1.0];
const ROTATIONS = [0, 90, 180, 270];

export function generateOddOneOut(
  rng: RNG,
  difficulty: number,
): GeneratedExercise<OddPuzzle, number, number> {
  const n = difficulty < 0.5 ? 4 : 6;

  // A shared template all-but-one figure conform to.
  const template: CellSpec = {
    kind: pick(rng, SHAPE_KINDS),
    count: int(rng, 1, 3),
    rotation: pick(rng, ROTATIONS),
    shade: pick(rng, [0, 1, 2] as const),
    size: pick(rng, SIZES),
  };

  // The dimension the odd one violates; subtler ones appear at high difficulty.
  const subtle = ['rotation', 'size'] as const;
  const obvious = ['kind', 'count', 'shade'] as const;
  const dim = difficulty > 0.6 ? pick(rng, subtle) : pick(rng, [...subtle, ...obvious]);

  const odd: CellSpec = { ...template };
  switch (dim) {
    case 'kind': odd.kind = pick(rng, SHAPE_KINDS.filter((k) => k !== template.kind)); break;
    case 'count': odd.count = pick(rng, [1, 2, 3].filter((c) => c !== template.count)); break;
    case 'shade': odd.shade = pick(rng, ([0, 1, 2] as const).filter((s) => s !== template.shade)); break;
    case 'rotation': odd.rotation = pick(rng, ROTATIONS.filter((r) => r !== template.rotation)); break;
    case 'size': odd.size = pick(rng, SIZES.filter((s) => s !== template.size)); break;
  }

  // Build figures: n-1 conform, 1 is odd, then shuffle and record the odd index.
  const figures: CellSpec[] = Array.from({ length: n - 1 }, () => ({ ...template }));
  figures.push(odd);
  const order = shuffle(rng, figures.map((_, i) => i));
  const shuffled = order.map((i) => figures[i]);
  const oddIndex = order.indexOf(n - 1);

  // options are the figure indices; solution is the odd index.
  return { puzzle: { figures: shuffled }, solution: oddIndex, options: shuffled.map((_, i) => i) };
}

function verify(
  ex: GeneratedExercise<OddPuzzle, number, number>,
  answer: number,
): BlockResult {
  const correct = answer === ex.solution;
  return { correct, ratingSignal: correct ? 1 : 0, payload: { correct } };
}

export const oddOneOut: ExerciseModule<OddPuzzle, number, number> = {
  id: 'oddOneOut',
  title: 'Odd One Out',
  blurb: 'All but one figure share a feature. Tap the one that breaks it.',
  category: 'visual',
  skillId: 'oddOneOut',
  evidence: {
    trains: 'Trains feature discrimination — noticing which attribute (shape, count, rotation, fill) sets one item apart.',
    doesNotClaim: 'Resembles visual reasoning items; expect to improve at this task. No IQ or general-intelligence claims.',
    citation: 'Perceptual discrimination shows task-specific learning. (Goldstone, 1998.)',
  },
  estimateSeconds: 45,
  minDifficulty: 0,
  maxDifficulty: 1,
  generate: generateOddOneOut,
  verify,
  Component: ({ puzzle, options, solution, onAnswer, reducedMotion }) => {
    const figs = (puzzle as OddPuzzle).figures;
    return (
      <ChoiceBlock<number>
        category="Visual reasoning"
        title="Which one doesn’t belong?"
        prompt={<p className="text-center text-small text-muted">Find the figure that breaks the shared pattern.</p>}
        ariaDescription={`${figs.length} figures. ${figs
          .map((f, i) => `figure ${i + 1}: ${describeCell(f)}`)
          .join('. ')}. Tap the one that differs from the rest.`}
        options={options ?? []}
        renderOption={(i) => <CellGlyph spec={figs[i]} px={64} />}
        optionLabel={(i) => `Figure ${i + 1}: ${describeCell(figs[i])}`}
        solution={solution as number}
        onAnswer={onAnswer}
        reducedMotion={reducedMotion}
        evidence={oddOneOut.evidence}
        columns={figs.length > 4 ? 3 : 2}
      />
    );
  },
  summarize: (_ex, _answer, result, summary) => {
    summary.blocks.push({
      moduleId: 'oddOneOut',
      title: 'Odd one out',
      category: 'visual',
      label: result.correct ? 'solved' : 'missed',
      glyphs: result.correct ? '🟩' : '⬜',
      correct: result.correct,
    });
  },
};

register(oddOneOut);
