import { NextRequest, NextResponse } from 'next/server';
import { MISSIONS, getMissionsByDestination, searchMissions, getActiveMissions } from '@/lib/missions';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const query = searchParams.get('q');

  let missions = MISSIONS;

  if (query) {
    missions = searchMissions(query);
  } else {
    if (destination) {
      missions = getMissionsByDestination(destination);
    }
    if (status === 'active') {
      missions = getActiveMissions();
    }
    if (status && status !== 'active') {
      missions = missions.filter((m) => m.status === status);
    }
    if (type) {
      missions = missions.filter((m) => m.missionType === type);
    }
  }

  return NextResponse.json({ missions, total: missions.length });
}
