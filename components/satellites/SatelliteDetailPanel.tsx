'use client';

/**
 * SatelliteDetailPanel — Public-friendly satellite information panel.
 *
 * Layout (from top):
 *  1. Back button
 *  2. Satellite name + agency
 *  3. Data quality warning (if stale)
 *  4. Hero stats: altitude, speed, period, inclination — in plain English
 *  5. "What is it doing?" description
 *  6. Fun fact
 *  7. SatNOGS observation data (if available)
 *  8. Live observation / video link (if available)
 *  9. ▶ Technical Details (collapsible): raw orbital elements + provenance
 * 10. View Mission link (if catalog entry links to a mission)
 * 11. Ask AI button
 *
 * Philosophy:
 *  - Statistics first for general public, raw data second via progressive disclosure.
 *  - Every derived value is labeled DERIVED.
 *  - No fabricated observations.
 *  - Plain-language labels ("How fast is it moving?") above raw numbers.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
  Radio, Video, ImageIcon, Sparkles, Satellite, Globe,
} from 'lucide-react';
import { GroundTrackMap } from './GroundTrackMap';
import type {
  SatelliteCatalogEntry,
  SatelliteOrbitalState,
  DataPoint,
  DataLabel,
  DataSource,
  SatelliteAIContext,
} from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SatNOGSTransmitter {
  description: string;
  frequencyHz: number;
  mode: string;
  status: string;
}

interface SatNOGSObservation {
  id: string;
  station: string;
  time: string;
  frequencyHz: number;
  mode: string;
  signalDbm: number | null;
  status: 'good' | 'failed' | 'unknown';
}

interface ApiResponse {
  catalog: SatelliteCatalogEntry | null;
  orbitalState: SatelliteOrbitalState | null;
  satnogs?: {
    transmitters: SatNOGSTransmitter[];
    observations: SatNOGSObservation[];
    available: boolean;
  };
  error?: string;
}

interface SatelliteDetailPanelProps {
  id: string;
  onBack: () => void;
  onAskAI: (satellite: SatelliteAIContext) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAlt(km: number): string {
  return `${Math.round(km).toLocaleString()} km`;
}

function fmtSpeed(kmS: number): string {
  const kmH = kmS * 3600;
  return `${Math.round(kmH).toLocaleString()} km/h`;
}

function fmtPeriod(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtFreq(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  return `${hz} Hz`;
}

function orbitsPerDay(periodMin: number): string {
  const n = 1440 / periodMin;
  return `~${n.toFixed(1)}`;
}

/**
 * Fun contextual fact about altitude.
 * Only generates factual statements anchored to the data.
 */
function altitudeFact(km: number): string {
  if (km < 500) return `That's roughly the driving distance from Manila to Baguio — straight up.`;
  if (km < 1000) return `Higher than any commercial aircraft, low enough to see Earth's curvature clearly.`;
  if (km < 5000) return `In this region, Earth's Van Allen radiation belts begin.`;
  if (km < 20000) return `Well above low Earth orbit — GPS satellites operate at this altitude.`;
  return `At geostationary altitude, the satellite appears to hover over one spot on Earth.`;
}

/**
 * Contextual note about inclination.
 */
function inclinationFact(deg: number): string {
  if (deg < 5) return `Near-equatorial orbit — stays close to Earth's equator.`;
  if (deg < 30) return `Moderate inclination — covers most of Earth's populated regions.`;
  if (deg < 60) return `Mid-inclination orbit — like the ISS, covers a broad swath of Earth.`;
  if (deg < 97) return `High inclination — covers the poles and most of Earth's surface.`;
  return `Sun-synchronous polar orbit — passes over the same area at the same local time every day.`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProvenanceBadge({ label }: { label: DataLabel }) {
  const cfg: Record<DataLabel, { text: string; color: string }> = {
    OBSERVED: { text: 'OBSERVED', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    DERIVED:  { text: 'DERIVED',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
    AI:       { text: 'AI',       color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
    ESTIMATED:{ text: 'ESTIMATED',color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  };
  const c = cfg[label] ?? cfg.ESTIMATED;
  return (
    <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold tracking-widest ${c.color}`}>
      {c.text}
    </span>
  );
}

function StatCard({ label, value, sub, badge }: { label: string; value: string; sub?: string; badge?: DataLabel }) {
  return (
    <div className="glass-subtle rounded-lg p-2.5 flex flex-col gap-0.5">
      <div className="text-[8px] text-orbit-dim/80 tracking-widest leading-tight">{label.toUpperCase()}</div>
      <div className="text-[15px] font-light text-orbit-white leading-tight">{value}</div>
      {sub && <div className="text-[9px] text-orbit-dim/70 leading-snug">{sub}</div>}
      {badge && <div className="mt-0.5"><ProvenanceBadge label={badge} /></div>}
    </div>
  );
}

function DPRow({ label, point, unit }: { label: string; point: DataPoint<number | string>; unit?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1 border-b border-space-border/30 last:border-0">
      <span className="text-[9px] text-orbit-dim/80 leading-tight min-w-0 flex-1">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-orbit-white font-mono">
          {typeof point.value === 'number' ? point.value.toFixed(point.value > 100 ? 1 : 5) : point.value}
          {unit && <span className="text-orbit-dim ml-0.5">{unit}</span>}
        </span>
        <ProvenanceBadge label={point.label as DataLabel} />
      </div>
    </div>
  );
}

function ObservationCapabilityCard({ catalog }: { catalog: SatelliteCatalogEntry }) {
  const cap = catalog.obsCapability;
  if (cap.type === 'NONE') {
    return (
      <div className="text-[10px] text-orbit-dim/60 border border-space-border/40 rounded-lg px-3 py-2 flex items-center gap-2">
        <Satellite size={12} className="shrink-0 text-orbit-dim/40" />
        <span>No public observation feed for this satellite.</span>
      </div>
    );
  }
  const Icon = cap.type === 'LIVE_VIDEO' ? Video : cap.type === 'RADIO' ? Radio : ImageIcon;
  const titles: Record<string, string> = {
    LIVE_VIDEO: 'Live video available from this satellite',
    NEAR_REAL_TIME: 'Near-real-time imagery available',
    RADIO: 'Radio signals observed via SatNOGS',
  };
  return (
    <div className="glass-subtle rounded-lg p-3 flex items-start gap-2.5 border border-orbit-blue/15">
      <Icon size={14} className="text-orbit-blue shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[11px] text-orbit-white leading-tight">{titles[cap.type]}</div>
        {cap.source && <div className="text-[9px] text-orbit-dim mt-0.5">Source: {cap.source}</div>}
        {cap.url && (
          <a
            href={cap.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-orbit-blue hover:text-orbit-accent mt-1.5 group"
          >
            <ExternalLink size={10} />
            <span className="group-hover:underline">
              {cap.type === 'LIVE_VIDEO' ? 'Watch live stream' : 'Open data portal'}
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

function SatNOGSPanel({ satnogs }: { satnogs: NonNullable<ApiResponse['satnogs']> }) {
  if (!satnogs.available) {
    return (
      <div className="text-[10px] text-orbit-dim/60 border border-dashed border-space-border/40 rounded-lg px-3 py-2">
        <div className="font-medium text-orbit-dim/80 mb-0.5">SatNOGS Data</div>
        No SatNOGS observations available for this satellite.
      </div>
    );
  }

  const latestObs = satnogs.observations[0];

  return (
    <div className="glass-subtle rounded-lg overflow-hidden border border-space-border/40">
      <div className="px-3 py-2 border-b border-space-border/40">
        <div className="flex items-center gap-1.5">
          <Radio size={11} className="text-orbit-blue" />
          <span className="text-[9px] tracking-widest font-medium text-orbit-dim">SATNOGS OBSERVATIONS</span>
          <ProvenanceBadge label="OBSERVED" />
        </div>
      </div>
      <div className="px-3 py-2 space-y-2">
        {satnogs.transmitters.length > 0 && (
          <div>
            <div className="text-[8px] text-orbit-dim/60 tracking-wider mb-1">TRANSMITTERS</div>
            {satnogs.transmitters.slice(0, 2).map((tx, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-space-border/20 last:border-0">
                <span className="text-[10px] text-orbit-dim truncate max-w-[120px]">{tx.description}</span>
                <span className="text-[9px] text-orbit-white font-mono">{fmtFreq(tx.frequencyHz)}</span>
              </div>
            ))}
          </div>
        )}
        {latestObs && (
          <div>
            <div className="text-[8px] text-orbit-dim/60 tracking-wider mb-1">LATEST OBSERVATION</div>
            <div className="text-[10px] text-orbit-dim">
              <div className="flex items-center justify-between">
                <span className="text-orbit-white/90 truncate">{latestObs.station}</span>
                <span className={`px-1 py-0.5 rounded text-[8px] ${latestObs.status === 'good' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {latestObs.status.toUpperCase()}
                </span>
              </div>
              {latestObs.signalDbm !== null && (
                <div className="text-orbit-dim/70 mt-0.5">
                  Signal: <span className="font-mono text-orbit-white/80">{latestObs.signalDbm} dBm</span>
                </div>
              )}
              <div className="text-[8px] text-orbit-dim/50 mt-0.5">
                {new Date(latestObs.time).toUTCString().slice(0, 25)} UTC
              </div>
            </div>
          </div>
        )}
        <a
          href={`https://db.satnogs.org/satellite/${satnogs.observations[0]?.station ?? ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[9px] text-orbit-blue/70 hover:text-orbit-blue mt-1"
        >
          <ExternalLink size={9} />
          View on SatNOGS DB
        </a>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SatelliteDetailPanel({ id, onBack, onAskAI }: SatelliteDetailPanelProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/satellites/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json: ApiResponse = await res.json();
        if (cancelled) return;
        if (!res.ok && !json.orbitalState) {
          setError(json.error || 'Live orbital data is currently unavailable.');
        }
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach the Orbital server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const os = data?.orbitalState;
  const cat = data?.catalog;
  const sn = data?.satnogs;

  return (
    <div className="absolute top-[110px] right-[15px] z-20 w-[300px] animate-slide-up">
      <div
        className="glass rounded-xl border border-space-border overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(640px, calc(100vh - 180px))' }}
      >
        {/* ── Back header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-space-border shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-widest transition-colors"
          >
            <ArrowLeft size={11} />
            BACK TO SATELLITES
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 rounded-full border border-orbit-blue/30 border-t-orbit-blue animate-spin" />
              <div className="text-[10px] text-orbit-dim tracking-wider">Loading satellite data…</div>
            </div>
          )}

          {/* Error (no data at all) */}
          {!loading && error && !os && (
            <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/20 flex items-start gap-2">
              <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-red-300 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Content */}
          {!loading && cat && os && (
            <>
              {/* ── Satellite identity ── */}
              <div>
                {cat.agency && (
                  <div className="text-[9px] text-orbit-dim/70 tracking-widest uppercase mb-0.5">{cat.agency}</div>
                )}
                <div className="text-xl font-light text-orbit-white leading-tight">{cat.name}</div>
                <div className="text-[9px] text-orbit-dim/60 font-mono mt-0.5">NORAD {os.noradId}</div>
                {cat.description && (
                  <p className="text-[11px] text-orbit-dim leading-relaxed mt-2">{cat.description}</p>
                )}
              </div>

              {/* Stale data warning */}
              {os.dataQuality === 'ESTIMATED' && (
                <div className="p-2.5 rounded-lg bg-amber-400/5 border border-amber-400/20 flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-300/90 leading-relaxed">{os.fallbackReason}</div>
                </div>
              )}

              {/* ── Hero stats — public-friendly ── */}
              <div className="space-y-1">
                <div className="text-[9px] text-orbit-dim/70 tracking-widest">WHERE IS IT · HOW IS IT MOVING</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <StatCard
                    label="Altitude above Earth"
                    value={fmtAlt(os.derived.altitudeKm.value)}
                    sub={altitudeFact(os.derived.altitudeKm.value)}
                    badge="DERIVED"
                  />
                  <StatCard
                    label="Orbital speed"
                    value={fmtSpeed(os.derived.velocityKmS.value)}
                    sub="That's fast enough to circle Earth in roughly 90 minutes."
                    badge="DERIVED"
                  />
                  <StatCard
                    label="Time for one orbit"
                    value={fmtPeriod(os.derived.periodMin.value)}
                    sub={`About ${orbitsPerDay(os.derived.periodMin.value)} orbits every day.`}
                    badge="DERIVED"
                  />
                  <StatCard
                    label="Orbital tilt"
                    value={`${os.elements.inclination.value.toFixed(1)}°`}
                    sub={inclinationFact(os.elements.inclination.value)}
                    badge="OBSERVED"
                  />
                </div>
              </div>

              {/* ── Ground track ── */}
              <div>
                <div className="text-[9px] text-orbit-dim/70 tracking-widest mb-1.5">GROUND TRACK · DERIVED</div>
                <GroundTrackMap
                  track={os.derived.groundTrack}
                  current={os.derived.position}
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[8px] text-orbit-dim/50">
                    Current: {os.derived.position.lat.toFixed(1)}°, {os.derived.position.lon.toFixed(1)}°
                  </span>
                  <ProvenanceBadge label="DERIVED" />
                </div>
              </div>

              {/* ── Observation capability ── */}
              <div>
                <div className="text-[9px] text-orbit-dim/70 tracking-widest mb-1.5">OBSERVATION CAPABILITY</div>
                <ObservationCapabilityCard catalog={cat} />
              </div>

              {/* ── SatNOGS data ── */}
              {sn !== undefined && (
                <div>
                  <SatNOGSPanel satnogs={sn} />
                </div>
              )}

              {/* ── Technical details (collapsible) ── */}
              <div>
                <button
                  onClick={() => setShowTechnical((v) => !v)}
                  className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-widest transition-colors w-full"
                >
                  {showTechnical ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  TECHNICAL ORBITAL DATA
                </button>
                {showTechnical && (
                  <div className="mt-2 space-y-0 border border-space-border/30 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-space-deep/30">
                      <div className="text-[8px] text-orbit-dim/60 tracking-wider mb-0.5">DATA EPOCH</div>
                      <div className="text-[9px] text-orbit-dim font-mono">{os.epoch}</div>
                    </div>
                    <div className="px-3 py-2 divide-y divide-space-border/20">
                      <DPRow label="Eccentricity" point={os.elements.eccentricity} />
                      <DPRow label="Mean motion" point={os.elements.meanMotion} unit="rev/day" />
                      <DPRow label="RAAN" point={os.elements.raan} unit="°" />
                      <DPRow label="Arg. of perigee" point={os.elements.argPerigee} unit="°" />
                      <DPRow label="Apogee" point={os.derived.apogeeKm} unit="km" />
                      <DPRow label="Perigee" point={os.derived.perigeeKm} unit="km" />
                      <DPRow label="Semi-major axis" point={{ value: Math.round(os.derived.apogeeKm.value + os.derived.perigeeKm.value) / 2 + 6371, label: 'DERIVED', source: 'CelesTrak' }} unit="km" />
                    </div>
                    <div className="px-3 py-2 bg-space-deep/20 text-[8px] text-orbit-dim/50">
                      Source: CelesTrak General Perturbations data · celestrak.org
                    </div>
                  </div>
                )}
              </div>

              {/* ── Mission link ── */}
              {cat.missionId && (
                <Link
                  href={`/missions/${cat.missionId}`}
                  className="flex items-center justify-center gap-2 text-[11px] text-orbit-blue hover:text-orbit-accent tracking-wider py-2.5 rounded-lg bg-orbit-blue/10 border border-orbit-blue/20 transition-colors"
                >
                  <Globe size={12} />
                  VIEW FULL MISSION
                </Link>
              )}

              {/* ── Ask AI ── */}
              <button
                onClick={() => onAskAI({
                  noradId: os.noradId,
                  name: os.name,
                  altitudeKm: os.derived.altitudeKm.value,
                  velocityKmS: os.derived.velocityKmS.value,
                  periodMin: os.derived.periodMin.value,
                  inclinationDeg: os.elements.inclination.value,
                  eccentricity: os.elements.eccentricity.value,
                  lat: os.derived.position.lat,
                  lon: os.derived.position.lon,
                  epoch: os.epoch,
                  dataQuality: os.dataQuality,
                  hasObservations: !!(sn?.available && sn.observations.length > 0),
                  anomalyFlags: [],
                })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-400/10 border border-purple-400/30 text-purple-400 hover:bg-purple-400/15 transition-colors text-[11px] tracking-wider"
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
