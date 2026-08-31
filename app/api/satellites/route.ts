import { NextRequest, NextResponse } from 'next/server';
import { SATELLITE_CATALOG, searchSatelliteCatalog } from '@/lib/satellites/catalog';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  const satellites = query ? searchSatelliteCatalog(query) : SATELLITE_CATALOG;

  return NextResponse.json({ satellites, total: satellites.length });
}
