'use client';

import { MissionPhase } from '@/lib/types';
import { CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface MissionTimelineProps {
  phases: MissionPhase[];
  compact?: boolean;
}

export function MissionTimeline({ phases, compact }: MissionTimelineProps) {

  if (compact) {
    return (
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-2">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex items-center">
            <div
              className={clsx(
                'relative flex flex-col items-center gap-1 px-2',
                phase.isCurrent && 'text-orbit-blue',
                phase.isCompleted && 'text-emerald-400',
                phase.isFuture && 'text-orbit-dim'
              )}
            >
              <div
                className={clsx(
                  'w-4 h-4 rounded-full border flex items-center justify-center text-[8px]',
                  phase.isCompleted ? 'border-emerald-400/60 bg-emerald-400/10' :
                  phase.isCurrent  ? 'border-orbit-blue bg-orbit-blue/20' :
                  'border-space-border bg-space-deep'
                )}
              >
                {phase.isCompleted ? '✓' : phase.isCurrent ? '●' : ''}
              </div>
              <div className="text-[9px] tracking-wider whitespace-nowrap text-center leading-tight max-w-[70px]">
                {phase.name.split(' ').slice(0, 2).join(' ')}
              </div>
            </div>
            {idx < phases.length - 1 && (
              <div className={clsx(
                'w-6 h-px shrink-0',
                phases[idx + 1].isCompleted || phases[idx + 1].isCurrent ? 'bg-emerald-400/40' : 'bg-space-border'
              )} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-0">
        {phases.map((phase, idx) => (
          <div key={phase.id} className="flex gap-4">
            {/* Connector column */}
            <div className="flex flex-col items-center w-8 shrink-0">
              {/* Node */}
              <div
                className={clsx(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 shrink-0',
                  phase.isCompleted
                    ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-400'
                    : phase.isCurrent
                    ? 'border-orbit-blue bg-orbit-blue/20 text-orbit-blue shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'border-space-border bg-space-deep text-orbit-dim/40'
                )}
              >
                {phase.isCompleted ? (
                  <CheckCircle size={14} />
                ) : phase.isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-orbit-blue animate-pulse" />
                ) : (
                  <Clock size={12} />
                )}
              </div>
              {/* Line */}
              {idx < phases.length - 1 && (
                <div
                  className={clsx(
                    'w-px flex-1 min-h-[24px] mt-1',
                    phases[idx + 1].isCompleted || phases[idx + 1].isCurrent
                      ? 'bg-emerald-400/30'
                      : 'bg-space-border'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div
              className={clsx(
                'pb-6 flex-1',
                phase.isCurrent && 'text-orbit-white',
                phase.isCompleted && 'text-orbit-dim',
                phase.isFuture && 'text-orbit-dim/60'
              )}
            >
              <div className="flex items-start gap-2 pt-1">
                <div>
                  <div className={clsx(
                    'text-sm font-medium',
                    phase.isCompleted ? 'text-orbit-dim' :
                    phase.isCurrent  ? 'text-orbit-white' :
                    'text-orbit-dim/60'
                  )}>
                    {phase.name}
                  </div>
                  {phase.description && (
                    <div className="text-[11px] text-orbit-dim/70 mt-0.5 leading-relaxed">
                      {phase.description}
                    </div>
                  )}
                  {(phase.startDate || phase.endDate) && (
                    <div className="text-[10px] text-orbit-dim/50 mt-1 font-mono">
                      {phase.startDate && <span>{phase.startDate}</span>}
                      {phase.startDate && phase.endDate && <span> → </span>}
                      {phase.endDate && <span>{phase.endDate}</span>}
                    </div>
                  )}
                </div>
                {phase.isCurrent && (
                  <span className="ml-auto shrink-0 text-[9px] text-orbit-blue tracking-widest border border-orbit-blue/30 px-2 py-0.5 rounded-full">
                    CURRENT
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
