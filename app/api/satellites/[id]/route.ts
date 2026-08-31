import { NextRequest, NextResponse } from 'next/server';
import { getSatelliteCatalogEntry } from '@/lib/satellites/catalog';
import { fetchGpData, cacheAgeSeconds, CelestrakFetchError } from '@/lib/satellites/celestrak';
import { deriveOrbitalState } from '@/lib/satellites/orbital-state';
import type { SatelliteCatalogEntry } from '@/lib/types';

/** Cache is considered "fresh enough to call OBSERVED" up to this age. Mirrors celestrak.ts's TTL. */
const FRESH_THRESHOLD_SEC = 2 * 60 * 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalogEntry = getSatelliteCatalogEntry(id);

  // Earth Mode's fleet includes many real satellites with no hand-authored
  // catalog entry (e.g. a GPS satellite pulled from CelesTrak's gps-ops
  // group). Their fleet id IS their NORAD id — fall back to treating the
  // route param as a NORAD id directly, with a generic honest description,
  // rather than 404ing on every non-curated satellite.
  const noradId = catalogEntry?.noradId ?? id;
  const isNumericId = /^\d+$/.test(id);

  if (!catalogEntry && !isNumericId) {
    return NextResponse.json({ error: 'Unknown satellite id' }, { status: 404 });
  }

  try {
    const gp = await fetchGpData(noradId);
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
      // Not domain data — purely a rendering input, computed once here so the
      // client never has to re-derive it from raw GP elements.
      orbitalParams,
    });
  } catch (err) {
    if (err instanceof CelestrakFetchError) {
      return NextResponse.json(
        {
          catalog: catalogEntry ?? null,
          orbitalState: null,
          error: 'Live orbital data is currently unavailable for this satellite. No cached data exists yet.',
        },
        { status: 503 }
      );
    }
    console.error('Satellite detail API error:', err);
    return NextResponse.json({ error: 'Failed to load satellite data' }, { status: 500 });
  }
}
