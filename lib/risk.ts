/**
 * Deterministic Orbital Risk Engine
 *
 * Consumes a TelemetrySnapshot and produces explainable orbital conjunction
 * risk assessments for every relevant spacecraft pair.
 *
 * ─── IMPORTANT DISCLAIMER ─────────────────────────────────────────────────
 * Risk scores produced here are NOT collision probabilities. They are
 * normalised 0–100 indices derived from observable geometric and kinematic
 * factors. The underlying positions are computed via simplified two-body
 * Keplerian propagation (no SGP4, no atmospheric drag, no J2 perturbations).
 * These scores are intended for situational awareness and educational
 * visualisation only.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Two complementary risk scores are computed per spacecraft pair:
 *
 * ── 1. Orbital Compatibility Score (structural, 0–100) ────────────────────
 *
 *   Measures how geometrically similar the two orbital paths are, independent
 *   of where the spacecraft currently sit on those paths. Three sub-scores:
 *
 *   altScore  = max(0, 1 − |altA − altB| / MAX_ALT_DIFF_KM)
 *               Radial shell overlap. Full score for identical altitudes;
 *               decays to 0 at MAX_ALT_DIFF_KM separation.
 *
 *   incScore  = max(0, 1 − |incA − incB| / MAX_INC_DIFF_DEG)
 *               Orbital-plane convergence. Full score for co-planar orbits;
 *               decays to 0 at MAX_INC_DIFF_DEG divergence.
 *
 *   proxScore = max(0, dot(unitPosA, unitPosB))
 *               Instantaneous angular proximity — where they are right now.
 *               Varies between 0 (opposite hemispheres) and 1 (same position).
 *
 *   orbitalCompatibilityScore = round((0.45·alt + 0.30·inc + 0.25·prox) × 100)
 *
 * ── 2. Trajectory Risk Score (kinematic, 0–100 or null) ──────────────────
 *
 *   Uses constant-velocity relative-motion to estimate the nearest approach
 *   event in the near future.
 *
 *   Under linear motion:  r(τ) = r₀ + v·τ  (r₀ = posB − posA, v = velB − velA)
 *
 *   The time of closest approach (TCA) minimises |r(τ)|²:
 *     d|r|²/dτ = 0  ⟹  τ_ca = −dot(r₀, v) / |v|²
 *
 *   Miss distance at TCA:
 *     r_ca = r₀ + v · τ_ca  =  r₀ − v · dot(r₀, v) / |v|²
 *     missDistanceKm = |r_ca|
 *
 *   τ_ca is declared INVALID (score = null) when:
 *     • |v| < MIN_REL_SPEED_KM_S  (near-zero relative velocity, formation-flying)
 *     • τ_ca < 0                  (closest approach already occurred; objects receding)
 *     • τ_ca > MAX_TCA_S          (too far in future; linear approximation invalid)
 *
 *   When valid, three sub-scores:
 *     missScore  = max(0, 1 − missDistanceKm / DANGER_DIST_KM)      weight 50%
 *     timeScore  = max(0, 1 − τ_ca / MAX_TCA_S)                     weight 30%
 *     speedScore = min(1, relSpeedKmS / MAX_SCORING_SPEED_KM_S)     weight 20%
 *
 *   trajectoryRiskScore = round((0.50·miss + 0.30·time + 0.20·speed) × 100)
 *
 * ── 3. Composite (final) Risk Score ──────────────────────────────────────
 *
 *   When trajectory TCA is valid:
 *     finalScore = round(0.65 · trajectoryRiskScore + 0.35 · orbitalCompatibilityScore)
 *     (Trajectory evidence dominates, structural context contributes.)
 *
 *   When TCA is invalid (null trajectoryRiskScore):
 *     finalScore = orbitalCompatibilityScore
 *     (No imminent kinematic signal; fall back to structural assessment.)
 *
 * References:
 *   lib/telemetry.ts — TelemetrySnapshot, OrbiterState, ECIVector
 *   lib/types.ts     — DataLabel
 */

import type {
  TelemetrySnapshot,
  OrbiterState,
  ECIVector,
} from './telemetry';
import type { DataLabel } from './types';

// ─── Orbital compatibility constants ─────────────────────────────────────────

/**
 * Maximum altitude difference (km) at which two orbits are considered to
 * occupy overlapping radial shells. Above this threshold altScore = 0.
 *
 * Calibrated against real data:
 *  - Earth: ISS (408 km) vs SSO (705 km) = 297 km  →  altScore > 0 but small
 *  - Moon:  LRO / KPLO both ~100 km                →  altScore ≈ 1
 *  - Mars:  MRO (~300 km) vs TGO (~400 km) = 100 km →  altScore high
 */
const MAX_ALT_DIFF_KM = 500;

/**
 * Maximum inclination difference (degrees) at which orbital planes are
 * considered to converge meaningfully. Above this incScore = 0.
 *
 *  - ISS (51.6°) vs SSO (98.2°) → 46.6° difference → incScore = 0   ✓
 *  - LRO (90°)   vs KPLO (90°)  →  0°  difference → incScore = 1   ✓
 *  - MRO (92.6°) vs TGO (74°)   → 18.6° difference → incScore ≈ 0.07 ✓
 */
const MAX_INC_DIFF_DEG = 20;

/** Orbital compatibility weighting — must sum to 1.0 */
const OCS_WEIGHT_ALT  = 0.45;
const OCS_WEIGHT_INC  = 0.30;
const OCS_WEIGHT_PROX = 0.25;

// ─── Trajectory risk constants ────────────────────────────────────────────────

/**
 * Miss-distance at which the trajectory risk score reaches 1.0.
 * Below this threshold objects are considered to be passing dangerously close.
 *
 * 50 km: well above real-world conjunction alert thresholds (ISS maneuvers at
 * < 1 km miss distance) but appropriate for the scale of this simplified model.
 * Scores decay linearly to 0 at 50 km miss distance.
 */
const DANGER_DIST_KM = 50;

/**
 * Maximum relative speed (km/s) that maps to a full speed sub-score of 1.0.
 * Head-on LEO encounters reach ~15 km/s. At or above this value the speed
 * sub-score saturates at 1.
 */
const MAX_SCORING_SPEED_KM_S = 15;

/**
 * Horizon beyond which the constant-velocity TCA estimate is considered
 * unreliable. Three ISS orbital periods ≈ 3 × 5561 s ≈ 16 683 s; rounded up
 * to 18 000 s (5 hours). TCA values beyond this are treated as invalid.
 */
const MAX_TCA_S = 18_000;

/**
 * Relative speed below which the pair is treated as having zero relative
 * velocity (formation-flying or extremely slowly drifting). TCA is undefined
 * in this regime.
 */
const MIN_REL_SPEED_KM_S = 1e-4; // 0.1 m/s

/** Trajectory risk sub-score weights — must sum to 1.0 */
const TRS_WEIGHT_MISS  = 0.50;
const TRS_WEIGHT_TIME  = 0.30;
const TRS_WEIGHT_SPEED = 0.20;

/**
 * Weight given to trajectoryRiskScore when TCA is valid in the composite.
 * Remainder (1 − TRAJ_WEIGHT) is given to orbitalCompatibilityScore.
 */
const COMPOSITE_TRAJ_WEIGHT = 0.65;

// ─── Risk level thresholds ────────────────────────────────────────────────────

/** Score bands for the final composite score. Upper bounds are inclusive. */
const LEVEL_LOW_MAX      = 24;
const LEVEL_MODERATE_MAX = 49;
const LEVEL_HIGH_MAX     = 74;
// 75–100 → CRITICAL

// ─── Exported types ───────────────────────────────────────────────────────────

/** Four-level risk classification. */
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

/**
 * Reason a TCA result may be unavailable.
 */
export type TCAInvalidReason =
  | 'ZERO_RELATIVE_VELOCITY'   // objects in near-formation, |v| ≈ 0
  | 'PAST_APPROACH'            // τ_ca < 0: closest approach already occurred
  | 'BEYOND_HORIZON';          // τ_ca > MAX_TCA_S: linear approx. not valid

/**
 * Result of the constant-velocity TCA analysis.
 * When valid, contains τ_ca and miss distance; when invalid, contains the reason.
 */
export type TCAResult =
  | {
      valid: true;
      /** Time to closest approach in seconds (positive, ≤ MAX_TCA_S) */
      timeToClosestApproachSec: number;
      /** Predicted miss distance at TCA in km */
      predictedMissDistanceKm: number;
    }
  | {
      valid: false;
      reason: TCAInvalidReason;
      /** τ_ca as computed, even if invalid — useful for display */
      rawTcaSec: number | null;
    };

/**
 * Decomposed orbital compatibility sub-scores [0–1] and raw deltas.
 * Unchanged from the original scoring implementation.
 */
export interface OrbitalCompatibilityComponents {
  /** Altitude shell overlap sub-score [0–1] */
  altitudeScore: number;
  /** Inclination convergence sub-score [0–1] */
  inclinationScore: number;
  /** Current angular proximity sub-score [0–1] */
  proximityScore: number;
  /** Altitude difference in km (unsigned) */
  altDiffKm: number;
  /** Inclination difference in degrees (unsigned) */
  incDiffDeg: number;
}

/**
 * Decomposed trajectory risk sub-scores [0–1] — only populated when TCA valid.
 */
export interface TrajectoryRiskComponents {
  /** Miss-distance sub-score: 1 at 0 km, 0 at DANGER_DIST_KM */
  missDistanceScore: number;
  /** Time-urgency sub-score: 1 at τ_ca=0, 0 at τ_ca=MAX_TCA_S */
  timeScore: number;
  /** Relative-speed severity sub-score: saturates at MAX_SCORING_SPEED_KM_S */
  speedScore: number;
}

/**
 * Full conjunction risk assessment for a single spacecraft pair.
 */
export interface ConjunctionRisk {
  /** Stable order-independent pair key: "idA::idB" (alphabetical) */
  pairId: string;

  /** Central body both spacecraft orbit */
  destination: string;

  /** Spacecraft A (lower missionId alphabetically) */
  objectA: OrbiterState;
  /** Spacecraft B */
  objectB: OrbiterState;

  // ── Current kinematics ──────────────────────────────────────────────────

  /** 3D separation at snapshot time (km) */
  currentSeparationKm: number;

  /** Relative velocity vector of B w.r.t. A (km/s) */
  relativeVelocity: ECIVector;

  /** Magnitude of relative velocity (km/s) */
  relativeSpeedKmS: number;

  /**
   * Closing speed (km/s).
   * Positive = objects approaching; negative = receding.
   */
  closingSpeedKmS: number;

  /** True when closingSpeedKmS > 0 */
  isApproaching: boolean;

  // ── Orbital compatibility ───────────────────────────────────────────────

  /**
   * Structural risk based on orbital geometry (altitude, inclination, phase).
   * Reflects sustained, orbit-averaged danger. [0–100]
   * NOT a collision probability.
   */
  orbitalCompatibilityScore: number;

  /** Sub-scores that compose orbitalCompatibilityScore */
  orbitalCompatibilityComponents: OrbitalCompatibilityComponents;

  // ── Trajectory risk ─────────────────────────────────────────────────────

  /**
   * Time to closest approach in seconds under constant-velocity assumption.
   * null when TCA is invalid (past, beyond horizon, or zero relative velocity).
   */
  timeToClosestApproachSec: number | null;

  /**
   * Predicted miss distance at TCA in km.
   * null when TCA is invalid.
   */
  predictedMissDistanceKm: number | null;

  /**
   * Kinematic risk based on near-future closest approach. [0–100] or null.
   * null when no valid TCA exists within the prediction horizon.
   * NOT a collision probability.
   */
  trajectoryRiskScore: number | null;

  /** Sub-scores that compose trajectoryRiskScore; null when TCA invalid */
  trajectoryRiskComponents: TrajectoryRiskComponents | null;

  /** Reason TCA is invalid, when trajectoryRiskScore is null */
  tcaInvalidReason: TCAInvalidReason | null;

  // ── Composite assessment ────────────────────────────────────────────────

  /**
   * Final composite risk score. [0–100]
   * When trajectoryRiskScore is valid:
   *   finalScore = 0.65 · trajectoryRisk + 0.35 · orbitalCompatibility
   * When trajectoryRiskScore is null:
   *   finalScore = orbitalCompatibilityScore
   * NOT a collision probability.
   */
  riskScore: number;

  /** Categorical classification of riskScore */
  riskLevel: RiskLevel;

  /**
   * Data provenance.
   * DERIVED if both input states are DERIVED; ESTIMATED otherwise.
   */
  dataLabel: DataLabel;

  /**
   * Machine-generated plain-text explanation. Template-driven — no AI calls.
   */
  explanation: string;

  /** Elapsed simulation seconds at which this assessment was computed */
  elapsedSeconds: number;
}

/**
 * Backward-compatible alias. The old RiskComponents type is now
 * OrbitalCompatibilityComponents.
 * @deprecated Use OrbitalCompatibilityComponents directly in new code.
 */
export type RiskComponents = OrbitalCompatibilityComponents;

/**
 * Fleet risk report for all relevant pairs at one simulation moment.
 */
export interface FleetRiskReport {
  elapsedSeconds: number;
  /** ISO-8601 wall-clock timestamp */
  computedAt: string;
  /** All assessed pairs, sorted by riskScore descending */
  conjunctions: ConjunctionRisk[];
  /** Total pairs evaluated (passed destination + altitude pre-filter) */
  pairsEvaluated: number;
  /** Total pairs skipped (cross-body or beyond altitude threshold) */
  pairsSkipped: number;
}

// ─── Vector helpers ───────────────────────────────────────────────────────────

/** Euclidean magnitude */
function vecMag(v: ECIVector): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** a − b */
function vecSub(a: ECIVector, b: ECIVector): ECIVector {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Dot product */
function vecDot(a: ECIVector, b: ECIVector): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** v · s */
function vecScale(v: ECIVector, s: number): ECIVector {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/** a + b */
function vecAdd(a: ECIVector, b: ECIVector): ECIVector {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

// ─── Pure kinematic functions (exported for external use) ─────────────────────

/**
 * Relative position vector of B with respect to A (km).
 * r₀ = posB − posA
 */
export function relativePosition(a: OrbiterState, b: OrbiterState): ECIVector {
  return vecSub(b.positionKm, a.positionKm);
}

/**
 * Relative velocity vector of B with respect to A (km/s).
 * v = velB − velA
 */
export function relativeVelocity(a: OrbiterState, b: OrbiterState): ECIVector {
  return vecSub(b.velocityKmS, a.velocityKmS);
}

/**
 * Closing speed between A and B (km/s).
 * Positive = approaching, negative = receding.
 *
 * Computed as −dot(v, r̂₀) where r̂₀ is the unit vector from A to B.
 * If current separation < 1e-6 km (effectively coincident) returns 0.
 */
export function closingSpeed(a: OrbiterState, b: OrbiterState): number {
  const r0 = relativePosition(a, b);
  const r0mag = vecMag(r0);
  if (r0mag < 1e-6) return 0;
  const r0hat = vecScale(r0, 1 / r0mag);
  const v = relativeVelocity(a, b);
  return -vecDot(v, r0hat);
}

/**
 * Estimate time to closest approach (TCA) and miss distance under the
 * constant-velocity relative-motion approximation.
 *
 * Physics:
 *   r(τ) = r₀ + v·τ
 *   d|r|²/dτ = 0  ⟹  τ_ca = −dot(r₀, v) / |v|²
 *   r_ca = r₀ + v · τ_ca
 *   missDistance = |r_ca|
 *
 * Validity constraints:
 *   |v| ≥ MIN_REL_SPEED_KM_S     (otherwise formation-flying; τ undefined)
 *   0 ≤ τ_ca ≤ MAX_TCA_S         (past TCA or beyond linear-approx horizon)
 */
export function estimateTCA(a: OrbiterState, b: OrbiterState): TCAResult {
  const r0 = relativePosition(a, b);
  const v  = relativeVelocity(a, b);
  const vMagSq = vecDot(v, v);
  const vMag   = Math.sqrt(vMagSq);

  // Guard: near-zero relative velocity
  if (vMag < MIN_REL_SPEED_KM_S) {
    return { valid: false, reason: 'ZERO_RELATIVE_VELOCITY', rawTcaSec: null };
  }

  const rawTca = -vecDot(r0, v) / vMagSq;

  // Guard: closest approach already occurred
  if (rawTca < 0) {
    return { valid: false, reason: 'PAST_APPROACH', rawTcaSec: rawTca };
  }

  // Guard: beyond prediction horizon
  if (rawTca > MAX_TCA_S) {
    return { valid: false, reason: 'BEYOND_HORIZON', rawTcaSec: rawTca };
  }

  // Miss distance: r_ca = r₀ + v · τ_ca
  const rCa = vecAdd(r0, vecScale(v, rawTca));
  const missDistanceKm = vecMag(rCa);

  return {
    valid: true,
    timeToClosestApproachSec: rawTca,
    predictedMissDistanceKm: missDistanceKm,
  };
}

// ─── Scoring functions ────────────────────────────────────────────────────────

/**
 * Compute orbital compatibility sub-scores for a pair.
 * Measures structural similarity of orbital geometry — a persistent signal.
 */
export function calculateCompatibilityComponents(
  a: OrbiterState,
  b: OrbiterState,
): OrbitalCompatibilityComponents {
  const altDiffKm  = Math.abs(a.altitudeKm - b.altitudeKm);
  const incDiffDeg = Math.abs(a.orbitalParams.incDeg - b.orbitalParams.incDeg);

  const altitudeScore    = Math.max(0, 1 - altDiffKm  / MAX_ALT_DIFF_KM);
  const inclinationScore = Math.max(0, 1 - incDiffDeg / MAX_INC_DIFF_DEG);

  // Angular proximity via dot product of unit position vectors
  const magA = vecMag(a.positionKm);
  const magB = vecMag(b.positionKm);
  let proximityScore = 0;
  if (magA > 1e-6 && magB > 1e-6) {
    const unitA = vecScale(a.positionKm, 1 / magA);
    const unitB = vecScale(b.positionKm, 1 / magB);
    proximityScore = Math.max(0, vecDot(unitA, unitB));
  }

  return { altitudeScore, inclinationScore, proximityScore, altDiffKm, incDiffDeg };
}

/**
 * Compute orbital compatibility score (0–100) from sub-scores.
 * NOT a collision probability.
 */
export function calculateCompatibilityScore(
  components: OrbitalCompatibilityComponents,
): number {
  const raw =
    OCS_WEIGHT_ALT  * components.altitudeScore +
    OCS_WEIGHT_INC  * components.inclinationScore +
    OCS_WEIGHT_PROX * components.proximityScore;
  return Math.round(raw * 100);
}

/**
 * Compute trajectory risk sub-scores from a valid TCA result.
 */
export function calculateTrajectoryComponents(
  tcaResult: TCAResult & { valid: true },
  relSpeedKmS: number,
): TrajectoryRiskComponents {
  const missDistanceScore = Math.max(
    0,
    1 - tcaResult.predictedMissDistanceKm / DANGER_DIST_KM,
  );
  const timeScore  = Math.max(0, 1 - tcaResult.timeToClosestApproachSec / MAX_TCA_S);
  const speedScore = Math.min(1, relSpeedKmS / MAX_SCORING_SPEED_KM_S);

  return { missDistanceScore, timeScore, speedScore };
}

/**
 * Compute trajectory risk score (0–100) from sub-scores.
 * NOT a collision probability.
 */
export function calculateTrajectoryScore(
  components: TrajectoryRiskComponents,
): number {
  const raw =
    TRS_WEIGHT_MISS  * components.missDistanceScore +
    TRS_WEIGHT_TIME  * components.timeScore +
    TRS_WEIGHT_SPEED * components.speedScore;
  return Math.round(raw * 100);
}

/**
 * Compute the composite final risk score (0–100).
 *
 * When trajectoryRiskScore is valid:
 *   finalScore = round(COMPOSITE_TRAJ_WEIGHT · traj + (1−COMPOSITE_TRAJ_WEIGHT) · compat)
 *
 * When trajectoryRiskScore is null (TCA invalid):
 *   finalScore = orbitalCompatibilityScore
 */
export function calculateCompositeScore(
  orbitalCompatibilityScore: number,
  trajectoryRiskScore: number | null,
): number {
  if (trajectoryRiskScore === null) return orbitalCompatibilityScore;
  return Math.round(
    COMPOSITE_TRAJ_WEIGHT * trajectoryRiskScore +
    (1 - COMPOSITE_TRAJ_WEIGHT) * orbitalCompatibilityScore,
  );
}

/**
 * Classify a numeric score [0–100] into a RiskLevel.
 * Used for the final composite score.
 */
export function classifyRiskLevel(score: number): RiskLevel {
  if (score <= LEVEL_LOW_MAX)      return 'LOW';
  if (score <= LEVEL_MODERATE_MAX) return 'MODERATE';
  if (score <= LEVEL_HIGH_MAX)     return 'HIGH';
  return 'CRITICAL';
}

// ─── Backward-compatible aliases ─────────────────────────────────────────────

/**
 * @deprecated Use calculateCompatibilityComponents in new code.
 */
export const calculateComponents = calculateCompatibilityComponents;

/**
 * @deprecated Use calculateCompatibilityScore in new code.
 */
export function calculateRiskScore(
  components: OrbitalCompatibilityComponents,
): number {
  return calculateCompatibilityScore(components);
}

// ─── Provenance helpers ───────────────────────────────────────────────────────

function pairDataLabel(a: OrbiterState, b: OrbiterState): DataLabel {
  if (a.dataLabel === 'ESTIMATED' || b.dataLabel === 'ESTIMATED') return 'ESTIMATED';
  return 'DERIVED';
}

// ─── Explanation builder ──────────────────────────────────────────────────────

function buildExplanation(
  a: OrbiterState,
  b: OrbiterState,
  occ: OrbitalCompatibilityComponents,
  compatScore: number,
  trajScore: number | null,
  finalScore: number,
  level: RiskLevel,
  sepKm: number,
  relSpeedKmS: number,
  closingKmS: number,
  tcaResult: TCAResult,
  dataLabel: DataLabel,
): string {
  const parts: string[] = [];

  // ── Lead ───────────────────────────────────────────────────────────────────
  parts.push(
    `${a.name} and ${b.name} — ${level} orbital compatibility / monitoring index ${finalScore}/100 ` +
    `(orbital compatibility score: ${compatScore}` +
    (trajScore !== null ? `, trajectory risk score: ${trajScore}` : ', no valid TCA — score reflects OCS only') +
    `)`,
  );

  // ── Orbital geometry ───────────────────────────────────────────────────────
  if (occ.altDiffKm < 10) {
    parts.push(`Spacecraft occupy nearly identical radial orbital shells (altitude gap < 10 km).`);
  } else if (occ.altDiffKm < 100) {
    parts.push(`Spacecraft occupy similar radial orbital shells — altitude gap ${occ.altDiffKm.toFixed(0)} km.`);
  } else {
    parts.push(`Altitude gap of ${occ.altDiffKm.toFixed(0)} km — spacecraft occupy different radial orbital shells.`);
  }

  if (occ.incDiffDeg < 2) {
    parts.push(
      `Inclinations are closely matched (${occ.incDiffDeg.toFixed(1)}° difference). ` +
      `Note: inclination alone does not fully determine orbital-plane orientation — RAAN and argument of perigee also matter. ` +
      `This model evaluates inclination similarity only; full orbital-plane orientation is not assessed.`,
    );
  } else if (occ.incDiffDeg < MAX_INC_DIFF_DEG) {
    parts.push(
      `Inclinations diverge by ${occ.incDiffDeg.toFixed(1)}°, indicating partial orbital-plane similarity. ` +
      `Full plane orientation (including RAAN) is not evaluated by this model.`,
    );
  } else {
    parts.push(
      `Inclinations diverge by ${occ.incDiffDeg.toFixed(1)}° — limited inclination similarity.`,
    );
  }

  // ── Current kinematics ─────────────────────────────────────────────────────
  const approachWord = closingKmS > 0 ? 'closing' : 'receding';
  parts.push(
    `Current separation: ${sepKm.toFixed(0)} km. ` +
    `Relative speed: ${relSpeedKmS.toFixed(2)} km/s (${approachWord} at ${Math.abs(closingKmS).toFixed(2)} km/s).`,
  );

  // ── TCA summary ────────────────────────────────────────────────────────────
  if (tcaResult.valid) {
    const tcaSec  = tcaResult.timeToClosestApproachSec;
    const missDist = tcaResult.predictedMissDistanceKm;
    const tcaMin  = (tcaSec / 60).toFixed(1);
    if (missDist < 10) {
      parts.push(
        `Closest approach predicted in ${tcaMin} min with miss distance ${missDist.toFixed(1)} km — dangerously close.`,
      );
    } else if (missDist < DANGER_DIST_KM) {
      parts.push(
        `Closest approach predicted in ${tcaMin} min with miss distance ${missDist.toFixed(0)} km.`,
      );
    } else {
      parts.push(
        `Closest approach predicted in ${tcaMin} min; predicted miss distance ${missDist.toFixed(0)} km (within analysis horizon).`,
      );
    }
  } else {
    const reasons: Record<TCAInvalidReason, string> = {
      ZERO_RELATIVE_VELOCITY: 'spacecraft have near-zero relative velocity (possible formation flight)',
      PAST_APPROACH:          'closest approach already occurred; spacecraft are now diverging',
      BEYOND_HORIZON:         `next closest approach is beyond the ${MAX_TCA_S / 3600}-hour prediction horizon`,
    };
    parts.push(`No valid TCA: ${reasons[tcaResult.reason]}.`);
  }

  // ── Data quality ───────────────────────────────────────────────────────────
  if (dataLabel === 'ESTIMATED') {
    parts.push(
      `Data quality: ESTIMATED — one or both spacecraft use simplified orbital elements with higher positional uncertainty.`,
    );
  } else {
    parts.push(
      `Data quality: DERIVED — positions from published TLE-derived orbital elements.`,
    );
  }

  // ── Disclaimer ─────────────────────────────────────────────────────────────
  parts.push(
    `These indices are NOT collision probabilities. ` +
    `They are geometric and kinematic risk indicators based on simplified two-body Keplerian propagation.`,
  );

  return parts.join(' ');
}

// ─── Main analysis functions ──────────────────────────────────────────────────

/**
 * Analyse the conjunction risk between two specific orbiters.
 *
 * @returns ConjunctionRisk, or null if the pair is on different bodies
 *          or altitude shells are too far apart to produce a non-zero score.
 */
export function analyzeConjunction(
  a: OrbiterState,
  b: OrbiterState,
): ConjunctionRisk | null {
  // Guard: only spacecraft orbiting the same body
  if (a.destination !== b.destination) return null;

  // Guard: altitude shells too far apart (orbital compatibility score = 0)
  const altDiff = Math.abs(a.altitudeKm - b.altitudeKm);
  if (altDiff > MAX_ALT_DIFF_KM) return null;

  // Stable pair ID
  const [idFirst, idSecond] = [a.missionId, b.missionId].sort();
  const pairId = `${idFirst}::${idSecond}`;

  // ── Current kinematics ────────────────────────────────────────────────────
  const r0        = relativePosition(a, b);
  const sepKm     = vecMag(r0);
  const relVel    = relativeVelocity(a, b);
  const relSpeed  = vecMag(relVel);
  const closing   = closingSpeed(a, b);

  // ── Orbital compatibility ─────────────────────────────────────────────────
  const occComponents = calculateCompatibilityComponents(a, b);
  const compatScore   = calculateCompatibilityScore(occComponents);

  // ── Trajectory risk ───────────────────────────────────────────────────────
  const tcaResult = estimateTCA(a, b);

  let trajectoryRiskScore: number | null             = null;
  let trajectoryRiskComponents: TrajectoryRiskComponents | null = null;
  let tcaInvalidReason: TCAInvalidReason | null      = null;
  let tcaSec: number | null                          = null;
  let missDist: number | null                        = null;

  if (tcaResult.valid) {
    tcaSec   = tcaResult.timeToClosestApproachSec;
    missDist = tcaResult.predictedMissDistanceKm;
    trajectoryRiskComponents = calculateTrajectoryComponents(tcaResult, relSpeed);
    trajectoryRiskScore      = calculateTrajectoryScore(trajectoryRiskComponents);
  } else {
    tcaInvalidReason = tcaResult.reason;
  }

  // ── Composite score ───────────────────────────────────────────────────────
  const finalScore = calculateCompositeScore(compatScore, trajectoryRiskScore);
  const level      = classifyRiskLevel(finalScore);
  const label      = pairDataLabel(a, b);

  const explanation = buildExplanation(
    a, b, occComponents,
    compatScore, trajectoryRiskScore, finalScore, level,
    sepKm, relSpeed, closing, tcaResult, label,
  );

  return {
    pairId,
    destination:                  a.destination,
    objectA:                      a,
    objectB:                      b,
    currentSeparationKm:          sepKm,
    relativeVelocity:             relVel,
    relativeSpeedKmS:             relSpeed,
    closingSpeedKmS:              closing,
    isApproaching:                closing > 0,
    orbitalCompatibilityScore:    compatScore,
    orbitalCompatibilityComponents: occComponents,
    timeToClosestApproachSec:     tcaSec,
    predictedMissDistanceKm:      missDist,
    trajectoryRiskScore,
    trajectoryRiskComponents,
    tcaInvalidReason,
    riskScore:                    finalScore,
    riskLevel:                    level,
    dataLabel:                    label,
    explanation,
    elapsedSeconds:               a.elapsedSeconds,
  };
}

/**
 * Analyse all relevant spacecraft pairs in a TelemetrySnapshot.
 * Returns a FleetRiskReport sorted by riskScore descending.
 *
 * Only orbiters are included — surface assets have no orbital velocity.
 * O(n²) over orbiters per destination; ≤ 55 pairs with the current dataset.
 */
export function analyzeFleetRisk(snapshot: TelemetrySnapshot): FleetRiskReport {
  const conjunctions: ConjunctionRisk[] = [];
  let pairsSkipped   = 0;
  let pairsEvaluated = 0;

  const { orbiters } = snapshot;

  for (let i = 0; i < orbiters.length; i++) {
    for (let j = i + 1; j < orbiters.length; j++) {
      const a = orbiters[i];
      const b = orbiters[j];

      if (a.destination !== b.destination) {
        pairsSkipped++;
        continue;
      }

      if (Math.abs(a.altitudeKm - b.altitudeKm) > MAX_ALT_DIFF_KM) {
        pairsSkipped++;
        continue;
      }

      pairsEvaluated++;
      const result = analyzeConjunction(a, b);
      if (result !== null) conjunctions.push(result);
    }
  }

  conjunctions.sort((x, y) => y.riskScore - x.riskScore);

  return {
    elapsedSeconds: snapshot.elapsedSeconds,
    computedAt:     new Date().toISOString(),
    conjunctions,
    pairsEvaluated,
    pairsSkipped,
  };
}
