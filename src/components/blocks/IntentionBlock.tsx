import { useState } from 'react';
import type { IntentionAnswer, IntentionExercise } from '../../types';
import { Button } from '../ui/Button';
import { EvidenceNote } from '../ui/EvidenceNote';

interface Props {
  exercise: IntentionExercise;
  onDone: (answer: IntentionAnswer) => void;
}

export function IntentionBlock({ exercise, onDone }: Props) {
  const [what, setWhat] = useState('');
  const [when, setWhen] = useState('');

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small text-muted">Today’s intention</p>
        <h2 className="text-h2 text-ink">One thing that matters</h2>
      </header>

      <p className="text-body text-ink-soft">{exercise.framing}</p>

      <form
        onSubmit={(e) => { e.preventDefault(); onDone({ what: what.trim(), when: when.trim() }); }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-1 text-small text-muted">
          The one thing that matters today is…
          <textarea
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            rows={2}
            placeholder="e.g. finish the first draft"
            className="resize-none rounded-sm border border-line bg-surface px-3 py-3 text-body text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-small text-muted">
          I will do it at / when…
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            placeholder="e.g. right after lunch, at my desk"
            className="rounded-sm border border-line bg-surface px-3 py-3 text-body text-ink outline-none focus:border-accent"
          />
        </label>
        <Button type="submit" full>
          {what.trim() ? 'Set my intention' : 'Skip for today'}
        </Button>
      </form>

      <EvidenceNote moduleId="intention" />
    </div>
  );
}
