import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import './modules';
import { allModules } from './registry';
import { makeRng } from '../lib/rng';

// Smoke test: every module's block component must render without throwing for a
// freshly generated instance. Catches runtime crashes (e.g. SVG layout, bad
// option access) that type-checking alone won't surface.

describe('module components render', () => {
  const modules = allModules();

  it.each(modules.map((m) => [m.id, m] as const))('%s renders', (_id, m) => {
    const ex = m.generate(makeRng(`render:${m.id}`), 0.5);
    const Comp = m.Component;
    const html = renderToStaticMarkup(
      <Comp
        puzzle={ex.puzzle}
        options={ex.options}
        solution={ex.solution}
        onAnswer={() => {}}
        practice={false}
        reducedMotion
      />,
    );
    expect(html.length).toBeGreaterThan(0);
  });
});
