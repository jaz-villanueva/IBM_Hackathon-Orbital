/**
 * Converts a live CelesTrak GP record into Orbital's existing orbital-mechanics
 * types and derives human-facing quantities from it.
 *
 * This module performs no fetching and no I/O — it is a pure consumer of
 * lib/orbital-mechanics.ts, following the same "one place for this math"
 * principle as lib/telemetry.ts. It never invents values: every derived
 * quantity is computed directly from the supplied GP record.
 */

import {
  OrbitalParams,
  subSatellitePoint,
} from '../orbital-mechanics';
import type { CelesTrakGpRecord } from './celestrak';
import type { DataPoint, SatelliteOrbitalState, SatelliteAIContext } from '../types';

// ─── Constants (shared convention with lib/telemetry.ts) ──────────────────────
const MU = 398600.4418; // Earth's gravitational parameter, km^3/s^2
const RE = 6371.0;      // Earth mean radius, km

/** Parse a CelesTrak EPOCH string (may carry microsecond precision JS Date can't parse) into a Date. */
function parseCelesTrakEpoch(epoch: string): Date {
  // CelesTrak emits e.g. "2024-01-01T12:34:56.123456" — truncate fractional
  // seconds to millisecond precision so the JS Date parser accepts it.
  const truncated = epoch.replace(/(\.\d{3})\d*$/, '$1');
  const withZone = /Z$/.test(truncated) ? truncated : `${truncated}Z`;
  return new Date(withZone);
}

/**
 * Convert a live GP record into Orbital's OrbitalParams shape, with the
 * mean anomaly propagated forward from the TLE epoch to `now`.
 *
 * The returned `referenceDate` is the real UTC instant that
 * elapsedSeconds=0 corresponds to for any keplerPosition()/subSatellitePoint()
 * call using these params — i.e. `now`, not the TLE epoch.
 */
export function gpRecordToOrbitalParams(
  gp: CelesTrakGpRecord,
  now: Date = new Date()
): { params: OrbitalParams; referenceDate: Date } {
  const meanMotionRadPerSec = (gp.MEAN_MOTION * 2 * Math.PI) / 86400;
  const smaKm = Math.cbrt(MU / (meanMotionRadPerSec * meanMotionRadPerSec));
  const periodMin = 1440 / gp.MEAN_MOTION;
  const periodSec = periodMin * 60;

  const epochDate = parseCelesTrakEpoch(gp.EPOCH);
  const elapsedSinceEpochSec = (now.getTime() - epochDate.getTime()) / 1000;
  const m0AtNowDeg =
    ((gp.MEAN_ANOMALY + (360 / periodSec) * elapsedSinceEpochSec) % 360 + 360) % 360;

  const params: OrbitalParams = {
    periodMin,
    smaKm,
    incDeg: gp.INCLINATION,
    ecc: gp.ECCENTRICITY,
    raanDeg: gp.RA_OF_ASC_NODE,
    aopDeg: gp.ARG_OF_PERICENTER,
    m0Deg: m0AtNowDeg,
    // Propagation is still simplified two-body Keplerian (no SGP4/drag/J2),
    // consistent with every other ORBITAL_PARAMS entry — the underlying
    // *elements* are OBSERVED (see buildElements below), but this derived
    // motion model is DERIVED, same convention as the rest of the file.
    source: 'DERIVED',
    sourceNote: `Live CelesTrak GP epoch ${gp.EPOCH}`,
  };

  return { params, referenceDate: now };
}

function point<T>(value: T, source: DataPoint<T>['source'] = 'CelesTrak', label: DataPoint<T>['label'] = 'OBSERVED', notes?: string): DataPoint<T> {
  return { value, label, source, sourceUrl: 'https://celestrak.org', notes };
}

/**
 * Compute the full SatelliteOrbitalState for a live GP record: raw elements
 * (OBSERVED), derived quantities (DERIVED), current sub-satellite point, and
 * a ground track sampled across one orbital period.
 */
export function deriveOrbitalState(
  gp: CelesTrakGpRecord,
  opts: { dataQuality?: 'OBSERVED' | 'ESTIMATED'; fallbackReason?: string; now?: Date } = {}
): { state: SatelliteOrbitalState; params: OrbitalParams } {
  const now = opts.now ?? new Date();
  const { params, referenceDate } = gpRecordToOrbitalParams(gp, now);

  const apogeeKm = params.smaKm * (1 + params.ecc) - RE;
  const perigeeKm = params.smaKm * (1 - params.ecc) - RE;
  const altitudeKm = (apogeeKm + perigeeKm) / 2; // mean altitude, simplified (circular-orbit approximation)
  const velocityKmS = Math.sqrt(MU / params.smaKm); // vis-viva at mean radius, approximate

  const currentPoint = subSatellitePoint(params, 0, referenceDate);
  const track = groundTrack(params, referenceDate, 96);

  const derivedLabel = opts.dataQuality === 'ESTIMATED' ? 'ESTIMATED' : 'DERIVED';
  const elementLabel = opts.dataQuality === 'ESTIMATED' ? 'ESTIMATED' : 'OBSERVED';

  const state: SatelliteOrbitalState = {
    noradId: String(gp.NORAD_CAT_ID),
    name: gp.OBJECT_NAME,
    epoch: gp.EPOCH,
    elements: {
      inclination: point(gp.INCLINATION, 'CelesTrak', elementLabel),
      eccentricity: point(gp.ECCENTRICITY, 'CelesTrak', elementLabel),
      meanMotion: point(gp.MEAN_MOTION, 'CelesTrak', elementLabel),
      raan: point(gp.RA_OF_ASC_NODE, 'CelesTrak', elementLabel),
      argPerigee: point(gp.ARG_OF_PERICENTER, 'CelesTrak', elementLabel),
    },
    derived: {
      altitudeKm: point(round(altitudeKm, 1), 'CelesTrak', derivedLabel, 'Mean of apogee/perigee altitude — simplified circular approximation.'),
      periodMin: point(round(params.periodMin, 2), 'CelesTrak', derivedLabel),
      velocityKmS: point(round(velocityKmS, 3), 'CelesTrak', derivedLabel, 'Approximate orbital speed at mean radius (vis-viva).'),
      apogeeKm: point(round(apogeeKm, 1), 'CelesTrak', derivedLabel),
      perigeeKm: point(round(perigeeKm, 1), 'CelesTrak', derivedLabel),
      position: { lat: round(currentPoint.lat, 3), lon: round(currentPoint.lon, 3), label: derivedLabel, source: 'CelesTrak' },
      groundTrack: track,
    },
    dataQuality: opts.dataQuality === 'ESTIMATED' ? 'ESTIMATED' : 'OBSERVED',
    fetchedAt: now.toISOString(),
    fallbackReason: opts.fallbackReason,
  };

  return { state, params };
}

/** Sample the ground track (sub-satellite lat/lon) across one full orbital period. */
export function groundTrack(
  params: OrbitalParams,
  referenceDate: Date,
  steps = 96
): Array<{ lat: number; lon: number }> {
  const periodSec = params.periodMin * 60;
  const track: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * periodSec;
    track.push(subSatellitePoint(params, t, referenceDate));
  }
  return track;
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/**
 * Flatten a SatelliteOrbitalState into the pre-computed context the AI
 * Analyst is grounded on — same "AI never recomputes" principle as
 * lib/risk.ts's OrbitalRiskContext.
 */
export function toSatelliteAIContext(
  state: SatelliteOrbitalState,
  observations?: { hasObservations: boolean; latest?: SatelliteAIContext['latestObservation'] },
  anomalyFlags: string[] = []
): SatelliteAIContext {
  return {
    noradId: state.noradId,
    name: state.name,
    altitudeKm: state.derived.altitudeKm.value,
    velocityKmS: state.derived.velocityKmS.value,
    periodMin: state.derived.periodMin.value,
    inclinationDeg: state.elements.inclination.value,
    eccentricity: state.elements.eccentricity.value,
    lat: state.derived.position.lat,
    lon: state.derived.position.lon,
    epoch: state.epoch,
    dataQuality: state.dataQuality,
    hasObservations: observations?.hasObservations ?? false,
    latestObservation: observations?.latest,
    anomalyFlags,
  };
}
