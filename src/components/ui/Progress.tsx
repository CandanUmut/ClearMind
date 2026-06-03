interface ProgressProps {
  value: number; // 0..1
  label?: string;
}

/** A slim horizontal progress bar used between session blocks. */
export function Progress({ value, label }: ProgressProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="w-full" aria-label={label ?? `Progress ${pct}%`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
