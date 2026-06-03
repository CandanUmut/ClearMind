# ClearMind

A **5-minute daily mental-exercise** web app — calibration, estimation, and a daily
intention, instead of scrolling. Built like Wordle: a deterministic daily seed
derived from the date generates the same session for everyone, with no backend.

**Live:** `https://<user>.github.io/clearmind/`

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
  rating, Brier/streak scoring, share text.
- `src/engine/` — `session.ts` assembles the daily blocks; `modules/` holds each
  exercise generator + scorer behind a single `ExerciseModule` contract.
- `src/content/` — curated, verifiable seed banks (calibration facts, estimation
  facts, reflection prompts) plus the honest evidence notes.
- `src/components/` — presentational UI; logic lives in `lib/` and `engine/`.

The daily set is identical for everyone on a date; **difficulty** adapts per user
from a per-skill rating, keeping you near your edge.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes
`dist/` to GitHub Pages. Set the repo's Pages source to **GitHub Actions**.
