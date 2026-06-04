import { useMemo, useState } from 'react';
import type { DailySession } from '../types';
import { allModules, generateValid, getModule } from '../engine/registry';
import { blockSeed } from '../lib/seed';
import { makeRng } from '../lib/rng';

interface Props {
  session: DailySession | null;
  dateKey: string;
  onClose: () => void;
}

function pretty(v: unknown): string {
  return JSON.stringify(v, null, 2);
}

/**
 * Dev overlay exposing the seed → session → generate → verify pipeline.
 * Shows today's seeds and lets you regenerate any module from any seed+difficulty
 * to demonstrate determinism. Never in the default UI — gated behind ?debug.
 */
export function SeedInspector({ session, dateKey, onClose }: Props) {
  const modules = useMemo(() => allModules(), []);
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? '');
  const [seed, setSeed] = useState(`clearmind:${dateKey}:${moduleId}`);
  const [difficulty, setDifficulty] = useState(0.5);
  const [tick, setTick] = useState(0);

  const sandbox = useMemo(() => {
    const m = getModule(moduleId);
    if (!m) return null;
    try {
      const ex = generateValid(m, makeRng(seed), difficulty);
      return { ex, m };
    } catch (e) {
      return { error: String(e) } as const;
    }
    // tick forces regeneration on demand (same inputs → identical output proves determinism)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, seed, difficulty, tick]);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/60 p-4" role="dialog" aria-label="Seed Inspector">
      <div className="mx-auto max-w-2xl rounded bg-surface p-5 text-ink shadow-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3">🔬 Seed Inspector</h2>
          <button onClick={onClose} className="text-small text-muted hover:text-ink">Close ✕</button>
        </div>

        {/* Today's session seeds */}
        <section className="mb-5">
          <h3 className="mb-1 text-body font-semibold">Today</h3>
          <p className="tnum text-small text-muted">date key: {dateKey}</p>
          <p className="tnum text-small text-muted">master seed: clearmind:{dateKey}</p>
          {session && (
            <table className="mt-2 w-full text-small">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-1">module</th>
                  <th>difficulty</th>
                  <th>block seed</th>
                </tr>
              </thead>
              <tbody>
                {session.blocks.map((b) => (
                  <tr key={b.moduleId} className="border-t border-line">
                    <td className="py-1">{b.moduleId}</td>
                    <td className="tnum">{b.difficulty.toFixed(2)}</td>
                    <td className="tnum text-muted">{blockSeed(dateKey, b.moduleId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Sandbox */}
        <section>
          <h3 className="mb-2 text-body font-semibold">Sandbox — regenerate any instance</h3>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-small text-muted">
              module
              <select
                value={moduleId}
                onChange={(e) => { setModuleId(e.target.value); setSeed(`clearmind:${dateKey}:${e.target.value}`); }}
                className="mt-1 rounded-sm border border-line bg-surface px-2 py-1 text-ink"
              >
                {modules.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
              </select>
            </label>
            <label className="flex flex-1 flex-col text-small text-muted">
              seed
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="tnum mt-1 rounded-sm border border-line bg-surface px-2 py-1 text-ink"
              />
            </label>
            <label className="flex flex-col text-small text-muted">
              difficulty {difficulty.toFixed(2)}
              <input
                type="range" min={0} max={1} step={0.05} value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="mt-2"
              />
            </label>
            <button onClick={() => setTick((t) => t + 1)} className="rounded-sm bg-accent px-3 py-2 text-small text-white">
              Regenerate
            </button>
          </div>

          {sandbox && 'error' in sandbox ? (
            <p className="mt-3 text-small text-incorrect">Generator error: {sandbox.error}</p>
          ) : sandbox ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-small font-semibold">puzzle</p>
                <pre className="max-h-64 overflow-auto rounded-sm bg-surface-2 p-2 text-[11px] leading-snug">{pretty(sandbox.ex.puzzle)}</pre>
              </div>
              <div>
                <p className="text-small font-semibold">solution {sandbox.ex.options ? '+ options' : ''}</p>
                <pre className="max-h-64 overflow-auto rounded-sm bg-surface-2 p-2 text-[11px] leading-snug">{pretty({ solution: sandbox.ex.solution, options: sandbox.ex.options })}</pre>
              </div>
            </div>
          ) : null}
          <p className="mt-2 text-small text-muted">
            Same module + seed + difficulty always yields byte-identical output — that is the determinism guarantee.
          </p>
        </section>
      </div>
    </div>
  );
}
