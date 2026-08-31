'use client';

import { Mission } from '@/lib/types';
import { PlanetIcon } from './PlanetIcon';
import { Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface MissionPulseProps {
  mercuryMissions: Mission[];
  venusMissions: Mission[];
  earthMissions: Mission[];
  moonMissions: Mission[];
  marsMissions: Mission[];
  jupiterMissions: Mission[];
  saturnMissions: Mission[];
  uranusMissions: Mission[];
  neptuneMissions: Mission[];
}

const DEST_CONFIG = {
  mercury: {
    label: 'MERCURY',
    emoji: '☿',
    color: 'text-stone-400',
    bg: 'bg-stone-400/10',
    border: 'border-stone-400/20',
    dotColor: 'bg-stone-400',
    highlights: [
      'BepiColombo (ESA/JAXA) en route — Mercury orbit insertion targeted November 2026.',
      'MESSENGER confirmed water ice in permanently shadowed polar craters (2012).',
    ],
  },
  venus: {
    label: 'VENUS',
    emoji: '♀',
    color: 'text-yellow-600',
    bg: 'bg-yellow-600/10',
    border: 'border-yellow-600/20',
    dotColor: 'bg-yellow-600',
    highlights: [
      'Three future missions selected: DAVINCI & VERITAS (NASA) and EnVision (ESA).',
      'Akatsuki (JAXA) concluded Venus cloud observations in September 2025.',
    ],
  },
  earth: {
    label: 'EARTH',
    emoji: '🌎',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    dotColor: 'bg-blue-400',
    highlights: [
      'ISS maintains continuous crewed presence in low Earth orbit.',
      'Multiple Earth observation satellites tracking climate change.',
    ],
  },
  moon: {
    label: 'MOON',
    emoji: '🌙',
    color: 'text-slate-300',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    dotColor: 'bg-slate-300',
    highlights: [
      'Artemis II crewed lunar flyby targeted for 2025.',
      'LRO continues detailed polar mapping after 15+ years in orbit.',
    ],
  },
  mars: {
    label: 'MARS',
    emoji: '🔴',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    dotColor: 'bg-orange-400',
    highlights: [
      'Two rovers actively exploring the Martian surface.',
      'Multiple orbiters conducting atmospheric science and relay.',
    ],
  },
  jupiter: {
    label: 'JUPITER',
    emoji: '🟠',
    color: 'text-orange-300',
    bg: 'bg-orange-300/10',
    border: 'border-orange-300/20',
    dotColor: 'bg-orange-300',
    highlights: [
      'Juno orbiting Jupiter — studying interior, magnetic field, and aurora.',
      'Europa Clipper and JUICE both en route, targeting 2030–2031 arrival.',
    ],
  },
  saturn: {
    label: 'SATURN',
    emoji: '🪐',
    color: 'text-yellow-300',
    bg: 'bg-yellow-300/10',
    border: 'border-yellow-300/20',
    dotColor: 'bg-yellow-300',
    highlights: [
      'Cassini–Huygens completed the most comprehensive Saturn survey ever.',
      'Dragonfly rotorcraft lander to Titan planned for 2028 launch.',
    ],
  },
  uranus: {
    label: 'URANUS',
    emoji: '🔵',
    color: 'text-cyan-300',
    bg: 'bg-cyan-300/10',
    border: 'border-cyan-300/20',
    dotColor: 'bg-cyan-300',
    highlights: [
      'Voyager 2 remains the only spacecraft to have visited Uranus (1986).',
      'Uranus Orbiter and Probe ranked top flagship priority by Decadal Survey.',
    ],
  },
  neptune: {
    label: 'NEPTUNE',
    emoji: '💙',
    color: 'text-blue-300',
    bg: 'bg-blue-300/10',
    border: 'border-blue-300/20',
    dotColor: 'bg-blue-300',
    highlights: [
      'Voyager 2 completed the only flyby of Neptune in 1989.',
      'Triton\'s nitrogen geysers make it a priority target for future missions.',
    ],
  },
};

function countActive(missions: Mission[]) {
  return missions.filter((m) =>
    ['active', 'science-operations', 'surface-operations', 'extended', 'cruise'].includes(m.status)
  ).length;
}

export function MissionPulse({ mercuryMissions, venusMissions, earthMissions, moonMissions, marsMissions, jupiterMissions, saturnMissions, uranusMissions, neptuneMissions }: MissionPulseProps) {
  const destData = [
    { key: 'mercury' as const, missions: mercuryMissions, cfg: DEST_CONFIG.mercury },
    { key: 'venus' as const, missions: venusMissions, cfg: DEST_CONFIG.venus },
    { key: 'earth' as const, missions: earthMissions, cfg: DEST_CONFIG.earth },
    { key: 'moon' as const, missions: moonMissions, cfg: DEST_CONFIG.moon },
    { key: 'mars' as const, missions: marsMissions, cfg: DEST_CONFIG.mars },
    { key: 'jupiter' as const, missions: jupiterMissions, cfg: DEST_CONFIG.jupiter },
    { key: 'saturn' as const, missions: saturnMissions, cfg: DEST_CONFIG.saturn },
    { key: 'uranus' as const, missions: uranusMissions, cfg: DEST_CONFIG.uranus },
    { key: 'neptune' as const, missions: neptuneMissions, cfg: DEST_CONFIG.neptune },
  ];

  const totalActive = destData.reduce((acc, d) => acc + countActive(d.missions), 0);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-orbit-blue" />
            <span className="text-[10px] text-orbit-dim tracking-widest">GLOBAL STATUS</span>
          </div>
          <h2 className="text-2xl font-light text-orbit-white tracking-wide">MISSION PULSE</h2>
          <p className="text-sm text-orbit-dim mt-1">What&apos;s happening in space right now</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-light text-orbit-white">{totalActive}</div>
          <div className="text-[10px] text-orbit-dim tracking-wider">ACTIVE MISSIONS</div>
        </div>
      </div>

      {/* Destination cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {destData.map(({ key, missions, cfg }) => {
          const active = countActive(missions);
          const total = missions.length;

          return (
            <Link
              key={key}
              href={`/missions?dest=${key}`}
              className={`glass rounded-xl p-5 border ${cfg.border} hover:${cfg.bg} transition-all group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <PlanetIcon planet={key} size={28} className="block mb-1.5" />
                  <div className={`text-xs tracking-widest font-semibold ${cfg.color}`}>{cfg.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-light text-orbit-white">{active}</div>
                  <div className="text-[10px] text-orbit-dim">active / {total} total</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-px bg-space-border mb-3 relative overflow-visible">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-1000 ${cfg.dotColor.replace('bg-', 'bg-').replace('400', '400/60')}`}
                  style={{ width: `${total > 0 ? (active / total) * 100 : 0}%` }}
                />
              </div>

              {/* Highlights */}
              <div className="space-y-1.5">
                {cfg.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${cfg.dotColor}`} />
                    <p className="text-[11px] text-orbit-dim leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>

              {/* Mission list preview */}
              <div className="mt-3 pt-3 border-t border-space-border/50 space-y-1">
                {missions
                  .filter((m) => ['active', 'science-operations', 'surface-operations'].includes(m.status))
                  .slice(0, 3)
                  .map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-[10px]">
                      <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-orbit-dim">{m.shortName || m.name}</span>
                      <span className="text-orbit-dim/40 ml-auto">{m.agency}</span>
                    </div>
                  ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* AI Pulse note */}
      <div className="flex items-start gap-3 glass-subtle rounded-lg p-3">
        <Sparkles size={13} className="text-purple-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-[9px] text-purple-400 tracking-widest mb-1">AI GENERATED · MISSION INTELLIGENCE</div>
          <p className="text-[12px] text-orbit-dim leading-relaxed">
            Current Mars operations center on two active rovers exploring different ancient lake environments —
            Perseverance in Jezero Crater hunting for biosignatures, Curiosity reading climate history from Mt. Sharp stratigraphy.
            Six active Mars orbiters provide global atmospheric monitoring and surface communications relay.
            At the Moon, Artemis II preparation continues as humanity prepares its first crewed deep-space journey since 1972.
          </p>
        </div>
      </div>
    </section>
  );
}
