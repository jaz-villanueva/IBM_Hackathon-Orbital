/**
 * Orbital mechanics helpers.
 *
 * Implements simplified Keplerian propagation for spacecraft in the
 * ORBITAL visualisation. Uses published orbital elements where available.
 *
 * This is NOT a full SGP4 implementation. Positions are ESTIMATED from
 * simplified two-body Keplerian motion. Labels accordingly: DERIVED / ESTIMATED.
 *
 * References:
 *   - Orbital elements from CelesTrak / NASA public data
 *   - "Fundamentals of Astrodynamics" — Bate, Mueller, White
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Seconds per minute */
const SPM = 60;

/**
 * Orbital period data per mission (minutes).
 * Source: CelesTrak / NASA public data. Label: DERIVED/OBSERVED.
 * Used to drive realistic angular speed in the simulation.
 */
export interface OrbitalParams {
  /** Orbital period in minutes */
  periodMin: number;
  /** Semi-major axis in km (used for visual orbit ring scale) */
  smaKm: number;
  /** Inclination degrees */
  incDeg: number;
  /** Eccentricity (0 = circular) */
  ecc: number;
  /** Right ascension of ascending node, degrees */
  raanDeg: number;
  /** Argument of perigee, degrees */
  aopDeg: number;
  /** Mean anomaly at epoch, degrees */
  m0Deg: number;
  /** Source label */
  source: 'DERIVED' | 'ESTIMATED';
  sourceNote: string;
}

/**
 * Published/derived orbital parameters for each tracked mission.
 * All values from public sources; approximate for non-Earth objects.
 */
export const ORBITAL_PARAMS: Record<string, OrbitalParams> = {
  // ── Earth orbiters ──────────────────────────────────────────────────────
  iss: {
    periodMin: 92.68,
    smaKm: 6778,
    incDeg: 51.64,
    ecc: 0.0003,
    raanDeg: 0,
    aopDeg: 0,
    m0Deg: 0,
    source: 'DERIVED',
    sourceNote: 'CelesTrak TLE-derived, ~408 km altitude',
  },
  terra: {
    periodMin: 98.88,
    smaKm: 7078,
    incDeg: 98.2,
    ecc: 0.0001,
    raanDeg: 90,
    aopDeg: 0,
    m0Deg: 120,
    source: 'DERIVED',
    sourceNote: 'Sun-synchronous, ~705 km altitude',
  },
  aqua: {
    periodMin: 98.88,
    smaKm: 7078,
    incDeg: 98.2,
    ecc: 0.0001,
    raanDeg: 90,
    aopDeg: 0,
    m0Deg: 300,
    source: 'DERIVED',
    sourceNote: 'Sun-synchronous, ~705 km altitude',
  },
  'landsat-9': {
    periodMin: 98.88,
    smaKm: 7078,
    incDeg: 98.2,
    ecc: 0.0001,
    raanDeg: 90,
    aopDeg: 0,
    m0Deg: 200,
    source: 'DERIVED',
    sourceNote: 'Sun-synchronous, ~705 km altitude',
  },
  // ── Moon orbiters ───────────────────────────────────────────────────────
  lro: {
    periodMin: 113,
    smaKm: 1837, // Moon radius + ~100 km
    incDeg: 90,
    ecc: 0.003,
    raanDeg: 0,
    aopDeg: 0,
    m0Deg: 0,
    source: 'DERIVED',
    sourceNote: 'Polar lunar orbit, ~100 km altitude',
  },
  kplo: {
    periodMin: 118,
    smaKm: 1837,
    incDeg: 90,
    ecc: 0.002,
    raanDeg: 60,
    aopDeg: 0,
    m0Deg: 180,
    source: 'ESTIMATED',
    sourceNote: 'Polar lunar orbit, ~100 km altitude',
  },
  'artemis-2': {
    periodMin: 1440, // ~24h for loose lunar flyby representation
    smaKm: 6000,
    incDeg: 30,
    ecc: 0.7,
    raanDeg: 45,
    aopDeg: 270,
    m0Deg: 60,
    source: 'ESTIMATED',
    sourceNote: 'Illustrative — pre-launch, 2025 target',
  },
  // ── Mars orbiters ───────────────────────────────────────────────────────
  mro: {
    periodMin: 112,
    smaKm: 3696, // Mars radius + ~300 km
    incDeg: 92.6,
    ecc: 0.005,
    raanDeg: 0,
    aopDeg: 0,
    m0Deg: 45,
    source: 'DERIVED',
    sourceNote: 'Near-polar Mars orbit, ~300 km altitude',
  },
  maven: {
    periodMin: 4.5 * 60, // ~4.5 hour highly elliptical orbit
    smaKm: 6500,
    incDeg: 75,
    ecc: 0.63,
    raanDeg: 80,
    aopDeg: 150,
    m0Deg: 90,
    source: 'DERIVED',
    sourceNote: 'Elliptical Mars orbit, ~150–6,000 km',
  },
  'mars-express': {
    periodMin: 426,
    smaKm: 9630,
    incDeg: 86.6,
    ecc: 0.6,
    raanDeg: 120,
    aopDeg: 357,
    m0Deg: 200,
    source: 'DERIVED',
    sourceNote: 'Highly elliptical Mars orbit',
  },
  tgo: {
    periodMin: 120,
    smaKm: 3796,
    incDeg: 74,
    ecc: 0.003,
    raanDeg: 200,
    aopDeg: 0,
    m0Deg: 300,
    source: 'DERIVED',
    sourceNote: 'Near-circular Mars orbit, ~400 km altitude',
  },
};

// ─── Simulation clock ────────────────────────────────────────────────────────

export type SimSpeed = 1 | 10 | 100 | 1000 | 10000;

export const SIM_SPEEDS: SimSpeed[] = [1, 10, 100, 1000, 10000];

export interface SimClock {
  /** Wall time when sim was last reset/started (ms) */
  wallBase: number;
  /** Sim time at last reset (Date) */
  simBase: Date;
  /** Speed multiplier */
  speed: SimSpeed;
}

export function makeSimClock(): SimClock {
  return {
    wallBase: Date.now(),
    simBase: new Date(),
    speed: 1,
  };
}

/** Current simulated UTC time */
export function simNow(clock: SimClock): Date {
  const elapsed = (Date.now() - clock.wallBase) * clock.speed; // ms of sim time
  return new Date(clock.simBase.getTime() + elapsed);
}

/** Total elapsed simulated seconds from epoch */
export function simElapsedSeconds(clock: SimClock): number {
  return (Date.now() - clock.wallBase) * clock.speed / 1000;
}

// ─── Keplerian propagation ────────────────────────────────────────────────────

/**
 * Solve Kepler's equation M = E − e·sin(E) for eccentric anomaly E.
 * Newton-Raphson, ~5 iterations.
 */
function solveKepler(M: number, ecc: number): number {
  let E = M;
  for (let i = 0; i < 8; i++) {
    E = E - (E - ecc * Math.sin(E) - M) / (1 - ecc * Math.cos(E));
  }
  return E;
}

/**
 * Compute spacecraft position in orbit plane (perifocal frame)
 * given elapsed time in seconds and orbital elements.
 * Returns unit vector (direction) for use in visualisation.
 */
export function keplerPosition(
  params: OrbitalParams,
  elapsedSeconds: number
): { x: number; y: number; z: number } {
  const TWO_PI = 2 * Math.PI;
  const deg = Math.PI / 180;

  const T = params.periodMin * SPM; // orbital period in seconds
  const n = TWO_PI / T;             // mean motion rad/s

  const M0 = params.m0Deg * deg;
  const M = (M0 + n * elapsedSeconds) % TWO_PI;

  const E = solveKepler(M, params.ecc);

  // True anomaly
  const sinv = (Math.sqrt(1 - params.ecc ** 2) * Math.sin(E)) / (1 - params.ecc * Math.cos(E));
  const cosv = (Math.cos(E) - params.ecc) / (1 - params.ecc * Math.cos(E));
  const nu = Math.atan2(sinv, cosv);

  // Radius
  const r = params.smaKm * (1 - params.ecc * Math.cos(E));

  // Position in perifocal frame
  const px = r * Math.cos(nu);
  const py = r * Math.sin(nu);

  // Rotate to ECI via Euler angles: Ω (RAAN), i, ω (AoP)
  const O = params.raanDeg * deg;  // RAAN
  const inc = params.incDeg * deg;
  const w = params.aopDeg * deg;   // AoP

  const x = (Math.cos(O) * Math.cos(w) - Math.sin(O) * Math.sin(w) * Math.cos(inc)) * px
           + (-Math.cos(O) * Math.sin(w) - Math.sin(O) * Math.cos(w) * Math.cos(inc)) * py;
  const y = (Math.sin(O) * Math.cos(w) + Math.cos(O) * Math.sin(w) * Math.cos(inc)) * px
           + (-Math.sin(O) * Math.sin(w) + Math.cos(O) * Math.cos(w) * Math.cos(inc)) * py;
  const z = (Math.sin(inc) * Math.sin(w)) * px
           + (Math.sin(inc) * Math.cos(w)) * py;

  // Return normalised direction vector (scene uses visual radius, not km)
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

/**
 * Build orbit path points (array of unit vectors) for rendering.
 * Returns 128 positions evenly sampled around one full orbit.
 */
export function orbitPath(params: OrbitalParams, steps = 128): Array<{ x: number; y: number; z: number }> {
  const T = params.periodMin * SPM;
  const pts: Array<{ x: number; y: number; z: number }> = [];
  for (let i = 0; i < steps; i++) {
    pts.push(keplerPosition(params, (i / steps) * T));
  }
  return pts;
}

/** Format a Date as "DD MMM YYYY HH:MM:SS UTC" */
export function formatSimTime(d: Date): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}
