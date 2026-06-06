import { dailyKey, keyToDate } from '../../lib/seed';

interface Props {
  /** Set of completed date keys (YYYY-MM-DD). */
  completed: Set<string>;
  weeks?: number;
}

/**
 * A GitHub-style activity heatmap of completed days — a quietly motivating view
 * of consistency. Columns are weeks (Sun→Sat rows), most recent on the right.
 */
export function Heatmap({ completed, weeks = 16 }: Props) {
  const today = new Date();
  const todayKey = dailyKey(today);
  // Start from the Sunday `weeks-1` weeks ago.
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

  const cols: { key: string; done: boolean; future: boolean; label: string }[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: { key: string; done: boolean; future: boolean; label: string }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = dailyKey(date);
      col.push({
        key,
        done: completed.has(key),
        future: key > todayKey,
        label: keyToDate(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
    }
    cols.push(col);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" role="img" aria-label={`Activity over the last ${weeks} weeks: ${completed.size} days completed`}>
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.label}${cell.done ? ' · done' : ''}`}
                className="h-3.5 w-3.5 rounded-[3px]"
                style={{
                  background: cell.future
                    ? 'transparent'
                    : cell.done
                      ? 'var(--accent)'
                      : 'var(--surface-2)',
                  border: cell.future ? 'none' : '1px solid var(--line)',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
