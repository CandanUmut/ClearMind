import type { UserState } from '../types';
import { keyToDate } from '../lib/seed';
import { Card } from './ui/Card';

interface Props {
  user: UserState;
  onBack: () => void;
}

const STYLE_LABELS: Record<string, string> = {
  stoic: 'Stoic',
  socratic: 'Socratic',
  gratitude: 'Gratitude',
  'decision-review': 'Decision review',
};

export function Journal({ user, onBack }: Props) {
  const entries = [...user.reflections].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

  return (
    <main className="mx-auto max-w-column px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="text-small text-muted hover:text-ink">← Back</button>
        <h1 className="text-h2 text-ink">Journal</h1>
      </div>

      <p className="mb-4 text-small text-muted">Private to this device. Nothing leaves your browser.</p>

      {entries.length === 0 ? (
        <p className="py-12 text-center text-small text-muted">
          Your saved reflections will appear here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <Card key={e.dateKey}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-small text-muted">
                  {keyToDate(e.dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-small text-muted">
                  {STYLE_LABELS[e.style] ?? e.style}
                </span>
              </div>
              <p className="text-small italic text-muted">{e.prompt}</p>
              <p className="mt-2 text-body text-ink">{e.text}</p>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
