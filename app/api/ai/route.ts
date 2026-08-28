import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';
import { getMissionById } from '@/lib/missions';
import { AIContext, OrbitalRiskContext } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, missionId, planet, riskContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const context: AIContext = {};

    if (missionId) {
      const mission = getMissionById(missionId);
      if (mission) context.selectedMission = mission;
    }

    if (planet) {
      context.selectedPlanet = planet;
    }

    // Attach risk context when provided by RiskHUD's "Analyze with AI" flow.
    // We only accept the fields we know about — no pass-through of arbitrary data.
    if (riskContext && typeof riskContext === 'object' && typeof riskContext.pairId === 'string') {
      const rc = riskContext as Record<string, unknown>;
      const safe: OrbitalRiskContext = {
        pairId:                    String(rc.pairId ?? ''),
        objectAName:               String(rc.objectAName ?? ''),
        objectBName:               String(rc.objectBName ?? ''),
        destination:               String(rc.destination ?? ''),
        objectAAltitudeKm:         Number(rc.objectAAltitudeKm ?? 0),
        objectBAltitudeKm:         Number(rc.objectBAltitudeKm ?? 0),
        riskLevel:                 (rc.riskLevel as OrbitalRiskContext['riskLevel']) ?? 'LOW',
        compositeScore:            Number(rc.compositeScore ?? 0),
        orbitalCompatibilityScore: Number(rc.orbitalCompatibilityScore ?? 0),
        trajectoryRiskScore:       rc.trajectoryRiskScore != null ? Number(rc.trajectoryRiskScore) : null,
        currentSeparationKm:       Number(rc.currentSeparationKm ?? 0),
        relativeSpeedKmS:          Number(rc.relativeSpeedKmS ?? 0),
        closingSpeedKmS:           Number(rc.closingSpeedKmS ?? 0),
        isApproaching:             Boolean(rc.isApproaching),
        timeToClosestApproachSec:  rc.timeToClosestApproachSec != null ? Number(rc.timeToClosestApproachSec) : null,
        predictedMissDistanceKm:   rc.predictedMissDistanceKm  != null ? Number(rc.predictedMissDistanceKm)  : null,
        tcaInvalidReason:          rc.tcaInvalidReason != null ? String(rc.tcaInvalidReason) : null,
        dataQuality:               (rc.dataQuality as OrbitalRiskContext['dataQuality']) ?? 'DERIVED',
        explanation:               String(rc.explanation ?? ''),
      };
      context.selectedRisk = safe;
    }

    const response = await generateAIResponse(messages, context);

    return NextResponse.json({
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
