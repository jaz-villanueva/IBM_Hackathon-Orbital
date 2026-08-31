'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FleetSatelliteEntry, OrbitRegime } from '@/lib/types';
import clsx from 'clsx';

interface EarthTelemetryHUDProps {
  satellites: FleetSatelliteEntry[];
  totals: { total: number; leo: number; meo: number; geo: number };
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
}

type Filter = 'ALL' | OrbitRegime;

const REGIME_DOT: Record<OrbitRegime, string> = {
  LEO: 'bg-cyan-400',
  MEO: 'bg-purple-400',
  GEO: 'bg-amber-400',
};

export function EarthTelemetryHUD({ satellites, totals, loading, error, onSelect }: EarthTelemetryHUDProps) {
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(
    () => (filter === 'ALL' ? satellites : satellites.filter((s) => s.orbitRegime === filter)),
    [satellites, filter]
  );

  return (
    <div className="absolute top-[110px] left-4 z-20 w-72 animate-slide-up">
      <div className="glass rounded-xl border border-space-border overflow-hidden flex flex-col max-h-[min(560px,calc(100%-160px))]">
        {/* Header */}
        <div className="p-4 border-b border-space-border shrink-0">
          <div className="text-[10px] text-orbit-dim tracking-widest mb-1">EARTH · ORBITAL ENVIRONMENT</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-light text-orbit-white leading-none">{loading ? '—' : totals.total}</div>
            <div className="text-[9px] text-orbit-dim tracking-wider mb-0.5">TRACKED SATELLITES</div>
          </div>
          {!loading && !error && (
            <div className="flex items-center gap-1.5 mt-2 text-[9px]">
              <span className="px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-400/8 border border-emerald-400/30 tracking-widest">OBSERVED</span>
              <span className="text-orbit-dim/60">CelesTrak live orbital data</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-1.5 mt-2 text-[10px] text-amber-300/90">
              <AlertTriangle size={11} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Distribution */}
        {!loading && totals.total > 0 && (
          <div className="px-4 py-3 border-b border-space-border shrink-0 space-y-1.5">
            {(['LEO', 'MEO', 'GEO'] as OrbitRegime[]).map((regime) => {
              const count = totals[regime.toLowerCase() as 'leo' | 'meo' | 'geo'];
              const pct = totals.total > 0 ? (count / totals.total) * 100 : 0;
              return (
                <div key={regime} className="flex items-center gap-2">
                  <span className="text-[10px] text-orbit-dim w-8">{regime}</span>
                  <div className="flex-1 h-1.5 bg-space-deep rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full', REGIME_DOT[regime])} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-orbit-dim w-5 text-right font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 px-4 py-2.5 border-b border-space-border shrink-0 flex-wrap">
          {(['ALL', 'LEO', 'MEO', 'GEO'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-2.5 py-1 rounded text-[10px] tracking-wider border transition-colors',
                filter === f
                  ? 'bg-orbit-blue/20 border-orbit-blue/50 text-orbit-blue'
                  : 'border-space-border text-orbit-dim hover:text-orbit-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="p-4 text-center text-[11px] text-orbit-dim">Loading live satellite data…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-4 text-center text-[11px] text-orbit-dim">No satellites in this filter.</div>
          )}
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 transition-colors text-left"
            >
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', REGIME_DOT[s.orbitRegime])} />
              <span className="flex-1 min-w-0">
                <span className="block text-[12px] text-orbit-white truncate">{s.name}</span>
                <span className="block text-[9px] text-orbit-dim/70 font-mono">NORAD {s.noradId} · {Math.round(s.altitudeKm)} km</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
