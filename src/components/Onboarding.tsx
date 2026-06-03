import { useState } from 'react';
import { motion } from 'framer-motion';
import { HONEST_PREMISE } from '../content/evidenceNotes';
import { Button } from './ui/Button';

interface Props {
  onDone: () => void;
}

const SCREENS = [
  {
    title: 'Five minutes of clear thinking',
    body: HONEST_PREMISE.promise + ' One short session a day — then you’re done.',
  },
  {
    title: 'Honest about the science',
    body: HONEST_PREMISE.caveat,
  },
  {
    title: 'The parts that matter',
    body: HONEST_PREMISE.spotlight,
  },
];

export function Onboarding({ onDone }: Props) {
  const [i, setI] = useState(0);
  const last = i === SCREENS.length - 1;
  const screen = SCREENS[i];

  return (
    <main className="mx-auto flex min-h-dvh max-w-column flex-col justify-between px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-small text-accent">ClearMind</p>
          <h1 className="mt-3 text-h1 text-ink">{screen.title}</h1>
          <p className="mt-4 text-body text-ink-soft">{screen.body}</p>
        </motion.div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-2" aria-hidden>
          {SCREENS.map((_, idx) => (
            <span
              key={idx}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: idx === i ? 20 : 8,
                background: idx === i ? 'var(--accent)' : 'var(--line)',
              }}
            />
          ))}
        </div>
        <Button full onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? 'Begin' : 'Next'}
        </Button>
        {!last && (
          <button onClick={onDone} className="text-center text-small text-muted hover:text-ink">
            Skip
          </button>
        )}
      </div>
    </main>
  );
}
