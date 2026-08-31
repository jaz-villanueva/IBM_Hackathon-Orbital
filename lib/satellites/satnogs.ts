/**
 * SatNOGS DB API integration.
 *
 * SatNOGS (https://db.satnogs.org) provides:
 *  - Satellite registry (satellite metadata, transmitters)
 *  - Observations (real ground-station receptions of satellite signals)
 *
 * All data returned is labeled OBSERVED — it comes from the public SatNOGS DB.
 * If a satellite has no transmitters or observations in SatNOGS, we report that
 * honestly rather than fabricating data.
 *
 * API docs: https://db.satnogs.org/api/
 *
 * Rate limits: SatNOGS DB is public and free. We cache aggressively to avoid
 * repeated hits. Transmitter data rarely changes; observation data refreshes
 * continuously but we only show recent results.
 */

const SATNOGS_BASE = 'https://db.satnogs.org/api';
const CACHE_TTL_TRANSMITTERS_MS = 4 * 60 * 60 * 1000; // 4 hours
const CACHE_TTL_OBSERVATIONS_MS = 30 * 60 * 1000;     // 30 minutes

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SatNOGSTransmitter {
  description: string;
  frequencyHz: number;
  mode: string;
  status: string;
  source: 'SatNOGS';
}

export interface SatNOGSObservation {
  id: string;
  station: string;
  time: string;
  frequencyHz: number;
  mode: string;
  signalDbm: number | null;
  status: 'good' | 'failed' | 'unknown';
}

export interface SatNOGSResult {
  transmitters: SatNOGSTransmitter[];
  observations: SatNOGSObservation[];
  /** true if SatNOGS has any data for this satellite */
  available: boolean;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const transmitterCache = new Map<string, { data: SatNOGSTransmitter[]; fetchedAt: number }>();
const observationCache = new Map<string, { data: SatNOGSObservation[]; fetchedAt: number }>();

// ─── Raw SatNOGS API types ────────────────────────────────────────────────────

interface RawSatNOGSTransmitter {
  description?: string;
  downlink_low?: number;
  downlink_high?: number;
  uplink_low?: number;
  mode?: string;
  status?: string;
  alive?: boolean;
}

interface RawSatNOGSObservation {
  id?: number;
  ground_station?: string | number;
  start?: string;
  end?: string;
  transmitter_freq?: number;
  mode?: string;
  client_version?: string;
  status?: string;
  // Signal strength is not directly in the observation list endpoint;
  // it's available in individual observation detail but we avoid per-obs fetches.
  vetted_status?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTransmitter(raw: RawSatNOGSTransmitter): SatNOGSTransmitter | null {
  const freq = raw.downlink_low ?? raw.downlink_high ?? 0;
  if (!freq) return null;
  return {
    description: raw.description ?? 'Unknown transmitter',
    frequencyHz: freq,
    mode: raw.mode ?? 'unknown',
    status: (raw.alive === false) ? 'inactive' : (raw.status ?? 'unknown'),
    source: 'SatNOGS',
  };
}

function normalizeObservation(raw: RawSatNOGSObservation): SatNOGSObservation {
  const status: SatNOGSObservation['status'] =
    raw.vetted_status === 'good' ? 'good' :
    raw.vetted_status === 'bad' ? 'failed' :
    raw.status === 'good' ? 'good' :
    raw.status === 'failed' ? 'failed' : 'unknown';
  return {
    id: String(raw.id ?? ''),
    station: String(raw.ground_station ?? 'Unknown station'),
    time: raw.start ?? new Date().toISOString(),
    frequencyHz: raw.transmitter_freq ?? 0,
    mode: raw.mode ?? 'unknown',
    signalDbm: null, // observation list endpoint does not include SNR/dBm directly
    status,
  };
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

/**
 * Fetch transmitter list for a satellite by NORAD catalog ID.
 * Returns empty array if not found or on error — never throws.
 */
async function fetchTransmitters(noradId: string): Promise<SatNOGSTransmitter[]> {
  const cached = transmitterCache.get(noradId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_TRANSMITTERS_MS) {
    return cached.data;
  }

  try {
    const url = `${SATNOGS_BASE}/transmitters/?satellite__norad_cat_id=${encodeURIComponent(noradId)}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      transmitterCache.set(noradId, { data: [], fetchedAt: Date.now() });
      return [];
    }
    const raw: RawSatNOGSTransmitter[] = await res.json();
    const data = raw
      .map(normalizeTransmitter)
      .filter((t): t is SatNOGSTransmitter => t !== null)
      // Only show active/unknown transmitters — filter out explicitly inactive
      .filter((t) => t.status !== 'inactive')
      .slice(0, 5); // cap at 5

    transmitterCache.set(noradId, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    // Network error or timeout — return cached (empty) or []
    return transmitterCache.get(noradId)?.data ?? [];
  }
}

/**
 * Fetch recent observations for a satellite by NORAD catalog ID.
 * Returns empty array if not found or on error — never throws.
 */
async function fetchObservations(noradId: string): Promise<SatNOGSObservation[]> {
  const cached = observationCache.get(noradId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_OBSERVATIONS_MS) {
    return cached.data;
  }

  try {
    // SatNOGS uses satellite__norad_cat_id to filter observations.
    // We request only recent ones (limit 5).
    const url = `${SATNOGS_BASE}/observations/?satellite__norad_cat_id=${encodeURIComponent(noradId)}&format=json&limit=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      observationCache.set(noradId, { data: [], fetchedAt: Date.now() });
      return [];
    }
    const raw: { results?: RawSatNOGSObservation[] } | RawSatNOGSObservation[] = await res.json();
    const rawList: RawSatNOGSObservation[] = Array.isArray(raw) ? raw : (raw.results ?? []);
    const data = rawList.map(normalizeObservation).slice(0, 5);
    observationCache.set(noradId, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    return observationCache.get(noradId)?.data ?? [];
  }
}

/**
 * Fetch all available SatNOGS data for a satellite.
 * This is the primary public API for consumers (API routes).
 */
export async function fetchSatNOGSData(noradId: string): Promise<SatNOGSResult> {
  const [transmitters, observations] = await Promise.all([
    fetchTransmitters(noradId),
    fetchObservations(noradId),
  ]);
  return {
    transmitters,
    observations,
    available: transmitters.length > 0 || observations.length > 0,
  };
}
