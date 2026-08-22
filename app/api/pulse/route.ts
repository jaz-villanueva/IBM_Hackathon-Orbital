import { NextResponse } from 'next/server';
import { computeGlobalPulse } from '@/lib/services';

export async function GET() {
  const pulse = computeGlobalPulse();
  return NextResponse.json(pulse);
}
