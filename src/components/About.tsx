import { useState } from 'react';
import { HONEST_PREMISE } from '../content/evidenceNotes';
import { allModules, type ModuleCategory } from '../engine/registry';
import '../engine/modules';
import { Card } from './ui/Card';

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  warmup: 'Warmups',
  judgment: 'Judgment (the parts that transfer)',
  visual: 'Visual & spatial',
  logic: 'Logic & puzzles',
  problem: 'Problem solving',
};
const ORDER: ModuleCategory[] = ['judgment', 'warmup', 'visual', 'logic', 'problem'];

export function About({ onBack }: { onBack: () => void }) {
  const modules = allModules();
  const [taps, setTaps] = useState(0);

  function tapVersion() {
    const n = taps + 1;
    setTaps(n);
    if (n >= 5) {
      window.localStorage.setItem('clearmind:debug', '1');
      // eslint-disable-next-line no-alert
      alert('Seed Inspector enabled. Reload to see the 🔬 button.');
    }
  }

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
            evidence did not support. We won’t repeat that mistake. Several modules here
            (pattern matrices, mental rotation, sequences) resemble IQ-test items; expect to get
            better at <em>those puzzles</em> — that is near transfer, not a rise in general intelligence.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 text-h3 text-ink">What genuinely transfers</h2>
          <p className="text-small text-ink-soft">{HONEST_PREMISE.spotlight}</p>
        </Card>

        <h2 className="mt-2 text-h3 text-ink">Every module, plainly</h2>
        {ORDER.map((cat) => {
          const inCat = modules.filter((m) => m.category === cat);
          if (!inCat.length) return null;
          return (
            <div key={cat} className="flex flex-col gap-3">
              <h3 className="text-body font-semibold text-accent-ink">{CATEGORY_LABELS[cat]}</h3>
              {inCat.map((m) => (
                <Card key={m.id}>
                  <h4 className="text-body font-semibold text-ink">{m.title}</h4>
                  <p className="mt-1 text-small text-ink-soft">{m.evidence.trains}</p>
                  {m.evidence.doesNotClaim && (
                    <p className="mt-1 text-small text-muted">{m.evidence.doesNotClaim}</p>
                  )}
                  {m.evidence.citation && (
                    <p className="mt-1 text-small italic text-muted">{m.evidence.citation}</p>
                  )}
                </Card>
              ))}
            </div>
          );
        })}

        <Card>
          <h2 className="mb-2 text-h3 text-ink">Infinite by design</h2>
          <p className="text-small text-ink-soft">
            Every exercise is generated procedurally from a daily seed and checked by its own
            verifier — so content never runs out and the day’s set is identical for everyone.
            Difficulty adapts to you. (See <code>docs/ENGINE.md</code>.)
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 text-h3 text-ink">Your privacy</h2>
          <p className="text-small text-ink-soft">
            ClearMind makes no network calls after loading. Everything — streaks, scores,
            journal — lives in your browser’s local storage. No account, no tracking, no ads.
          </p>
        </Card>

        <button onClick={tapVersion} className="py-4 text-center text-small text-muted">
          ClearMind v0.2 · tap to inspect the engine
        </button>
      </div>
    </main>
  );
}
