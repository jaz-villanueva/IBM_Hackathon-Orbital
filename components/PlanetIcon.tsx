/**
 * Small CSS-rendered planet sphere used anywhere Orbital previously used a
 * raw emoji for planet navigation (Earth 🌎, Moon 🌙, etc.). Replaces the
 * Neptune 💙 (a heart, not a planet) with an actual distinct sphere, and
 * gives every planet a consistent, deliberately-differentiated look —
 * matching the ringed-sphere motif already used in Orbital's logo mark
 * rather than relying on inconsistent platform emoji rendering.
 */

const PLANET_GRADIENT: Record<string, string> = {
  mercury: 'radial-gradient(circle at 34% 30%, #d6d2cc 0%, #8c8378 45%, #453f37 100%)',
  venus:   'radial-gradient(circle at 34% 30%, #fdeecb 0%, #d9a441 45%, #6b4c15 100%)',
  earth:   'radial-gradient(circle at 34% 30%, #7dd3fc 0%, #2b7fc4 45%, #103a5e 100%)',
  moon:    'radial-gradient(circle at 34% 30%, #f1f2f4 0%, #a9adb6 45%, #5b6068 100%)',
  mars:    'radial-gradient(circle at 34% 30%, #f4a678 0%, #c2410c 45%, #6e2205 100%)',
  jupiter: 'radial-gradient(circle at 34% 30%, #fde3b8 0%, #d97706 45%, #6b3705 100%)',
  saturn:  'radial-gradient(circle at 34% 30%, #fdeec0 0%, #eab308 45%, #7a5709 100%)',
  // Uranus: pale icy cyan — visually distinct from Neptune's deeper, more saturated blue.
  uranus:  'radial-gradient(circle at 34% 30%, #e0fdfc 0%, #7dd3d8 45%, #1f6e73 100%)',
  neptune: 'radial-gradient(circle at 34% 30%, #93b8fd 0%, #3454d1 45%, #131f6e 100%)',
};

interface PlanetIconProps {
  planet: string;
  size?: number;
  className?: string;
  /** Saturn only: draw a thin ring, since it's the one planet recognizable primarily by its ring. */
  ring?: boolean;
}

export function PlanetIcon({ planet, size = 14, className, ring }: PlanetIconProps) {
  const gradient = PLANET_GRADIENT[planet] ?? PLANET_GRADIENT.earth;
  const showRing = ring ?? planet === 'saturn';

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {showRing && (
        <span
          style={{
            position: 'absolute',
            inset: -size * 0.28,
            borderRadius: '9999px',
            border: `${Math.max(1, size * 0.07)}px solid rgba(234,179,8,0.55)`,
            transform: 'rotate(-18deg) scaleY(0.38)',
          }}
        />
      )}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: gradient,
          boxShadow: 'inset -1.5px -1.5px 2.5px rgba(0,0,0,0.45), 0 0 6px rgba(255,255,255,0.06)',
        }}
      />
    </span>
  );
}
