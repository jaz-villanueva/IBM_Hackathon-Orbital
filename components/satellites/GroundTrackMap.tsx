'use client';

import { useMemo } from 'react';
import { CONTINENTS, continentAt } from '@/lib/satellites/world-continents';

/**
 * "Where does it fly over?" — a stylised Earth map with the satellite's real
 * ground track drawn over it, instead of an abstract line-graph on a blank
 * grid. Continents are deliberately simplified (see lib/satellites/world-
 * continents.ts) — recognisable at a glance, not survey-accurate.
 *
 * The track/position themselves are unchanged from before: real DERIVED
 * ground-track points computed from the selected satellite's live orbital
 * elements (see lib/satellites/orbital-state.ts). This component only
 * changes how they're drawn.
 */

interface GroundTrackMapProps {
  track: Array<{ lat: number; lon: number }>;
  current: { lat: number; lon: number };
  /** Orbital inclination, degrees — used only for the plain-language coverage note below the map. */
  inclinationDeg?: number;
}

const WIDTH = 360;
const HEIGHT = 180;

function toXY(lat: number, lon: number): [number, number] {
  const x = ((lon + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT;
  return [x, y];
}

function polygonToPath(points: Array<[number, number]>): string {
  return points
    .map(([lon, lat], i) => {
      const [x, y] = toXY(lat, lon);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

/** Plain-language note about how much of Earth this orbit's inclination covers — computed, not a generic statement. */
function coverageNote(inclinationDeg: number): string {
  if (inclinationDeg > 80) {
    return `This orbit is tilted ${inclinationDeg.toFixed(0)}° — nearly pole-to-pole — so its path sweeps over almost every part of Earth, from the poles to the equator, as the planet turns underneath it.`;
  }
  if (inclinationDeg > 45) {
    return `This orbit is tilted ${inclinationDeg.toFixed(0)}° from the equator, so its path ranges from about ${inclinationDeg.toFixed(0)}°N to ${inclinationDeg.toFixed(0)}°S — a wide band across most populated latitudes.`;
  }
  if (inclinationDeg > 5) {
    return `This orbit is tilted only ${inclinationDeg.toFixed(0)}° from the equator, so its path stays close to the tropics — it never reaches the higher latitudes.`;
  }
  return `This orbit sits almost exactly over the equator (${inclinationDeg.toFixed(1)}° tilt), so its ground track barely moves north or south at all.`;
}

export function GroundTrackMap({ track, current, inclinationDeg }: GroundTrackMapProps) {
  // Split the track into contiguous segments wherever it wraps across the
  // ±180° antimeridian, so the polyline doesn't draw a spurious line
  // across the whole map.
  const segments: Array<Array<[number, number]>> = [];
  let seg: Array<[number, number]> = [];
  for (let i = 0; i < track.length; i++) {
    const [x, y] = toXY(track[i].lat, track[i].lon);
    if (seg.length > 0) {
      const prevX = seg[seg.length - 1][0];
      if (Math.abs(x - prevX) > WIDTH / 2) {
        segments.push(seg);
        seg = [];
      }
    }
    seg.push([x, y]);
  }
  if (seg.length > 0) segments.push(seg);

  const [curX, curY] = toXY(current.lat, current.lon);

  // Continent-scale only — never a country/city. Falls back to raw lat/lon
  // in the caller when this is null (open ocean), per the "don't fabricate
  // a location" requirement.
  const region = useMemo(() => continentAt(current.lat, current.lon), [current.lat, current.lon]);

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto rounded-lg border border-space-border overflow-hidden">
        <defs>
          <radialGradient id="gt-ocean" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#0d2847" />
            <stop offset="100%" stopColor="#050d1a" />
          </radialGradient>
          <filter id="gt-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="url(#gt-ocean)" />

        {/* Subtle lat/lon grid */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const [, y] = toXY(lat, 0);
          return <line key={`lat-${lat}`} x1={0} y1={y} x2={WIDTH} y2={y} stroke={lat === 0 ? 'rgba(96,165,250,0.25)' : 'rgba(148,163,184,0.08)'} strokeWidth={lat === 0 ? 0.7 : 0.35} />;
        })}
        {[-120, -60, 0, 60, 120].map((lon) => {
          const [x] = toXY(0, lon);
          return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={HEIGHT} stroke="rgba(148,163,184,0.08)" strokeWidth={0.35} />;
        })}

        {/* Continents — recognisable silhouettes, not survey-accurate */}
        {CONTINENTS.map((c) => (
          <path
            key={c.name}
            d={polygonToPath(c.points)}
            fill="rgba(74,222,128,0.14)"
            stroke="rgba(134,239,172,0.35)"
            strokeWidth={0.6}
          />
        ))}

        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth={0.8} />

        {/* Ground track — bright, glowing */}
        {segments.map((s, i) => (
          <polyline
            key={i}
            points={s.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#gt-glow)"
          />
        ))}

        {/* Current position — glowing marker */}
        <circle cx={curX} cy={curY} r={6} fill="none" stroke="#4ade80" strokeOpacity={0.4} strokeWidth={1} />
        <circle cx={curX} cy={curY} r={3} fill="#4ade80" filter="url(#gt-glow)" />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-orbit-dim">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-[2px] rounded-full bg-cyan-400" style={{ boxShadow: '0 0 4px rgba(34,211,238,0.8)' }} />
          Satellite&apos;s path
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.8)' }} />
          Current position
        </span>
      </div>

      {/* Honest current-location line: continent-scale label if we can place
          it on land, otherwise plain lat/lon — never a guessed country/city. */}
      <div className="mt-2 text-[12px] text-orbit-white/80">
        {region ? (
          <>Right now, it&apos;s passing over <span className="text-emerald-400 font-medium">{region}</span>.</>
        ) : (
          <>Right now, it&apos;s over open ocean, near <span className="text-emerald-400 font-medium">{current.lat.toFixed(1)}°, {current.lon.toFixed(1)}°</span>.</>
        )}
      </div>

      {inclinationDeg !== undefined && (
        <p className="text-[11px] text-orbit-dim leading-relaxed mt-2">{coverageNote(inclinationDeg)}</p>
      )}

      <p className="text-[9px] text-orbit-dim/50 mt-2">
        Path traced from the satellite&apos;s real orbital elements · DERIVED
      </p>
    </div>
  );
}
