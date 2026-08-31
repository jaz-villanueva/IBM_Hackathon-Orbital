'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertTriangle, ChevronDown, Radio, Video, Image as ImageIcon, ImageOff, Sparkles, Lightbulb, Globe, Rocket, Clock, Info, Compass } from 'lucide-react';
import { GroundTrackMap } from './GroundTrackMap';
import type { SatelliteCatalogEntry, SatelliteOrbitalState, SatelliteAIContext, FleetSatelliteEntry } from '@/lib/types';
import { SATELLITE_EDUCATION, getEducationProfile, type SatelliteEducationProfile } from '@/lib/satellites/education';
import { getSatelliteImage } from '@/lib/satellites/imagery';
import clsx from 'clsx';

interface ApiResponse {
  catalog: SatelliteCatalogEntry | null;
  orbitalState: SatelliteOrbitalState | null;
  error?: string;
}

interface SatelliteHUDPanelProps {
  id: string;
  onBack: () => void;
  onAskAI: (satellite: SatelliteAIContext) => void;
  /**
   * When the selected satellite is already present in the loaded fleet, its
   * full orbital state was already computed for that fetch — pass it here to
   * render immediately instead of firing a second, independent CelesTrak
   * request on click. That second request runs as its own isolated route
   * with its own cache, so without this it can fail (or just be slow) even
   * though the satellite's data is already sitting in memory on the client.
   */
  preloaded?: FleetSatelliteEntry;
}

/** Mean Earth diameter, km (IAU nominal — used only for the "N Earth-diameters" comparison). */
const EARTH_DIAMETER_KM = 12742;
/** Great-circle distance New York → Los Angeles, km — a fixed, verifiable reference distance for the speed comparison. */
const NY_TO_LA_KM = 3940;

/** Precise, computed altitude comparison — never a guessed number. */
function altitudeDescription(km: number): string {
  const diameters = km / EARTH_DIAMETER_KM;
  const diameterPhrase =
    diameters < 0.1
      ? `about ${Math.round(diameters * 100)}% of Earth's diameter above the surface`
      : `about ${diameters.toFixed(1)} Earth-diameters above the surface`;
  if (km < 600) return `That's ${diameterPhrase} — roughly where the ISS orbits.`;
  if (km < 2000) return `That's ${diameterPhrase} — well above where aircraft fly (they cruise around 10-13 km up).`;
  if (km < 8000) return `That's ${diameterPhrase} — high enough to see a huge stretch of Earth at once.`;
  if (km < 36000) return `That's ${diameterPhrase} — in medium orbit, well above most other satellites.`;
  return `That's ${diameterPhrase} — in geostationary orbit, so it stays over the same spot on Earth all day.`;
}

/** Precise, computed speed comparison using a fixed real-world distance. */
function speedDescription(kmh: number): string {
  const hoursAcrossUS = NY_TO_LA_KM / kmh;
  const usPhrase =
    hoursAcrossUS < 1
      ? `it could cross the U.S. (New York to Los Angeles) in about ${Math.round(hoursAcrossUS * 60)} minutes`
      : `it could cross the U.S. (New York to Los Angeles) in about ${hoursAcrossUS.toFixed(1)} hours`;
  return `At this speed, ${usPhrase}.`;
}

/** Orbital period described in everyday terms. */
function periodDescription(min: number): string {
  const orbitsPerDay = 24 / (min / 60);
  if (min < 100) return `It circles Earth about ${Math.round(orbitsPerDay)} times a day.`;
  if (min < 800) return `It circles Earth about ${orbitsPerDay.toFixed(1)} times a day.`;
  return `It takes about ${(min / 60).toFixed(1)} hours to complete one full orbit.`;
}

export function SatelliteHUDPanel({ id, onBack, onAskAI, preloaded }: SatelliteHUDPanelProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (preloaded) {
      // Already have everything from the fleet fetch — render immediately,
      // no network round-trip.
      setData({
        catalog: {
          id: preloaded.id,
          name: preloaded.name,
          shortName: preloaded.shortName,
          agency: preloaded.agency,
          noradId: preloaded.noradId,
          description: preloaded.description,
          obsCapability: preloaded.obsCapability,
          missionId: preloaded.missionId,
        },
        orbitalState: preloaded.orbitalState,
      });
      setError(null);
      setLoading(false);
      return;
    }

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
  }, [id, preloaded]);

  const education: SatelliteEducationProfile | null = data?.catalog?.noradId
    ? (SATELLITE_EDUCATION[data.catalog.noradId] ?? getEducationProfile(data.catalog.noradId, data.catalog.name))
    : null;

  return (
    // Anchored to the viewport, not just the hero section, so the panel's max
    // height is always correct regardless of ancestor percentage-height quirks —
    // this is what makes the bottom of the panel (Ask AI, technical details)
    // reliably reachable on short/laptop viewports instead of being clipped.
    <div
      className={clsx(
        // Mobile: a bottom sheet spanning the viewport width, clear of the
        // bottom orbit-control row. Desktop (sm+): the original fixed-width
        // right-side panel, unchanged.
        'absolute z-20 left-3 right-3 bottom-[124px] top-auto max-h-[55vh]',
        'sm:left-auto sm:right-[15px] sm:top-[110px] sm:bottom-auto sm:w-80 sm:max-h-[calc(100vh-190px)]',
        'animate-slide-up flex flex-col'
      )}
    >
      <div className="glass rounded-xl border border-space-border overflow-hidden flex flex-col min-h-0 flex-1">

        {/* Back button */}
        <div className="flex items-center px-4 py-3 border-b border-space-border shrink-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-wider transition-colors">
            <ArrowLeft size={11} />
            BACK TO SATELLITES
          </button>
        </div>

        {/* min-h-0 is the key fix: without it, a flex child with overflow-y-auto
            refuses to shrink below its content size, so the parent's
            overflow-hidden silently clips the bottom instead of scrolling. */}
        <div className="overflow-y-auto min-h-0 flex-1 px-4 py-4 space-y-5">
          {loading && (
            <div className="text-center text-[11px] text-orbit-dim py-8">
              <div className="w-6 h-6 rounded-full border border-orbit-blue/30 border-t-orbit-blue animate-spin mx-auto mb-3" />
              Loading satellite data…
            </div>
          )}

          {!loading && error && !data?.orbitalState && (
            <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/30 flex items-start gap-2">
              <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-[12px] text-red-200">{error}</div>
            </div>
          )}

          {!loading && data?.catalog && data.orbitalState && (() => {
            const cat = data.catalog!;
            const state = data.orbitalState!;
            const altKm = Math.round(state.derived.altitudeKm.value);
            const speedKmh = Math.round(state.derived.velocityKmS.value * 3600);
            const periodMin = state.derived.periodMin.value;
            const incDeg = state.elements.inclination.value;
            const edu = education;
            // EDUCATIONAL DATA — never derived from live orbital state, see lib/satellites/imagery.ts.
            const image = getSatelliteImage(cat.noradId, cat.name);

            return (
              <>
                {/* ── Identity ── */}
                <div>
                  <div className="text-[10px] text-orbit-cyan tracking-widest mb-1 uppercase font-medium">
                    {edu?.category ?? cat.agency ?? 'Tracked Satellite'}
                  </div>
                  <div className="text-2xl text-orbit-white font-light leading-tight">
                    {cat.shortName ?? cat.name}
                  </div>
                  {(cat.shortName && cat.shortName !== cat.name) && (
                    <div className="text-[12px] text-orbit-dim mt-0.5">{cat.name}</div>
                  )}
                  {edu?.tagline && (
                    <div className="text-[13px] text-orbit-blue mt-1.5 italic">&ldquo;{edu.tagline}&rdquo;</div>
                  )}
                </div>

                {/* ── What does it look like? — EDUCATIONAL DATA, not live/derived ── */}
                <SatelliteImageSection image={image} name={cat.shortName ?? cat.name} />

                {/* ── Stale data warning ── */}
                {state.dataQuality === 'ESTIMATED' && (
                  <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-start gap-2">
                    <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-200 leading-relaxed">{state.fallbackReason}</div>
                  </div>
                )}

                {/* ── What is it? ── */}
                {(edu?.description ?? cat.description) && (
                  <section>
                    <SectionHeading icon={<Info size={12} />} label="WHAT IS IT?" color="text-orbit-dim" />
                    <p className="text-[13px] text-orbit-white/80 leading-relaxed">
                      {edu?.description ?? cat.description}
                    </p>
                  </section>
                )}

                {/* ── Big stat cards — color-coded for quick visual scanning ── */}
                <StatCard
                  icon={<Globe size={18} />}
                  color="cyan"
                  heading="HOW HIGH IS IT?"
                  value={`${altKm.toLocaleString()}`}
                  unit="km"
                  label="above Earth"
                  badge={state.derived.altitudeKm.label}
                  note={altitudeDescription(altKm)}
                />

                <StatCard
                  icon={<Rocket size={18} />}
                  color="blue"
                  heading="HOW FAST IS IT GOING?"
                  value={speedKmh.toLocaleString()}
                  unit="km/h"
                  label="orbital speed"
                  badge={state.derived.velocityKmS.label}
                  note={speedDescription(speedKmh)}
                />

                <StatCard
                  icon={<Clock size={18} />}
                  color="violet"
                  heading="HOW LONG IS ONE ORBIT?"
                  value={periodMin < 120 ? `${Math.round(periodMin)}` : `${(periodMin / 60).toFixed(1)}`}
                  unit={periodMin < 120 ? 'min' : 'hrs'}
                  label="per orbit"
                  badge={state.derived.periodMin.label}
                  note={periodDescription(periodMin)}
                />

                {/* ── Did You Know — the discovery moment, gold accent ── */}
                {edu?.didYouKnow && (
                  <section>
                    <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-amber-400/[0.03] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={14} className="text-amber-400" />
                        <span className="text-[11px] text-amber-300 tracking-widest font-semibold">DID YOU KNOW?</span>
                      </div>
                      <p className="text-[13px] text-orbit-white leading-relaxed">{edu.didYouKnow}</p>
                      {edu.didYouKnowSource && (
                        <p className="text-[10px] text-orbit-dim mt-2">Source: {edu.didYouKnowSource}</p>
                      )}
                    </div>
                  </section>
                )}

                {/* ── Why it matters — teal accent ── */}
                {edu?.whyItMatters && (
                  <section>
                    <SectionHeading icon={<Sparkles size={12} />} label="WHY DOES IT MATTER?" color="text-teal-400" />
                    <p className="text-[13px] text-orbit-white/80 leading-relaxed">{edu.whyItMatters}</p>
                  </section>
                )}

                {/* ── How it stays in space ── */}
                <section>
                  <SectionHeading icon={<Compass size={12} />} label="WHY DOESN'T IT FALL?" color="text-emerald-400" />
                  <p className="text-[13px] text-orbit-white/80 leading-relaxed">
                    It&apos;s actually falling toward Earth right now — but it&apos;s moving sideways
                    so incredibly fast that Earth&apos;s surface curves away beneath it faster than
                    it falls. Instead of crashing down, it keeps &ldquo;falling around&rdquo; the planet.
                  </p>
                </section>

                {/* ── Ground track — real Earth map + the satellite's actual computed path ── */}
                <section>
                  <SectionHeading icon={<Globe size={12} />} label="WHERE DOES IT FLY OVER?" color="text-cyan-400" />
                  <GroundTrackMap
                    track={state.derived.groundTrack}
                    current={state.derived.position}
                    inclinationDeg={incDeg}
                  />
                </section>

                {/* ── Orbit tilt ── */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03]">
                  <div>
                    <div className="text-[11px] text-orbit-white/80">Orbit tilt</div>
                    <div className="text-[10px] text-orbit-dim">vs. Earth&apos;s equator</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base text-orbit-white font-light">{incDeg.toFixed(1)}°</div>
                    <div className="text-[9px] text-orbit-dim/60 tracking-wider">OBSERVED</div>
                  </div>
                </div>

                {/* ── Observation capability ── */}
                <ObservationPanel catalog={cat} />

                {/* ── Technical details (collapsible — advanced info stays out of the way by default) ── */}
                <div>
                  <button
                    onClick={() => setShowTechnical((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] text-orbit-dim hover:text-orbit-white tracking-wider w-full py-1.5 transition-colors"
                  >
                    <ChevronDown size={12} className={showTechnical ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    TECHNICAL DETAILS
                  </button>
                  {showTechnical && (
                    <div className="space-y-2 pt-2 border-t border-space-border/30">
                      <TechRow label="NORAD ID" value={state.noradId} badge="OBSERVED" />
                      <TechRow label="Epoch" value={state.epoch.replace('T', ' ').replace(/\.\d+Z?$/, ' UTC')} badge="OBSERVED" />
                      <TechRow label="Inclination" value={`${incDeg.toFixed(4)}°`} badge="OBSERVED" />
                      <TechRow label="Eccentricity" value={state.elements.eccentricity.value.toFixed(7)} badge="OBSERVED" />
                      <TechRow label="Mean motion" value={`${state.elements.meanMotion.value.toFixed(8)} rev/day`} badge="OBSERVED" />
                      <TechRow label="RAAN" value={`${state.elements.raan.value.toFixed(4)}°`} badge="OBSERVED" />
                      <TechRow label="Arg. of perigee" value={`${state.elements.argPerigee.value.toFixed(4)}°`} badge="OBSERVED" />
                      <TechRow label="Highest point" value={`${Math.round(state.derived.apogeeKm.value).toLocaleString()} km`} badge="DERIVED" />
                      <TechRow label="Lowest point" value={`${Math.round(state.derived.perigeeKm.value).toLocaleString()} km`} badge="DERIVED" />
                      <div className="pt-1 border-t border-space-border/20">
                        <div className="text-[9px] text-orbit-dim/70 leading-relaxed">
                          ORBITAL ELEMENTS · SOURCE: CelesTrak<br />
                          POSITION · DERIVED FROM KEPLERIAN PROPAGATION<br />
                          DATA AGE · {state.fetchedAt ? `Fetched ${new Date(state.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC` : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Mission link ── */}
                {cat.missionId && (
                  <Link
                    href={`/missions/${cat.missionId}`}
                    className="block text-center text-[12px] text-orbit-blue hover:text-orbit-accent tracking-wider py-2.5 rounded-lg bg-orbit-blue/10 border border-orbit-blue/30 hover:border-orbit-blue/50 transition-colors"
                  >
                    VIEW FULL MISSION →
                  </Link>
                )}

                {/* ── Ask AI ── */}
                <button
                  onClick={() => onAskAI({
                    noradId: state.noradId,
                    name: state.name,
                    altitudeKm: state.derived.altitudeKm.value,
                    velocityKmS: state.derived.velocityKmS.value,
                    periodMin: state.derived.periodMin.value,
                    inclinationDeg: state.elements.inclination.value,
                    eccentricity: state.elements.eccentricity.value,
                    lat: state.derived.position.lat,
                    lon: state.derived.position.lon,
                    epoch: state.epoch,
                    dataQuality: state.dataQuality,
                    hasObservations: false,
                    anomalyFlags: [],
                  })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-purple-400/15 to-fuchsia-400/15 border border-purple-400/40 text-purple-300 hover:from-purple-400/25 hover:to-fuchsia-400/25 hover:border-purple-400/60 transition-all text-[12px] font-medium tracking-wider"
                >
                  <Sparkles size={13} />
                  ASK ORBITAL AI ABOUT THIS SATELLITE
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className={color}>{icon}</span>
      <span className="text-[10px] text-orbit-dim tracking-widest font-semibold">{label}</span>
    </div>
  );
}

const STAT_COLOR = {
  cyan:   { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/25', glow: 'shadow-[0_0_20px_-8px_rgba(34,211,238,0.4)]' },
  blue:   { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/25', glow: 'shadow-[0_0_20px_-8px_rgba(96,165,250,0.4)]' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/25', glow: 'shadow-[0_0_20px_-8px_rgba(167,139,250,0.4)]' },
} as const;

function StatCard({ icon, color, heading, value, unit, label, badge, note }: {
  icon: React.ReactNode;
  color: keyof typeof STAT_COLOR;
  heading: string;
  value: string;
  unit: string;
  label: string;
  badge: string;
  note?: string;
}) {
  const c = STAT_COLOR[color];
  return (
    <section>
      <SectionHeading icon={<span className="text-[11px]">•</span>} label={heading} color={c.text} />
      <div className={clsx('rounded-xl p-4 border', c.bg, c.border, c.glow)}>
        <div className="flex items-start gap-3">
          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', c.bg, c.text)}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={clsx('text-2xl font-light leading-none', c.text)}>{value}</span>
              <span className="text-[13px] text-orbit-white/70">{unit}</span>
              <span className="text-[9px] text-orbit-dim/50 tracking-widest ml-auto">{badge}</span>
            </div>
            <div className="text-[11px] text-orbit-dim mt-0.5">{label}</div>
          </div>
        </div>
        {note && <p className="text-[12px] text-orbit-white/70 leading-relaxed mt-2.5">{note}</p>}
      </div>
    </section>
  );
}

function TechRow({ label, value, badge }: { label: string; value: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-orbit-dim shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] text-orbit-white/80 font-mono truncate">{value}</span>
        <span className="text-[8px] text-orbit-dim/50 shrink-0">{badge}</span>
      </div>
    </div>
  );
}

/**
 * "What does it look like?" — a real photo/rendering of the satellite
 * (EDUCATIONAL DATA, see lib/satellites/imagery.ts). Never shows a broken
 * image or an unrelated stock photo: missing entries fall back to an
 * honest "image unavailable" state, and representative (not-the-exact-
 * spacecraft) images are always labeled as such.
 */
function SatelliteImageSection({ image, name }: { image: ReturnType<typeof getSatelliteImage>; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <section>
      <SectionHeading icon={<ImageIcon size={12} />} label="WHAT DOES IT LOOK LIKE?" color="text-orbit-blue" />
      <div className="rounded-xl overflow-hidden border border-space-border bg-space-deep relative aspect-[4/3]">
        {image && !failed ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-orbit-blue/30 border-t-orbit-blue animate-spin" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt}
              className={clsx('w-full h-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <ImageOff size={22} className="text-space-border" />
            <span className="text-[11px] text-orbit-dim">An image of this spacecraft isn&apos;t currently available.</span>
          </div>
        )}
      </div>
      {image && !failed && (
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-orbit-dim">
            {image.isRepresentative ? `Representative image of this satellite class` : name}
          </span>
          <span className="text-[9px] text-orbit-dim/60 tracking-wider">IMAGE · {image.source.toUpperCase()}</span>
        </div>
      )}
    </section>
  );
}

function ObservationPanel({ catalog }: { catalog: SatelliteCatalogEntry }) {
  const cap = catalog.obsCapability;
  if (cap.type === 'NONE') {
    return (
      <p className="text-[11px] text-orbit-dim leading-relaxed">
        No public video feed or radio observation data is currently available for this satellite.
      </p>
    );
  }
  const Icon = cap.type === 'LIVE_VIDEO' ? Video : cap.type === 'RADIO' ? Radio : ImageIcon;
  const title =
    cap.type === 'LIVE_VIDEO' ? 'Live video available — you can watch from space right now' :
    cap.type === 'NEAR_REAL_TIME' ? 'Near-real-time imagery available from this satellite' :
    'Radio observation data is publicly available';
  return (
    <div className="rounded-lg p-3 flex items-start gap-2.5 bg-emerald-400/5 border border-emerald-400/20">
      <Icon size={15} className="text-emerald-400 shrink-0 mt-0.5" />
      <div>
        <div className="text-[12px] text-orbit-white">{title}</div>
        <div className="text-[10px] text-orbit-dim mt-0.5">Source: {cap.source}</div>
        {cap.url && (
          <a href={cap.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-orbit-blue hover:text-orbit-accent mt-1.5">
            <ExternalLink size={11} />
            {cap.type === 'LIVE_VIDEO' ? 'Watch the live stream' : 'View data portal'}
          </a>
        )}
      </div>
    </div>
  );
}
