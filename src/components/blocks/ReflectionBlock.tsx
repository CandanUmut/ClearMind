import { useState } from 'react';
import type { ReflectionAnswer, ReflectionExercise } from '../../types';
import { Button } from '../ui/Button';
import { EvidenceNote } from '../ui/EvidenceNote';

interface Props {
  exercise: ReflectionExercise;
  onDone: (answer: ReflectionAnswer) => void;
}

const STYLE_LABELS: Record<string, string> = {
  stoic: 'Stoic',
  socratic: 'Socratic',
  gratitude: 'Gratitude',
  'decision-review': 'Decision review',
};

export function ReflectionBlock({ exercise, onDone }: Props) {
  const [text, setText] = useState('');
  const { prompt } = exercise;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-small text-muted">Reflection · {STYLE_LABELS[prompt.style] ?? prompt.style}</p>
        <h2 className="text-h2 text-ink">A moment to think</h2>
      </header>

      <blockquote className="rounded border-l-4 border-accent bg-surface p-5 text-h3 leading-snug text-ink shadow-1">
        {prompt.prompt}
      </blockquote>

      <form
        onSubmit={(e) => { e.preventDefault(); onDone({ text: text.trim() }); }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Optional — just for you, saved privately on this device."
          className="resize-none rounded-sm border border-line bg-surface px-3 py-3 text-body text-ink outline-none focus:border-accent"
        />
        <Button type="submit" full>
          {text.trim() ? 'Save & finish' : 'Finish'}
        </Button>
      </form>

      <EvidenceNote moduleId="reflection" />
    </div>
  );
}
