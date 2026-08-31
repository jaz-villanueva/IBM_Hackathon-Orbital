'use client';

/**
 * SatelliteDetailPanel — Space museum / science education experience.
 *
 * Information hierarchy (public-first):
 *  1. Back / header
 *  2. Satellite name + category tagline
 *  3. Stale-data notice (if applicable)
 *  4. WHAT IS IT?
 *  5. WHAT DOES IT DO?
 *  6. Four large stat cards (altitude / speed / orbit / tilt) — live derived data
 *  7. ✦ DID YOU KNOW? — curated factual highlight
 *  8. WHY DOES IT MATTER?
 *  9. WHERE DOES IT FLY? — ground track map with plain-language caption
 * 10. CAN WE SEE ITS SIGNALS? — observation / SatNOGS
 * 11. HOW DOES IT STAY IN SPACE? — educational explainer (collapsible)
 * 12. TECHNICAL DETAILS (collapsible) — raw orbital elements + provenance
 * 13. View Mission link
 * 14. Ask AI button
 * 15. Sources attribution
 *
 * Design principles:
 *  - Sections use question headings ("WHAT IS IT?" not "DESCRIPTION")
 *  - Large numbers + short sub-captions dominate stats, not tiny label grids
 *  - Curated "Did You Know?" card is visually distinct — looks like a discovery
 *  - All live numbers are clearly labeled DERIVED from CelesTrak orbital elements
 *  - Technical data is preserved but hidden behind progressive disclosure
 *  - No fabricated facts — every educational statement has a source
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
  Radio, Video, ImageIcon, Sparkles, Globe, MapPin, Zap,
  RotateCcw, Orbit, BookOpen, Signal,
} from 'lucide-react';
import { GroundTrackMap } from './GroundTrackMap';
import { getSatelliteEducationProfile, hasCuratedProfile } from '@/lib/satellites/education';
import type {
  SatelliteCatalogEntry,
  SatelliteOrbitalState,
  DataPoint,
  DataLabel,
  DataSource,
  SatelliteAIContext,
} from '@/lib/types';

// ─── Local types ──────────────────────────────────────────────────────────────

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

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtAlt(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(km >= 10000 ? 0 : 1).replace(/\.0$/, '')}k km`;
  return `${Math.round(km).toLocaleString()} km`;
}

function fmtAltFull(km: number): string {
  return `${Math.round(km).toLocaleString()} km`;
}

function fmtSpeed(kmS: number): string {
  const kmH = Math.round(kmS * 3600);
  return `${kmH.toLocaleString()} km/h`;
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

/** Approximate number of orbits per day, as a friendly string. */
function orbitsPerDayStr(periodMin: number): string {
  const n = 1440 / periodMin;
  if (n < 1.5) return `about once a day`;
  if (n < 2.5) return `about twice a day`;
  return `about ${Math.round(n)} times a day`;
}

/** Short contextual caption for speed. */
function speedCaption(kmS: number): string {
  const kmH = kmS * 3600;
  if (kmH > 25000) return `Fast enough to circle Earth in about 90 minutes.`;
  if (kmH > 10000) return `That's roughly ${Math.round(kmS)} km every second.`;
  return `Moving at ${Math.round(kmS)} km every second.`;
}

/** Short plain-English note about orbit tilt. */
function inclinationCaption(deg: number): string {
  if (deg < 5) return `Stays near Earth's equator — equatorial orbit.`;
  if (deg < 15) return `Near-equatorial orbit, covering tropical and subtropical regions.`;
  if (deg < 40) return `Tilted orbit covering most of Earth's populated areas.`;
  if (deg < 60) return `Like the ISS — covers a broad band from about ${Math.round(deg)}° south to north.`;
  if (deg < 97) return `High-inclination orbit covering most of Earth's surface.`;
  return `Near-polar orbit — passes over nearly every part of Earth each day.`;
}

// ─── Provenance badge ─────────────────────────────────────────────────────────

function Badge({ label }: { label: DataLabel }) {
  const styles: Record<DataLabel, string> = {
    OBSERVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    DERIVED:  'text-blue-400/80 bg-blue-400/10 border-blue-400/25',
    AI:       'text-purple-400 bg-purple-400/10 border-purple-400/30',
    ESTIMATED:'text-amber-400 bg-amber-400/10 border-amber-400/30',
  };
  return (
    <span className={`px-1 py-0.5 rounded border text-[7px] font-bold tracking-widest ${styles[label] ?? styles.ESTIMATED}`}>
      {label}
    </span>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={11} className="text-orbit-blue/80 shrink-0" />
      <span className="text-[9px] font-semibold text-orbit-dim/80 tracking-[0.18em] uppercase">{text}</span>
    </div>
  );
}

// ─── Large stat card ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  caption?: string;
  badge: DataLabel;
}) {
  return (
    <div className="glass-subtle rounded-xl p-3 flex flex-col gap-1 border border-space-border/40">
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-orbit-blue/60 shrink-0" />
        <span className="text-[8px] text-orbit-dim/70 tracking-widest font-medium uppercase">{label}</span>
      </div>
      <div className="text-[22px] font-light text-orbit-white leading-none tracking-tight">{value}</div>
      {caption && (
        <div className="text-[10px] text-orbit-dim/70 leading-snug">{caption}</div>
      )}
      <div className="mt-0.5">
        <Badge label={badge} />
      </div>
    </div>
  );
}

// ─── Did You Know card ────────────────────────────────────────────────────────

function DidYouKnowCard({ text }: { text: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-orbit-blue/25 bg-gradient-to-br from-orbit-blue/8 to-space-deep/60">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-orbit-blue/6 rounded-bl-full" />
      <div className="p-4 relative">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-orbit-blue text-base leading-none">✦</span>
          <span className="text-[10px] font-bold text-orbit-blue tracking-[0.2em] uppercase">Did You Know?</span>
        </div>
        <p className="text-[12px] text-orbit-white/90 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ─── Technical data row ───────────────────────────────────────────────────────

function TechRow({
  label,
  point,
  unit,
}: {
  label: string;
  point: DataPoint<number | string>;
  unit?: string;
}) {
  const val = typeof point.value === 'number'
    ? (point.value > 100 ? point.value.toFixed(1) : point.value.toFixed(5))
    : String(point.value);
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-space-border/20 last:border-0">
      <span className="text-[10px] text-orbit-dim/70 leading-tight">{label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-orbit-white font-mono">
          {val}
          {unit && <span className="text-orbit-dim ml-0.5">{unit}</span>}
        </span>
        <Badge label={point.label as DataLabel} />
      </div>
    </div>
  );
}

// ─── Ground track section ─────────────────────────────────────────────────────

function GroundTrackSection({ os }: { os: SatelliteOrbitalState }) {
  return (
    <div>
      <SectionHeading icon={Globe} text="Where does it fly over Earth?" />
      <GroundTrackMap
        track={os.derived.groundTrack}
        current={os.derived.position}
      />
      <p className="text-[10px] text-orbit-dim/60 leading-relaxed mt-2">
        This line shows the path the satellite traces over Earth's surface during one orbit. The green dot marks its current position.
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px] text-orbit-dim/50 font-mono">
          {os.derived.position.lat.toFixed(1)}° lat, {os.derived.position.lon.toFixed(1)}° lon
        </span>
        <Badge label="DERIVED" />
      </div>
    </div>
  );
}

// ─── Signals / observation section ────────────────────────────────────────────

function SignalsSection({
  catalog,
  satnogs,
}: {
  catalog: SatelliteCatalogEntry;
  satnogs?: ApiResponse['satnogs'];
}) {
  const cap = catalog.obsCapability;
  const hasVideo = cap.type === 'LIVE_VIDEO';
  const hasImagery = cap.type === 'NEAR_REAL_TIME';
  const hasRadio = cap.type === 'RADIO';
  const hasSatnogsData = satnogs?.available;

  return (
    <div>
      <SectionHeading icon={Signal} text="Can we see its signals?" />

      {/* Live video */}
      {hasVideo && (
        <div className="glass-subtle rounded-xl p-3 border border-emerald-400/20 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-medium text-emerald-400">Live video available</span>
          </div>
          <p className="text-[10px] text-orbit-dim/80 leading-relaxed mb-2">
            You can watch a live video feed from cameras aboard this spacecraft right now.
          </p>
          {cap.url && (
            <a
              href={cap.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium group"
            >
              <Video size={11} />
              <span className="group-hover:underline">Watch the live stream</span>
              <ExternalLink size={9} />
            </a>
          )}
          <div className="mt-1.5 text-[8px] text-orbit-dim/50">Source: {cap.source}</div>
        </div>
      )}

      {/* Near-real-time imagery */}
      {hasImagery && (
        <div className="glass-subtle rounded-xl p-3 border border-orbit-blue/20 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <ImageIcon size={11} className="text-orbit-blue shrink-0" />
            <span className="text-[11px] font-medium text-orbit-white">Near-real-time imagery</span>
          </div>
          <p className="text-[10px] text-orbit-dim/80 leading-relaxed mb-2">
            Images captured by this satellite are made publicly available within hours of being taken.
          </p>
          {cap.url && (
            <a
              href={cap.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-orbit-blue hover:text-orbit-accent group"
            >
              <ExternalLink size={9} />
              <span className="group-hover:underline">Browse imagery</span>
            </a>
          )}
          <div className="mt-1.5 text-[8px] text-orbit-dim/50">Source: {cap.source}</div>
        </div>
      )}

      {/* SatNOGS radio data */}
      {hasSatnogsData && satnogs && (
        <div className="glass-subtle rounded-xl p-3 border border-space-border/40 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <Radio size={11} className="text-orbit-blue/80 shrink-0" />
            <span className="text-[11px] font-medium text-orbit-white">Radio observations recorded</span>
            <Badge label="OBSERVED" />
          </div>
          <p className="text-[10px] text-orbit-dim/80 leading-relaxed mb-2">
            Amateur and professional ground stations around the world have recorded radio signals from this satellite via the SatNOGS network.
          </p>
          {satnogs.transmitters.length > 0 && (
            <div className="space-y-1 mb-2">
              <div className="text-[8px] text-orbit-dim/50 tracking-wider uppercase mb-1">Known signals</div>
              {satnogs.transmitters.slice(0, 2).map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-orbit-dim/80 truncate max-w-[130px]">{tx.description}</span>
                  <span className="text-orbit-white font-mono text-[9px]">{fmtFreq(tx.frequencyHz)}</span>
                </div>
              ))}
            </div>
          )}
          {satnogs.observations[0] && (
            <div className="text-[9px] text-orbit-dim/60">
              Latest observation: {satnogs.observations[0].station}
              {satnogs.observations[0].signalDbm !== null && ` · ${satnogs.observations[0].signalDbm} dBm`}
            </div>
          )}
          <a
            href={`https://db.satnogs.org/satellite/${catalog.noradId}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[9px] text-orbit-blue/60 hover:text-orbit-blue mt-2"
          >
            <ExternalLink size={8} />
            View on SatNOGS DB
          </a>
        </div>
      )}

      {/* No public signals */}
      {!hasVideo && !hasImagery && !hasSatnogsData && (
        <div className="rounded-xl px-3 py-3 border border-dashed border-space-border/40 text-[10px] text-orbit-dim/60 leading-relaxed">
          No public observation feeds, imagery, or radio recordings are currently available for this satellite.
          This is normal for many operational satellites — it doesn&apos;t mean anything is wrong.
        </div>
      )}

      {/* Radio capability but no satnogs data */}
      {hasRadio && !hasSatnogsData && (
        <div className="rounded-xl px-3 py-3 border border-dashed border-orbit-blue/20 text-[10px] text-orbit-dim/60 leading-relaxed">
          This satellite has known radio transmitters, but no recent SatNOGS observations were found in the public database at this time.
        </div>
      )}
    </div>
  );
}

// ─── How it stays in space ────────────────────────────────────────────────────

function OrbitalMechanicsExplainer() {
  return (
    <div className="glass-subtle rounded-xl p-4 border border-space-border/40 space-y-2">
      <p className="text-[11px] text-orbit-dim leading-relaxed">
        Satellites stay in orbit because they are moving sideways extremely fast while Earth's gravity continuously pulls them downward.
      </p>
      <p className="text-[11px] text-orbit-dim leading-relaxed">
        Rather than falling straight down, they are essentially <span className="text-orbit-white/80">falling around Earth</span> — the curve of their fall matches the curve of Earth's surface, so they never hit the ground.
      </p>
      <p className="text-[11px] text-orbit-dim leading-relaxed">
        The higher the orbit, the slower the satellite needs to travel to maintain it. Low Earth orbit satellites travel at around 7–8 km/s; geostationary satellites at ~3 km/s.
      </p>
      <div className="text-[8px] text-orbit-dim/50 mt-1">
        Source: NASA Space Place · spaceplace.nasa.gov
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SatelliteDetailPanel({ id, onBack, onAskAI }: SatelliteDetailPanelProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOrbitalMechanics, setShowOrbitalMechanics] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setShowTechnical(false);
    setShowOrbitalMechanics(false);
    fetch(`/api/satellites/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json: ApiResponse = await res.json();
        if (cancelled) return;
        if (!res.ok && !json.orbitalState) {
          setError(json.error || 'Live orbital data is currently unavailable.');
        }
        setData(json);
      })
      .catch(() => { if (!cancelled) setError('Could not reach the Orbital server.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleAskAI = useCallback(() => {
    if (!data?.orbitalState) return;
    const os = data.orbitalState;
    const sn = data.satnogs;
    onAskAI({
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
    });
  }, [data, onAskAI]);

  const os = data?.orbitalState;
  const cat = data?.catalog;
  const sn = data?.satnogs;

  // Derive educational profile once we have live data
  const edu = (cat && os)
    ? getSatelliteEducationProfile(
        cat.id,
        cat.name,
        os.derived.altitudeKm.value,
        os.derived.periodMin.value,
      )
    : null;

  return (
    <div className="absolute top-[110px] right-[15px] z-20 w-[310px] animate-slide-up">
      <div
        className="glass rounded-xl border border-space-border overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(680px, calc(100vh - 175px))' }}
      >
        {/* ── Back button ── */}
        <div className="flex items-center px-4 py-3 border-b border-space-border/60 shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-widest transition-colors"
          >
            <ArrowLeft size={11} />
            BACK TO SATELLITES
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 space-y-5 p-4">

          {/* ── Loading ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 rounded-full border border-orbit-blue/30 border-t-orbit-blue animate-spin" />
              <span className="text-[10px] text-orbit-dim tracking-wider">Loading satellite data…</span>
            </div>
          )}

          {/* ── Error (no data) ── */}
          {!loading && error && !os && (
            <div className="p-3 rounded-xl bg-red-400/5 border border-red-400/20 flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-red-300/90 leading-relaxed">{error}</div>
            </div>
          )}

          {/* ── Main content ── */}
          {!loading && cat && os && edu && (
            <>
              {/* ── 1. Identity header ── */}
              <div>
                <div className="text-[9px] text-orbit-blue/70 font-semibold tracking-[0.2em] uppercase mb-0.5">
                  {edu.category}
                </div>
                <h2 className="text-[18px] font-light text-orbit-white leading-tight tracking-wide">
                  {cat.shortName || cat.name}
                </h2>
                {cat.shortName && cat.shortName !== cat.name && (
                  <div className="text-[10px] text-orbit-dim/60 leading-tight mt-0.5">{cat.name}</div>
                )}
                <div className="text-[12px] text-orbit-dim/80 italic mt-1 leading-snug">
                  {edu.tagline}
                </div>
                {cat.agency && (
                  <div className="text-[9px] text-orbit-dim/50 tracking-wider mt-1.5 font-mono">
                    {cat.agency} · NORAD {os.noradId}
                  </div>
                )}
              </div>

              {/* Stale data notice */}
              {os.dataQuality === 'ESTIMATED' && (
                <div className="p-2.5 rounded-lg bg-amber-400/5 border border-amber-400/20 flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-300/80 leading-relaxed">{os.fallbackReason}</div>
                </div>
              )}

              {/* ── 2. What is it? ── */}
              <div>
                <SectionHeading icon={BookOpen} text="What is it?" />
                <p className="text-[12px] text-orbit-dim leading-relaxed">{edu.whatIsIt}</p>
              </div>

              {/* ── 3. What does it do? ── */}
              <div>
                <SectionHeading icon={Orbit} text="What does it do?" />
                <p className="text-[12px] text-orbit-dim leading-relaxed">{edu.whatDoesItDo}</p>
              </div>

              {/* ── 4. Four stat cards ── */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  icon={MapPin}
                  label="How high is it?"
                  value={fmtAlt(os.derived.altitudeKm.value)}
                  caption={`${fmtAltFull(os.derived.altitudeKm.value)} above Earth's surface`}
                  badge="DERIVED"
                />
                <StatCard
                  icon={Zap}
                  label="How fast is it?"
                  value={fmtSpeed(os.derived.velocityKmS.value)}
                  caption={speedCaption(os.derived.velocityKmS.value)}
                  badge="DERIVED"
                />
                <StatCard
                  icon={RotateCcw}
                  label="One orbit takes…"
                  value={fmtPeriod(os.derived.periodMin.value)}
                  caption={`Circles Earth ${orbitsPerDayStr(os.derived.periodMin.value)}`}
                  badge="DERIVED"
                />
                <StatCard
                  icon={Globe}
                  label="Orbit tilt"
                  value={`${os.elements.inclination.value.toFixed(1)}°`}
                  caption={inclinationCaption(os.elements.inclination.value)}
                  badge="OBSERVED"
                />
              </div>

              {/* ── 5. Did You Know? ── */}
              <DidYouKnowCard text={edu.didYouKnow} />

              {/* ── 6. Why does it matter? ── */}
              <div>
                <SectionHeading icon={Sparkles} text="Why does it matter?" />
                <p className="text-[12px] text-orbit-dim leading-relaxed">{edu.whyItMatters}</p>
                {edu.extraNote && (
                  <p className="text-[11px] text-orbit-dim/70 leading-relaxed mt-2 italic">{edu.extraNote}</p>
                )}
              </div>

              {/* ── 7. Ground track ── */}
              <GroundTrackSection os={os} />

              {/* ── 8. Signals / observations ── */}
              <SignalsSection catalog={cat} satnogs={sn} />

              {/* ── 9. How does it stay in space? (collapsible) ── */}
              <div>
                <button
                  onClick={() => setShowOrbitalMechanics(v => !v)}
                  className="w-full flex items-center justify-between text-[10px] text-orbit-dim hover:text-orbit-white tracking-widest transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw size={10} className="text-orbit-blue/60" />
                    <span>HOW DOES IT STAY IN SPACE?</span>
                  </div>
                  {showOrbitalMechanics ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                {showOrbitalMechanics && (
                  <div className="mt-2">
                    <OrbitalMechanicsExplainer />
                  </div>
                )}
              </div>

              {/* ── 10. Technical details (collapsible) ── */}
              <div>
                <button
                  onClick={() => setShowTechnical(v => !v)}
                  className="w-full flex items-center justify-between text-[10px] text-orbit-dim hover:text-orbit-white tracking-widest transition-colors py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <Signal size={10} className="text-orbit-blue/60" />
                    <span>TECHNICAL DETAILS</span>
                  </div>
                  {showTechnical ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                {showTechnical && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-space-border/30 bg-space-deep/20">
                    <div className="px-3 py-2 border-b border-space-border/30">
                      <div className="text-[8px] text-orbit-dim/50 tracking-wider uppercase mb-0.5">Orbital element epoch</div>
                      <div className="text-[9px] text-orbit-dim font-mono">{os.epoch}</div>
                    </div>
                    <div className="px-3 py-2 divide-y divide-space-border/20">
                      <TechRow
                        label="NORAD Catalog ID"
                        point={{ value: os.noradId, label: 'OBSERVED', source: 'CelesTrak' }}
                      />
                      <TechRow
                        label="Inclination"
                        point={os.elements.inclination}
                        unit="°"
                      />
                      <TechRow
                        label="Eccentricity"
                        point={os.elements.eccentricity}
                      />
                      <TechRow
                        label="Mean motion"
                        point={os.elements.meanMotion}
                        unit=" rev/day"
                      />
                      <TechRow
                        label="RAAN (Right ascension of asc. node)"
                        point={os.elements.raan}
                        unit="°"
                      />
                      <TechRow
                        label="Argument of perigee"
                        point={os.elements.argPerigee}
                        unit="°"
                      />
                      <TechRow
                        label="Apogee (highest point)"
                        point={os.derived.apogeeKm}
                        unit=" km"
                      />
                      <TechRow
                        label="Perigee (lowest point)"
                        point={os.derived.perigeeKm}
                        unit=" km"
                      />
                      <TechRow
                        label="Orbital period"
                        point={os.derived.periodMin}
                        unit=" min"
                      />
                      <TechRow
                        label="Mean altitude"
                        point={os.derived.altitudeKm}
                        unit=" km"
                      />
                    </div>
                    <div className="px-3 py-2 text-[8px] text-orbit-dim/40 border-t border-space-border/20">
                      Source: CelesTrak General Perturbations (GP) data · celestrak.org
                    </div>
                  </div>
                )}
              </div>

              {/* ── 11. Mission link ── */}
              {cat.missionId && (
                <Link
                  href={`/missions/${cat.missionId}`}
                  className="flex items-center justify-center gap-2 text-[11px] text-orbit-blue hover:text-orbit-accent tracking-wider py-2.5 rounded-xl bg-orbit-blue/10 border border-orbit-blue/20 transition-colors"
                >
                  <Globe size={12} />
                  VIEW FULL MISSION
                </Link>
              )}

              {/* ── 12. Ask AI ── */}
              <button
                onClick={handleAskAI}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-400/10 border border-purple-400/30 text-purple-400 hover:bg-purple-400/15 transition-colors text-[11px] tracking-wider"
              >
                <Sparkles size={12} />
                ASK AI ABOUT THIS SATELLITE
              </button>

              {/* ── 13. Sources ── */}
              <div className="pt-1 pb-2 border-t border-space-border/30">
                <div className="text-[8px] text-orbit-dim/40 tracking-wider uppercase mb-1.5">Educational sources</div>
                <div className="space-y-0.5">
                  {edu.sources.map((src, i) => (
                    <div key={i} className="text-[9px] text-orbit-dim/50 leading-snug">{src}</div>
                  ))}
                  {!hasCuratedProfile(cat.id) && (
                    <div className="text-[9px] text-orbit-dim/40 leading-snug italic">
                      Generic profile — detailed curated content not yet available for this satellite.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
