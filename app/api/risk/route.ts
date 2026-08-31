/**
 * GET /api/risk
 *
 * Exposes the deterministic orbital risk engine to the frontend.
 * Computes a fleet-wide conjunction risk report for all tracked spacecraft
 * and returns a structured, filtered summary.
 *
 * ── Query parameters ──────────────────────────────────────────────────────────
 *
 *   t           number   Simulation elapsed seconds since epoch (≥ 0).
 *                        If omitted, falls back to wall-clock seconds
 *                        (Date.now() / 1000), which is equivalent to a
 *                        simulation clock started at epoch 0 running at 1×.
 *                        Pass the value of simElapsedSeconds(clock) from the
 *                        client to synchronise with the running simulation.
 *
 *   destination string   Filter results to a single central body.
 *                        One of: earth | moon | mars
 *                        If omitted, all destinations are included.
 *
 *   minScore    integer  Only include conjunctions with riskScore ≥ minScore.
 *                        Range: 0–100. Default: 0 (all results).
 *
 *   limit       integer  Maximum number of conjunctions to return.
 *                        Range: 1–100. Default: 20.
 *
 * ── Response ──────────────────────────────────────────────────────────────────
 *
 *   HTTP 200  Normal response (see RiskApiResponse type below)
 *   HTTP 400  Invalid query parameter (error message in body)
 *   HTTP 500  Unexpected internal error
 *
 * ── Design notes ─────────────────────────────────────────────────────────────
 *
 * • All risk calculations are delegated to analyzeFleetRisk() in lib/risk.ts.
 *   This route contains no physics or scoring logic of its own.
 *
 * • The response shape projects each ConjunctionRisk to a lean API record.
 *   Full OrbiterState objects (which contain large nested orbital parameter
 *   trees) are reduced to the fields the UI needs for display.
 *
 * • The endpoint is stateless and deterministic: the same `t` value always
 *   produces the same response. No database or external I/O.
 *
 * • No secrets or environment variables are read or exposed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { snapshotOrbitalState } from '@/lib/telemetry';
import {
  analyzeFleetRisk,
  ConjunctionRisk,
  RiskLevel,
} from '@/lib/risk';
import type { DataLabel } from '@/lib/types';
import type { ObjectType } from '@/lib/spacecraft-positions';

// ─── Response types ───────────────────────────────────────────────────────────

/** Lean spacecraft identity block included in each risk entry. */
interface SpacecraftSummary {
  missionId: string;
  name: string;
  destination: 'earth' | 'moon' | 'mars';
  objectType: ObjectType;
  /** Altitude above body surface in km (approximate, from telemetry) */
  altitudeKm: number;
  /** Provenance label for this spacecraft's state vector */
  dataLabel: DataLabel;
}

/** A single conjunction risk entry in the API response. */
interface RiskEntry {
  /** Stable order-independent pair identifier: "idA::idB" */
  pairId: string;
  objectA: SpacecraftSummary;
  objectB: SpacecraftSummary;

  /** Structural geometry score based on altitude, inclination, phase [0–100] */
  orbitalCompatibilityScore: number;
  /**
   * Kinematic score from constant-velocity TCA analysis [0–100].
   * null when no valid closest approach exists within the prediction horizon.
   */
  trajectoryRiskScore: number | null;
  /** Final composite score [0–100]. NOT a collision probability. */
  compositeScore: number;
  riskLevel: RiskLevel;

  /** Current 3D separation in km */
  currentSeparationKm: number;
  /** Magnitude of relative velocity (km/s) */
  relativeSpeedKmS: number;
  /** Closing speed (km/s). Positive = approaching, negative = receding. */
  closingSpeedKmS: number;
  /** True when objects are currently approaching one another */
  isApproaching: boolean;

  /**
   * Estimated time to closest approach (seconds).
   * null when TCA is invalid (past, beyond 5-hour horizon, or zero relative velocity).
   */
  timeToClosestApproachSec: number | null;
  /**
   * Predicted miss distance at closest approach (km).
   * null when TCA is invalid.
   */
  predictedMissDistanceKm: number | null;
  /** Reason TCA is unavailable, when trajectoryRiskScore is null */
  tcaInvalidReason: string | null;

  /**
   * Worst provenance label for this pair.
   * ESTIMATED if either spacecraft uses simplified orbital elements.
   */
  dataQuality: DataLabel;
  /** Machine-generated plain-text explanation. Not AI-generated. */
  explanation: string;
}

/** Counts by risk level, reflecting any active filters. */
interface RiskLevelCounts {
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

/** Top-level API response shape. */
interface RiskApiResponse {
  /** ISO-8601 wall-clock time this response was computed */
  timestamp: string;
  /** Simulation elapsed seconds used for this snapshot */
  elapsedSeconds: number;
  /** Pre-filter fleet statistics */
  totals: {
    orbitersTracked: number;
    pairsEvaluated: number;
    pairsSkipped: number;
  };
  /** Summary counts after applying destination / minScore filters */
  summary: RiskLevelCounts & {
    objectsAnalyzed: number;
    pairsEvaluated: number;
  };
  /** Active query filters echoed back for client debugging */
  filters: {
    destination: string | null;
    minScore: number;
    limit: number;
  };
  /** Filtered, limited list of conjunctions sorted by compositeScore descending */
  risks: RiskEntry[];
}

// ─── Validation constants ─────────────────────────────────────────────────────

const VALID_DESTINATIONS = new Set(['earth', 'moon', 'mars']);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT      = 100;
const MIN_LIMIT      = 1;
const MAX_SCORE      = 100;
const MIN_SCORE      = 0;

// ─── Projection helper ────────────────────────────────────────────────────────

/** Project a ConjunctionRisk to the lean RiskEntry API shape. */
function toRiskEntry(c: ConjunctionRisk): RiskEntry {
  return {
    pairId: c.pairId,
    objectA: {
      missionId:   c.objectA.missionId,
      name:        c.objectA.name,
      destination: c.objectA.destination,
      objectType:  c.objectA.objectType,
      altitudeKm:  Math.round(c.objectA.altitudeKm * 10) / 10,
      dataLabel:   c.objectA.dataLabel,
    },
    objectB: {
      missionId:   c.objectB.missionId,
      name:        c.objectB.name,
      destination: c.objectB.destination,
      objectType:  c.objectB.objectType,
      altitudeKm:  Math.round(c.objectB.altitudeKm * 10) / 10,
      dataLabel:   c.objectB.dataLabel,
    },
    orbitalCompatibilityScore: c.orbitalCompatibilityScore,
    trajectoryRiskScore:       c.trajectoryRiskScore,
    compositeScore:            c.riskScore,
    riskLevel:                 c.riskLevel,
    currentSeparationKm:       Math.round(c.currentSeparationKm),
    relativeSpeedKmS:          Math.round(c.relativeSpeedKmS * 100) / 100,
    closingSpeedKmS:           Math.round(c.closingSpeedKmS * 100) / 100,
    isApproaching:             c.isApproaching,
    timeToClosestApproachSec:  c.timeToClosestApproachSec !== null
                                 ? Math.round(c.timeToClosestApproachSec)
                                 : null,
    predictedMissDistanceKm:   c.predictedMissDistanceKm !== null
                                 ? Math.round(c.predictedMissDistanceKm)
                                 : null,
    tcaInvalidReason:          c.tcaInvalidReason ?? null,
    dataQuality:               c.dataLabel,
    explanation:               c.explanation,
  };
}

/** Count conjunctions by risk level. */
function countByLevel(conjunctions: ConjunctionRisk[]): RiskLevelCounts {
  return conjunctions.reduce<RiskLevelCounts>(
    (acc, c) => {
      switch (c.riskLevel) {
        case 'CRITICAL': acc.critical++; break;
        case 'HIGH':     acc.high++;     break;
        case 'MODERATE': acc.moderate++; break;
        case 'LOW':      acc.low++;      break;
      }
      return acc;
    },
    { critical: 0, high: 0, moderate: 0, low: 0 },
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // ── Parse and validate: t ───────────────────────────────────────────────
    const tRaw = searchParams.get('t');
    let elapsedSeconds: number;

    if (tRaw !== null) {
      const tParsed = Number(tRaw);
      if (!isFinite(tParsed) || tParsed < 0) {
        return NextResponse.json(
          { error: 'Invalid parameter: t must be a finite number ≥ 0' },
          { status: 400 },
        );
      }
      elapsedSeconds = tParsed;
    } else {
      // Default: wall-clock seconds since Unix epoch
      elapsedSeconds = Date.now() / 1000;
    }

    // ── Parse and validate: destination ────────────────────────────────────
    const destRaw = searchParams.get('destination');
    let destination: 'earth' | 'moon' | 'mars' | null = null;

    if (destRaw !== null) {
      if (!VALID_DESTINATIONS.has(destRaw)) {
        return NextResponse.json(
          { error: `Invalid parameter: destination must be one of earth, moon, mars` },
          { status: 400 },
        );
      }
      destination = destRaw as 'earth' | 'moon' | 'mars';
    }

    // ── Parse and validate: minScore ────────────────────────────────────────
    const minScoreRaw = searchParams.get('minScore');
    let minScore = MIN_SCORE;

    if (minScoreRaw !== null) {
      const parsed = parseInt(minScoreRaw, 10);
      if (!isFinite(parsed) || parsed < MIN_SCORE || parsed > MAX_SCORE) {
        return NextResponse.json(
          { error: `Invalid parameter: minScore must be an integer between ${MIN_SCORE} and ${MAX_SCORE}` },
          { status: 400 },
        );
      }
      minScore = parsed;
    }

    // ── Parse and validate: limit ────────────────────────────────────────────
    const limitRaw = searchParams.get('limit');
    let limit = DEFAULT_LIMIT;

    if (limitRaw !== null) {
      const parsed = parseInt(limitRaw, 10);
      if (!isFinite(parsed) || parsed < MIN_LIMIT || parsed > MAX_LIMIT) {
        return NextResponse.json(
          { error: `Invalid parameter: limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}` },
          { status: 400 },
        );
      }
      limit = parsed;
    }

    // ── Compute telemetry snapshot and fleet risk ────────────────────────────
    const snapshot = snapshotOrbitalState(elapsedSeconds);
    const report   = analyzeFleetRisk(snapshot);

    // ── Apply filters ────────────────────────────────────────────────────────
    let filtered = report.conjunctions;

    if (destination !== null) {
      filtered = filtered.filter(c => c.destination === destination);
    }

    if (minScore > MIN_SCORE) {
      filtered = filtered.filter(c => c.riskScore >= minScore);
    }

    // Summary counts are based on the full filtered set (before limit)
    const levelCounts = countByLevel(filtered);

    // Apply limit to the output list only
    const limited = filtered.slice(0, limit);

    // ── Build response ───────────────────────────────────────────────────────
    const response: RiskApiResponse = {
      timestamp:      new Date().toISOString(),
      elapsedSeconds: Math.round(elapsedSeconds * 1000) / 1000,
      totals: {
        orbitersTracked: snapshot.orbiters.length,
        pairsEvaluated:  report.pairsEvaluated,
        pairsSkipped:    report.pairsSkipped,
      },
      summary: {
        objectsAnalyzed: filtered.length,
        pairsEvaluated:  filtered.length,
        ...levelCounts,
      },
      filters: {
        destination,
        minScore,
        limit,
      },
      risks: limited.map(toRiskEntry),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[/api/risk] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
