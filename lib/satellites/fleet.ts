/**
 * Assembles the live "fleet" — the population of real satellites shown around
 * Earth in Earth Mode — from real CelesTrak group fetches.
 *
 * This is server-only. It reuses deriveOrbitalState (the same function the
 * single-satellite route uses) for every satellite, so there is exactly one
 * place that turns a GP record into altitude/velocity/period/position — no
 * duplicated orbital math between the single-satellite and fleet paths.
 */

import { fetchGpGroup, CelestrakFetchError, type CelesTrakGpRecord } from './celestrak';
import { deriveOrbitalState } from './orbital-state';
import { getSatelliteCatalogEntryByNoradId } from './catalog';
import type { FleetSatelliteEntry, OrbitRegime } from '../types';

/**
 * CelesTrak groups combined to populate the fleet, each capped so the 3D
 * scene stays a readable "populated Earth" rather than an unreadable swarm
 * (telemetry's own prototype used 26 total; this targets a similar range).
 * 'starlink' was tried and dropped — CelesTrak consistently 503s that group
 * (likely deliberate throttling of its very large payload), and the other
 * three groups alone already comfortably cover the target population.
 */
const FLEET_GROUP_CAPS: Record<string, number> = {
  stations: 10,
  weather: 10,
  'gps-ops': 8,
};
const FLEET_GROUPS = Object.keys(FLEET_GROUP_CAPS);
const FLEET_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function classifyOrbitRegime(altitudeKm: number): OrbitRegime {
  if (altitudeKm < 2000) return 'LEO';
  if (altitudeKm > 34000 && altitudeKm < 37500) return 'GEO';
  return 'MEO';
}

/**
 * Debris and spent rocket bodies are real CelesTrak-tracked objects, but they
 * aren't "satellites" in the sense the public-facing explorer means — showing
 * them would make the population feel accidental/cluttered rather than
 * intentional. CelesTrak's OBJECT_NAME follows a conventional " DEB" / "R/B"
 * suffix for these, so they can be filtered without guessing.
 */
function isSatelliteNotDebris(gp: CelesTrakGpRecord): boolean {
  return !/ DEB\b|R\/B\b/i.test(gp.OBJECT_NAME);
}

function toFleetEntry(gp: CelesTrakGpRecord): FleetSatelliteEntry | null {
  try {
    const { state, params } = deriveOrbitalState(gp);
    const noradId = state.noradId;
    const catalogEntry = getSatelliteCatalogEntryByNoradId(noradId);
    const altitudeKm = state.derived.altitudeKm.value;

    return {
      id: catalogEntry?.id ?? noradId,
      name: catalogEntry?.name ?? state.name,
      noradId,
      orbitRegime: classifyOrbitRegime(altitudeKm),
      description: catalogEntry?.description ?? `Tracked via CelesTrak public orbital element data.`,
      obsCapability: catalogEntry?.obsCapability ?? { type: 'NONE' },
      missionId: catalogEntry?.missionId,
      orbitalParams: params,
      altitudeKm,
      velocityKmS: state.derived.velocityKmS.value,
      periodMin: state.derived.periodMin.value,
      inclinationDeg: state.elements.inclination.value,
      dataQuality: state.dataQuality,
    };
  } catch {
    // A single malformed GP record shouldn't take down the whole fleet.
    return null;
  }
}

interface FleetCacheEntry {
  satellites: FleetSatelliteEntry[];
  totals: { total: number; leo: number; meo: number; geo: number };
  fetchedAt: number;
}

let fleetCache: FleetCacheEntry | null = null;

export async function assembleFleet(): Promise<FleetCacheEntry> {
  if (fleetCache && Date.now() - fleetCache.fetchedAt < FLEET_CACHE_TTL_MS) {
    return fleetCache;
  }

  const groupResults = await Promise.allSettled(FLEET_GROUPS.map((g) => fetchGpGroup(g)));

  const records: CelesTrakGpRecord[] = [];
  groupResults.forEach((result, i) => {
    if (result.status !== 'fulfilled') return;
    const group = FLEET_GROUPS[i];
    const satellitesOnly = result.value.filter(isSatelliteNotDebris);
    records.push(...satellitesOnly.slice(0, FLEET_GROUP_CAPS[group]));
  });

  if (records.length === 0) {
    if (fleetCache) return fleetCache; // serve stale rather than an empty fleet
    throw new CelestrakFetchError('No CelesTrak groups were reachable and no cached fleet exists.');
  }

  const seen = new Set<string>();
  const satellites: FleetSatelliteEntry[] = [];
  for (const gp of records) {
    const noradId = String(gp.NORAD_CAT_ID);
    if (seen.has(noradId)) continue;
    seen.add(noradId);
    const entry = toFleetEntry(gp);
    if (entry) satellites.push(entry);
  }

  const totals = {
    total: satellites.length,
    leo: satellites.filter((s) => s.orbitRegime === 'LEO').length,
    meo: satellites.filter((s) => s.orbitRegime === 'MEO').length,
    geo: satellites.filter((s) => s.orbitRegime === 'GEO').length,
  };

  fleetCache = { satellites, totals, fetchedAt: Date.now() };
  return fleetCache;
}
