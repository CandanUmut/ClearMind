# ClearMind engine: seed → session → generate → verify

ClearMind has **no backend and no hand-authored question lists as the sole
source**. Every exercise is produced by a **pure parametric generator** from a
deterministic daily seed, and validated by a **verifier/solver**. This is what
makes content effectively infinite and identical for everyone on a given day.

## The pipeline

```
        date (local)                      user per-skill rating
            │                                      │
            ▼                                      ▼
    dailyKey("YYYY-MM-DD")                   difficulty (0..1)
            │                                      │
            ▼                                      │
  masterSeed = "clearmind:<date>"                  │
            │                                      │
            ▼                                      │
  blockSeed = "clearmind:<date>:<moduleId>"        │
            │                                      │
            ▼                                      ▼
        makeRng(blockSeed)  ───────────►  module.generate(rng, difficulty)
                                                   │
                                                   ▼
                              GeneratedExercise { puzzle, solution, options? }
                                                   │
                          ┌────────────────────────┼───────────────────────┐
                          ▼                         ▼                       ▼
                   Component(puzzle)         module.verify(ex, answer)   summarize()
                   (the block UI)            → BlockResult               commit()
```

- **`makeRng`** = `mulberry32(xmur3(seed)())` — a deterministic PRNG. Same seed
  ⇒ same sequence ⇒ same instance, byte-for-byte (`src/lib/rng.ts`).
- **Seeds** are derived in `src/lib/seed.ts`. The master seed depends only on the
  local date; per-block seeds append the module id so blocks are independent but
  reproducible. Difficulty is **not** in the seed — the daily set is identical
  for everyone, but each user sees it at their own difficulty.

## The module contract (`src/engine/registry.ts`)

```ts
interface ExerciseModule<P, A, S> {
  id; title; blurb; category;          // metadata (Explore reads these)
  skillId;                             // rating bucket, or null for input blocks
  evidence;                            // honest "why this works" note
  minDifficulty; maxDifficulty;
  generate(rng, difficulty): { puzzle: P; solution: S; options?: A[] };
  verify(ex, answer: A): BlockResult;
  Component: React.FC<BlockProps<P, A>>;
  commit?(prev, ctx): UserState;       // optional extra persistence
  summarize?(ex, answer, result, summary): void; // optional summary/share line
}
```

Modules **self-register** via `register(module)`. The session builder, the
Explore library, the Stats skill rows, and the Seed Inspector all consume the
registry — so **adding a module is one import in `src/engine/modules/index.ts`
and nothing else in the core**.

## Generator discipline

- Generators are **pure**: `(rng, difficulty)` in, deterministic instance out.
  No `Math.random`, `Date.now`, or `new Date` anywhere under `src/engine` — this
  is enforced by `src/engine/purity.test.ts`.
- Difficulty maps to **explicit parameters**, documented in a comment block at
  the top of each module.
- Generators that can produce an invalid or ambiguous instance run their own
  **solver and reject-and-regenerate** until the instance is valid and uniquely
  solvable. `generateValid()` additionally steps difficulty down and retries if a
  generator throws.

## Verification & uniqueness

- `verify(ex, answer)` returns `{ correct?, ratingSignal, payload? }`.
- For **choice** modules, exactly one option deep-equals `solution`; tested over
  many seeds in `registry.test.ts`.
- For **construction** puzzles (nonogram, sudoku, cryptarithm), a real solver
  confirms a *unique* solution at generation time; uniqueness is covered by each
  module's own test.

## Seeing it live: the Seed Inspector

Append `?debug` to the URL (or set `localStorage['clearmind:debug'] = '1'`). A
🔬 button opens an overlay showing today's date key, master seed, every block's
derived seed and difficulty, and a **sandbox**: pick any module, type any seed +
difficulty, and regenerate — identical inputs always yield identical output,
which is the determinism guarantee made visible.

## Adding a new module (checklist)

1. Create `src/engine/modules/<id>.tsx` exporting a generator, a verifier, and a
   `Component`, then `register(module)`.
2. Add one import line to `src/engine/modules/index.ts`.
3. Write a determinism test (and a uniqueness test if the puzzle is constructed).
4. Done — it appears in the daily rotation (by category), Explore, and Stats
   automatically.
