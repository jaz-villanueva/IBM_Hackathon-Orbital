'use client';

import { Mission, MissionStatus, MissionType, Destination } from '@/lib/types';
import { MissionCard } from './MissionCard';
import { useState, useMemo } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';

interface MissionCatalogProps {
  missions: Mission[];
  onMissionSelect?: (mission: Mission) => void;
  initialDestination?: Destination;
}

const STATUS_OPTIONS: { value: MissionStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'science-operations', label: 'Science Operations' },
  { value: 'surface-operations', label: 'Surface Operations' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'extended', label: 'Extended' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'unknown', label: 'Unknown' },
];

const TYPE_OPTIONS: { value: MissionType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'rover', label: 'Rover' },
  { value: 'orbiter', label: 'Orbiter' },
  { value: 'lander', label: 'Lander' },
  { value: 'crewed', label: 'Crewed' },
  { value: 'earth-observation', label: 'Earth Observation' },
  { value: 'science', label: 'Science' },
  { value: 'communications', label: 'Communications' },
  { value: 'technology', label: 'Technology' },
];

const DEST_OPTIONS: { value: Destination | ''; label: string; emoji: string }[] = [
  { value: '', label: 'All Destinations', emoji: '🌌' },
  { value: 'mercury', label: 'Mercury', emoji: '☿' },
  { value: 'venus', label: 'Venus', emoji: '♀' },
  { value: 'earth', label: 'Earth', emoji: '🌎' },
  { value: 'moon', label: 'Moon', emoji: '🌙' },
  { value: 'mars', label: 'Mars', emoji: '🔴' },
  { value: 'jupiter', label: 'Jupiter', emoji: '🟠' },
  { value: 'saturn', label: 'Saturn', emoji: '🪐' },
  { value: 'uranus', label: 'Uranus', emoji: '🔵' },
  { value: 'neptune', label: 'Neptune', emoji: '💙' },
];

export function MissionCatalog({ missions, onMissionSelect, initialDestination }: MissionCatalogProps) {
  const [dest, setDest] = useState<Destination | ''>(initialDestination || '');
  const [status, setStatus] = useState<MissionStatus | ''>('');
  const [type, setType] = useState<MissionType | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('status');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = missions;
    if (dest) result = result.filter((m) => m.destination === dest);
    if (status) result = result.filter((m) => m.status === status);
    if (type) result = result.filter((m) => m.missionType === type);

    const statusOrder: Record<string, number> = {
      'surface-operations': 0,
      active: 1,
      'science-operations': 2,
      cruise: 3,
      extended: 4,
      planned: 5,
      completed: 6,
      unknown: 7,
    };

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return (b.launchDate || '').localeCompare(a.launchDate || '');
      if (sortBy === 'status') return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      return 0;
    });

    return result;
  }, [missions, dest, status, type, sortBy]);

  const hasFilters = dest || status || type;
  const clearFilters = () => { setDest(''); setStatus(''); setType(''); };

  return (
    <div className="space-y-4">
      {/* Filter header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded glass-subtle text-xs tracking-wider transition-colors ${showFilters ? 'text-orbit-blue border-orbit-blue/40' : 'text-orbit-dim hover:text-orbit-white'}`}
        >
          <Filter size={12} />
          <span>FILTERS</span>
          {hasFilters && <span className="w-4 h-4 rounded-full bg-orbit-blue text-white text-[9px] flex items-center justify-center font-bold">!</span>}
        </button>

        {/* Destination quick filter */}
        <div className="flex items-center gap-1">
          {DEST_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDest(d.value as Destination | '')}
              className={`px-2.5 py-1 text-[11px] tracking-wider rounded transition-all ${
                dest === d.value
                  ? 'bg-orbit-blue/20 text-orbit-blue border border-orbit-blue/40'
                  : 'text-orbit-dim hover:text-orbit-white glass-subtle border border-transparent'
              }`}
            >
              {d.emoji} {d.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-orbit-dim tracking-wider">SORT:</span>
          <div className="flex gap-1">
            {(['status', 'name', 'date'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-1 text-[10px] tracking-wider rounded transition-colors ${
                  sortBy === s ? 'text-orbit-blue' : 'text-orbit-dim hover:text-orbit-white'
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="glass rounded-lg p-4 flex flex-wrap gap-4 items-end animate-fade-in">
          <FilterSelect
            label="DESTINATION"
            value={dest}
            onChange={(v) => setDest(v as Destination | '')}
            options={DEST_OPTIONS}
          />
          <FilterSelect
            label="STATUS"
            value={status}
            onChange={(v) => setStatus(v as MissionStatus | '')}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label="MISSION TYPE"
            value={type}
            onChange={(v) => setType(v as MissionType | '')}
            options={TYPE_OPTIONS}
          />
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-orbit-dim hover:text-orbit-white pb-1">
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Count */}
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-orbit-dim tracking-wider">
          SHOWING <span className="text-orbit-white font-semibold">{filtered.length}</span> MISSIONS
          {hasFilters && <span className="text-orbit-dim"> (filtered)</span>}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-orbit-dim">
          <div className="text-3xl mb-3 opacity-30">◉</div>
          <div className="text-sm tracking-wider">No missions match current filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <MissionCard key={m.id} mission={m} onClick={() => onMissionSelect?.(m)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-orbit-dim tracking-widest">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-space-deep border border-space-border text-orbit-white text-xs px-3 py-2 pr-8 rounded outline-none focus:border-orbit-blue/50 cursor-pointer min-w-[140px]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orbit-dim pointer-events-none" />
      </div>
    </div>
  );
}
