import { calibrationCurve } from '../../lib/scoring';

interface Props {
  points: { confidence: number; correct: boolean }[];
  size?: number;
}

/**
 * Reliability diagram: predicted confidence (x) vs observed accuracy (y).
 * The diagonal is perfect calibration; dots above mean under-confidence, below
 * mean over-confidence. Dot area scales with sample count.
 */
export function ReliabilityDiagram({ points, size = 240 }: Props) {
  const pad = 28;
  const inner = size - pad * 2;
  const curve = calibrationCurve(points).filter((c) => c.count > 0);
  const maxCount = Math.max(1, ...curve.map((c) => c.count));

  const x = (v: number) => pad + ((v - 0.5) / 0.5) * inner;
  const y = (v: number) => pad + (1 - v) * inner;

  return (
    <svg width={size} height={size} role="img" aria-label="Calibration reliability diagram">
      {/* Frame */}
      <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke="var(--line)" />
      {/* Perfect-calibration diagonal */}
      <line x1={x(0.5)} y1={y(0.5)} x2={x(1)} y2={y(1)} stroke="var(--muted)" strokeDasharray="4 4" />
      {/* Axis labels */}
      <text x={pad} y={size - 6} fontSize="10" fill="var(--muted)">50%</text>
      <text x={size - pad - 18} y={size - 6} fontSize="10" fill="var(--muted)">100%</text>
      <text x={2} y={pad + 8} fontSize="10" fill="var(--muted)">100%</text>
      <text x={2} y={size - pad} fontSize="10" fill="var(--muted)">0%</text>
      {/* Observed points */}
      {curve.map((c, i) => (
        <circle
          key={i}
          cx={x(c.predicted)}
          cy={y(c.observed)}
          r={4 + (c.count / maxCount) * 7}
          fill="color-mix(in srgb, var(--accent) 70%, transparent)"
          stroke="var(--accent)"
        />
      ))}
    </svg>
  );
}
