import type { UserState } from '../types';
import { allModules, type ModuleCategory } from '../engine/registry';
import '../engine/modules';
import { masteryTier, tierProgress } from '../lib/mastery';
import { Card } from './ui/Card';
import { Ring } from './ui/Ring';

interface Props {
  user: UserState;
  onBack: () => void;
  onPractice: (moduleId: string) => void;
}

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  warmup: 'Warmups',
  judgment: 'Judgment',
  visual: 'Visual & spatial',
  logic: 'Logic & puzzles',
  problem: 'Problem solving',
};
const CATEGORY_ORDER: ModuleCategory[] = ['warmup', 'judgment', 'visual', 'logic', 'problem'];

export function Explore({ user, onBack, onPractice }: Props) {
  const modules = allModules();

  return (
    <main className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-2 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back home" className="text-small text-muted hover:text-ink">← Home</button>
        <h1 className="text-h2 text-ink">Explore</h1>
      </div>
      <p className="mb-6 text-small text-muted">
        Every exercise is generated fresh from a seed — practice any of them endlessly, unscored.
        New modules appear here automatically.
      </p>

      <div className="flex flex-col gap-6">
        {CATEGORY_ORDER.map((cat) => {
          const inCat = modules.filter((m) => m.category === cat);
          if (inCat.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="mb-3 text-h3 text-ink">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {inCat.map((m) => {
                  const rating = m.skillId ? user.ratings[m.skillId] ?? 0.4 : null;
                  return (
                    <Card key={m.id} interactive className="flex items-center gap-4">
                      {rating !== null ? (
                        <Ring value={tierProgress(rating)} size={52} stroke={5}>
                          <span className="text-[10px] text-muted">{Math.round(rating * 100)}</span>
                        </Ring>
                      ) : (
                        <div className="grid h-[52px] w-[52px] place-items-center text-h3" aria-hidden>✎</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-body font-semibold text-ink">{m.title}</h3>
                          {rating !== null && (
                            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-small text-muted">
                              {masteryTier(rating)}
                            </span>
                          )}
                        </div>
                        <p className="text-small text-muted">{m.blurb}</p>
                        <button
                          onClick={() => onPractice(m.id)}
                          className="mt-2 text-small font-medium text-accent hover:underline"
                        >
                          Practice →
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
