'use client';

/**
 * EarthSatellitePanel — Telemetry-inspired satellite browser for Earth Mode.
 *
 * Design inspired by the telemetry reference project (jaz-villanueva/telemetry)
 * but fully integrated into Orbital's design language.
 *
 * Layout:
 *  • Header: Earth context, total tracked, data quality badge
 *  • Orbit distribution bars (LEO / MEO / GEO)
 *  • Filter tabs
 *  • Scrollable satellite list
 *
 * No "fleet" terminology in the user-facing strings.
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, Satellite, Search, X } from 'lucide-react';
import type { FleetSatelliteEntry, OrbitRegime } from '@/lib/types';
import clsx from 'clsx';

interface EarthSatellitePanelProps {
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

const REGIME_BAR: Record<OrbitRegime, string> = {
  LEO: 'bg-cyan-400/80',
  MEO: 'bg-purple-400/80',
  GEO: 'bg-amber-400/80',
};

const REGIME_LABEL: Record<OrbitRegime, string> = {
  LEO: 'Low Earth Orbit',
  MEO: 'Medium Earth Orbit',
  GEO: 'Geostationary',
};

function getAltitudeLabel(km: number): string {
  return `${Math.round(km).toLocaleString()} km`;
}

function SearchBox({ search, onSearch }: { search: string; onSearch: (q: string) => void }) {
  return (
    <div className="relative px-3 py-2 border-b border-space-border shrink-0">
      <Search size={11} className="absolute left-5 top-1/2 -translate-y-1/2 text-orbit-dim/50 pointer-events-none" />
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search satellites…"
        className="w-full bg-space-deep/60 border border-space-border/50 rounded-md text-[11px] text-orbit-white placeholder:text-orbit-dim/40 pl-7 pr-7 py-1.5 outline-none focus:border-orbit-blue/40 tracking-wide"
      />
      {search && (
        <button
          onClick={() => onSearch('')}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-orbit-dim/60 hover:text-orbit-white"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export function EarthSatellitePanel({ satellites, totals, loading, error, onSelect }: EarthSatellitePanelProps) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = filter === 'ALL' ? satellites : satellites.filter((s) => s.orbitRegime === filter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) || s.noradId.includes(q)
      );
    }
    return list;
  }, [satellites, filter, search]);

  return (
    <div className="absolute top-[110px] left-4 z-20 w-[280px] animate-slide-up">
      <div
        className="glass rounded-xl border border-space-border overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(580px, calc(100vh - 220px))' }}
      >
        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3 border-b border-space-border shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[9px] text-orbit-dim tracking-widest font-medium">EARTH · ORBITAL ENVIRONMENT</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-light text-orbit-white leading-none">
                {loading ? '—' : totals.total}
              </div>
              <div className="text-[9px] text-orbit-dim tracking-wider mt-1">TRACKED SATELLITES</div>
            </div>
            {!loading && !error && (
              <div className="flex items-center gap-1 text-[8px] mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold tracking-widest">LIVE DATA</span>
              </div>
            )}
          </div>
          {!loading && !error && (
            <div className="flex items-center gap-1 mt-2">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 tracking-widest">OBSERVED</span>
              <span className="text-[9px] text-orbit-dim/60">CelesTrak live orbital data</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-1.5 mt-2 text-[10px] text-amber-300/90">
              <AlertTriangle size={11} className="shrink-0 mt-0.5" />
              <span className="leading-tight">{error}</span>
            </div>
          )}
        </div>

        {/* ── Orbit distribution ── */}
        {!loading && totals.total > 0 && (
          <div className="px-4 py-3 border-b border-space-border shrink-0 space-y-2">
            <div className="text-[9px] text-orbit-dim tracking-widest mb-1">ORBIT DISTRIBUTION</div>
            {(['LEO', 'MEO', 'GEO'] as OrbitRegime[]).map((regime) => {
              const count = totals[regime.toLowerCase() as 'leo' | 'meo' | 'geo'];
              const pct = totals.total > 0 ? (count / totals.total) * 100 : 0;
              return (
                <div key={regime} className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-orbit-dim w-8">{regime}</span>
                  <div className="flex-1 h-1.5 bg-space-deep rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full transition-all duration-700', REGIME_BAR[regime])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-orbit-dim font-mono w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Search ── */}
        <SearchBox search={search} onSearch={setSearch} />

        {/* ── Filters ── */}
        <div className="flex gap-1 px-4 py-2.5 border-b border-space-border shrink-0 flex-wrap">
          {(['ALL', 'LEO', 'MEO', 'GEO'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-2.5 py-1 rounded text-[9px] tracking-widest border font-medium transition-all',
                filter === f
                  ? 'bg-orbit-blue/20 border-orbit-blue/50 text-orbit-blue'
                  : 'border-space-border text-orbit-dim hover:text-orbit-white hover:border-space-muted'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Satellite list ── */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 rounded-full border border-orbit-blue/30 border-t-orbit-blue animate-spin" />
              <span className="text-[10px] text-orbit-dim tracking-wider">Loading satellite data…</span>
            </div>
          )}
          {!loading && filtered.length === 0 && !error && (
            <div className="p-6 text-center">
              <Satellite size={20} className="text-orbit-dim/40 mx-auto mb-2" />
              <div className="text-[11px] text-orbit-dim">No satellites in this filter.</div>
            </div>
          )}
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-space-border/30 last:border-0 group"
            >
              {/* Regime indicator */}
              <span
                className={clsx('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', REGIME_DOT[s.orbitRegime])}
                title={REGIME_LABEL[s.orbitRegime]}
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-orbit-white leading-tight truncate group-hover:text-white">
                  {s.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-orbit-dim/70 font-mono">{getAltitudeLabel(s.altitudeKm)}</span>
                  <span className="text-[9px] text-orbit-dim/40">·</span>
                  <span className={clsx('text-[9px] font-medium', {
                    'text-cyan-400/80': s.orbitRegime === 'LEO',
                    'text-purple-400/80': s.orbitRegime === 'MEO',
                    'text-amber-400/80': s.orbitRegime === 'GEO',
                  })}>{s.orbitRegime}</span>
                </div>
                <div className="text-[9px] text-orbit-dim/40 font-mono mt-0.5">NORAD {s.noradId}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-2.5 border-t border-space-border/40 shrink-0">
          <div className="text-[8px] text-orbit-dim/50 tracking-wider">
            Positions derived from CelesTrak orbital elements · Click to explore
          </div>
        </div>
      </div>
    </div>
  );
}
