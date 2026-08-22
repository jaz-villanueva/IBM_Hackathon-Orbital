'use client';

import { Mission, Spacecraft, DataSource } from '@/lib/types';
import { MissionTimeline } from './MissionTimeline';
import { DataProvenance, DataSourcePanel, DataLegend } from './DataProvenance';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, Sparkles } from 'lucide-react';

interface MissionDetailProps {
  mission: Mission;
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; text: string }> = {
  active: { dot: 'bg-emerald-400 animate-pulse', label: 'ACTIVE', text: 'text-emerald-400' },
  'science-operations': { dot: 'bg-purple-400 animate-pulse', label: 'SCIENCE OPERATIONS', text: 'text-purple-400' },
  'surface-operations': { dot: 'bg-amber-400 animate-pulse', label: 'SURFACE OPERATIONS', text: 'text-amber-400' },
  cruise: { dot: 'bg-blue-400', label: 'CRUISE', text: 'text-blue-400' },
  extended: { dot: 'bg-cyan-400', label: 'EXTENDED', text: 'text-cyan-400' },
  planned: { dot: 'bg-sky-400', label: 'PLANNED', text: 'text-sky-400' },
  completed: { dot: 'bg-slate-500', label: 'MISSION COMPLETE', text: 'text-slate-400' },
  unknown: { dot: 'bg-slate-600', label: 'UNKNOWN', text: 'text-slate-500' },
};

function SpacecraftCard({ sc }: { sc: Spacecraft }) {
  return (
    <div className="glass rounded-lg p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orbit-blue/10 border border-orbit-blue/20 flex items-center justify-center shrink-0">
          <div className="w-3 h-3 rounded-sm border border-orbit-blue/50 relative">
            <div className="absolute -left-1 top-1/2 w-0.5 h-2 bg-orbit-blue/50 -translate-y-1/2" />
            <div className="absolute -right-1 top-1/2 w-0.5 h-2 bg-orbit-blue/50 -translate-y-1/2" />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-orbit-white">{sc.name}</div>
          <div className="text-[10px] text-orbit-dim capitalize tracking-wider mt-0.5">{sc.type}</div>
        </div>
      </div>
      <p className="text-[12px] text-orbit-dim leading-relaxed">{sc.description}</p>
      {(sc.massKg || sc.powerSource || sc.manufacturer) && (
        <div className="pt-2 border-t border-space-border space-y-1">
          {sc.massKg && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim tracking-wider">MASS</span>
              <DataProvenance
                value={sc.massKg.value}
                label={sc.massKg.label}
                source={sc.massKg.source}
                unit="kg"
              />
            </div>
          )}
          {sc.powerSource && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim tracking-wider">POWER</span>
              <span className="text-[11px] text-orbit-dim text-right max-w-[150px] leading-tight">{sc.powerSource}</span>
            </div>
          )}
          {sc.manufacturer && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim tracking-wider">BUILDER</span>
              <span className="text-[11px] text-orbit-dim text-right max-w-[150px] leading-tight">{sc.manufacturer}</span>
            </div>
          )}
          {sc.noradId && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim tracking-wider">NORAD ID</span>
              <DataProvenance value={sc.noradId} label="OBSERVED" source="CelesTrak" sourceUrl="https://celestrak.org" />
            </div>
          )}
        </div>
      )}
      {sc.orbitalElements && (
        <div className="pt-2 border-t border-space-border space-y-1">
          <div className="text-[10px] text-orbit-dim tracking-widest mb-2">ORBITAL PARAMETERS</div>
          {sc.orbitalElements.altitude && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim">ALTITUDE</span>
              <DataProvenance
                value={`~${sc.orbitalElements.altitude.value}`}
                label={sc.orbitalElements.altitude.label}
                source={sc.orbitalElements.altitude.source}
                unit="km"
                notes={sc.orbitalElements.altitude.notes}
              />
            </div>
          )}
          {sc.orbitalElements.inclination && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim">INCLINATION</span>
              <DataProvenance
                value={sc.orbitalElements.inclination.value}
                label={sc.orbitalElements.inclination.label}
                source={sc.orbitalElements.inclination.source}
                unit="°"
              />
            </div>
          )}
          {sc.orbitalElements.period && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orbit-dim">PERIOD</span>
              <DataProvenance
                value={`~${sc.orbitalElements.period.value}`}
                label={sc.orbitalElements.period.label}
                source={sc.orbitalElements.period.source}
                unit="min"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MissionDetail({ mission }: MissionDetailProps) {
  const status = STATUS_CONFIG[mission.status] || STATUS_CONFIG.unknown;

  const dataSources: Array<{ source: DataSource; description: string; url?: string }> = [];
  if (mission.agency.includes('NASA')) {
    dataSources.push({ source: 'NASA', description: 'Mission data, imagery, and status', url: mission.sourceUrl });
  }
  if (mission.agency.includes('ESA')) {
    dataSources.push({ source: 'ESA', description: 'Mission data and status', url: mission.sourceUrl });
  }
  if (mission.spacecraft.some((s) => s.noradId)) {
    dataSources.push({ source: 'CelesTrak', description: 'Orbital elements and TLE data', url: 'https://celestrak.org' });
  }
  if (mission.spacecraft.some((s) => s.transmitters?.length)) {
    dataSources.push({ source: 'SatNOGS', description: 'Transmitter and signal data', url: 'https://db.satnogs.org' });
  }
  dataSources.push({ source: 'AI', description: 'AI-generated summaries and insights' });

  return (
    <div className="min-h-screen bg-space-black">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {mission.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mission.heroImageUrl}
            alt={mission.name}
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="w-full h-full bg-space-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-black/40 to-space-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-space-black/60 to-transparent" />

        {/* Back button */}
        <div className="absolute top-6 left-4 md:left-8">
          <Link
            href="/missions"
            className="flex items-center gap-2 text-orbit-dim hover:text-orbit-white text-xs tracking-wider glass px-3 py-1.5 rounded transition-colors"
          >
            <ArrowLeft size={12} />
            ALL MISSIONS
          </Link>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-6 left-4 md:left-8 right-4 md:right-8">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className={`text-[11px] tracking-widest font-medium ${status.text}`}>{status.label}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-orbit-white tracking-wide leading-tight">{mission.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-orbit-dim text-sm">{mission.agency}</span>
            <span className="text-space-border">·</span>
            <span className="text-orbit-dim text-sm capitalize">
              {mission.destination} · {mission.missionType}
            </span>
            {mission.launchDate && (
              <>
                <span className="text-space-border">·</span>
                <span className="text-orbit-dim text-sm">
                  Launched {new Date(mission.launchDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left / main column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mission overview */}
            <section className="space-y-4">
              <div className="text-[10px] text-orbit-dim tracking-widest">MISSION OVERVIEW</div>
              <p className="text-orbit-dim leading-relaxed">{mission.description}</p>

              {/* Objectives */}
              <div className="space-y-2">
                <div className="text-[10px] text-orbit-dim tracking-widest">OBJECTIVES</div>
                <ul className="space-y-2">
                  {mission.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-orbit-dim">
                      <span className="text-orbit-blue mt-0.5 shrink-0">○</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Current location */}
              {mission.currentLocation && (
                <div className="glass-subtle rounded-lg p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orbit-blue/10 border border-orbit-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe size={12} className="text-orbit-blue" />
                  </div>
                  <div>
                    <div className="text-[10px] text-orbit-dim tracking-wider mb-0.5">CURRENT LOCATION</div>
                    <div className="text-sm text-orbit-white">{mission.currentLocation.description}</div>
                    <DataProvenance
                      value=""
                      label={mission.currentLocation.label}
                      source={mission.currentLocation.source}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Phase Timeline */}
            {mission.phases.length > 0 && (
              <section className="space-y-4">
                <div className="text-[10px] text-orbit-dim tracking-widest">MISSION PHASES</div>
                <MissionTimeline phases={mission.phases} />
              </section>
            )}

            {/* Events */}
            {mission.events.length > 0 && (
              <section className="space-y-4">
                <div className="text-[10px] text-orbit-dim tracking-widest">MISSION EVENTS</div>
                <div className="space-y-2">
                  {[...mission.events].reverse().map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-3 p-3 glass-subtle rounded-lg border border-space-border/50"
                    >
                      <div className="text-[10px] text-orbit-dim font-mono shrink-0 w-20 pt-0.5">
                        {event.timestamp.substring(0, 10)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-orbit-white font-medium">{event.title}</div>
                        <div className="text-[12px] text-orbit-dim mt-0.5 leading-relaxed">{event.description}</div>
                      </div>
                      <div className="text-[9px] text-orbit-dim/60 shrink-0 tracking-wider capitalize pt-0.5">
                        {event.eventType}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Image Gallery */}
            {mission.images.length > 0 && (
              <section className="space-y-4">
                <div className="text-[10px] text-orbit-dim tracking-widest">MISSION IMAGERY</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {mission.images.map((img) => (
                    <div key={img.id} className="relative aspect-video overflow-hidden rounded-lg glass border border-space-border group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.title}
                        className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity duration-300"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-space-black/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-[10px] text-orbit-white line-clamp-2 leading-tight">{img.title}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[9px] text-orbit-dim">{img.source} · {img.date?.substring(0, 4)}</div>
                          {img.sourceUrl && (
                            <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-orbit-blue/60 hover:text-orbit-blue">
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* AI Mission Brief */}
            {mission.aiInsights && mission.aiInsights.length > 0 && (
              <div className="glass rounded-xl p-4 border border-purple-400/15 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-space-border">
                  <Sparkles size={13} className="text-purple-400" />
                  <div className="text-[10px] text-purple-400 tracking-widest font-medium">MISSION PULSE</div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className={`text-xs tracking-widest font-semibold ${status.text}`}>{status.label}</span>
                </div>

                {mission.aiInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="space-y-1">
                    <div className="text-[9px] text-orbit-dim tracking-widest uppercase">{insight.type.replace(/-/g, ' ')}</div>
                    <p className="text-[12px] text-orbit-dim leading-relaxed">{insight.content}</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[9px] text-orbit-dim/50 uppercase tracking-wider">Confidence: {insight.confidence}</div>
                    </div>
                  </div>
                ))}

                <div className="text-[9px] text-purple-400/60 tracking-widest border-t border-space-border pt-2">
                  AI GENERATED · BASED ON PUBLIC MISSION DATA
                </div>
              </div>
            )}

            {/* Spacecraft */}
            {mission.spacecraft.length > 0 && (
              <div className="space-y-3">
                <div className="text-[10px] text-orbit-dim tracking-widest">SPACECRAFT</div>
                {mission.spacecraft.map((sc) => (
                  <SpacecraftCard key={sc.id} sc={sc} />
                ))}
              </div>
            )}

            {/* Data Sources */}
            <DataSourcePanel sources={dataSources} />

            {/* Data legend */}
            <div className="space-y-2">
              <div className="text-[10px] text-orbit-dim tracking-widest">DATA LABELS</div>
              <DataLegend />
              <p className="text-[10px] text-orbit-dim/60 leading-relaxed">
                All data displayed is labeled to indicate its provenance. ORBITAL does not fabricate telemetry or spacecraft health data.
              </p>
            </div>

            {/* Source link */}
            {mission.sourceUrl && (
              <a
                href={mission.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-orbit-blue hover:text-orbit-accent glass-subtle p-3 rounded-lg transition-colors"
              >
                <ExternalLink size={12} />
                Official mission page
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
