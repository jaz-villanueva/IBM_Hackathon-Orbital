'use client';

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { MissionPulse } from '@/components/MissionPulse';
import { MissionCard } from '@/components/MissionCard';
import { AIAnalyst } from '@/components/AIAnalyst';
import { RiskHUD, RiskEntry } from '@/components/RiskHUD';
import { EarthTelemetryHUD } from '@/components/satellites/EarthTelemetryHUD';
import { SatelliteHUDPanel } from '@/components/satellites/SatelliteHUDPanel';
import { buildSceneObject } from '@/lib/satellites/scene';
import { MISSIONS, getMissionsByDestination } from '@/lib/missions';
import { Mission, AIContext, OrbitalRiskContext, FleetSatelliteEntry, SatelliteAIContext } from '@/lib/types';
import { Sparkles, ChevronRight, ArrowRight, Database, ChevronDown } from 'lucide-react';
import type { ExtraOrbiter } from '@/components/SpaceScene';

// Dynamically import ThreeJS scene to avoid SSR issues
const SpaceScene = dynamic(() => import('@/components/SpaceScene').then((m) => ({ default: m.SpaceScene })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border border-orbit-blue/30 border-t-orbit-blue animate-spin mx-auto" />
        <div className="text-[11px] text-orbit-dim tracking-widest">INITIALIZING VISUALIZATION</div>
      </div>
    </div>
  ),
});

const PLANET_LABELS: Record<string, { title: string; desc: string; color: string; href: string }> = {
  earth:   { title: 'EARTH',   desc: 'Low Earth Orbit · Observation · Crewed',       color: 'text-blue-400',   href: '/missions?dest=earth' },
  moon:    { title: 'MOON',    desc: 'Lunar Orbit · Artemis · Surface',               color: 'text-slate-300',  href: '/missions?dest=moon' },
  mars:    { title: 'MARS',    desc: 'Rovers · Orbiters · Sample Caching',            color: 'text-orange-400', href: '/missions?dest=mars' },
  jupiter: { title: 'JUPITER', desc: 'Juno · Europa Clipper · JUICE · Galilean Moons', color: 'text-orange-300', href: '/missions?dest=jupiter' },
  saturn:  { title: 'SATURN',  desc: 'Cassini Legacy · Titan · Ring System',          color: 'text-yellow-300', href: '/missions?dest=saturn' },
  uranus:  { title: 'URANUS',  desc: 'Ice Giant · Voyager 2 · Future Orbiter',        color: 'text-cyan-300',   href: '/missions?dest=uranus' },
  neptune: { title: 'NEPTUNE', desc: 'Ice Giant · Voyager 2 · Triton',                color: 'text-blue-300',   href: '/missions?dest=neptune' },
};

function HomePageInner() {
  const searchParams   = useSearchParams();
  const planetParam    = searchParams.get('planet');
  const satelliteParam = searchParams.get('satellite');

  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  /** Ref to the hero / 3D-map section so we can scroll back to it. */
  const heroRef = useRef<HTMLElement>(null);

  // ── Earth Mode: live satellite fleet ────────────────────────────────────
  const [fleet, setFleet] = useState<FleetSatelliteEntry[]>([]);
  const [fleetTotals, setFleetTotals] = useState({ total: 0, leo: 0, meo: 0, geo: 0 });
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string | null>(null);
  const [aiSatellite, setAiSatellite] = useState<SatelliteAIContext | null>(null);
  /** One-off ExtraOrbiter for a deep-linked/selected satellite not present in the fetched fleet groups. */
  const [deepLinkOrbiter, setDeepLinkOrbiter] = useState<ExtraOrbiter | null>(null);

  // Fetch the live fleet once, the first time Earth is selected.
  useEffect(() => {
    if (selectedPlanet !== 'earth' || fleet.length > 0 || fleetLoading) return;
    setFleetLoading(true);
    setFleetError(null);
    fetch('/api/satellites/fleet')
      .then(async (res) => {
        const json = await res.json();
        if (json.error) setFleetError(json.error);
        setFleet(json.satellites || []);
        setFleetTotals(json.totals || { total: 0, leo: 0, meo: 0, geo: 0 });
      })
      .catch(() => setFleetError('Could not reach the Orbital server for live satellite data.'))
      .finally(() => setFleetLoading(false));
  }, [selectedPlanet, fleet.length, fleetLoading]);

  // A satellite selected via the HUD/3D click that isn't in the fetched fleet groups
  // (e.g. a deep-linked catalog satellite like Terra) still needs a scene entry for
  // the 3D marker/camera focus — fetch its params once and merge them in.
  useEffect(() => {
    if (!selectedSatelliteId) { setDeepLinkOrbiter(null); return; }
    if (fleet.some((s) => s.id === selectedSatelliteId)) { setDeepLinkOrbiter(null); return; }
    let cancelled = false;
    fetch(`/api/satellites/${selectedSatelliteId}`)
      .then(async (res) => {
        const json = await res.json();
        if (cancelled || !json.orbitalParams || !json.catalog) return;
        setDeepLinkOrbiter({
          id: selectedSatelliteId,
          params: json.orbitalParams,
          sceneObject: buildSceneObject({ id: selectedSatelliteId, name: json.catalog.name, shortName: json.catalog.shortName, agency: json.catalog.agency, missionId: json.catalog.missionId }),
        });
      })
      .catch(() => { /* HUD panel already surfaces its own error; camera focus just degrades gracefully */ });
    return () => { cancelled = true; };
  }, [selectedSatelliteId, fleet]);

  const extraOrbiters = useMemo<ExtraOrbiter[]>(() => {
    const fromFleet = fleet.map((s) => ({
      id: s.id,
      params: s.orbitalParams,
      sceneObject: buildSceneObject({ id: s.id, name: s.name, missionId: s.missionId, orbitRegime: s.orbitRegime }),
    }));
    if (deepLinkOrbiter && !fromFleet.some((o) => o.id === deepLinkOrbiter.id)) {
      return [...fromFleet, deepLinkOrbiter];
    }
    return fromFleet;
  }, [fleet, deepLinkOrbiter]);

  const handleSelectSatellite = useCallback((id: string) => {
    setSelectedSatelliteId(id);
    setAiSatellite(null);
  }, []);

  const handleBackToFleet = useCallback(() => {
    setSelectedSatelliteId(null);
  }, []);

  const handleAskAISatellite = useCallback((sat: SatelliteAIContext) => {
    setAiSatellite(sat);
    setAiOpen(true);
  }, []);

  /** SpaceScene's onObjectSelect — fires for ANY clicked object, mission or not. */
  const handleObjectSelect = useCallback((obj: { missionId: string } | null) => {
    if (!obj) { setSelectedSatelliteId(null); return; }
    setSelectedSatelliteId(obj.missionId);
    setAiSatellite(null);
  }, []);

  // Deep link: /?satellite=<id> selects Earth Mode with that satellite focused.
  useEffect(() => {
    if (satelliteParam) {
      setSelectedPlanet('earth');
      setSelectedSatelliteId(satelliteParam);
    }
  }, [satelliteParam]);

  /**
   * When arriving via /?planet=earth (i.e. from the top nav on another route),
   * auto-select the requested planet so the camera transitions to it immediately.
   * We only fire this once per navigation — the effect re-runs only when planetParam
   * changes (i.e. a new navigation to this page).
   */
  useEffect(() => {
    if (planetParam && ['earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(planetParam)) {
      setSelectedPlanet(planetParam);
      setSelectedMission(null);
      // Scroll hero into view so the map is visible
      heroRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [planetParam]);

  const earthMissions   = useMemo(() => getMissionsByDestination('earth'), []);
  const moonMissions    = useMemo(() => getMissionsByDestination('moon'), []);
  const marsMissions    = useMemo(() => getMissionsByDestination('mars'), []);
  const jupiterMissions = useMemo(() => getMissionsByDestination('jupiter'), []);
  const saturnMissions  = useMemo(() => getMissionsByDestination('saturn'), []);
  const uranusMissions  = useMemo(() => getMissionsByDestination('uranus'), []);
  const neptuneMissions = useMemo(() => getMissionsByDestination('neptune'), []);

  const featuredMissions = useMemo(
    () =>
      MISSIONS.filter((m) =>
        ['perseverance', 'artemis-2', 'curiosity', 'iss', 'lro', 'mro'].includes(m.id)
      ),
    []
  );

  // Simulation elapsed seconds — updated by SpaceScene's clock ticker every 250 ms
  const [simTimeSec, setSimTimeSec] = useState(0);
  const handleSimTimeUpdate = useCallback((t: number) => setSimTimeSec(t), []);
  // Risk context — set when user clicks "Analyze with AI" on a RiskHUD card
  const [activeRisk, setActiveRisk] = useState<OrbitalRiskContext | null>(null);

  const aiContext: AIContext = {
    selectedMission: selectedMission || undefined,
    selectedPlanet: (selectedPlanet ?? '') as AIContext['selectedPlanet'],
    visibleMissions: selectedPlanet
      ? getMissionsByDestination(selectedPlanet)
      : MISSIONS.filter((m) => ['active', 'science-operations', 'surface-operations'].includes(m.status)),
    selectedRisk: activeRisk ?? undefined,
    selectedSatellite: aiSatellite ?? undefined,
  };

  /**
   * Toggle-select a planet. Clicking the already-selected planet deselects it.
   * Switching to a different planet clears the selected mission.
   * Passing '' or 'home' deselects (used by deep-space search results).
   */
  const handlePlanetSelect = useCallback((planet: string) => {
    const dest = planet === '' || planet === 'home' ? null : planet;
    setSelectedSatelliteId(null);
    setSelectedPlanet(prev => {
      if (dest !== null && prev === dest) {
        setSelectedMission(null);
        return null;
      }
      setSelectedMission(null);
      return dest;
    });
  }, []);

  /**
   * Select a mission from the Active Missions widget.
   * Sets the mission in parent state so SpaceScene can respond via prop.
   * Does NOT navigate to /missions/[id].
   */
  const handleWidgetMissionSelect = useCallback((mission: Mission) => {
    const dest = mission.destination === 'deep-space' ? null : mission.destination;
    if (dest) setSelectedPlanet(dest);
    setSelectedMission(mission);
  }, []);

  // Called by RiskHUD when user clicks "Analyze with AI" on a conjunction card.
  const handleAnalyzeRisk = useCallback((risk: RiskEntry) => {
    const ctx: OrbitalRiskContext = {
      pairId:                    risk.pairId,
      objectAName:               risk.objectA.name,
      objectBName:               risk.objectB.name,
      destination:               risk.objectA.destination,
      objectAAltitudeKm:         risk.objectA.altitudeKm,
      objectBAltitudeKm:         risk.objectB.altitudeKm,
      riskLevel:                 risk.riskLevel,
      compositeScore:            risk.compositeScore,
      orbitalCompatibilityScore: risk.orbitalCompatibilityScore,
      trajectoryRiskScore:       risk.trajectoryRiskScore,
      currentSeparationKm:       risk.currentSeparationKm,
      relativeSpeedKmS:          risk.relativeSpeedKmS,
      closingSpeedKmS:           risk.closingSpeedKmS,
      isApproaching:             risk.isApproaching,
      timeToClosestApproachSec:  risk.timeToClosestApproachSec,
      predictedMissDistanceKm:   risk.predictedMissDistanceKm,
      tcaInvalidReason:          risk.tcaInvalidReason,
      dataQuality:               risk.dataQuality,
      explanation:               risk.explanation,
    };
    setActiveRisk(ctx);
    setAiOpen(true);
  }, []);

  /** Space bar → deselect everything and return to overview */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return;
      e.preventDefault();
      setSelectedPlanet(null);
      setSelectedMission(null);
      setSelectedSatelliteId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /** Scroll-down floating button handler */
  const handleScrollDown = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: heroBottom,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  }, []);

  /**
   * Scroll the page back to the 3D map hero section.
   * Called by the top-nav Earth/Moon/Mars buttons so that clicking them from
   * anywhere below the map first returns the user to the map, then the camera
   * transitions to the selected body.
   */
  const handleScrollToMap = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hero.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }, []);

  return (
    <div className="min-h-screen bg-space-black">
      <Navigation
        selectedPlanet={selectedPlanet ?? ''}
        onPlanetSelect={handlePlanetSelect}
        onScrollToMap={handleScrollToMap}
      />

      {/* Hero Section — 3D Visualization */}
      <section ref={heroRef} className="relative h-[calc(100vh-3.5rem)] mt-14 overflow-hidden">
        {/* Scene */}
        <div className="absolute inset-0">
          <SpaceScene
            selectedPlanet={selectedPlanet}
            missions={MISSIONS}
            onPlanetSelect={handlePlanetSelect}
            onMissionSelect={setSelectedMission}
            selectedMission={selectedMission}
            onSimTimeUpdate={handleSimTimeUpdate}
            extraOrbiters={extraOrbiters}
            onObjectSelect={handleObjectSelect}
            focusedOrbiterId={selectedPlanet === 'earth' ? selectedSatelliteId : null}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-space-black pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-space-black/20 via-transparent to-space-black/20 pointer-events-none" />

        {/* Top-left hero copy */}
        <div className="absolute top-8 left-6 md:left-10 pointer-events-none">
          <div className="text-[9px] text-orbit-dim tracking-widest mb-2 font-mono">ORBITAL · AI MISSION ATLAS</div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extralight text-orbit-white tracking-wider leading-none">
            SEE WHAT
            <br />
            <span className="text-orbit-blue">HUMANITY</span>
            <br />
            IS DOING
            <br />
            IN SPACE.
          </h1>
          <p className="text-orbit-dim text-sm mt-4 max-w-[260px] leading-relaxed hidden md:block">
            An AI-powered atlas of active missions across Earth, Moon, and Mars.
          </p>
        </div>

        {/* Earth Mode: telemetry-styled HUD replaces the standard planet info panel */}
        {selectedPlanet === 'earth' && (
          selectedSatelliteId ? (
            <SatelliteHUDPanel id={selectedSatelliteId} onBack={handleBackToFleet} onAskAI={handleAskAISatellite} />
          ) : (
            <EarthTelemetryHUD
              satellites={fleet}
              totals={fleetTotals}
              loading={fleetLoading}
              error={fleetError}
              onSelect={handleSelectSatellite}
            />
          )
        )}

        {/* Planet info panel (Moon/Mars/outer planets — unchanged) */}
        {selectedPlanet && selectedPlanet !== 'earth' && PLANET_LABELS[selectedPlanet] && (
          <div className="absolute top-[110px] right-[15px] animate-slide-up">
            <div className="glass rounded-xl p-5 w-64 border border-space-border">
              <div className={`text-[10px] tracking-widest font-semibold mb-1 ${PLANET_LABELS[selectedPlanet].color}`}>
                {PLANET_LABELS[selectedPlanet].title}
              </div>
              <div className="text-[12px] text-orbit-dim mb-3">{PLANET_LABELS[selectedPlanet].desc}</div>

              {/* Active mission count */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-orbit-dim">Active missions</span>
                <span className="text-orbit-white font-semibold text-sm">
                  {getMissionsByDestination(selectedPlanet).filter((m) =>
                    ['active', 'science-operations', 'surface-operations', 'extended', 'cruise'].includes(m.status)
                  ).length}
                </span>
              </div>

              {/* Active missions — scrollable, clickable, selects mission on the 3D map.
                  max-h shows ~3 rows; remaining missions reachable by scrolling.
                  onWheel/onTouchMove stop propagation so the page doesn't scroll while
                  the user is scrolling within this list. */}
              <div
                className="mb-3 overflow-y-auto pr-1"
                role="list"
                aria-label="Active missions"
                tabIndex={0}
                style={{
                  maxHeight: '4.75rem',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(100,116,139,0.4) transparent',
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                {getMissionsByDestination(selectedPlanet!)
                  .filter((m) => ['active', 'science-operations', 'surface-operations'].includes(m.status))
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWidgetMissionSelect(m);
                      }}
                      role="listitem"
                      className={`w-full flex items-center gap-2 text-[11px] text-left rounded px-1 py-1 -mx-1 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orbit-blue/50 ${
                        selectedMission?.id === m.id ? 'text-orbit-white' : 'text-orbit-dim hover:text-orbit-white'
                      }`}
                      aria-label={`Select ${m.shortName || m.name} on the 3D map`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        selectedMission?.id === m.id ? 'bg-orbit-blue animate-pulse' : 'bg-emerald-400 animate-pulse'
                      }`} />
                      <span className="truncate">{m.shortName || m.name}</span>
                    </button>
                  ))}
              </div>

              <Link
                href={PLANET_LABELS[selectedPlanet].href}
                className="flex items-center gap-2 text-[11px] text-orbit-blue hover:text-orbit-accent tracking-wider"
              >
                <span>EXPLORE ALL MISSIONS</span>
                <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* Bottom orbit controls */}
        <div className="absolute bottom-[64px] left-0 right-0 flex justify-center gap-1.5 flex-wrap px-4 pointer-events-auto">
          {[
            { id: 'earth',   emoji: '🌎', label: 'EARTH',   color: 'text-blue-400' },
            { id: 'moon',    emoji: '🌙', label: 'MOON',    color: 'text-slate-300' },
            { id: 'mars',    emoji: '🔴', label: 'MARS',    color: 'text-orange-400' },
            { id: 'jupiter', emoji: '🟠', label: 'JUPITER', color: 'text-orange-300' },
            { id: 'saturn',  emoji: '🪐', label: 'SATURN',  color: 'text-yellow-300' },
            { id: 'uranus',  emoji: '🔵', label: 'URANUS',  color: 'text-cyan-300' },
            { id: 'neptune', emoji: '💙', label: 'NEPTUNE', color: 'text-blue-300' },
          ].map((cfg) => (
            <button
              key={cfg.id}
              onClick={() => handlePlanetSelect(cfg.id)}
              aria-pressed={selectedPlanet === cfg.id}
              className={`flex items-center gap-1.5 px-3 py-2 glass rounded-lg border transition-all text-xs tracking-wider ${
                selectedPlanet === cfg.id
                  ? `border-orbit-blue/50 ${cfg.color} bg-white/5`
                  : 'border-space-border text-orbit-dim hover:text-orbit-white hover:border-space-muted'
              }`}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* Scroll-down floating button — centered via fixed full-width container */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={handleScrollDown}
            aria-label="Scroll down to see more content"
            className="flex items-center justify-center w-8 h-8 glass rounded-full border border-space-border/50 text-orbit-dim hover:text-orbit-white hover:border-space-muted transition-colors pointer-events-auto"
          >
            <ChevronDown size={15} />
          </button>
        </div>

        {/* AI Analyst button — kept for deep conversation mode */}
        <button
          onClick={() => setAiOpen(true)}
          className="absolute bottom-16 right-4 flex items-center gap-2 px-4 py-2.5 glass rounded-lg border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-xs tracking-wider"
        >
          <Sparkles size={13} />
          <span>AI ANALYST</span>
        </button>
      </section>

      {/* Content below the hero */}
      <div className="relative z-10 bg-space-black">
        {/* Mission Pulse */}
        <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-16">
          <MissionPulse
            earthMissions={earthMissions}
            moonMissions={moonMissions}
            marsMissions={marsMissions}
            jupiterMissions={jupiterMissions}
            saturnMissions={saturnMissions}
            uranusMissions={uranusMissions}
            neptuneMissions={neptuneMissions}
          />
        </section>

        {/* Featured Missions */}
        <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-8 border-t border-space-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] text-orbit-dim tracking-widest mb-1">FEATURED</div>
              <h2 className="text-xl font-light text-orbit-white tracking-wide">KEY MISSIONS</h2>
            </div>
            <Link href="/missions" className="flex items-center gap-2 text-xs text-orbit-blue hover:text-orbit-accent tracking-wider">
              <span>ALL MISSIONS</span>
              <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredMissions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>

        {/* Data Sources section */}
        <section className="max-w-screen-xl mx-auto px-4 md:px-8 py-12 border-t border-space-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-[10px] text-orbit-dim tracking-widest mb-2">DATA INTEGRITY</div>
              <h2 className="text-xl font-light text-orbit-white tracking-wide mb-3">TRANSPARENT DATA SOURCES</h2>
              <p className="text-orbit-dim text-sm leading-relaxed mb-4">
                Every data point in ORBITAL is labeled with its provenance. We don&apos;t invent telemetry. 
                We only display what&apos;s publicly available from authoritative sources — and we tell you exactly where it came from.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'NASA', url: 'https://api.nasa.gov' },
                  { name: 'CelesTrak', url: 'https://celestrak.org' },
                  { name: 'SatNOGS', url: 'https://db.satnogs.org' },
                  { name: 'ESA', url: 'https://www.esa.int' },
                ].map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 glass-subtle rounded border border-space-border hover:border-orbit-blue/30 text-xs text-orbit-dim hover:text-orbit-white transition-colors"
                  >
                    <Database size={11} />
                    {s.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'OBSERVED', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', desc: 'Data directly from NASA, ESA, CelesTrak, SatNOGS' },
                { label: 'DERIVED', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', desc: 'Mathematically calculated from public observations' },
                { label: 'AI', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30', desc: 'AI-generated analysis, summaries, and insights' },
                { label: 'ESTIMATED', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', desc: 'Approximate — based on typical mission parameters' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 glass-subtle rounded-lg">
                  <div className={`px-2 py-0.5 rounded border text-[9px] tracking-widest font-medium shrink-0 mt-0.5 ${item.color}`}>
                    {item.label}
                  </div>
                  <div className="text-[12px] text-orbit-dim leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-space-border py-8 px-4 md:px-8">
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 relative">
                <div className="absolute inset-0 rounded-full border border-orbit-blue/50" />
                <div className="absolute inset-[3px] rounded-full border border-orbit-cyan/30" />
                <div className="absolute inset-[6px] rounded-full bg-orbit-blue/20" />
              </div>
              <div>
                <div className="text-xs font-semibold tracking-widest text-orbit-white">ORBITAL</div>
                <div className="text-[9px] text-orbit-dim tracking-widest">AI MISSION ATLAS</div>
              </div>
            </div>
            <div className="text-[11px] text-orbit-dim text-center">
              Data sourced from NASA, ESA, CelesTrak, and SatNOGS public APIs.
              <br />
              Not affiliated with any space agency. Built for educational exploration.
            </div>
            <div className="text-[11px] text-orbit-dim">
              {new Date().getFullYear()} ORBITAL
            </div>
          </div>
        </footer>
      </div>

      {/* AI Analyst Panel */}
      <AIAnalyst
        context={aiContext}
        isOpen={aiOpen}
        onClose={() => { setAiOpen(false); setActiveRisk(null); setAiSatellite(null); }}
      />

      {/* Orbital Safety Monitor HUD */}
      <RiskHUD simulationTimeSec={simTimeSec} onAnalyzeWithAI={handleAnalyzeRisk} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
