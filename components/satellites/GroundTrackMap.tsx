'use client';

/**
 * Flat equirectangular ground-track map.
 *
 * The 3D globe (SpaceScene) shows the satellite's marker and orbit ring in
 * the same inertial (ECI) frame as every other tracked spacecraft — it does
 * not model Earth's real rotation. A ground track (the sinusoidal path swept
 * across Earth's rotating surface) only makes sense in the Earth-fixed
 * (ECEF) frame, so it's rendered here as a simple 2D map instead of forcing
 * an inconsistent line onto the 3D scene.
 */

interface GroundTrackMapProps {
  track: Array<{ lat: number; lon: number }>;
  current: { lat: number; lon: number };
}

const WIDTH = 360;
const HEIGHT = 180;

function toXY(lat: number, lon: number): [number, number] {
  const x = ((lon + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT;
  return [x, y];
}

export function GroundTrackMap({ track, current }: GroundTrackMapProps) {
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

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto rounded-lg border border-space-border bg-space-deep">
      {/* Graticule */}
      {[-60, -30, 0, 30, 60].map((lat) => {
        const [, y] = toXY(lat, 0);
        return (
          <line key={`lat-${lat}`} x1={0} y1={y} x2={WIDTH} y2={y}
            stroke={lat === 0 ? 'rgba(96,165,250,0.35)' : 'rgba(148,163,184,0.12)'} strokeWidth={lat === 0 ? 0.8 : 0.4} />
        );
      })}
      {[-120, -60, 0, 60, 120].map((lon) => {
        const [x] = toXY(0, lon);
        return (
          <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={HEIGHT}
            stroke={lon === 0 ? 'rgba(96,165,250,0.35)' : 'rgba(148,163,184,0.12)'} strokeWidth={lon === 0 ? 0.8 : 0.4} />
        );
      })}
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={0.6} />

      {/* Ground track */}
      {segments.map((s, i) => (
        <polyline
          key={i}
          points={s.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.1}
          strokeOpacity={0.85}
        />
      ))}

      {/* Current position */}
      <circle cx={curX} cy={curY} r={2.6} fill="#22c55e" stroke="#0a1628" strokeWidth={0.8} />
      <circle cx={curX} cy={curY} r={5} fill="none" stroke="#22c55e" strokeOpacity={0.5} strokeWidth={0.6} />
    </svg>
  );
}
