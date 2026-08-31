/**
 * CelesTrak GP (General Perturbations) live data fetch.
 *
 * Server-only. CelesTrak's GP endpoint is public and requires no API key:
 *   https://celestrak.org/NORAD/elements/gp.php?CATNR={noradId}&FORMAT=json
 *
 * Real orbital element sets refresh roughly once or twice a day per object;
 * an in-memory TTL cache avoids hammering the endpoint on every request
 * while keeping data fresh enough to be honestly labeled OBSERVED.
 *
 * This module never fabricates data: a failed or malformed fetch throws
 * CelestrakFetchError. Callers decide the fallback (e.g. label ESTIMATED,
 * fall back to a cached snapshot) — this module never silently invents
 * or guesses element values.
 */

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Raw shape of a CelesTrak GP JSON record (OMM-derived). */
export interface CelesTrakGpRecord {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  NORAD_CAT_ID: number;
  BSTAR?: number;
  ELEMENT_SET_NO?: number;
  REV_AT_EPOCH?: number;
}

export class CelestrakFetchError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'CelestrakFetchError';
  }
}

interface CacheEntry {
  record: CelesTrakGpRecord;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Fetch the current GP record for a satellite by NORAD catalog ID.
 * Uses a 2-hour in-memory cache. Throws CelestrakFetchError on any
 * network error, non-200 response, or malformed/empty payload — it
 * never returns a guessed or partial record.
 */
export async function fetchGpData(noradId: string): Promise<CelesTrakGpRecord> {
  const cached = cache.get(noradId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.record;
  }

  let response: Response;
  try {
    response = await fetch(
      `${CELESTRAK_BASE}?CATNR=${encodeURIComponent(noradId)}&FORMAT=json`,
      { signal: AbortSignal.timeout(8000) }
    );
  } catch (err) {
    if (cached) return cached.record; // network hiccup — serve stale cache, caller labels it
    throw new CelestrakFetchError(`Network error fetching CelesTrak data for NORAD ${noradId}`, err);
  }

  if (!response.ok) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak returned HTTP ${response.status} for NORAD ${noradId}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak returned malformed JSON for NORAD ${noradId}`, err);
  }

  if (!Array.isArray(data) || data.length === 0) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak has no GP record for NORAD ${noradId}`);
  }

  const record = data[0] as CelesTrakGpRecord;
  if (
    typeof record.MEAN_MOTION !== 'number' ||
    typeof record.ECCENTRICITY !== 'number' ||
    typeof record.INCLINATION !== 'number'
  ) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak record for NORAD ${noradId} is missing required fields`);
  }

  cache.set(noradId, { record, fetchedAt: Date.now() });
  return record;
}

interface GroupCacheEntry {
  record: CelesTrakGpRecord[];
  fetchedAt: number;
}

const groupCache = new Map<string, GroupCacheEntry>();

/**
 * Fetch all GP records for a named CelesTrak group (e.g. 'stations', 'weather',
 * 'gps-ops', 'starlink' — see https://celestrak.org/NORAD/elements/). Public,
 * no API key. Same 2-hour cache/fallback behaviour as fetchGpData: throws
 * CelestrakFetchError only when there is no cached data at all to fall back to.
 */
export async function fetchGpGroup(group: string): Promise<CelesTrakGpRecord[]> {
  const cached = groupCache.get(group);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.record;
  }

  let response: Response;
  try {
    response = await fetch(
      `${CELESTRAK_BASE}?GROUP=${encodeURIComponent(group)}&FORMAT=json`,
      // Group endpoints are observed to take 8-12s in practice (much larger
      // payloads than a single-satellite lookup) — a longer timeout than
      // fetchGpData's avoids spurious failures under normal conditions.
      { signal: AbortSignal.timeout(20000) }
    );
  } catch (err) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`Network error fetching CelesTrak group "${group}"`, err);
  }

  if (!response.ok) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak returned HTTP ${response.status} for group "${group}"`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak returned malformed JSON for group "${group}"`, err);
  }

  if (!Array.isArray(data)) {
    if (cached) return cached.record;
    throw new CelestrakFetchError(`CelesTrak returned an unexpected shape for group "${group}"`);
  }

  const records = data as CelesTrakGpRecord[];
  groupCache.set(group, { record: records, fetchedAt: Date.now() });
  return records;
}

/** Whether the last successful fetch for this NORAD ID is still within the fresh cache TTL. */
export function isFreshlyCached(noradId: string): boolean {
  const cached = cache.get(noradId);
  return !!cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
}

/** Age of the cached record in seconds, or null if nothing is cached. */
export function cacheAgeSeconds(noradId: string): number | null {
  const cached = cache.get(noradId);
  if (!cached) return null;
  return Math.round((Date.now() - cached.fetchedAt) / 1000);
}
