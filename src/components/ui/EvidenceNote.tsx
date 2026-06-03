import { useState } from 'react';
import type { ModuleId } from '../../types';
import { evidenceNotes } from '../../content/evidenceNotes';

/** Honest "Why this works" disclosure shown on every module. */
export function EvidenceNote({ moduleId }: { moduleId: ModuleId }) {
  const [open, setOpen] = useState(false);
  const note = evidenceNotes[moduleId];
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
          <p className="text-muted">{note.doesNotClaim}</p>
          <p className="text-muted italic">{note.citation}</p>
        </div>
      )}
    </div>
  );
}
