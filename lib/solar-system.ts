/**
 * lib/solar-system.ts
 *
 * Celestial body catalogue and JPL-based Keplerian orbital elements for all
 * solar-system bodies rendered in ORBITAL.
 *
 * Planetary elements from:
 *   "Keplerian Elements for Approximate Positions of the Major Planets"
 *   E.M. Standish, JPL/Caltech, Solar System Dynamics
 *   https://ssd.jpl.nasa.gov/planets/approx_pos.html
 *   Table 1 — elements valid 1800 AD to 2050 AD.
 *
 * Lunar / Martian-moon elements from JPL Planetary Satellite Mean Orbital
 * Parameters (public data).
 *
 * NOTE: all angular rates (Ld, wd, Od, Md) are in degrees per Julian century.
 */

// ─── Scale constants ──────────────────────────────────────────────────────────

/**
 * Conversion from Astronomical Units to Three.js scene units.
 * 1 AU → 10 scene units keeps the inner solar system (~1.5 AU) tightly packed
 * while outer planets span out to ~300 units (well within the 1 000-unit far clip).
 */
export const AU_TO_SCENE = 10;

/**
 * Scale factor for visual body radii.
 * Bodies are enlarged far beyond their real relative size so they remain
 * legible at solar-system scale.  Orbital distances remain true to AU ratios.
 */
export const VISUAL_RADIUS_SCALE = 1; // applied to visualRadius values below

// ─── Types ────────────────────────────────────────────────────────────────────

/** JPL table-1 Keplerian elements + secular rates (all in deg or AU). */
export interface PlanetaryElements {
  /** Semi-major axis, AU */
  a: number;
  /** Rate of change of a, AU/century */
  ad: number;
  /** Eccentricity */
  e: number;
  /** Rate, per century */
  ed: number;
  /** Inclination to ecliptic, deg */
  I: number;
  /** Rate, deg/century */
  Id: number;
  /** Mean longitude, deg (L = Ω + ω + M₀) */
  L: number;
  /** Rate, deg/century */
  Ld: number;
  /** Longitude of perihelion, deg (ω̃ = Ω + ω) */
  wp: number;
  /** Rate, deg/century */
  wpd: number;
  /** Longitude of ascending node, deg */
  O: number;
  /** Rate, deg/century */
  Od: number;
  /** Extra terms for outer planets (b, c, s, f) – leave 0 for inner */
  b?: number;
  c?: number;
  s?: number;
  f?: number;
}

/**
 * Simplified elements for moons (relative to parent body).
 * Uses mean motion (degrees/day) and mean longitude epoch.
 */
export interface MoonElements {
  /** Semi-major axis in km */
  smaKm: number;
  /** Inclination, degrees */
  incDeg: number;
  /** Eccentricity */
  ecc: number;
  /** Right ascension of ascending node, degrees */
  raanDeg: number;
  /** Argument of periapsis, degrees */
  aopDeg: number;
  /** Mean anomaly at J2000, degrees */
  m0Deg: number;
  /** Orbital period, days */
  periodDays: number;
}

export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'moon';
  /** Parent body id (undefined for Sun) */
  parentId?: string;
  /** Radius in km – kept for reference */
  radiusKm: number;
  /** Visual radius in scene units (exaggerated) */
  visualRadius: number;
  /** Whether the user can click to select missions */
  interactive: boolean;
  /** Maps to mission destination key, if this body is a mission destination */
  missionDestination?: 'earth' | 'moon' | 'mars';
  /** JPL elements for heliocentric planets (undefined for Sun and moons) */
  planetaryElements?: PlanetaryElements;
  /** Local moon elements relative to parent (undefined for heliocentric bodies) */
  moonElements?: MoonElements;
  /** Three.js color hex (for non-Earth planets/moons) */
  color?: number;
  /** Emissive hex */
  emissive?: number;
  /** Atmosphere glow color */
  atmosphereColor?: number;
  /** Show orbital path line */
  showOrbit: boolean;
}

// ─── Planetary elements (JPL Table 1, 1800–2050) ─────────────────────────────

const MERCURY_ELEMENTS: PlanetaryElements = {
  a: 0.38709927, ad:  0.00000037,
  e: 0.20563593, ed:  0.00001906,
  I: 7.00497902, Id: -0.00594749,
  L: 252.25032350, Ld: 149472.67411175,
  wp: 77.45779628, wpd:  0.16047689,
  O: 48.33076593, Od: -0.12534081,
};

const VENUS_ELEMENTS: PlanetaryElements = {
  a: 0.72333566, ad:  0.00000390,
  e: 0.00677672, ed: -0.00004107,
  I: 3.39467605, Id: -0.00078890,
  L: 181.97909950, Ld: 58517.81538729,
  wp: 131.60246718, wpd:  0.00268329,
  O: 76.67984255, Od: -0.27769418,
};

const EARTH_ELEMENTS: PlanetaryElements = {
  a: 1.00000011, ad: -0.00000005,
  e: 0.01671022, ed: -0.00003804,
  I: 0.00005,    Id: -0.01294668,
  L: 100.46457166, Ld: 35999.37244981,
  wp: 102.93768193, wpd:  0.32327364,
  O: -11.26064,   Od: -0.13717600,
};

const MARS_ELEMENTS: PlanetaryElements = {
  a: 1.52371034, ad:  0.00001847,
  e: 0.09339410, ed:  0.00007882,
  I: 1.84969142, Id: -0.00813131,
  L: -4.55343205, Ld: 19140.30268499,
  wp: -23.94362959, wpd:  0.44441088,
  O: 49.55953891, Od: -0.29257343,
};

const JUPITER_ELEMENTS: PlanetaryElements = {
  a: 5.20288700, ad: -0.00011607,
  e: 0.04838624, ed: -0.00013253,
  I: 1.30439695, Id: -0.00183714,
  L: 34.39644051, Ld:  3034.74612775,
  wp: 14.72847983, wpd:  0.21252668,
  O: 100.47390909, Od:  0.20469106,
  b: -0.00012452, c: 0.0606406, s: -0.35635438, f: 38.35125,
};

const SATURN_ELEMENTS: PlanetaryElements = {
  a: 9.53667594, ad: -0.00125060,
  e: 0.05386179, ed: -0.00050991,
  I: 2.48599187, Id:  0.00193609,
  L: 49.95424423, Ld:  1222.49362201,
  wp: 92.59887831, wpd: -0.41897216,
  O: 113.66242448, Od: -0.28867794,
  b: 0.00025899, c: -0.13434469, s: 0.87320147, f: 38.35125,
};

const URANUS_ELEMENTS: PlanetaryElements = {
  a: 19.18916464, ad: -0.00196176,
  e: 0.04725744, ed: -0.00004397,
  I: 0.77263783, Id: -0.00242939,
  L: 313.23810451, Ld:  428.48202785,
  wp: 170.95427630, wpd:  0.40805281,
  O: 74.01692503, Od:  0.04240589,
  b: 0.00058331, c: -0.97731848, s: 0.17689245, f: 7.67025,
};

const NEPTUNE_ELEMENTS: PlanetaryElements = {
  a: 30.06992276, ad:  0.00026291,
  e: 0.00859048, ed:  0.00005105,
  I: 1.77004347, Id:  0.00035372,
  L: -55.12002969, Ld:  218.45945325,
  wp: 44.96476227, wpd: -0.32241464,
  O: 131.78422574, Od: -0.00508664,
  b: 0.00041348, c: -0.68346480, s: -0.10162547, f: 7.67025,
};

// ─── Moon elements (relative to Earth) ───────────────────────────────────────

const LUNA_ELEMENTS: MoonElements = {
  smaKm:      384400,
  incDeg:     5.145,
  ecc:        0.0549,
  raanDeg:    125.045,
  aopDeg:     318.15,
  m0Deg:      115.3654,
  periodDays: 27.321661,
};

// ─── Phobos & Deimos (relative to Mars) ──────────────────────────────────────

const PHOBOS_ELEMENTS: MoonElements = {
  smaKm:       9376,
  incDeg:      1.093,
  ecc:         0.0151,
  raanDeg:     164.931,
  aopDeg:      150.057,
  m0Deg:       92.474,
  periodDays:  0.31891023,
};

const DEIMOS_ELEMENTS: MoonElements = {
  smaKm:       23458,
  incDeg:      1.788,
  ecc:         0.0002,
  raanDeg:     339.600,
  aopDeg:      260.729,
  m0Deg:       296.230,
  periodDays:  1.2624407,
};

// ─── Solar system catalogue ───────────────────────────────────────────────────

export const SOLAR_SYSTEM: CelestialBody[] = [
  {
    id: 'sun',
    name: 'Sun',
    type: 'star',
    radiusKm: 695700,
    visualRadius: 2.2,
    interactive: false,
    showOrbit: false,
    color: 0xffdd88,
    emissive: 0xff8800,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    radiusKm: 2440,
    visualRadius: 0.22,
    interactive: false,
    showOrbit: true,
    color: 0x8c7a6b,
    emissive: 0x1a1008,
    planetaryElements: MERCURY_ELEMENTS,
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    radiusKm: 6052,
    visualRadius: 0.40,
    interactive: false,
    showOrbit: true,
    color: 0xddb870,
    emissive: 0x2a1a04,
    atmosphereColor: 0xe0a820,
    planetaryElements: VENUS_ELEMENTS,
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    radiusKm: 6371,
    visualRadius: 0.55,
    interactive: true,
    missionDestination: 'earth',
    showOrbit: true,
    color: 0x1e6fa5,
    emissive: 0x0a2040,
    atmosphereColor: 0x4db8ff,
    planetaryElements: EARTH_ELEMENTS,
  },
  {
    id: 'moon',
    name: 'Moon',
    type: 'moon',
    parentId: 'earth',
    radiusKm: 1737,
    visualRadius: 0.22,
    interactive: true,
    missionDestination: 'moon',
    showOrbit: true,
    color: 0x8a8f9e,
    emissive: 0x1a1e28,
    moonElements: LUNA_ELEMENTS,
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    radiusKm: 3390,
    visualRadius: 0.42,
    interactive: true,
    missionDestination: 'mars',
    showOrbit: true,
    color: 0xc2410c,
    emissive: 0x3a0d02,
    atmosphereColor: 0xe05c30,
    planetaryElements: MARS_ELEMENTS,
  },
  {
    id: 'phobos',
    name: 'Phobos',
    type: 'moon',
    parentId: 'mars',
    radiusKm: 11,
    visualRadius: 0.06,
    interactive: false,
    showOrbit: false,
    color: 0x7a6a5a,
    emissive: 0x0a0808,
    moonElements: PHOBOS_ELEMENTS,
  },
  {
    id: 'deimos',
    name: 'Deimos',
    type: 'moon',
    parentId: 'mars',
    radiusKm: 6,
    visualRadius: 0.05,
    interactive: false,
    showOrbit: false,
    color: 0x6a5a4e,
    emissive: 0x080806,
    moonElements: DEIMOS_ELEMENTS,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    radiusKm: 69911,
    visualRadius: 0.70,
    interactive: false,
    showOrbit: true,
    color: 0xc88b3a,
    emissive: 0x1a0e04,
    atmosphereColor: 0xd4a060,
    planetaryElements: JUPITER_ELEMENTS,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    radiusKm: 58232,
    visualRadius: 0.58,
    interactive: false,
    showOrbit: true,
    color: 0xe4d191,
    emissive: 0x1e1804,
    atmosphereColor: 0xd4c060,
    planetaryElements: SATURN_ELEMENTS,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    radiusKm: 25362,
    visualRadius: 0.38,
    interactive: false,
    showOrbit: true,
    color: 0x7de8e8,
    emissive: 0x041818,
    atmosphereColor: 0x60d4d4,
    planetaryElements: URANUS_ELEMENTS,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    radiusKm: 24622,
    visualRadius: 0.36,
    interactive: false,
    showOrbit: true,
    color: 0x3f54ba,
    emissive: 0x060a18,
    atmosphereColor: 0x4060d4,
    planetaryElements: NEPTUNE_ELEMENTS,
  },
];

/** Look up a body by id */
export function getBody(id: string): CelestialBody | undefined {
  return SOLAR_SYSTEM.find(b => b.id === id);
}

/** All heliocentric planets (have planetaryElements) */
export const PLANETS = SOLAR_SYSTEM.filter(b => b.planetaryElements != null);

/** All moons (have moonElements) */
export const MOONS = SOLAR_SYSTEM.filter(b => b.moonElements != null);
