import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CellGlyph, describeCell, type CellSpec } from './Cell';

const spec: CellSpec = { kind: 'triangle', count: 2, rotation: 90, shade: 2, size: 1 };

describe('CellGlyph SVG primitive', () => {
  it('renders an svg with the right number of shapes', () => {
    const html = renderToStaticMarkup(<CellGlyph spec={spec} px={80} />);
    expect(html).toContain('<svg');
    // count=2 triangles → two <path> elements (plus the hatch <line> only when shaded 1)
    expect((html.match(/<path/g) ?? []).length).toBe(2);
  });

  it('uses a circle element for circle kind', () => {
    const html = renderToStaticMarkup(<CellGlyph spec={{ ...spec, kind: 'circle' }} px={64} />);
    expect((html.match(/<circle/g) ?? []).length).toBe(2);
  });

  it('describeCell gives a non-color, screen-reader-friendly description', () => {
    expect(describeCell(spec)).toBe('2 solid triangles, rotated 90°, large');
  });
});
