'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { MissionPulse } from '@/components/MissionPulse';
import { MissionCard } from '@/components/MissionCard';
import { AIAnalyst } from '@/components/AIAnalyst';
import { RiskHUD, RiskEntry } from '@/components/RiskHUD';
import { MISSIONS, getMissionsByDestination } from '@/lib/missions';
import { Mission, AIContext, OrbitalRiskContext } from '@/lib/types';
import { Sparkles, ChevronRight, ArrowRight, Database } from 'lucide-react';

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
  earth: { title: 'EARTH', desc: 'Low Earth Orbit · Observation · Crewed', color: 'text-blue-400', href: '/missions?dest=earth' },
  moon: { title: 'MOON', desc: 'Lunar Orbit · Artemis · Surface', color: 'text-slate-300', href: '/missions?dest=moon' },
  mars: { title: 'MARS', desc: 'Rovers · Orbiters · Sample Caching', color: 'text-orange-400', href: '/missions?dest=mars' },
};

export default function HomePage() {
  const [selectedPlanet, setSelectedPlanet] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  // Simulation elapsed seconds — updated by SpaceScene's clock ticker every 250 ms
  const [simTimeSec, setSimTimeSec] = useState(0);
  const handleSimTimeUpdate = useCallback((t: number) => setSimTimeSec(t), []);
  // Risk context — set when user clicks "Analyze with AI" on a RiskHUD card
  const [activeRisk, setActiveRisk] = useState<OrbitalRiskContext | null>(null);

  const earthMissions = useMemo(() => getMissionsByDestination('earth'), []);
  const moonMissions = useMemo(() => getMissionsByDestination('moon'), []);
  const marsMissions = useMemo(() => getMissionsByDestination('mars'), []);

  const featuredMissions = useMemo(
    () =>
      MISSIONS.filter((m) =>
        ['perseverance', 'artemis-2', 'curiosity', 'iss', 'lro', 'mro'].includes(m.id)
      ),
    []
  );

  const aiContext: AIContext = {
    selectedMission: selectedMission || undefined,
    selectedPlanet: selectedPlanet as AIContext['selectedPlanet'],
    visibleMissions: selectedPlanet
      ? getMissionsByDestination(selectedPlanet)
      : MISSIONS.filter((m) => ['active', 'science-operations', 'surface-operations'].includes(m.status)),
    selectedRisk: activeRisk ?? undefined,
  };

  const handlePlanetSelect = (planet: string) => {
    setSelectedPlanet((prev) => (prev === planet ? '' : planet));
    setSelectedMission(null);
  };

  // Called by RiskHUD when user clicks "Analyze with AI" on a conjunction card.
  // Maps the RiskEntry shape into OrbitalRiskContext and opens the AI panel.
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

  return (
    <div className="min-h-screen bg-space-black">
      <Navigation selectedPlanet={selectedPlanet} onPlanetSelect={handlePlanetSelect} />

      {/* Hero Section — 3D Visualization */}
      <section className="relative h-[calc(100vh-3.5rem)] mt-14 overflow-hidden">
        {/* Scene */}
        <div className="absolute inset-0">
          <SpaceScene
            selectedPlanet={selectedPlanet}
            missions={MISSIONS}
            onPlanetSelect={handlePlanetSelect}
            onMissionSelect={setSelectedMission}
            selectedMission={selectedMission}
            onSimTimeUpdate={handleSimTimeUpdate}
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

        {/* Planet info panel (when selected) */}
        {selectedPlanet && PLANET_LABELS[selectedPlanet] && (
          <div className="absolute top-8 right-6 md:right-10 animate-slide-up">
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

              {/* Recent missions */}
              <div className="space-y-1.5 mb-3">
                {getMissionsByDestination(selectedPlanet)
                  .filter((m) => ['active', 'science-operations', 'surface-operations'].includes(m.status))
                  .slice(0, 3)
                  .map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-[11px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-orbit-dim">{m.shortName || m.name}</span>
                    </div>
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
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 pointer-events-auto">
          {['earth', 'moon', 'mars'].map((p) => {
            const cfg = { earth: { emoji: '🌎', label: 'EARTH', color: 'text-blue-400' }, moon: { emoji: '🌙', label: 'MOON', color: 'text-slate-300' }, mars: { emoji: '🔴', label: 'MARS', color: 'text-orange-400' } }[p]!;
            return (
              <button
                key={p}
                onClick={() => handlePlanetSelect(p)}
                className={`flex items-center gap-2 px-4 py-2.5 glass rounded-lg border transition-all text-xs tracking-wider ${
                  selectedPlanet === p
                    ? `border-orbit-blue/50 ${cfg.color} bg-white/5`
                    : 'border-space-border text-orbit-dim hover:text-orbit-white hover:border-space-muted'
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* AI Analyst button — kept for deep conversation mode */}
        <button
          onClick={() => setAiOpen(true)}
          className="absolute bottom-8 left-6 flex items-center gap-2 px-4 py-2.5 glass rounded-lg border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-xs tracking-wider"
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
        onClose={() => { setAiOpen(false); setActiveRisk(null); }}
      />

      {/* Orbital Safety Monitor HUD */}
      <RiskHUD simulationTimeSec={simTimeSec} onAnalyzeWithAI={handleAnalyzeRisk} />
    </div>
  );
}
