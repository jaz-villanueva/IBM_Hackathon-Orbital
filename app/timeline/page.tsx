'use client';

import { Navigation } from '@/components/Navigation';
import { MISSIONS } from '@/lib/missions';
import { MissionEvent } from '@/lib/types';
import Link from 'next/link';
import { useState, useMemo } from 'react';

interface TimelineItem {
  event: MissionEvent;
  missionId: string;
  missionName: string;
  missionDest: string;
  year: number;
}

const DEST_COLORS: Record<string, string> = {
  earth: 'text-blue-400 border-blue-400/30',
  moon: 'text-slate-300 border-slate-400/30',
  mars: 'text-orange-400 border-orange-400/30',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  launch: 'bg-orbit-blue',
  landing: 'bg-amber-400',
  milestone: 'bg-emerald-400',
  science: 'bg-purple-400',
  maneuver: 'bg-cyan-400',
  anomaly: 'bg-red-400',
  flyby: 'bg-indigo-400',
};

export default function TimelinePage() {
  const [filter, setFilter] = useState<'all' | 'earth' | 'moon' | 'mars'>('all');

  const timelineItems: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    MISSIONS.forEach((m) => {
      if (filter !== 'all' && m.destination !== filter) return;
      m.events.forEach((ev) => {
        items.push({
          event: ev,
          missionId: m.id,
          missionName: m.shortName || m.name,
          missionDest: m.destination,
          year: new Date(ev.timestamp).getFullYear(),
        });
      });
    });
    return items.sort((a, b) => b.event.timestamp.localeCompare(a.event.timestamp));
  }, [filter]);

  const byYear = useMemo(() => {
    const grouped: Record<number, TimelineItem[]> = {};
    timelineItems.forEach((item) => {
      if (!grouped[item.year]) grouped[item.year] = [];
      grouped[item.year].push(item);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year: Number(year), items }));
  }, [timelineItems]);

  return (
    <div className="min-h-screen bg-space-black">
      <Navigation />
      <div className="pt-14">
        {/* Header */}
        <div className="border-b border-space-border bg-space-navy/50">
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
            <div className="text-[10px] text-orbit-dim tracking-widest mb-1">ORBITAL</div>
            <h1 className="text-3xl font-light text-orbit-white tracking-wide mb-2">MISSION TIMELINE</h1>
            <p className="text-orbit-dim text-sm">Key events across all missions — from launches to science discoveries.</p>

            {/* Filter */}
            <div className="flex gap-2 mt-5">
              {(['all', 'earth', 'moon', 'mars'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs tracking-wider rounded transition-colors ${
                    filter === f
                      ? 'bg-orbit-blue/20 text-orbit-blue border border-orbit-blue/30'
                      : 'text-orbit-dim hover:text-orbit-white glass-subtle border border-transparent'
                  }`}
                >
                  {f === 'all' ? '🌌 ALL' : f === 'earth' ? '🌎 EARTH' : f === 'moon' ? '🌙 MOON' : '🔴 MARS'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
          {byYear.map(({ year, items }) => (
            <div key={year} className="mb-10">
              <div className="sticky top-16 z-10 flex items-center gap-4 mb-4 py-2">
                <div className="text-2xl font-extralight text-orbit-white tracking-wider">{year}</div>
                <div className="flex-1 h-px bg-space-border" />
                <div className="text-[10px] text-orbit-dim tracking-wider">{items.length} events</div>
              </div>

              <div className="space-y-3 pl-4 border-l border-space-border ml-4">
                {items.map((item) => (
                  <div key={`${item.event.id}-${item.missionId}`} className="flex gap-4 group">
                    {/* Dot */}
                    <div className="relative flex-shrink-0 -ml-[17px]">
                      <div className={`w-3 h-3 rounded-full mt-1 ${EVENT_TYPE_COLORS[item.event.eventType] || 'bg-orbit-dim'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/missions/${item.missionId}`}
                              className={`text-[10px] tracking-wider border px-1.5 py-0.5 rounded ${DEST_COLORS[item.missionDest] || 'text-orbit-dim border-space-border'}`}
                            >
                              {item.missionName}
                            </Link>
                            <span className="text-[10px] text-orbit-dim capitalize">{item.event.eventType}</span>
                          </div>
                          <div className="text-sm font-medium text-orbit-white mt-1">{item.event.title}</div>
                          <p className="text-[12px] text-orbit-dim mt-1 leading-relaxed">{item.event.description}</p>
                        </div>
                        <div className="text-[10px] text-orbit-dim font-mono shrink-0">
                          {item.event.timestamp.substring(0, 10)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
