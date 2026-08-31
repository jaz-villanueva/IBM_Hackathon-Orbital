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
  missionDestination?: 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
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
  smaKm:      450000,
  incDeg:     5.145,
  ecc:        0.0549,
  raanDeg:    125.045,
  aopDeg:     318.15,
  m0Deg:      115.3654,
  periodDays: 27.321661,
};

// ─── Phobos & Deimos (relative to Mars) ──────────────────────────────────────

const PHOBOS_ELEMENTS: MoonElements = {
  smaKm:       14064,
  incDeg:      1.093,
  ecc:         0.0151,
  raanDeg:     164.931,
  aopDeg:      150.057,
  m0Deg:       92.474,
  periodDays:  0.31891023,
};

const DEIMOS_ELEMENTS: MoonElements = {
  smaKm:       35187,
  incDeg:      1.788,
  ecc:         0.0002,
  raanDeg:     339.600,
  aopDeg:      260.729,
  m0Deg:       296.230,
  periodDays:  1.2624407,
};

// ─── Jupiter moons (Galilean + inner/irregular major moons) ──────────────────
// Source: JPL Planetary Satellite Mean Orbital Parameters (2024)

const METIS_ELEMENTS: MoonElements     = { smaKm:  192000, incDeg: 0.019, ecc: 0.0002, raanDeg:  70, aopDeg:  270, m0Deg:  0,   periodDays:  0.29478 };
const ADRASTEA_ELEMENTS: MoonElements  = { smaKm:  193500, incDeg: 0.054, ecc: 0.0018, raanDeg: 120, aopDeg:   90, m0Deg: 90,   periodDays:  0.29826 };
const AMALTHEA_ELEMENTS: MoonElements  = { smaKm:  272049, incDeg: 0.380, ecc: 0.0032, raanDeg: 185, aopDeg:   84, m0Deg: 185,  periodDays:  0.49818 };
const THEBE_ELEMENTS: MoonElements     = { smaKm:  332850, incDeg: 1.076, ecc: 0.0177, raanDeg: 235, aopDeg:  235, m0Deg: 270,  periodDays:  0.67475 };
const IO_ELEMENTS: MoonElements        = { smaKm:  632550, incDeg: 0.036, ecc: 0.0041, raanDeg:  43, aopDeg:   84, m0Deg:  80,  periodDays:  1.769138 };
const EUROPA_ELEMENTS: MoonElements    = { smaKm: 1006650, incDeg: 0.466, ecc: 0.0094, raanDeg: 219, aopDeg:   88, m0Deg: 130,  periodDays:  3.551181 };
const GANYMEDE_ELEMENTS: MoonElements  = { smaKm: 1605600, incDeg: 0.177, ecc: 0.0011, raanDeg:  63, aopDeg:   192, m0Deg: 250, periodDays:  7.154553 };
const CALLISTO_ELEMENTS: MoonElements  = { smaKm: 2824050, incDeg: 0.192, ecc: 0.0074, raanDeg: 298, aopDeg:   52, m0Deg: 190,  periodDays: 16.689018 };
const HIMALIA_ELEMENTS: MoonElements   = { smaKm:17191500, incDeg:27.63,  ecc: 0.1620, raanDeg:  50, aopDeg:   29, m0Deg:  20,  periodDays:250.5662 };
const ELARA_ELEMENTS: MoonElements     = { smaKm:17611500, incDeg:26.63,  ecc: 0.2174, raanDeg: 142, aopDeg:  143, m0Deg:  67,  periodDays:259.6528 };

// ─── Saturn moons ─────────────────────────────────────────────────────────────
// Source: JPL Planetary Satellite Mean Orbital Parameters (2024)

const PAN_ELEMENTS: MoonElements       = { smaKm:  200376, incDeg: 0.001, ecc: 0.0000, raanDeg:   0, aopDeg:   0, m0Deg:   0,  periodDays:  0.57505 };
const ATLAS_ELEMENTS: MoonElements     = { smaKm:  206505, incDeg: 0.003, ecc: 0.0012, raanDeg: 110, aopDeg: 197, m0Deg:  60,  periodDays:  0.60169 };
const PROMETHEUS_ELEMENTS: MoonElements= { smaKm:  209070, incDeg: 0.008, ecc: 0.0022, raanDeg: 205, aopDeg:  65, m0Deg: 110,  periodDays:  0.61299 };
const PANDORA_ELEMENTS: MoonElements   = { smaKm:  212580, incDeg: 0.050, ecc: 0.0042, raanDeg: 280, aopDeg:  90, m0Deg: 180,  periodDays:  0.62850 };
const JANUS_ELEMENTS: MoonElements     = { smaKm:  227190, incDeg: 0.165, ecc: 0.0068, raanDeg:  73, aopDeg: 178, m0Deg: 220,  periodDays:  0.69466 };
const EPIMETHEUS_ELEMENTS: MoonElements= { smaKm:  227115, incDeg: 0.351, ecc: 0.0098, raanDeg:  30, aopDeg: 334, m0Deg:  80,  periodDays:  0.69433 };
const MIMAS_ELEMENTS: MoonElements     = { smaKm:  278310, incDeg: 1.574, ecc: 0.0202, raanDeg: 172, aopDeg: 332, m0Deg:  24,  periodDays:  0.94242 };
const ENCELADUS_ELEMENTS: MoonElements = { smaKm:  357060, incDeg: 0.009, ecc: 0.0045, raanDeg: 170, aopDeg: 299, m0Deg: 197,  periodDays:  1.37022 };
const TETHYS_ELEMENTS: MoonElements    = { smaKm:  442005, incDeg: 1.091, ecc: 0.0001, raanDeg: 111, aopDeg: 262, m0Deg: 298,  periodDays:  1.88780 };
const DIONE_ELEMENTS: MoonElements     = { smaKm:  566130, incDeg: 0.028, ecc: 0.0022, raanDeg: 169, aopDeg: 172, m0Deg:  84,  periodDays:  2.73692 };
const RHEA_ELEMENTS: MoonElements      = { smaKm:  790605, incDeg: 0.345, ecc: 0.0010, raanDeg: 311, aopDeg: 257, m0Deg: 155,  periodDays:  4.51820 };
const TITAN_ELEMENTS: MoonElements     = { smaKm: 1832805, incDeg: 0.349, ecc: 0.0288, raanDeg:  28, aopDeg: 185, m0Deg: 120,  periodDays: 15.94540 };
const HYPERION_ELEMENTS: MoonElements  = { smaKm: 2221515, incDeg: 0.615, ecc: 0.1230, raanDeg: 287, aopDeg: 205, m0Deg:  39,  periodDays: 21.27660 };
const IAPETUS_ELEMENTS: MoonElements   = { smaKm: 5341260, incDeg:15.470, ecc: 0.0283, raanDeg: 81,  aopDeg: 275, m0Deg: 211,  periodDays: 79.33020 };
const PHOEBE_ELEMENTS: MoonElements    = { smaKm:19421670, incDeg:175.243,ecc: 0.1635, raanDeg: 244, aopDeg: 355, m0Deg:  64,  periodDays:550.56500 };

// ─── Uranus moons ─────────────────────────────────────────────────────────────
// Source: JPL Planetary Satellite Mean Orbital Parameters (2024)

const MIRANDA_ELEMENTS: MoonElements   = { smaKm: 194850, incDeg: 4.338, ecc: 0.0013, raanDeg: 326, aopDeg:  68, m0Deg: 311,  periodDays:  1.41348 };
const ARIEL_ELEMENTS: MoonElements     = { smaKm: 286350, incDeg: 0.041, ecc: 0.0012, raanDeg: 167, aopDeg: 115, m0Deg:  39,  periodDays:  2.52038 };
const UMBRIEL_ELEMENTS: MoonElements   = { smaKm: 399000, incDeg: 0.128, ecc: 0.0039, raanDeg: 109, aopDeg:  84, m0Deg:  12,  periodDays:  4.14418 };
const TITANIA_ELEMENTS: MoonElements   = { smaKm: 654450, incDeg: 0.079, ecc: 0.0011, raanDeg: 132, aopDeg: 284, m0Deg: 219,  periodDays:  8.70588 };
const OBERON_ELEMENTS: MoonElements    = { smaKm: 875250, incDeg: 0.068, ecc: 0.0014, raanDeg: 200, aopDeg: 104, m0Deg: 145,  periodDays: 13.46324 };

// ─── Neptune moons ────────────────────────────────────────────────────────────
// Source: JPL Planetary Satellite Mean Orbital Parameters (2024)

const NAIAD_ELEMENTS: MoonElements     = { smaKm:   72341, incDeg: 4.691, ecc: 0.0003, raanDeg: 100, aopDeg: 181, m0Deg:  45,  periodDays:  0.29394 };
const THALASSA_ELEMENTS: MoonElements  = { smaKm:   75113, incDeg: 0.135, ecc: 0.0002, raanDeg: 212, aopDeg: 156, m0Deg: 190,  periodDays:  0.31148 };
const DESPINA_ELEMENTS: MoonElements   = { smaKm:   78789, incDeg: 0.068, ecc: 0.0002, raanDeg:  90, aopDeg:  65, m0Deg:  85,  periodDays:  0.33465 };
const GALATEA_ELEMENTS: MoonElements   = { smaKm:   92930, incDeg: 0.034, ecc: 0.0001, raanDeg: 359, aopDeg: 218, m0Deg: 320,  periodDays:  0.42875 };
const LARISSA_ELEMENTS: MoonElements   = { smaKm:  110322, incDeg: 0.205, ecc: 0.0014, raanDeg: 271, aopDeg:  44, m0Deg: 177,  periodDays:  0.55465 };
const PROTEUS_ELEMENTS: MoonElements   = { smaKm:  176471, incDeg: 0.075, ecc: 0.0005, raanDeg: 354, aopDeg: 131, m0Deg: 225,  periodDays:  1.12231 };
const TRITON_ELEMENTS: MoonElements    = { smaKm:  532139, incDeg:156.865,ecc: 0.0000, raanDeg: 177, aopDeg: 348, m0Deg:  21,  periodDays:  5.87685 };
const NEREID_ELEMENTS: MoonElements    = { smaKm: 8270727, incDeg: 7.090, ecc: 0.7507, raanDeg: 320, aopDeg: 289, m0Deg: 358,  periodDays:360.13619 };

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
    interactive: true,
    missionDestination: 'mercury',
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
    interactive: true,
    missionDestination: 'venus',
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
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    radiusKm: 69911,
    visualRadius: 0.70,
    interactive: true,
    missionDestination: 'jupiter',
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
    interactive: true,
    missionDestination: 'saturn',
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
    interactive: true,
    missionDestination: 'uranus',
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
    interactive: true,
    missionDestination: 'neptune',
    showOrbit: true,
    color: 0x3f54ba,
    emissive: 0x060a18,
    atmosphereColor: 0x4060d4,
    planetaryElements: NEPTUNE_ELEMENTS,
  },

  // ─── Earth's Moon ────────────────────────────────────────────────────────
  {
    id: 'moon', name: 'Moon', type: 'moon', parentId: 'earth',
    radiusKm: 1737, visualRadius: 0.19,
    interactive: true, missionDestination: 'moon',
    showOrbit: true, color: 0x8a8f9e, emissive: 0x1a1e28,
    moonElements: LUNA_ELEMENTS,
  },

  // ─── Mars moons ──────────────────────────────────────────────────────────
  {
    id: 'phobos', name: 'Phobos', type: 'moon', parentId: 'mars',
    radiusKm: 11, visualRadius: 0.06,
    interactive: false, showOrbit: false, color: 0x7a6a5a, emissive: 0x0a0808,
    moonElements: PHOBOS_ELEMENTS,
  },
  {
    id: 'deimos', name: 'Deimos', type: 'moon', parentId: 'mars',
    radiusKm: 6, visualRadius: 0.05,
    interactive: false, showOrbit: false, color: 0x6a5a4e, emissive: 0x080806,
    moonElements: DEIMOS_ELEMENTS,
  },

  // ─── Jupiter moons ───────────────────────────────────────────────────────
  {
    id: 'metis', name: 'Metis', type: 'moon', parentId: 'jupiter',
    radiusKm: 22, visualRadius: 0.045,
    interactive: false, showOrbit: false, color: 0x8a7060, emissive: 0x080604,
    moonElements: METIS_ELEMENTS,
  },
  {
    id: 'adrastea', name: 'Adrastea', type: 'moon', parentId: 'jupiter',
    radiusKm: 8, visualRadius: 0.040,
    interactive: false, showOrbit: false, color: 0x807060, emissive: 0x080604,
    moonElements: ADRASTEA_ELEMENTS,
  },
  {
    id: 'amalthea', name: 'Amalthea', type: 'moon', parentId: 'jupiter',
    radiusKm: 84, visualRadius: 0.050,
    interactive: false, showOrbit: false, color: 0x9a5040, emissive: 0x100804,
    moonElements: AMALTHEA_ELEMENTS,
  },
  {
    id: 'thebe', name: 'Thebe', type: 'moon', parentId: 'jupiter',
    radiusKm: 50, visualRadius: 0.045,
    interactive: false, showOrbit: false, color: 0x887060, emissive: 0x080604,
    moonElements: THEBE_ELEMENTS,
  },
  {
    id: 'io', name: 'Io', type: 'moon', parentId: 'jupiter',
    radiusKm: 1822, visualRadius: 0.10,
    interactive: false, showOrbit: false, color: 0xe8c84a, emissive: 0x201800,
    moonElements: IO_ELEMENTS,
  },
  {
    id: 'europa', name: 'Europa', type: 'moon', parentId: 'jupiter',
    radiusKm: 1561, visualRadius: 0.09,
    interactive: false, showOrbit: false, color: 0xc8b898, emissive: 0x181410,
    moonElements: EUROPA_ELEMENTS,
  },
  {
    id: 'ganymede', name: 'Ganymede', type: 'moon', parentId: 'jupiter',
    radiusKm: 2634, visualRadius: 0.12,
    interactive: false, showOrbit: false, color: 0x9a8878, emissive: 0x100c0a,
    moonElements: GANYMEDE_ELEMENTS,
  },
  {
    id: 'callisto', name: 'Callisto', type: 'moon', parentId: 'jupiter',
    radiusKm: 2410, visualRadius: 0.11,
    interactive: false, showOrbit: false, color: 0x787068, emissive: 0x0c0a08,
    moonElements: CALLISTO_ELEMENTS,
  },
  {
    id: 'himalia', name: 'Himalia', type: 'moon', parentId: 'jupiter',
    radiusKm: 85, visualRadius: 0.050,
    interactive: false, showOrbit: false, color: 0x706860, emissive: 0x080808,
    moonElements: HIMALIA_ELEMENTS,
  },
  {
    id: 'elara', name: 'Elara', type: 'moon', parentId: 'jupiter',
    radiusKm: 43, visualRadius: 0.045,
    interactive: false, showOrbit: false, color: 0x686060, emissive: 0x080808,
    moonElements: ELARA_ELEMENTS,
  },

  // ─── Saturn moons ────────────────────────────────────────────────────────
  {
    id: 'pan', name: 'Pan', type: 'moon', parentId: 'saturn',
    radiusKm: 14, visualRadius: 0.038,
    interactive: false, showOrbit: false, color: 0xc8b890, emissive: 0x181408,
    moonElements: PAN_ELEMENTS,
  },
  {
    id: 'atlas', name: 'Atlas', type: 'moon', parentId: 'saturn',
    radiusKm: 15, visualRadius: 0.038,
    interactive: false, showOrbit: false, color: 0xc0b088, emissive: 0x181408,
    moonElements: ATLAS_ELEMENTS,
  },
  {
    id: 'prometheus', name: 'Prometheus', type: 'moon', parentId: 'saturn',
    radiusKm: 43, visualRadius: 0.042,
    interactive: false, showOrbit: false, color: 0xb8a880, emissive: 0x141008,
    moonElements: PROMETHEUS_ELEMENTS,
  },
  {
    id: 'pandora', name: 'Pandora', type: 'moon', parentId: 'saturn',
    radiusKm: 42, visualRadius: 0.042,
    interactive: false, showOrbit: false, color: 0xb8a880, emissive: 0x141008,
    moonElements: PANDORA_ELEMENTS,
  },
  {
    id: 'janus', name: 'Janus', type: 'moon', parentId: 'saturn',
    radiusKm: 90, visualRadius: 0.046,
    interactive: false, showOrbit: false, color: 0xb0a878, emissive: 0x140e06,
    moonElements: JANUS_ELEMENTS,
  },
  {
    id: 'epimetheus', name: 'Epimetheus', type: 'moon', parentId: 'saturn',
    radiusKm: 58, visualRadius: 0.044,
    interactive: false, showOrbit: false, color: 0xb0a878, emissive: 0x140e06,
    moonElements: EPIMETHEUS_ELEMENTS,
  },
  {
    id: 'mimas', name: 'Mimas', type: 'moon', parentId: 'saturn',
    radiusKm: 198, visualRadius: 0.055,
    interactive: false, showOrbit: false, color: 0xc8c0b0, emissive: 0x181610,
    moonElements: MIMAS_ELEMENTS,
  },
  {
    id: 'enceladus', name: 'Enceladus', type: 'moon', parentId: 'saturn',
    radiusKm: 252, visualRadius: 0.060,
    interactive: false, showOrbit: false, color: 0xe8e8f0, emissive: 0x181820,
    moonElements: ENCELADUS_ELEMENTS,
  },
  {
    id: 'tethys', name: 'Tethys', type: 'moon', parentId: 'saturn',
    radiusKm: 533, visualRadius: 0.065,
    interactive: false, showOrbit: false, color: 0xd0c8b8, emissive: 0x181610,
    moonElements: TETHYS_ELEMENTS,
  },
  {
    id: 'dione', name: 'Dione', type: 'moon', parentId: 'saturn',
    radiusKm: 561, visualRadius: 0.065,
    interactive: false, showOrbit: false, color: 0xc8c0b0, emissive: 0x181610,
    moonElements: DIONE_ELEMENTS,
  },
  {
    id: 'rhea', name: 'Rhea', type: 'moon', parentId: 'saturn',
    radiusKm: 764, visualRadius: 0.075,
    interactive: false, showOrbit: false, color: 0xc0b8a8, emissive: 0x181410,
    moonElements: RHEA_ELEMENTS,
  },
  {
    id: 'titan', name: 'Titan', type: 'moon', parentId: 'saturn',
    radiusKm: 2575, visualRadius: 0.13,
    interactive: false, showOrbit: false, color: 0xe8a040, emissive: 0x201408,
    moonElements: TITAN_ELEMENTS,
  },
  {
    id: 'hyperion', name: 'Hyperion', type: 'moon', parentId: 'saturn',
    radiusKm: 135, visualRadius: 0.048,
    interactive: false, showOrbit: false, color: 0xa89880, emissive: 0x141008,
    moonElements: HYPERION_ELEMENTS,
  },
  {
    id: 'iapetus', name: 'Iapetus', type: 'moon', parentId: 'saturn',
    radiusKm: 736, visualRadius: 0.072,
    interactive: false, showOrbit: false, color: 0x988880, emissive: 0x100c0a,
    moonElements: IAPETUS_ELEMENTS,
  },
  {
    id: 'phoebe', name: 'Phoebe', type: 'moon', parentId: 'saturn',
    radiusKm: 107, visualRadius: 0.046,
    interactive: false, showOrbit: false, color: 0x706860, emissive: 0x0c0a0a,
    moonElements: PHOEBE_ELEMENTS,
  },

  // ─── Uranus moons ────────────────────────────────────────────────────────
  {
    id: 'miranda', name: 'Miranda', type: 'moon', parentId: 'uranus',
    radiusKm: 236, visualRadius: 0.050,
    interactive: false, showOrbit: false, color: 0xb8b0a8, emissive: 0x141210,
    moonElements: MIRANDA_ELEMENTS,
  },
  {
    id: 'ariel', name: 'Ariel', type: 'moon', parentId: 'uranus',
    radiusKm: 579, visualRadius: 0.062,
    interactive: false, showOrbit: false, color: 0xb8b8c0, emissive: 0x141418,
    moonElements: ARIEL_ELEMENTS,
  },
  {
    id: 'umbriel', name: 'Umbriel', type: 'moon', parentId: 'uranus',
    radiusKm: 585, visualRadius: 0.062,
    interactive: false, showOrbit: false, color: 0x787880, emissive: 0x0c0c10,
    moonElements: UMBRIEL_ELEMENTS,
  },
  {
    id: 'titania', name: 'Titania', type: 'moon', parentId: 'uranus',
    radiusKm: 789, visualRadius: 0.072,
    interactive: false, showOrbit: false, color: 0xa8a8b0, emissive: 0x101014,
    moonElements: TITANIA_ELEMENTS,
  },
  {
    id: 'oberon', name: 'Oberon', type: 'moon', parentId: 'uranus',
    radiusKm: 761, visualRadius: 0.070,
    interactive: false, showOrbit: false, color: 0x988890, emissive: 0x100c10,
    moonElements: OBERON_ELEMENTS,
  },

  // ─── Neptune moons ───────────────────────────────────────────────────────
  {
    id: 'naiad', name: 'Naiad', type: 'moon', parentId: 'neptune',
    radiusKm: 33, visualRadius: 0.040,
    interactive: false, showOrbit: false, color: 0x4870a8, emissive: 0x080c14,
    moonElements: NAIAD_ELEMENTS,
  },
  {
    id: 'thalassa', name: 'Thalassa', type: 'moon', parentId: 'neptune',
    radiusKm: 41, visualRadius: 0.040,
    interactive: false, showOrbit: false, color: 0x4878b0, emissive: 0x080c14,
    moonElements: THALASSA_ELEMENTS,
  },
  {
    id: 'despina', name: 'Despina', type: 'moon', parentId: 'neptune',
    radiusKm: 75, visualRadius: 0.044,
    interactive: false, showOrbit: false, color: 0x5080b8, emissive: 0x080c18,
    moonElements: DESPINA_ELEMENTS,
  },
  {
    id: 'galatea', name: 'Galatea', type: 'moon', parentId: 'neptune',
    radiusKm: 88, visualRadius: 0.044,
    interactive: false, showOrbit: false, color: 0x5080b8, emissive: 0x080c18,
    moonElements: GALATEA_ELEMENTS,
  },
  {
    id: 'larissa', name: 'Larissa', type: 'moon', parentId: 'neptune',
    radiusKm: 97, visualRadius: 0.046,
    interactive: false, showOrbit: false, color: 0x5888c0, emissive: 0x080e18,
    moonElements: LARISSA_ELEMENTS,
  },
  {
    id: 'proteus', name: 'Proteus', type: 'moon', parentId: 'neptune',
    radiusKm: 210, visualRadius: 0.055,
    interactive: false, showOrbit: false, color: 0x5890c8, emissive: 0x080e18,
    moonElements: PROTEUS_ELEMENTS,
  },
  {
    id: 'triton', name: 'Triton', type: 'moon', parentId: 'neptune',
    radiusKm: 1353, visualRadius: 0.10,
    interactive: false, showOrbit: false, color: 0x80b0d8, emissive: 0x0c1820,
    moonElements: TRITON_ELEMENTS,
  },
  {
    id: 'nereid', name: 'Nereid', type: 'moon', parentId: 'neptune',
    radiusKm: 170, visualRadius: 0.050,
    interactive: false, showOrbit: false, color: 0x6090c0, emissive: 0x081018,
    moonElements: NEREID_ELEMENTS,
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
