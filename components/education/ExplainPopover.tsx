'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { getConcept } from '@/lib/education/concepts';
import clsx from 'clsx';

interface ExplainPopoverProps {
  conceptId: string;
  className?: string;
}

/** Small inline "What does this mean?" affordance — same interaction pattern as DataProvenance. */
export function ExplainPopover({ conceptId, className }: ExplainPopoverProps) {
  const [open, setOpen] = useState(false);
  const concept = getConcept(conceptId);
  if (!concept) return null;

  return (
    <span className={clsx('relative inline-flex', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[11px] text-orbit-blue/80 hover:text-orbit-blue"
      >
        <HelpCircle size={11} />
        What does this mean?
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-72 glass rounded-lg p-3 shadow-2xl border border-space-border animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="text-[12px] font-semibold text-orbit-white">{concept.title}</div>
            <button onClick={() => setOpen(false)}>
              <X size={11} className="text-orbit-dim hover:text-orbit-white" />
            </button>
          </div>
          <p className="text-[11px] text-orbit-dim leading-relaxed">{concept.short}</p>
        </div>
      )}
    </span>
  );
}
