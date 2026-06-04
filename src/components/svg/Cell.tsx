import { useId } from 'react';

// Shared visual primitives for the visual/spatial module pack. Meaning is never
// encoded by color alone: shapes differ by *form*, fills differ by *texture*
// (outline / hatch / solid), and every puzzle ships a text description too.

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon';
export const SHAPE_KINDS: ShapeKind[] = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];

export interface CellSpec {
  kind: ShapeKind;
  count: number; // 1..3
  rotation: number; // degrees
  shade: 0 | 1 | 2; // outline / hatch / solid
  size: number; // 0.6..1.0 scale
}

export const SHADE_NAMES = ['outline', 'hatched', 'solid'] as const;

export function describeCell(c: CellSpec): string {
  const plural = c.count > 1 ? 's' : '';
  const rot = c.rotation % 360;
  return `${c.count} ${SHADE_NAMES[c.shade]} ${c.kind}${plural}${rot ? `, rotated ${rot}°` : ''}, ${c.size < 0.85 ? 'small' : 'large'}`;
}

function shapePath(kind: ShapeKind, r: number): string {
  switch (kind) {
    case 'circle':
      return ''; // drawn as <circle>
    case 'square':
      return `M${-r},${-r} H${r} V${r} H${-r} Z`;
    case 'triangle':
      return `M0,${-r} L${r},${r} L${-r},${r} Z`;
    case 'diamond':
      return `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`;
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
      });
      return `M${pts.join(' L')} Z`;
    }
  }
}

/** Render a single cell spec into an inline SVG of `px` pixels. */
export function CellGlyph({ spec, px = 80 }: { spec: CellSpec; px?: number }) {
  const hatchId = useId();
  const baseR = 13 * spec.size;
  const fill =
    spec.shade === 0 ? 'none' : spec.shade === 1 ? `url(#${hatchId})` : 'var(--accent)';
  const stroke = spec.shade === 2 ? 'var(--accent)' : 'var(--ink)';

  // Lay out `count` shapes evenly across the width.
  const slots = Array.from({ length: spec.count }, (_, i) => {
    const span = px * 0.66;
    const x = px / 2 + (spec.count === 1 ? 0 : (i - (spec.count - 1) / 2) * (span / spec.count));
    return x;
  });

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      style={{ maxWidth: '100%', height: 'auto' }}
      aria-hidden
    >
      <defs>
        <pattern id={hatchId} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--ink)" strokeWidth="1.5" />
        </pattern>
      </defs>
      {slots.map((x, i) => (
        <g key={i} transform={`translate(${x}, ${px / 2}) rotate(${spec.rotation})`}>
          {spec.kind === 'circle' ? (
            <circle cx={0} cy={0} r={baseR} fill={fill} stroke={stroke} strokeWidth={2} />
          ) : (
            <path d={shapePath(spec.kind, baseR)} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
          )}
        </g>
      ))}
    </svg>
  );
}
