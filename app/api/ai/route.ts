import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, AIConfigurationError } from '@/lib/ai';
import { getMissionById } from '@/lib/missions';
import { getSatelliteCatalogEntryByNoradId } from '@/lib/satellites/catalog';
import { fetchGpData, CelestrakFetchError } from '@/lib/satellites/celestrak';
import { deriveOrbitalState, toSatelliteAIContext } from '@/lib/satellites/orbital-state';
import { AIContext, OrbitalRiskContext } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, missionId, planet, riskContext, satelliteId } = body;

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

    // Look up live satellite data server-side — never trust a client-supplied
    // orbital/telemetry blob for the AI to reason over, only a NORAD id.
    // satelliteId may be a NORAD id directly (numeric string from fleet) or a
    // catalog id (alpha, e.g. 'iss'). Try catalog lookup first, then treat it
    // as a raw NORAD id for fleet-only satellites.
    if (typeof satelliteId === 'string' && satelliteId) {
      const entry = getSatelliteCatalogEntryByNoradId(satelliteId);
      const noradId = entry?.noradId ?? (/^\d+$/.test(satelliteId) ? satelliteId : null);
      if (noradId) {
        try {
          const gp = await fetchGpData(noradId);
          const { state } = deriveOrbitalState(gp);
          context.selectedSatellite = toSatelliteAIContext(state);
        } catch (err) {
          if (!(err instanceof CelestrakFetchError)) {
            console.error('Satellite context lookup error:', err);
          }
          // No live data and no cache — leave selectedSatellite unset; the AI
          // system prompt already instructs it to say so rather than invent data.
        }
      }
    }

    const response = await generateAIResponse(messages, context);

    return NextResponse.json({
      content: response,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AIConfigurationError) {
      // Missing or rejected API key — a setup problem, not an outage. Logged
      // server-side with detail (never the key itself; AIConfigurationError
      // messages never carry it); the client gets a safe, distinct message so
      // this is never confused with a transient failure or silently masked
      // by falling back to a mock answer.
      console.error('[AI] Configuration error:', error.message);
      return NextResponse.json(
        { error: 'Orbital AI is temporarily unavailable. Please check the Gemini API configuration.' },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI] Provider error:', message);
    return NextResponse.json(
      // The provider's own error messages (rate limit, network timeout, a
      // Gemini API error) are already written to be safe to show a user —
      // see GeminiProvider.generateResponse in lib/ai.ts — so they're passed
      // through directly rather than replaced with a generic string.
      { error: message || "Orbital AI couldn't connect to Gemini right now. Please try again." },
      { status: 502 }
    );
  }
}
