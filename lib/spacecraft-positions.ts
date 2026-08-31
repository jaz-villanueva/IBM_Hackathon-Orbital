/**
 * Spacecraft / mission positional data for the 3D scene.
 *
 * Positions are expressed in local planet-relative spherical coordinates:
 *   orbitRadius — radius of orbit ring around planet (in scene units)
 *   orbitInclination — inclination of orbit plane (radians)
 *   orbitPhase — starting angle on the orbit (radians)
 *   surfaceLat / surfaceLon — surface position (degrees) for landers/rovers
 *
 * Scene coordinates:
 *   Earth centre:  [-4,  0,   0]
 *   Moon centre:   [ 0,  1.2, -3]
 *   Mars centre:   [ 4, -0.5,  0]
 * Planet radii: earth=1.2  moon=0.35  mars=0.65
 *
 * Sources: publicly documented orbital parameters (NASA, ESA, CelesTrak).
 * Surface coordinates for rovers/landers from published landing-site data.
 */

export type ObjectType =
  | 'station'
  | 'orbiter'
  | 'rover'
  | 'lander'
  | 'capsule'
  | 'telescope';

export type SceneStatus =
  | 'active'      // green
  | 'science'     // blue-purple
  | 'surface'     // amber
  | 'planned'     // sky
  | 'completed';  // gray

export interface SceneObject {
  /** Matches Mission.id in lib/missions.ts */
  missionId: string;
  name: string;
  shortName: string;
  agency: string;
  objectType: ObjectType;
  status: SceneStatus;
  destination: 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
  /** If true the object orbits its planet */
  isOrbiter: boolean;
  /** Orbit ring radius in scene units (planet-relative) */
  orbitRadius?: number;
  /** Inclination of orbit plane, radians */
  orbitInclination?: number;
  /** Starting phase angle, radians */
  orbitPhase?: number;
  /** Angular speed multiplier (relative) — higher = faster */
  orbitSpeed?: number;
  /** For surface missions: lat/lon degrees */
  surfaceLat?: number;
  surfaceLon?: number;
  /** One-line status blurb shown in popup */
  statusNote: string;
  /** Color accent for orbit ring */
  orbitColor?: number;
  /**
   * True for satellites sourced live from Earth Mode's CelesTrak fleet/deep-link
   * data (see lib/satellites/scene.ts#buildSceneObject) — SpaceScene renders
   * these with the dedicated SatelliteMarker model (always visible, larger,
   * with an invisible click-target sphere) instead of the sprite/model swap
   * used for the static mission catalog.
   */
  isLiveSatellite?: boolean;
}

// ─── EARTH ───────────────────────────────────────────────────────────────────

export const EARTH_OBJECTS: SceneObject[] = [
  {
    missionId: 'iss',
    name: 'International Space Station',
    shortName: 'ISS',
    agency: 'NASA / ESA / JAXA',
    objectType: 'station',
    status: 'active',
    destination: 'earth',
    isOrbiter: true,
    orbitRadius: 1.45,
    orbitInclination: Math.PI / 3,
    orbitPhase: 0,
    orbitSpeed: 2.2,
    orbitColor: 0x06b6d4,
    statusNote: 'Low Earth Orbit · ~408 km · Crewed',
  },
  {
    missionId: 'terra',
    name: 'Terra',
    shortName: 'Terra',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'active',
    destination: 'earth',
    isOrbiter: true,
    orbitRadius: 1.72,
    orbitInclination: Math.PI * 0.55,
    orbitPhase: Math.PI * 0.3,
    orbitSpeed: 1.0,
    orbitColor: 0x22c55e,
    statusNote: 'Sun-synchronous orbit · ~705 km · Earth observation',
  },
  {
    missionId: 'aqua',
    name: 'Aqua',
    shortName: 'Aqua',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'active',
    destination: 'earth',
    isOrbiter: true,
    orbitRadius: 1.72,
    orbitInclination: Math.PI * 0.55,
    orbitPhase: Math.PI * 0.9,
    orbitSpeed: 1.0,
    orbitColor: 0x3b82f6,
    statusNote: 'Sun-synchronous orbit · ~705 km · Water cycle',
  },
  {
    missionId: 'landsat-9',
    name: 'Landsat 9',
    shortName: 'Landsat 9',
    agency: 'NASA / USGS',
    objectType: 'orbiter',
    status: 'active',
    destination: 'earth',
    isOrbiter: true,
    orbitRadius: 1.72,
    orbitInclination: Math.PI * 0.56,
    orbitPhase: Math.PI * 1.5,
    orbitSpeed: 0.9,
    orbitColor: 0x22c55e,
    statusNote: 'Sun-synchronous orbit · ~705 km · Land imaging',
  },
];

// ─── MOON ────────────────────────────────────────────────────────────────────

export const MOON_OBJECTS: SceneObject[] = [
  {
    missionId: 'lro',
    name: 'Lunar Reconnaissance Orbiter',
    shortName: 'LRO',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'active',
    destination: 'moon',
    isOrbiter: true,
    orbitRadius: 0.52,
    orbitInclination: Math.PI * 0.5,
    orbitPhase: 0,
    orbitSpeed: 1.8,
    orbitColor: 0x3b82f6,
    statusNote: 'Polar orbit · ~100 km · Lunar mapping',
  },
  {
    missionId: 'kplo',
    name: 'KPLO (Danuri)',
    shortName: 'Danuri',
    agency: 'KARI',
    objectType: 'orbiter',
    status: 'active',
    destination: 'moon',
    isOrbiter: true,
    orbitRadius: 0.52,
    orbitInclination: Math.PI * 0.48,
    orbitPhase: Math.PI,
    orbitSpeed: 1.6,
    orbitColor: 0xa855f7,
    statusNote: 'Polar orbit · ~100 km · ShadowCam imaging',
  },
  {
    missionId: 'artemis-2',
    name: 'Artemis II',
    shortName: 'Artemis II',
    agency: 'NASA',
    objectType: 'capsule',
    status: 'planned',
    destination: 'moon',
    isOrbiter: true,
    orbitRadius: 0.65,
    orbitInclination: Math.PI * 0.25,
    orbitPhase: Math.PI * 0.5,
    orbitSpeed: 0.4,
    orbitColor: 0x60a5fa,
    statusNote: 'Planned lunar flyby · 2025 target',
  },
];

// ─── MARS ────────────────────────────────────────────────────────────────────

export const MARS_OBJECTS: SceneObject[] = [
  // Orbiters
  {
    missionId: 'mro',
    name: 'Mars Reconnaissance Orbiter',
    shortName: 'MRO',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'science',
    destination: 'mars',
    isOrbiter: true,
    orbitRadius: 0.92,
    orbitInclination: Math.PI * 0.52,
    orbitPhase: 0,
    orbitSpeed: 1.5,
    orbitColor: 0xf59e0b,
    statusNote: 'Polar orbit · ~300 km · HiRISE imaging & relay',
  },
  {
    missionId: 'maven',
    name: 'MAVEN',
    shortName: 'MAVEN',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'science',
    destination: 'mars',
    isOrbiter: true,
    orbitRadius: 1.05,
    orbitInclination: Math.PI * 0.42,
    orbitPhase: Math.PI * 0.7,
    orbitSpeed: 0.9,
    orbitColor: 0xe05c30,
    statusNote: 'Elliptical orbit · Atmospheric science & relay',
  },
  {
    missionId: 'mars-express',
    name: 'Mars Express',
    shortName: 'Mars Express',
    agency: 'ESA',
    objectType: 'orbiter',
    status: 'science',
    destination: 'mars',
    isOrbiter: true,
    orbitRadius: 1.15,
    orbitInclination: Math.PI * 0.48,
    orbitPhase: Math.PI * 1.3,
    orbitSpeed: 0.7,
    orbitColor: 0x06b6d4,
    statusNote: 'Elliptical orbit · MARSIS radar · Over 20 yrs',
  },
  {
    missionId: 'tgo',
    name: 'ExoMars TGO',
    shortName: 'TGO',
    agency: 'ESA',
    objectType: 'orbiter',
    status: 'science',
    destination: 'mars',
    isOrbiter: true,
    orbitRadius: 0.98,
    orbitInclination: Math.PI * 0.41,
    orbitPhase: Math.PI * 1.8,
    orbitSpeed: 1.1,
    orbitColor: 0xa855f7,
    statusNote: 'Near-circular orbit · ~400 km · Trace gas science',
  },
  // Surface missions
  {
    missionId: 'perseverance',
    name: 'Perseverance',
    shortName: 'Perseverance',
    agency: 'NASA',
    objectType: 'rover',
    status: 'surface',
    destination: 'mars',
    isOrbiter: false,
    surfaceLat: 18.4,
    surfaceLon: 77.5,
    statusNote: 'Jezero Crater · Sample caching · ACTIVE',
  },
  {
    missionId: 'curiosity',
    name: 'Curiosity',
    shortName: 'Curiosity',
    agency: 'NASA',
    objectType: 'rover',
    status: 'surface',
    destination: 'mars',
    isOrbiter: false,
    surfaceLat: -4.6,
    surfaceLon: 137.4,
    statusNote: 'Gale Crater / Mt. Sharp · Geology · ACTIVE',
  },
  {
    missionId: 'insight',
    name: 'InSight',
    shortName: 'InSight',
    agency: 'NASA',
    objectType: 'lander',
    status: 'completed',
    destination: 'mars',
    isOrbiter: false,
    surfaceLat: 4.5,
    surfaceLon: 135.6,
    statusNote: 'Elysium Planitia · Mission ended Dec 2022',
  },
];

// ─── JUPITER ─────────────────────────────────────────────────────────────────

export const JUPITER_OBJECTS: SceneObject[] = [
  {
    missionId: 'juno',
    name: 'Juno',
    shortName: 'Juno',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'science',
    destination: 'jupiter',
    isOrbiter: true,
    orbitRadius: 1.8,
    orbitInclination: Math.PI * 0.5,
    orbitPhase: 0,
    orbitSpeed: 0.8,
    orbitColor: 0xf97316,
    statusNote: 'Polar orbit · Studying interior, magnetic field, aurora',
  },
  {
    missionId: 'europa-clipper',
    name: 'Europa Clipper',
    shortName: 'Europa Clipper',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'active',
    destination: 'jupiter',
    isOrbiter: true,
    orbitRadius: 2.2,
    orbitInclination: Math.PI * 0.35,
    orbitPhase: Math.PI * 0.8,
    orbitSpeed: 0.4,
    orbitColor: 0x60a5fa,
    statusNote: 'En route to Jupiter · Arrives 2030 · Europa ocean study',
  },
  {
    missionId: 'juice',
    name: 'JUICE',
    shortName: 'JUICE',
    agency: 'ESA',
    objectType: 'orbiter',
    status: 'active',
    destination: 'jupiter',
    isOrbiter: true,
    orbitRadius: 2.6,
    orbitInclination: Math.PI * 0.28,
    orbitPhase: Math.PI * 1.5,
    orbitSpeed: 0.35,
    orbitColor: 0xa855f7,
    statusNote: 'En route to Jupiter · Arrives 2031 · Icy moons survey',
  },
];

// ─── SATURN ──────────────────────────────────────────────────────────────────

export const SATURN_OBJECTS: SceneObject[] = [
  {
    missionId: 'cassini',
    name: 'Cassini–Huygens',
    shortName: 'Cassini',
    agency: 'NASA / ESA',
    objectType: 'orbiter',
    status: 'completed',
    destination: 'saturn',
    isOrbiter: true,
    orbitRadius: 1.6,
    orbitInclination: Math.PI * 0.4,
    orbitPhase: Math.PI * 0.2,
    orbitSpeed: 0.5,
    orbitColor: 0xe4d191,
    statusNote: 'Mission concluded Sep 2017 · Grand Finale atmospheric entry',
  },
  {
    missionId: 'dragonfly',
    name: 'Dragonfly',
    shortName: 'Dragonfly',
    agency: 'NASA',
    objectType: 'lander',
    status: 'planned',
    destination: 'saturn',
    isOrbiter: true,
    orbitRadius: 1.3,
    orbitInclination: Math.PI * 0.3,
    orbitPhase: Math.PI * 1.2,
    orbitSpeed: 0.3,
    orbitColor: 0xf59e0b,
    statusNote: 'Planned Titan rotorcraft · Launch 2028',
  },
];

// ─── URANUS ───────────────────────────────────────────────────────────────────

export const URANUS_OBJECTS: SceneObject[] = [
  {
    missionId: 'voyager-2-uranus',
    name: 'Voyager 2 — Uranus Flyby',
    shortName: 'Voyager 2',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'completed',
    destination: 'uranus',
    isOrbiter: true,
    orbitRadius: 1.2,
    orbitInclination: Math.PI * 0.5,
    orbitPhase: 0,
    orbitSpeed: 0.2,
    orbitColor: 0x7de8e8,
    statusNote: 'Flyby Jan 1986 · Only Uranus encounter · Now in interstellar space',
  },
];

// ─── NEPTUNE ──────────────────────────────────────────────────────────────────

export const NEPTUNE_OBJECTS: SceneObject[] = [
  {
    missionId: 'voyager-2-neptune',
    name: 'Voyager 2 — Neptune Flyby',
    shortName: 'Voyager 2',
    agency: 'NASA',
    objectType: 'orbiter',
    status: 'completed',
    destination: 'neptune',
    isOrbiter: true,
    orbitRadius: 1.1,
    orbitInclination: Math.PI * 0.45,
    orbitPhase: Math.PI * 0.6,
    orbitSpeed: 0.2,
    orbitColor: 0x3f54ba,
    statusNote: 'Flyby Aug 1989 · Only Neptune encounter · Now in interstellar space',
  },
];

export const ALL_SCENE_OBJECTS: SceneObject[] = [
  ...EARTH_OBJECTS,
  ...MOON_OBJECTS,
  ...MARS_OBJECTS,
  ...JUPITER_OBJECTS,
  ...SATURN_OBJECTS,
  ...URANUS_OBJECTS,
  ...NEPTUNE_OBJECTS,
];
