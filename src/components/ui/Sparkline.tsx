interface Props {
  values: number[];
  min?: number;
  max?: number;
  width?: number;
  height?: number;
}

/** A tiny inline trend line. Empty/short series render a flat baseline. */
export function Sparkline({ values, min = 0, max = 1, width = 120, height = 32 }: Props) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="var(--line)" strokeWidth={2} />
      </svg>
    );
  }
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((Math.max(min, Math.min(max, v)) - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
