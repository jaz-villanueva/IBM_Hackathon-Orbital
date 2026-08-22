'use client';

import { useState, useMemo, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { MissionCatalog } from '@/components/MissionCatalog';
import { AIAnalyst } from '@/components/AIAnalyst';
import { MISSIONS, getMissionsByDestination } from '@/lib/missions';
import { AIContext, Destination } from '@/lib/types';
import { Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function MissionsContent() {
  const searchParams = useSearchParams();
  const destParam = searchParams.get('dest') as Destination | null;

  const [aiOpen, setAiOpen] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState(destParam || '');

  const aiContext: AIContext = {
    selectedPlanet: selectedPlanet as Destination | undefined,
    visibleMissions: selectedPlanet ? getMissionsByDestination(selectedPlanet) : MISSIONS,
  };

  const stats = useMemo(() => ({
    total: MISSIONS.length,
    active: MISSIONS.filter((m) => ['active', 'science-operations', 'surface-operations', 'extended'].includes(m.status)).length,
    earth: getMissionsByDestination('earth').length,
    moon: getMissionsByDestination('moon').length,
    mars: getMissionsByDestination('mars').length,
  }), []);

  return (
    <div className="min-h-screen bg-space-black">
      <Navigation selectedPlanet={selectedPlanet} onPlanetSelect={setSelectedPlanet} />

      <div className="pt-14">
        {/* Header */}
        <div className="border-b border-space-border bg-space-navy/50">
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
            <div className="text-[10px] text-orbit-dim tracking-widest mb-1">ORBITAL</div>
            <h1 className="text-3xl font-light text-orbit-white tracking-wide mb-2">MISSION CATALOG</h1>
            <p className="text-orbit-dim text-sm">
              Active and recent space missions across Earth, Moon, and Mars.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-5">
              {[
                { label: 'TOTAL MISSIONS', value: stats.total },
                { label: 'ACTIVE', value: stats.active, dot: 'bg-emerald-400' },
                { label: '🌎 EARTH', value: stats.earth },
                { label: '🌙 MOON', value: stats.moon },
                { label: '🔴 MARS', value: stats.mars },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  {s.dot && <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse`} />}
                  <span className="text-[10px] text-orbit-dim tracking-wider">{s.label}</span>
                  <span className="text-orbit-white font-semibold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Catalog */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
          <MissionCatalog
            missions={MISSIONS}
            initialDestination={destParam || undefined}
          />
        </div>
      </div>

      {/* AI button */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 glass rounded-lg border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-xs tracking-wider z-30"
      >
        <Sparkles size={13} />
        <span>AI ANALYST</span>
      </button>

      <AIAnalyst context={aiContext} isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

export default function MissionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-space-black flex items-center justify-center"><div className="text-orbit-dim text-sm">Loading missions...</div></div>}>
      <MissionsContent />
    </Suspense>
  );
}
