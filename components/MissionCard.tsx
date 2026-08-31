'use client';

import Link from 'next/link';
import { Mission } from '@/lib/types';
import { ArrowRight, Satellite, Globe, Moon } from 'lucide-react';
import { useState } from 'react';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; text: string }> = {
  active:               { dot: 'bg-emerald-400', label: 'ACTIVE', text: 'text-emerald-400' },
  'science-operations': { dot: 'bg-purple-400',  label: 'SCIENCE OPS', text: 'text-purple-400' },
  'surface-operations': { dot: 'bg-amber-400',   label: 'SURFACE OPS', text: 'text-amber-400' },
  cruise:               { dot: 'bg-blue-400',    label: 'CRUISE', text: 'text-blue-400' },
  extended:             { dot: 'bg-cyan-400',    label: 'EXTENDED', text: 'text-cyan-400' },
  planned:              { dot: 'bg-sky-400',     label: 'PLANNED', text: 'text-sky-400' },
  completed:            { dot: 'bg-slate-500',   label: 'COMPLETED', text: 'text-slate-400' },
  unknown:              { dot: 'bg-slate-600',   label: 'UNKNOWN', text: 'text-slate-500' },
};

const DEST_ICON: Record<string, React.ReactNode> = {
  earth: <Globe size={11} className="text-blue-400" />,
  moon:  <Moon size={11} className="text-slate-300" />,
  mars:  <span className="text-[10px]">🔴</span>,
};

const TYPE_LABELS: Record<string, string> = {
  rover: 'ROVER',
  orbiter: 'ORBITER',
  lander: 'LANDER',
  crewed: 'CREWED',
  'earth-observation': 'EARTH OBS',
  science: 'SCIENCE',
  communications: 'COMMS',
  technology: 'TECH',
  flyby: 'FLYBY',
};

function CardThumbnail({ mission }: { mission: Mission }) {
  const [imgFailed, setImgFailed] = useState(false);
  const dest = mission.destination;
  return (
    <div className="relative h-32 bg-space-deep overflow-hidden">
      {mission.thumbnailUrl && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mission.thumbnailUrl}
          alt={mission.name}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Satellite size={32} className="text-space-border" />
        </div>
      )}
      {/* Destination badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 glass px-2 py-0.5 rounded-full text-[10px] tracking-wider">
        {DEST_ICON[dest]}
        <span className="text-orbit-dim uppercase">{dest}</span>
      </div>
      {/* Type badge */}
      <div className="absolute top-2 right-2 glass px-1.5 py-0.5 rounded text-[9px] tracking-widest text-orbit-dim">
        {TYPE_LABELS[mission.missionType] || mission.missionType.toUpperCase()}
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-space-panel via-transparent to-transparent" />
    </div>
  );
}

export function MissionCard({ mission, onClick, compact }: MissionCardProps) {
  const status = STATUS_CONFIG[mission.status] || STATUS_CONFIG.unknown;
  const dest = mission.destination;

  if (compact) {
    return (
      <Link
        href={`/missions/${mission.id}`}
        className="flex items-center gap-3 p-3 glass-subtle rounded-lg hover:bg-white/5 transition-colors group"
        onClick={onClick}
      >
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-orbit-white font-medium truncate group-hover:text-orbit-accent">{mission.shortName || mission.name}</div>
          <div className="text-[10px] text-orbit-dim">{mission.agency} · {dest.toUpperCase()}</div>
        </div>
        <ArrowRight size={12} className="text-orbit-dim group-hover:text-orbit-white shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href={`/missions/${mission.id}`}
      className="mission-card flex flex-col glass rounded-lg overflow-hidden border border-space-border hover:border-orbit-blue/30 group"
      onClick={onClick}
    >
      {/* Image / Hero */}
      <CardThumbnail mission={mission} />

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot} ${mission.status === 'active' || mission.status === 'surface-operations' ? 'animate-pulse' : ''}`} />
          <span className={`text-[10px] tracking-widest font-medium ${status.text}`}>{status.label}</span>
        </div>

        {/* Name */}
        <div>
          <h3 className="text-sm font-semibold text-orbit-white leading-snug group-hover:text-orbit-accent transition-colors line-clamp-2">
            {mission.name}
          </h3>
          <div className="text-[10px] text-orbit-dim mt-0.5 tracking-wider">{mission.agency}</div>
        </div>

        {/* Description snippet */}
        <p className="text-[11px] text-orbit-dim leading-relaxed line-clamp-2 flex-1">
          {mission.description.substring(0, 100)}...
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-space-border/50">
          <div className="text-[10px] text-orbit-dim">
            {mission.launchDate ? new Date(mission.launchDate).getFullYear() : '—'}
          </div>
          {mission.currentPhase && (
            <div className="text-[10px] text-orbit-dim truncate max-w-[120px]" title={mission.currentPhase.name}>
              {mission.currentPhase.name}
            </div>
          )}
          <ArrowRight size={11} className="text-orbit-dim group-hover:text-orbit-white shrink-0" />
        </div>
      </div>
    </Link>
  );
}
