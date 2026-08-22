'use client';

import { useState } from 'react';
import { AIAnalyst } from './AIAnalyst';
import { Mission, AIContext } from '@/lib/types';
import { Sparkles } from 'lucide-react';

export function AIAnalystWrapper({ mission }: { mission: Mission }) {
  const [aiOpen, setAiOpen] = useState(false);
  const context: AIContext = {
    selectedMission: mission,
    selectedPlanet: mission.destination,
  };

  return (
    <>
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 glass rounded-lg border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-xs tracking-wider z-30"
      >
        <Sparkles size={13} />
        <span>ASK AI ABOUT THIS MISSION</span>
      </button>
      <AIAnalyst context={context} isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
