import { useState } from 'react';
import type { EvidenceNote } from '../../engine/registry';

/** Honest "Why this works" disclosure driven by a module's evidence note. */
export function ModuleEvidence({ note }: { note: EvidenceNote }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-sm border border-line bg-surface-2/60 p-3 text-small">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left font-medium text-ink-soft"
      >
        <span>Why this works</span>
        <span aria-hidden className="text-muted">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-ink-soft">
          <p>{note.trains}</p>
          {note.doesNotClaim && <p className="text-muted">{note.doesNotClaim}</p>}
          {note.citation && <p className="italic text-muted">{note.citation}</p>}
        </div>
      )}
    </div>
  );
}
