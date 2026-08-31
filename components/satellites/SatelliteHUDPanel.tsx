'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertTriangle, ChevronDown, Radio, Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import { DataProvenance } from '../DataProvenance';
import { GroundTrackMap } from './GroundTrackMap';
import { ExplainPopover } from '../education/ExplainPopover';
import type { SatelliteCatalogEntry, SatelliteOrbitalState, DataPoint, DataLabel, DataSource, SatelliteAIContext } from '@/lib/types';

interface ApiResponse {
  catalog: SatelliteCatalogEntry | null;
  orbitalState: SatelliteOrbitalState | null;
  error?: string;
}

interface SatelliteHUDPanelProps {
  id: string;
  onBack: () => void;
  onAskAI: (satellite: SatelliteAIContext) => void;
}

export function SatelliteHUDPanel({ id, onBack, onAskAI }: SatelliteHUDPanelProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/satellites/${id}`)
      .then(async (res) => {
        const json: ApiResponse = await res.json();
        if (cancelled) return;
        if (!res.ok && !json.orbitalState) setError(json.error || 'Live orbital data is currently unavailable.');
        setData(json);
      })
      .catch(() => { if (!cancelled) setError('Could not reach the Orbital server.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="absolute top-[110px] right-[15px] z-20 w-72 animate-slide-up">
      <div className="glass rounded-xl border border-space-border overflow-hidden flex flex-col max-h-[min(620px,calc(100%-160px))]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-space-border shrink-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-wider">
            <ArrowLeft size={11} />
            BACK TO SATELLITES
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {loading && <div className="text-center text-[11px] text-orbit-dim py-6">Loading…</div>}

          {!loading && error && !data?.orbitalState && (
            <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/20 flex items-start gap-2">
              <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-red-300">{error}</div>
            </div>
          )}

          {!loading && data?.catalog && data.orbitalState && (
            <>
              <div>
                <div className="text-[10px] text-orbit-dim tracking-widest mb-0.5">{data.catalog.agency || 'CelesTrak-tracked'}</div>
                <div className="text-lg text-orbit-white font-medium leading-tight">{data.catalog.name}</div>
                <div className="text-[10px] text-orbit-dim/70 font-mono mt-0.5">NORAD {data.orbitalState.noradId}</div>
              </div>

              {data.orbitalState.dataQuality === 'ESTIMATED' && (
                <div className="p-2.5 rounded-lg bg-amber-400/5 border border-amber-400/20 flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-300/90 leading-relaxed">{data.orbitalState.fallbackReason}</div>
                </div>
              )}

              {/* Level 1 */}
              <div className="grid grid-cols-2 gap-2">
                <SimpleStat label="Altitude" value={Math.round(data.orbitalState.derived.altitudeKm.value)} unit="km" />
                <SimpleStat label="Speed" value={Math.round(data.orbitalState.derived.velocityKmS.value * 3600)} unit="km/h" />
                <SimpleStat label="Period" value={Math.round(data.orbitalState.derived.periodMin.value)} unit="min" />
                <SimpleStat label="Inclination" value={data.orbitalState.elements.inclination.value.toFixed(1)} unit="°" />
              </div>

              {/* Ground track */}
              <div>
                <div className="text-[9px] text-orbit-dim tracking-widest mb-1.5">GROUND TRACK</div>
                <GroundTrackMap track={data.orbitalState.derived.groundTrack} current={data.orbitalState.derived.position} />
              </div>

              {/* Learn */}
              <p className="text-[11px] text-orbit-dim leading-relaxed">
                It stays in orbit because it&apos;s moving fast enough to continuously &quot;fall around&quot; Earth instead of into it.{' '}
                <ExplainPopover conceptId="orbit" />
              </p>

              {/* Observation */}
              <ObservationPanel catalog={data.catalog} />

              {/* Technical */}
              <button onClick={() => setShowTechnical((v) => !v)} className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-wider">
                <ChevronDown size={11} className={showTechnical ? 'rotate-180 transition-transform' : 'transition-transform'} />
                TECHNICAL DATA
              </button>
              {showTechnical && (
                <div className="space-y-1.5 pt-1">
                  <DPRow label="Epoch" point={{ value: data.orbitalState.epoch, label: 'OBSERVED', source: 'CelesTrak' }} />
                  <DPRow label="Eccentricity" point={data.orbitalState.elements.eccentricity} />
                  <DPRow label="Mean motion" point={data.orbitalState.elements.meanMotion} unit="rev/day" />
                  <DPRow label="RAAN" point={data.orbitalState.elements.raan} unit="°" />
                  <DPRow label="Arg. of perigee" point={data.orbitalState.elements.argPerigee} unit="°" />
                  <DPRow label="Apogee" point={data.orbitalState.derived.apogeeKm} unit="km" />
                  <DPRow label="Perigee" point={data.orbitalState.derived.perigeeKm} unit="km" />
                </div>
              )}

              {data.catalog.missionId && (
                <Link href={`/missions/${data.catalog.missionId}`} className="block text-center text-[11px] text-orbit-blue hover:text-orbit-accent tracking-wider py-2 rounded-lg bg-orbit-blue/10 border border-orbit-blue/20">
                  VIEW FULL MISSION →
                </Link>
              )}

              <button
                onClick={() => onAskAI({
                  noradId: data.orbitalState!.noradId,
                  name: data.orbitalState!.name,
                  altitudeKm: data.orbitalState!.derived.altitudeKm.value,
                  velocityKmS: data.orbitalState!.derived.velocityKmS.value,
                  periodMin: data.orbitalState!.derived.periodMin.value,
                  inclinationDeg: data.orbitalState!.elements.inclination.value,
                  eccentricity: data.orbitalState!.elements.eccentricity.value,
                  lat: data.orbitalState!.derived.position.lat,
                  lon: data.orbitalState!.derived.position.lon,
                  epoch: data.orbitalState!.epoch,
                  dataQuality: data.orbitalState!.dataQuality,
                  hasObservations: false,
                  anomalyFlags: [],
                })}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-400/10 border border-purple-400/30 text-purple-400 hover:bg-purple-400/15 transition-colors text-[11px] tracking-wider"
              >
                <Sparkles size={12} />
                ASK AI ABOUT THIS SATELLITE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleStat({ label, value, unit }: { label: string; value: string | number; unit: string }) {
  return (
    <div className="glass-subtle rounded-lg p-2.5">
      <div className="text-[8px] text-orbit-dim tracking-widest mb-0.5">{label.toUpperCase()}</div>
      <div className="text-base font-light text-orbit-white">
        {value}
        <span className="text-[10px] text-orbit-dim ml-1">{unit}</span>
      </div>
    </div>
  );
}

function DPRow({ label, point, unit }: { label: string; point: DataPoint<number | string>; unit?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-orbit-dim">{label}</span>
      <DataProvenance value={point.value} label={point.label as DataLabel} source={point.source as DataSource} unit={unit} notes={point.notes} />
    </div>
  );
}

function ObservationPanel({ catalog }: { catalog: SatelliteCatalogEntry }) {
  const cap = catalog.obsCapability;
  if (cap.type === 'NONE') {
    return <p className="text-[10px] text-orbit-dim/60">No public visual feed or observation data available for this satellite.</p>;
  }
  const Icon = cap.type === 'LIVE_VIDEO' ? Video : cap.type === 'RADIO' ? Radio : ImageIcon;
  const title = cap.type === 'LIVE_VIDEO' ? 'Live video available' : cap.type === 'NEAR_REAL_TIME' ? 'Near-real-time imagery' : 'Radio observation data';
  return (
    <div className="glass-subtle rounded-lg p-3 flex items-start gap-2.5">
      <Icon size={14} className="text-orbit-blue shrink-0 mt-0.5" />
      <div>
        <div className="text-[11px] text-orbit-white">{title}</div>
        <div className="text-[9px] text-orbit-dim mt-0.5">Source: {cap.source}</div>
        {cap.url && (
          <a href={cap.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-orbit-blue hover:text-orbit-accent mt-1.5">
            <ExternalLink size={10} />
            {cap.type === 'LIVE_VIDEO' ? 'Official live stream' : 'Data portal'}
          </a>
        )}
      </div>
    </div>
  );
}
