import { NextRequest, NextResponse } from 'next/server';
import { getSatelliteCatalogEntry } from '@/lib/satellites/catalog';
import { fetchGpData, cacheAgeSeconds, CelestrakFetchError } from '@/lib/satellites/celestrak';
import { deriveOrbitalState } from '@/lib/satellites/orbital-state';
import { fetchSatNOGSData } from '@/lib/satellites/satnogs';
import type { SatelliteCatalogEntry } from '@/lib/types';

/** Cache is considered "fresh enough to call OBSERVED" up to this age. Mirrors celestrak.ts's TTL. */
const FRESH_THRESHOLD_SEC = 2 * 60 * 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalogEntry = getSatelliteCatalogEntry(id);

  // Earth Mode's satellite population includes many real satellites with no hand-authored
  // catalog entry (e.g. a GPS satellite pulled from CelesTrak's gps-ops group).
  // Their id IS their NORAD id — fall back to treating the route param as a NORAD id
  // directly, with an honest generic description, rather than 404ing.
  const noradId = catalogEntry?.noradId ?? id;
  const isNumericId = /^\d+$/.test(id);

  if (!catalogEntry && !isNumericId) {
    return NextResponse.json({ error: 'Unknown satellite id' }, { status: 404 });
  }

  try {
    // Fetch CelesTrak orbital data and SatNOGS data in parallel.
    // SatNOGS failure does not fail the whole request — it just means no observation data.
    const [gp, satnogsData] = await Promise.all([
      fetchGpData(noradId),
      fetchSatNOGSData(noradId).catch(() => ({ transmitters: [], observations: [], available: false })),
    ]);

    const ageSec = cacheAgeSeconds(noradId);
    const isStale = ageSec !== null && ageSec > FRESH_THRESHOLD_SEC;

    const { state: orbitalState, params: orbitalParams } = deriveOrbitalState(gp, {
      dataQuality: isStale ? 'ESTIMATED' : 'OBSERVED',
      fallbackReason: isStale
        ? `Live CelesTrak fetch is currently unavailable — showing the last known orbital elements (${Math.round((ageSec ?? 0) / 60)} min old).`
        : undefined,
    });

    const entry: SatelliteCatalogEntry = catalogEntry ?? {
      id,
      name: gp.OBJECT_NAME,
      noradId,
      description: 'Tracked via CelesTrak public orbital element data.',
      obsCapability: { type: 'NONE' },
    };

    return NextResponse.json({
      catalog: entry,
      orbitalState,
      // OrbitalParams for the embedded 3D scene (see lib/orbital-mechanics.ts).
      orbitalParams,
      // SatNOGS observation/transmitter data (OBSERVED from SatNOGS DB).
      satnogs: satnogsData,
    });
  } catch (err) {
    if (err instanceof CelestrakFetchError) {
      return NextResponse.json(
        {
          catalog: catalogEntry ?? null,
          orbitalState: null,
          satnogs: { transmitters: [], observations: [], available: false },
          error: 'Live orbital data is currently unavailable for this satellite. No cached data exists yet.',
        },
        { status: 503 }
      );
    }
    console.error('Satellite detail API error:', err);
    return NextResponse.json({ error: 'Failed to load satellite data' }, { status: 500 });
  }
}
