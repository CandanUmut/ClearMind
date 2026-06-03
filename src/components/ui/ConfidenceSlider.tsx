interface ConfidenceSliderProps {
  value: number; // 50..100
  onChange: (v: number) => void;
  disabled?: boolean;
}

/**
 * Confidence slider 50%→100%. The fill warms from --info toward --reward as
 * confidence rises; the live % reads in tabular mono.
 */
export function ConfidenceSlider({ value, onChange, disabled }: ConfidenceSliderProps) {
  // Map 50..100 to 0..1 for the fill width and color mix.
  const t = (value - 50) / 50;
  const pct = Math.round(t * 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-small text-muted">How sure are you?</span>
        <span className="tnum text-h3 font-semibold text-ink">{value}%</span>
      </div>
      <div className="relative">
        {/* Track + fill */}
        <div className="pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, var(--info), color-mix(in srgb, var(--info) ${100 - pct}%, var(--reward) ${pct}%))`,
            }}
          />
        </div>
        <input
          type="range"
          min={50}
          max={100}
          step={5}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Confidence percentage"
          aria-valuetext={`${value} percent`}
          className="relative z-10 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent
            [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-1
            [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-surface"
        />
      </div>
      <div className="mt-1 flex justify-between text-small text-muted">
        <span>50% · a guess</span>
        <span>100% · certain</span>
      </div>
    </div>
  );
}
