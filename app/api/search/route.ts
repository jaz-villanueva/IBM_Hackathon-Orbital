import { NextRequest, NextResponse } from 'next/server';
import { searchMissions } from '@/lib/missions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const missions = searchMissions(query);
  const results = missions.map((m) => ({
    type: 'mission',
    mission: {
      id: m.id,
      name: m.name,
      shortName: m.shortName,
      agency: m.agency,
      destination: m.destination,
      status: m.status,
      missionType: m.missionType,
      thumbnailUrl: m.thumbnailUrl,
      description: m.description.substring(0, 120) + '...',
    },
    relevance: 1,
    matchedOn: m.name,
  }));

  return NextResponse.json({ results, total: results.length });
}
