/**
 * Telemetry Snapshot Engine
 *
 * Produces a deterministic, side-effect-free snapshot of the orbital state
 * of every tracked spacecraft at a supplied simulation time `t` (elapsed
 * seconds since simulation epoch).
 *
 * Design notes
 * ─────────────
 * • keplerPosition() in lib/orbital-mechanics.ts returns a NORMALISED unit
 *   vector (direction only). To obtain a km-scale ECI position the unit
 *   vector is scaled by the spacecraft's semi-major axis (smaKm). This is
 *   an approximation that is exact for circular orbits and progressively
 *   less accurate for highly elliptical ones (MAVEN ecc≈0.63). The error is
 *   acceptable for proximity / risk scoring; the provenance label is set to
 *   'ESTIMATED' for those cases.
 *
 * • Velocity is derived by finite differencing two positions separated by
 *   VELOCITY_DT_S seconds. The same smaKm scaling applies.
 *
 * • Surface assets (rovers, landers) are not in ORBITAL_PARAMS because they
 *   do not orbit. They are included as SurfaceAssetState entries with a fixed
 *   lat/lon from ALL_SCENE_OBJECTS and no orbital velocity.
 *
 * • This module never modifies lib/orbital-mechanics.ts and duplicates none
 *   of its calculations. It is a pure consumer of keplerPosition().
 *
 * • All functions are pure (deterministic, no side effects, no I/O).
 *
 * References:
 *   lib/orbital-mechanics.ts — keplerPosition(), ORBITAL_PARAMS, OrbitalParams
 *   lib/spacecraft-positions.ts — ALL_SCENE_OBJECTS, SceneObject
 */

import {
  keplerPosition,
  ORBITAL_PARAMS,
  OrbitalParams,
} from './orbital-mechanics';
import {
  ALL_SCENE_OBJECTS,
  SceneObject,
  ObjectType,
} from './spacecraft-positions';
import type { DataLabel, Destination } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Time delta used for finite-difference velocity estimation, in seconds.
 * Small enough to be accurate; large enough to avoid floating-point noise.
 */
const VELOCITY_DT_S = 10;

// ─── Exported types ───────────────────────────────────────────────────────────

/**
 * ECI (Earth-Centred Inertial) position vector in kilometres, relative to the
 * spacecraft's central body (Earth for Earth orbiters, Moon for lunar orbiters,
 * Mars for Mars orbiters). The origin is the centre of the central body.
 *
 * Axes follow the standard ECI convention as implemented in keplerPosition():
 *   x — in the equatorial plane, towards the vernal equinox
 *   y — in the equatorial plane, 90° east
 *   z — towards the north pole
 */
export interface ECIVector {
  x: number; // km
  y: number; // km
  z: number; // km
}

/**
 * Telemetry state for a single orbiting spacecraft at a given simulation time.
 */
export interface OrbiterState {
  /** Matches Mission.id and ORBITAL_PARAMS key */
  missionId: string;
  /** Human-readable short name */
  name: string;
  /** The gravitational body this spacecraft orbits */
  destination: 'earth' | 'moon' | 'mars';
  /** Spacecraft class from SceneObject */
  objectType: ObjectType;

  /**
   * Position in km relative to the central body centre (body-centred inertial
   * frame, same orientation as keplerPosition output scaled by smaKm).
   */
  positionKm: ECIVector;

  /**
   * Velocity estimate in km/s derived from finite differencing positionKm at
   * t − VELOCITY_DT_S/2 and t + VELOCITY_DT_S/2.
   */
  velocityKmS: ECIVector;

  /**
   * Scalar distance from central body centre in km.
   * Equals |positionKm|.
   */
  radiusKm: number;

  /**
   * Approximate altitude above the body's mean surface in km.
   * = radiusKm − BODY_RADIUS_KM[destination]
   */
  altitudeKm: number;

  /**
   * Scalar orbital speed in km/s.
   * Equals |velocityKmS|.
   */
  speedKmS: number;

  /**
   * The orbital elements used for propagation.
   * Included so the risk engine can access inclination, eccentricity, etc.
   * without re-importing ORBITAL_PARAMS.
   */
  orbitalParams: OrbitalParams;

  /**
   * Provenance of this state vector.
   * Inherits from OrbitalParams.source; ESTIMATED for high-eccentricity orbits.
   */
  dataLabel: DataLabel;

  /**
   * Elapsed simulation seconds at which this state was computed.
   */
  elapsedSeconds: number;
}

/**
 * State for a surface asset (rover, lander) that does not orbit.
 */
export interface SurfaceAssetState {
  missionId: string;
  name: string;
  destination: 'earth' | 'moon' | 'mars';
  objectType: ObjectType;
  /** Geodetic latitude, degrees (positive = north) */
  surfaceLat: number;
  /** Geodetic longitude, degrees (positive = east) */
  surfaceLon: number;
  dataLabel: DataLabel;
  elapsedSeconds: number;
}

/**
 * Complete telemetry snapshot for all tracked spacecraft at a given
 * simulation time. Orbiters and surface assets are kept separate because
 * the risk engine only operates on orbiters sharing the same destination.
 */
export interface TelemetrySnapshot {
  /** Simulation elapsed seconds at snapshot time */
  elapsedSeconds: number;
  /** ISO-8601 wall-clock timestamp when this snapshot was computed */
  computedAt: string;
  /** All orbiting spacecraft with full state vectors */
  orbiters: OrbiterState[];
  /** Surface assets (rovers/landers) with fixed positions */
  surfaceAssets: SurfaceAssetState[];
}

// ─── Body radii (mean) ────────────────────────────────────────────────────────

/**
 * Mean radii of the three bodies in the simulation, in km.
 * Used to derive altitude from radius.
 * Sources: NASA Fact Sheets (OBSERVED).
 */
const BODY_RADIUS_KM: Record<'earth' | 'moon' | 'mars', number> = {
  earth: 6371,  // km — IAU 2015 nominal
  moon:  1737,  // km — IAU 2015 nominal
  mars:  3390,  // km — IAU 2015 nominal mean
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Compute a km-scale ECI position for a spacecraft at elapsed time t.
 *
 * keplerPosition() returns a unit vector. Scaling by smaKm gives an
 * approximate km position. The error grows with eccentricity because
 * the true radius r = a(1 − e·cos E) deviates from smaKm as E changes.
 * For near-circular orbiters (e < 0.01) the error is < 1%. For MAVEN
 * (e ≈ 0.63) the error can reach ~40% of smaKm, which is still sufficient
 * for ordering relative risk but not for precision conjunction analysis.
 */
function eciPositionKm(params: OrbitalParams, t: number): ECIVector {
  const unit = keplerPosition(params, t);
  const scale = params.smaKm;
  return {
    x: unit.x * scale,
    y: unit.y * scale,
    z: unit.z * scale,
  };
}

/** Euclidean length of an ECIVector */
function vecLen(v: ECIVector): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** Element-wise subtraction of two ECIVectors */
function vecSub(a: ECIVector, b: ECIVector): ECIVector {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Scale an ECIVector by a scalar */
function vecScale(v: ECIVector, s: number): ECIVector {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * Estimate velocity via symmetric finite differencing.
 * vel ≈ (pos(t + dt/2) − pos(t − dt/2)) / dt
 */
function estimateVelocity(params: OrbitalParams, t: number): ECIVector {
  const half = VELOCITY_DT_S / 2;
  const forward  = eciPositionKm(params, t + half);
  const backward = eciPositionKm(params, t - half);
  return vecScale(vecSub(forward, backward), 1 / VELOCITY_DT_S);
}

/**
 * Choose the appropriate provenance label for a state vector.
 * High-eccentricity orbits get ESTIMATED; low-eccentricity keep the
 * source label from the orbital parameters record.
 */
function stateDataLabel(params: OrbitalParams): DataLabel {
  // Eccentricity ≥ 0.1 introduces meaningful smaKm-scaling error
  if (params.ecc >= 0.1) return 'ESTIMATED';
  return params.source; // 'DERIVED' or 'ESTIMATED' from the params record
}

// ─── Core lookup: scene metadata for orbiters ─────────────────────────────────

/**
 * Build a lookup map from missionId → SceneObject for all objects that have a
 * corresponding entry in ORBITAL_PARAMS. Constructed once at module load.
 */
const SCENE_BY_MISSION: Map<string, SceneObject> = new Map(
  ALL_SCENE_OBJECTS
    .filter((obj) => obj.missionId in ORBITAL_PARAMS)
    .map((obj) => [obj.missionId, obj])
);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Snapshot the orbital state of every tracked spacecraft at the given
 * simulation elapsed time.
 *
 * @param elapsedSeconds
 *   Elapsed seconds since the simulation epoch (as returned by
 *   simElapsedSeconds() from lib/orbital-mechanics.ts, or any arbitrary
 *   positive number for what-if / historical queries).
 *
 * @returns A fully typed TelemetrySnapshot. Pure function — same input always
 *   produces the same output. Safe to call from any context (server, client,
 *   worker).
 *
 * @example
 *   // Snapshot at the current simulation time:
 *   import { simElapsedSeconds, makeSimClock } from './orbital-mechanics';
 *   const clock = makeSimClock();
 *   const snapshot = snapshotOrbitalState(simElapsedSeconds(clock));
 *
 *   // Snapshot at an arbitrary future time (1 hour from epoch):
 *   const future = snapshotOrbitalState(3600);
 */
export function snapshotOrbitalState(elapsedSeconds: number): TelemetrySnapshot {
  const orbiters: OrbiterState[] = [];
  const surfaceAssets: SurfaceAssetState[] = [];

  // ── Orbiters: everything with an entry in ORBITAL_PARAMS ──────────────────
  for (const [missionId, params] of Object.entries(ORBITAL_PARAMS)) {
    const sceneObj = SCENE_BY_MISSION.get(missionId);

    // Destination is required to contextualise risk; fall back to 'earth' only
    // if the scene object is somehow absent (shouldn't happen with current data).
    const destination: 'earth' | 'moon' | 'mars' =
      (sceneObj?.destination as 'earth' | 'moon' | 'mars') ?? 'earth';

    const positionKm  = eciPositionKm(params, elapsedSeconds);
    const velocityKmS = estimateVelocity(params, elapsedSeconds);
    const radiusKm    = vecLen(positionKm);
    const altitudeKm  = radiusKm - BODY_RADIUS_KM[destination];
    const speedKmS    = vecLen(velocityKmS);
    const dataLabel   = stateDataLabel(params);

    orbiters.push({
      missionId,
      name:          sceneObj?.name ?? missionId,
      destination,
      objectType:    sceneObj?.objectType ?? 'orbiter',
      positionKm,
      velocityKmS,
      radiusKm,
      altitudeKm,
      speedKmS,
      orbitalParams: params,
      dataLabel,
      elapsedSeconds,
    });
  }

  // ── Surface assets: scene objects NOT in ORBITAL_PARAMS ───────────────────
  // This telemetry/risk engine only models Earth, Moon, and Mars (see
  // OrbiterState/SurfaceAssetState.destination) — outer-planet scene objects
  // (Jupiter, Saturn, ...) are out of scope here and intentionally excluded.
  for (const obj of ALL_SCENE_OBJECTS) {
    if (obj.missionId in ORBITAL_PARAMS) continue; // already handled above
    if (obj.destination !== 'earth' && obj.destination !== 'moon' && obj.destination !== 'mars') continue;
    if (!obj.isOrbiter && obj.surfaceLat !== undefined && obj.surfaceLon !== undefined) {
      surfaceAssets.push({
        missionId:     obj.missionId,
        name:          obj.name,
        destination:   obj.destination,
        objectType:    obj.objectType,
        surfaceLat:    obj.surfaceLat,
        surfaceLon:    obj.surfaceLon,
        dataLabel:     'OBSERVED', // surface coords are published landing-site data
        elapsedSeconds,
      });
    }
  }

  return {
    elapsedSeconds,
    computedAt: new Date().toISOString(),
    orbiters,
    surfaceAssets,
  };
}

/**
 * Convenience: return only the orbiters at a given destination.
 * Useful for the risk engine, which compares spacecraft sharing the same
 * central body.
 *
 * @param elapsedSeconds Simulation time
 * @param destination    Body to filter on
 */
export function snapshotByDestination(
  elapsedSeconds: number,
  destination: 'earth' | 'moon' | 'mars'
): OrbiterState[] {
  return snapshotOrbitalState(elapsedSeconds).orbiters.filter(
    (o) => o.destination === destination
  );
}

/**
 * Compute the 3D separation in km between two orbiters at a given time.
 * Pure helper exposed here so the risk engine does not need to import
 * ECIVector arithmetic separately.
 *
 * @returns Distance in km, or null if either missionId is not found.
 */
export function separationKm(
  missionIdA: string,
  missionIdB: string,
  elapsedSeconds: number
): number | null {
  const paramsA = ORBITAL_PARAMS[missionIdA];
  const paramsB = ORBITAL_PARAMS[missionIdB];
  if (!paramsA || !paramsB) return null;

  const posA = eciPositionKm(paramsA, elapsedSeconds);
  const posB = eciPositionKm(paramsB, elapsedSeconds);
  return vecLen(vecSub(posA, posB));
}
