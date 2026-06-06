import type { ChallengeLevel, ThemeMode, UserState } from '../types';
import { sound } from '../lib/sound';
import { Card } from './ui/Card';

interface Props {
  user: UserState;
  update: (fn: (prev: UserState) => UserState) => void;
  onBack: () => void;
  onAbout: () => void;
  onResetData: () => void;
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-body text-ink">{label}</p>
        {hint && <p className="text-small text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-sm border border-line p-0.5" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-[9px] px-3 py-1.5 text-small font-medium transition-colors ${
            value === o.value ? 'bg-accent text-white' : 'text-ink-soft hover:bg-surface-2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 rounded-full transition-colors"
      style={{ background: on ? 'var(--accent)' : 'var(--surface-2)', border: '1px solid var(--line)' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-1 transition-all"
        style={{ left: on ? '24px' : '2px' }}
      />
    </button>
  );
}

export function Settings({ user, update, onBack, onAbout, onResetData }: Props) {
  const s = user.settings;
  const set = (patch: Partial<UserState['settings']>) =>
    update((p) => ({ ...p, settings: { ...p.settings, ...patch } }));

  return (
    <main className="mx-auto max-w-column px-5 py-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back" className="text-small text-muted hover:text-ink">← Back</button>
        <h1 className="text-h2 text-ink">Settings</h1>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <h2 className="mb-1 text-small font-semibold uppercase tracking-wide text-muted">Appearance</h2>
          <Row label="Theme">
            <Segmented<ThemeMode>
              value={s.theme}
              options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
              onChange={(theme) => set({ theme })}
            />
          </Row>
          <Row label="Reduced motion" hint="Calm, instant transitions">
            <Toggle on={s.reducedMotion} onChange={(reducedMotion) => set({ reducedMotion })} label="Reduced motion" />
          </Row>
        </Card>

        <Card>
          <h2 className="mb-1 text-small font-semibold uppercase tracking-wide text-muted">Challenge</h2>
          <Row label="Difficulty bias" hint="On top of the level that adapts to you">
            <Segmented<ChallengeLevel>
              value={s.challenge}
              options={[
                { value: 'relaxed', label: 'Relaxed' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'challenging', label: 'Harder' },
              ]}
              onChange={(challenge) => set({ challenge })}
            />
          </Row>
        </Card>

        <Card>
          <h2 className="mb-1 text-small font-semibold uppercase tracking-wide text-muted">Sound</h2>
          <Row label="Chimes" hint="A soft tone on each answer">
            <Toggle on={s.sound} onChange={(v) => { set({ sound: v }); sound.configure({ sound: v, voice: s.voice }); if (v) sound.correct(); }} label="Chimes" />
          </Row>
          <Row label="Spoken feedback" hint="Reads results aloud">
            <Toggle on={s.voice} onChange={(v) => { set({ voice: v }); sound.configure({ sound: s.sound, voice: v }); if (v) sound.say('Voice on'); }} label="Spoken feedback" />
          </Row>
        </Card>

        <Card>
          <h2 className="mb-1 text-small font-semibold uppercase tracking-wide text-muted">About &amp; data</h2>
          <Row label="The science, honestly">
            <button onClick={onAbout} className="text-small font-medium text-accent hover:underline">Open →</button>
          </Row>
          <Row label="Reset this device’s data" hint="Streaks, journal and progress — can’t be undone">
            <button
              onClick={() => { if (window.confirm('Erase all ClearMind data on this device? This cannot be undone.')) onResetData(); }}
              className="text-small font-medium text-incorrect hover:underline"
            >
              Reset
            </button>
          </Row>
        </Card>

        <p className="pb-6 text-center text-small text-muted">ClearMind · everything stays on this device</p>
      </div>
    </main>
  );
}
