interface StreakFlameProps {
  count: number;
  label?: string;
}

/** Streak flame in the reward color with the count in tabular mono. */
export function StreakFlame({ count, label = 'day streak' }: StreakFlameProps) {
  return (
    <div className="inline-flex items-center gap-2" title={`${count} ${label}`}>
      <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true">
        <path
          d="M10 1C10 1 4 6 4 12a6 6 0 0 0 12 0c0-2-1-3.5-2-5 0 1.5-1 2.5-2 2.5 0-3-2-6.5-2-8.5Z"
          fill="var(--reward)"
        />
      </svg>
      <span className="tnum text-body font-semibold text-ink">
        {count}
        <span className="ml-1 font-body text-small font-normal text-muted">{label}</span>
      </span>
    </div>
  );
}
