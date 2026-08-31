import { NextResponse } from 'next/server';
import { assembleFleet } from '@/lib/satellites/fleet';
import { CelestrakFetchError } from '@/lib/satellites/celestrak';

export async function GET() {
  try {
    const { satellites, totals } = await assembleFleet();
    return NextResponse.json({ satellites, totals });
  } catch (err) {
    if (err instanceof CelestrakFetchError) {
      return NextResponse.json(
        { error: 'Live satellite fleet data is currently unavailable.', satellites: [], totals: { total: 0, leo: 0, meo: 0, geo: 0 } },
        { status: 503 }
      );
    }
    console.error('Fleet API error:', err);
    return NextResponse.json({ error: 'Failed to load satellite fleet' }, { status: 500 });
  }
}
