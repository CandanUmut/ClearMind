# ClearMind

A **5-minute daily mental-exercise** web app — calibration, estimation, and a daily
intention, instead of scrolling. Built like Wordle: a deterministic daily seed
derived from the date generates the same session for everyone, with no backend.

**Live:** `https://<user>.github.io/ClearMind/`

## The honest premise

Brain-training games produce *near transfer* (you get better at the trained task)
but **no reliable far transfer** — they do **not** raise general intelligence, IQ, or
prevent dementia. ClearMind never claims otherwise. Its honest promise is a short
daily habit of clear thinking and good judgment. The two parts with genuine evidence
of transfer — **calibration** and **implementation intentions** — get the spotlight;
the games are honest warmups. See the in-app **About · The science** page.

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS over a CSS-variable design-token layer
- Framer Motion for purposeful animation
- `localStorage` only — privacy-first, offline-capable, no network calls at runtime
- In-app view-state machine (no router) + `404.html` SPA fallback for GitHub Pages
- PWA: installable, works offline via a hand-rolled service worker

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
npm run test     # vitest (rng determinism, Brier, streaks, generators, session)
```

## Architecture

- `src/lib/` — seeded PRNG (`rng`), daily seed (`seed`), typed storage, adaptive
  rating, Brier/streak scoring, mastery tiers, share text.
- `src/engine/` — a **module registry** (`registry.ts`): every exercise is a pure
  `generate(rng, difficulty)` + a `verify`, self-registering into the registry.
  `session.ts` assembles the daily blocks (with a weekly category rotation) and
  the runner/Explore/Stats all consume the registry — **adding a module touches
  no core code**. `puzzles/` holds solvers (e.g. the nonogram line-solver used to
  guarantee unique solutions). See [`docs/ENGINE.md`](docs/ENGINE.md).
- `src/content/` — curated, verifiable banks (calibration/estimation facts,
  reflection prompts) used as one *supplementary* source; computable generators
  make calibration and estimation infinite and self-verifying.
- `src/components/` — presentational UI; logic lives in `lib/` and `engine/`.

**Modules:** mental math, n-back (warmup); calibration, estimation, intention,
reflection (judgment); pattern matrix, odd-one-out, grid recall (visual); number
sequence, nonogram (logic); word problems (problem). The daily set is identical
for everyone on a date; **difficulty** adapts per user from a per-skill rating.

**Seed Inspector:** append `?debug` to the URL (or tap the version label on the
About page 5×) to open an overlay exposing today's seeds and a sandbox that
regenerates any module from any seed + difficulty — determinism made visible.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes
`dist/` to GitHub Pages. Set the repo's Pages source to **GitHub Actions**.
