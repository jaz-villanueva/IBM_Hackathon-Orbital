import { NextRequest, NextResponse } from 'next/server';
import { getMissionById } from '@/lib/missions';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const mission = getMissionById(params.id);
  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  }
  return NextResponse.json(mission);
}
