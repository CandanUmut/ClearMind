import { evidenceNotes, HONEST_PREMISE } from '../content/evidenceNotes';
import type { ModuleId } from '../types';
import { Card } from './ui/Card';

const MODULE_TITLES: Record<ModuleId, string> = {
  mentalMath: 'Mental Math',
  nback: 'N-Back',
  calibration: 'Calibration',
  estimation: 'Estimation',
  intention: 'Daily Intention',
  reflection: 'Reflection',
};

export function About({ onBack }: { onBack: () => void }) {
  return (
    <main className="mx-auto max-w-column px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="text-small text-muted hover:text-ink">← Back</button>
        <h1 className="text-h2 text-ink">The science, honestly</h1>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <p className="text-body text-ink">{HONEST_PREMISE.promise}</p>
        </Card>

        <Card>
          <h2 className="mb-2 text-h3 text-ink">What we don’t claim</h2>
          <p className="text-small text-ink-soft">{HONEST_PREMISE.caveat}</p>
          <p className="mt-3 text-small text-muted">
            Lumosity was fined by the U.S. FTC in 2016 for advertising that its games could
            stave off cognitive decline and boost performance at work and school — claims the
            evidence did not support. We won’t repeat that mistake.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 text-h3 text-ink">What genuinely transfers</h2>
          <p className="text-small text-ink-soft">{HONEST_PREMISE.spotlight}</p>
        </Card>

        <h2 className="mt-2 text-h3 text-ink">Each module, plainly</h2>
        {(Object.keys(MODULE_TITLES) as ModuleId[]).map((id) => {
          const note = evidenceNotes[id];
          return (
            <Card key={id}>
              <h3 className="text-body font-semibold text-ink">{MODULE_TITLES[id]}</h3>
              <p className="mt-1 text-small text-ink-soft">{note.trains}</p>
              <p className="mt-1 text-small text-muted">{note.doesNotClaim}</p>
              <p className="mt-1 text-small italic text-muted">{note.citation}</p>
            </Card>
          );
        })}

        <Card>
          <h2 className="mb-2 text-h3 text-ink">Your privacy</h2>
          <p className="text-small text-ink-soft">
            ClearMind makes no network calls after loading. Everything — streaks, scores,
            journal — lives in your browser’s local storage. No account, no tracking, no ads.
          </p>
        </Card>
      </div>
    </main>
  );
}
