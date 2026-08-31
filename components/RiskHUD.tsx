'use client';

/**
 * RiskHUD — Orbital Safety Monitor
 *
 * A floating, poppable HUD panel that polls /api/risk with the current
 * simulation elapsed time and displays the top orbital conjunction risks.
 * Closing it fully hides the panel (freeing the 3D scene) while leaving a
 * small persistent button to bring it back — it never blocks the scene and
 * never restructures the page around itself.
 *
 * Props:
 *   simulationTimeSec  — Current simulation elapsed seconds, kept in sync
 *                        with the SpaceScene clock via the onSimTimeUpdate
 *                        callback. RiskHUD never calls Date.now() for
 *                        simulation time.
 *   onAnalyzeWithAI    — Optional callback fired when the user clicks
 *                        "Analyze with AI" on a risk item. Receives the
 *                        pairId. AI integration is NOT implemented here.
 *
 * Architecture:
 *   • No physics or risk calculations in this component. Every number shown
 *     is read straight from the /api/risk response — see lib/risk.ts for
 *     the actual scoring engine. This file only changes PRESENTATION: big
 *     numbers and compact visuals up front, the full technical readout
 *     preserved (unchanged, all fields) under a collapsed-by-default toggle.
 *   • Fetches /api/risk?t=<simulationTimeSec>&limit=3
 *   • Refreshes every REFRESH_INTERVAL_MS wall-clock milliseconds.
 *   • simulationTimeSec is stored in a ref so the interval closure always
 *     reads the latest value without being recreated.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, ChevronDown, RefreshCw, AlertTriangle, X, Sparkles,
  Satellite, ChevronsRightLeft, ChevronsLeftRight, HelpCircle, Rocket, Check, ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { PlanetIcon } from './PlanetIcon';

// ─── Constants ────────────────────────────────────────────────────────────────

/** How often to re-fetch the risk report (wall-clock ms). */
const REFRESH_INTERVAL_MS = 5_000;

/** Number of top conjunctions to request and display. */
const DISPLAY_LIMIT = 3;

// ─── API response types ───────────────────────────────────────────────────────
// Mirror the response shape of /api/risk without importing server-only modules.

interface SpacecraftSummary {
  missionId: string;
  name: string;
  destination: 'earth' | 'moon' | 'mars';
  altitudeKm: number;
  dataLabel: 'OBSERVED' | 'DERIVED' | 'AI' | 'ESTIMATED';
}

export interface RiskEntry {
  pairId: string;
  objectA: SpacecraftSummary;
  objectB: SpacecraftSummary;
  orbitalCompatibilityScore: number;
  trajectoryRiskScore: number | null;
  compositeScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  currentSeparationKm: number;
  relativeSpeedKmS: number;
  closingSpeedKmS: number;
  isApproaching: boolean;
  timeToClosestApproachSec: number | null;
  predictedMissDistanceKm: number | null;
  tcaInvalidReason: string | null;
  dataQuality: 'OBSERVED' | 'DERIVED' | 'AI' | 'ESTIMATED';
  explanation: string;
}

interface RiskSummary {
  objectsAnalyzed: number;
  pairsEvaluated: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

interface RiskTotals {
  orbitersTracked: number;
  pairsEvaluated: number;
  pairsSkipped: number;
}

interface RiskApiResponse {
  timestamp: string;
  elapsedSeconds: number;
  totals: RiskTotals;
  summary: RiskSummary;
  risks: RiskEntry[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiskHUDProps {
  /** Current simulation elapsed seconds from SpaceScene's clock. */
  simulationTimeSec: number;
  /**
   * Called when the user clicks "Analyze with AI" on a risk card.
   * Receives the full RiskEntry so the AI route has all pre-computed values.
   */
  onAnalyzeWithAI?: (risk: RiskEntry) => void;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const RISK_LEVEL_STYLES: Record<RiskEntry['riskLevel'], {
  badge: string;
  bar: string;
  border: string;
  dot: string;
  text: string;
  bg: string;
}> = {
  CRITICAL: {
    badge:  'bg-red-500/20 border-red-500/40 text-red-400',
    bar:    'bg-red-500',
    border: 'border-red-500/30',
    dot:    'bg-red-500 animate-pulse',
    text:   'text-red-400',
    bg:     'bg-red-500/10',
  },
  HIGH: {
    badge:  'bg-orange-500/20 border-orange-500/40 text-orange-400',
    bar:    'bg-orange-400',
    border: 'border-orange-500/20',
    dot:    'bg-orange-400 animate-pulse',
    text:   'text-orange-400',
    bg:     'bg-orange-500/10',
  },
  MODERATE: {
    badge:  'bg-amber-500/20 border-amber-500/40 text-amber-400',
    bar:    'bg-amber-400',
    border: 'border-amber-500/20',
    dot:    'bg-amber-400',
    text:   'text-amber-400',
    bg:     'bg-amber-500/10',
  },
  LOW: {
    badge:  'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    bar:    'bg-emerald-500',
    border: 'border-emerald-500/10',
    dot:    'bg-emerald-500',
    text:   'text-emerald-400',
    bg:     'bg-emerald-500/10',
  },
};

const DATA_QUALITY_STYLES: Record<string, string> = {
  DERIVED:   'text-blue-400 bg-blue-400/10 border-blue-400/30',
  ESTIMATED: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  OBSERVED:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  AI:        'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

/**
 * A short pool of generic, verifiably-true orbital-mechanics facts — never
 * claims anything about the specific pair shown, only general facts, so
 * there is no risk of fabricating something about a particular spacecraft.
 * Picked deterministically per card (by index) so multiple visible cards
 * don't repeat the same line.
 */
const SPACE_FACTS = [
  'Most low-Earth-orbit satellites travel faster than 7 km/s — about 25,000 km/h.',
  'Thousands of active satellites orbit Earth right now.',
  'The ISS circles Earth roughly every 90 minutes.',
  'Operators track objects as small as a few centimeters to avoid close calls.',
];

// ─── TCA reason → human-readable (technical details only) ───────────────────

function formatTCAReason(reason: string | null): string {
  if (!reason) return '';
  switch (reason) {
    case 'PAST_APPROACH':          return 'Closest approach already passed';
    case 'ZERO_RELATIVE_VELOCITY': return 'Objects have negligible relative motion';
    case 'BEYOND_HORIZON':         return 'Closest approach beyond analysis horizon';
    default:                       return reason;
  }
}

/**
 * Very short status line — built only from fields lib/risk.ts already
 * computed (isApproaching, tcaInvalidReason). Never invents a trend.
 */
function approachStatus(risk: RiskEntry): { label: string; state: 'approaching' | 'receding' | 'steady' } {
  if (risk.tcaInvalidReason === 'ZERO_RELATIVE_VELOCITY') {
    return { label: 'HOLDING STEADY', state: 'steady' };
  }
  if (risk.isApproaching) {
    return { label: 'GETTING CLOSER', state: 'approaching' };
  }
  return { label: 'MOVING APART', state: 'receding' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** One big-number stat pod: tiny label, dominant number, tiny unit. */
function StatPod({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[8px] text-orbit-dim tracking-widest font-semibold mb-0.5">{label}</span>
      <span className={clsx('text-xl font-semibold tabular-nums leading-none', color ?? 'text-orbit-white')}>{value}</span>
      <span className="text-[9px] text-orbit-dim mt-0.5">{unit}</span>
    </div>
  );
}

/** Top dashboard: one big-number pod per risk level + tracked count. Numbers dominate, labels are single words. */
function SummaryDashboard({ data }: { data: RiskApiResponse }) {
  const cells: Array<{ level: RiskEntry['riskLevel'] | 'TRACKED'; count: number }> = [
    { level: 'CRITICAL', count: data.summary.critical },
    { level: 'HIGH',     count: data.summary.high },
    { level: 'MODERATE', count: data.summary.moderate },
    { level: 'LOW',      count: data.summary.low },
    { level: 'TRACKED',  count: data.totals.orbitersTracked },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 px-4 py-3 border-b border-space-border/50">
      {cells.map((c) => {
        const styles = c.level === 'TRACKED' ? null : RISK_LEVEL_STYLES[c.level];
        return (
          <div key={c.level} className="flex flex-col items-center gap-1">
            <span className={clsx('text-xl font-bold tabular-nums leading-none', styles?.text ?? 'text-orbit-cyan')}>
              {c.count}
            </span>
            <span className={clsx('w-1.5 h-1.5 rounded-full', styles?.dot ?? 'bg-orbit-cyan')} />
            <span className="text-[8px] text-orbit-dim tracking-wider font-medium">
              {c.level === 'TRACKED' ? 'TRACKED' : c.level}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact orbit/approach graphic. Not an ephemeris plot — a clearly
 * stylised schematic (curved path + two markers) built only from the real
 * approach direction (isApproaching/tcaInvalidReason), never fabricated
 * geometry. Communicates: two objects, a shared path, and which way they're
 * currently moving relative to each other.
 */
function OrbitGraphic({ risk, approach }: { risk: RiskEntry; approach: ReturnType<typeof approachStatus> }) {
  const color = approach.state === 'approaching' ? '#f87171' : approach.state === 'receding' ? '#34d399' : '#8fa3be';
  const ArrowIcon = approach.state === 'approaching' ? ChevronsRightLeft : ChevronsLeftRight;
  return (
    <div className="flex items-center justify-center gap-2 py-1.5">
      <Satellite size={16} className="text-orbit-blue shrink-0" />
      <svg viewBox="0 0 100 20" className="flex-1 h-4" preserveAspectRatio="none">
        <path d="M2,16 Q50,-4 98,16" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
      </svg>
      {approach.state !== 'steady' && <ArrowIcon size={13} className="shrink-0" style={{ color }} />}
      <Satellite size={16} className="text-orbit-accent shrink-0" />
    </div>
  );
}

interface ConjunctionCardProps {
  risk: RiskEntry;
  factIndex: number;
  onAnalyzeWithAI?: (risk: RiskEntry) => void;
}

function ConjunctionCard({ risk, factIndex, onAnalyzeWithAI }: ConjunctionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const styles = RISK_LEVEL_STYLES[risk.riskLevel];
  const approach = approachStatus(risk);
  const StatusIcon = approach.state === 'receding' ? Check : approach.state === 'approaching' ? ArrowRight : undefined;

  const tcaDisplay = risk.timeToClosestApproachSec !== null
    ? risk.timeToClosestApproachSec < 60
      ? `${Math.round(risk.timeToClosestApproachSec)}s`
      : `${(risk.timeToClosestApproachSec / 60).toFixed(1)} min`
    : null;

  const missDisplay = risk.predictedMissDistanceKm !== null
    ? `${risk.predictedMissDistanceKm.toLocaleString()} km`
    : null;

  return (
    <div className={clsx('rounded-lg border overflow-hidden', styles.border, 'glass-subtle')}>
      <div className="p-3">
        {/* ── Identity ── */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] font-semibold text-orbit-white truncate">{risk.objectA.name}</span>
              <span className="text-orbit-dim text-[10px]">↔</span>
              <span className="text-[12px] font-semibold text-orbit-white truncate">{risk.objectB.name}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-orbit-dim mt-0.5">
              <PlanetIcon planet={risk.objectA.destination} size={9} />
              <span>{risk.objectA.destination.toUpperCase()}</span>
            </div>
          </div>
          <div className={clsx('px-2 py-0.5 rounded border text-[9px] font-semibold tracking-wider shrink-0', styles.badge)}>
            {risk.riskLevel}
          </div>
        </div>

        {/* ── Orbit / approach graphic ── */}
        <OrbitGraphic risk={risk} approach={approach} />

        {/* ── Big numbers row: distance / speed / score ── */}
        <div className="grid grid-cols-3 gap-1.5 mt-1 mb-2.5">
          <StatPod label="DISTANCE" value={risk.currentSeparationKm.toLocaleString()} unit="km" />
          <StatPod label="REL. SPEED" value={risk.relativeSpeedKmS.toFixed(1)} unit="km/s" />
          <StatPod label="SAFETY" value={`${risk.compositeScore}`} unit="/ 100" color={styles.text} />
        </div>

        {/* ── Score bar ── */}
        <div className="h-1.5 w-full rounded-full bg-space-border overflow-hidden mb-2.5">
          <div className={clsx('h-full rounded-full transition-all duration-500', styles.bar)} style={{ width: `${risk.compositeScore}%` }} />
        </div>

        {/* ── Status line ── */}
        <div className={clsx(
          'flex items-center justify-center gap-1.5 py-1.5 rounded-lg mb-2.5',
          styles.bg,
        )}>
          {StatusIcon && <StatusIcon size={13} className={styles.text} />}
          <span className={clsx('text-[11px] font-semibold tracking-wide', styles.text)}>{approach.label}</span>
        </div>

        {/* ── Did you know — one short line ── */}
        <div className="flex items-start gap-1.5 mb-1">
          <Sparkles size={10} className="text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-orbit-dim leading-snug">{SPACE_FACTS[factIndex % SPACE_FACTS.length]}</p>
        </div>

        {/* ── Technical details (collapsed by default) ── */}
        <div className="mt-2 pt-2 border-t border-space-border/40">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-[10px] text-orbit-dim hover:text-orbit-white tracking-wider w-full py-0.5 transition-colors"
          >
            <ChevronDown size={12} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
            TECHNICAL DETAILS
            <span className={clsx('px-1.5 py-px rounded border text-[8px] tracking-wider ml-auto', DATA_QUALITY_STYLES[risk.dataQuality] ?? 'text-orbit-dim')}>
              {risk.dataQuality}
            </span>
          </button>

          {expanded && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2.5 mt-1 border-t border-space-border/30">
              <TechPod label="SEP" value={`${risk.currentSeparationKm.toLocaleString()} km`} />
              <TechPod label="REL SPEED" value={`${risk.relativeSpeedKmS.toFixed(2)} km/s`} />
              <TechPod
                label={risk.isApproaching ? 'CLOSING' : 'RECEDING'}
                value={`${Math.abs(risk.closingSpeedKmS).toFixed(2)} km/s`}
              />
              <TechPod label="OCS" value={`${risk.orbitalCompatibilityScore}`} />
              <TechPod label="TRS" value={risk.trajectoryRiskScore !== null ? `${risk.trajectoryRiskScore}` : 'N/A'} />
              <TechPod label="COMPOSITE" value={`${risk.compositeScore}`} />
              {tcaDisplay && missDisplay ? (
                <>
                  <TechPod label="TCA IN" value={tcaDisplay} />
                  <TechPod label="MISS DIST" value={missDisplay} />
                </>
              ) : (
                <div className="col-span-2">
                  <TechPod label="TCA STATUS" value={formatTCAReason(risk.tcaInvalidReason)} />
                </div>
              )}

              <p className="col-span-2 text-[10px] text-orbit-dim/80 leading-relaxed pt-2 border-t border-space-border/20">
                {risk.explanation}
              </p>
              <p className="col-span-2 text-[9px] text-orbit-dim/50 italic">
                Scores are NOT collision probabilities. Simplified Keplerian propagation.
              </p>

              {onAnalyzeWithAI && (
                <button
                  onClick={() => onAnalyzeWithAI(risk)}
                  className="col-span-2 mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded glass border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-[10px] tracking-wider w-full justify-center"
                >
                  <Sparkles size={10} />
                  ANALYZE WITH AI
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TechPod({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[8px] text-orbit-dim tracking-widest">{label}</div>
      <div className="text-[11px] text-orbit-white/90 font-mono">{value}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RiskHUD({ simulationTimeSec, onAnalyzeWithAI }: RiskHUDProps) {
  const [data,       setData]       = useState<RiskApiResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  // Single open/closed toggle — closing fully hides the panel (freeing the
  // 3D scene, per spec) and leaves only the small pill button below to
  // bring it back. Replaces the old separate minimize+dismiss states,
  // which used to have a dead end (dismissed had no way back without a
  // page reload).
  const [open, setOpen] = useState(false);
  const [pairsInfoOpen, setPairsInfoOpen] = useState(false);

  // Keep the latest simulationTimeSec in a ref so the interval callback
  // always uses the current value without needing to be recreated.
  const simTimeRef = useRef(simulationTimeSec);
  useEffect(() => { simTimeRef.current = simulationTimeSec; }, [simulationTimeSec]);

  const fetchRisk = useCallback(async () => {
    try {
      const t = Math.round(simTimeRef.current);
      const res = await fetch(`/api/risk?t=${t}&limit=${DISPLAY_LIMIT}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const json: RiskApiResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []); // stable — reads simTimeRef, not simulationTimeSec

  // Fetch on mount + refresh on interval (keeps polling even while closed,
  // so the reopen button's urgent-count badge stays live).
  useEffect(() => {
    fetchRisk();
    const id = setInterval(fetchRisk, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchRisk]);

  const critical = data?.summary.critical ?? 0;
  const high     = data?.summary.high ?? 0;
  const urgent   = critical + high;

  // ── Closed: a small persistent pill, never blocks the scene ──────────────
  if (!open) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setOpen(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 glass rounded-lg border text-[11px] tracking-wider transition-colors',
            urgent > 0
              ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
              : 'border-space-border text-orbit-dim hover:text-orbit-white hover:border-space-muted',
          )}
        >
          <Shield size={12} />
          <span>SAFETY</span>
          {urgent > 0 && (
            <span className="px-1.5 py-px rounded bg-red-500/30 border border-red-500/40 text-red-300 text-[9px] font-semibold">
              {urgent}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ── Open: full floating panel, overlays the scene without restructuring it ──
  return (
    <div className={clsx(
      'fixed bottom-4 left-4 z-40 animate-slide-up',
      'glass rounded-xl border border-space-border shadow-2xl',
      'w-[calc(100vw-2rem)] sm:w-80 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden',
    )}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-space-border shrink-0">
        <Shield size={13} className="text-orbit-blue shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-orbit-white tracking-widest">
            SAFETY MONITOR
          </div>
          {data && (
            <div className="text-[9px] text-orbit-dim mt-0.5">
              {data.totals.pairsEvaluated} pairs · t={Math.round(data.elapsedSeconds)}s
            </div>
          )}
        </div>
        {loading && <RefreshCw size={10} className="text-orbit-dim animate-spin shrink-0" />}
        <button
          onClick={() => setOpen(false)}
          className="p-1 text-orbit-dim hover:text-orbit-white transition-colors shrink-0"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* min-h-0 lets this actually shrink to its flex share and scroll,
          instead of the panel's overflow-hidden silently clipping the
          bottom. */}
      <div className="overflow-y-auto min-h-0 flex-1">

        {/* Loading state */}
        {loading && !data && (
          <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-orbit-dim">
            <RefreshCw size={13} className="animate-spin" />
            <span>Analyzing orbital state…</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="m-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-400 flex items-start gap-2">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>Failed to load risk data: {error}</span>
          </div>
        )}

        {/* Visual summary dashboard */}
        {data && <SummaryDashboard data={data} />}

        {/* Conjunction cards */}
        {data && (
          <div className="p-3 space-y-2.5">
            {data.risks.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                  <Shield size={14} className="text-emerald-400" />
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Nothing worth watching right now
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1 relative">
                  <Rocket size={11} className="text-orbit-blue" />
                  <span className="text-[9px] text-orbit-dim tracking-widest font-semibold">
                    SPACE TRAFFIC TO WATCH
                  </span>
                  <button
                    onClick={() => setPairsInfoOpen(v => !v)}
                    className="text-orbit-dim/60 hover:text-orbit-white transition-colors"
                    aria-label="What is a monitoring pair?"
                  >
                    <HelpCircle size={11} />
                  </button>
                  {pairsInfoOpen && (
                    <div className="absolute left-0 top-5 z-10 w-64 p-2.5 rounded-lg glass border border-space-border text-[10px] text-orbit-dim leading-relaxed shadow-xl">
                      Pairs of spacecraft our system is monitoring because their predicted paths bring them relatively close together.
                    </div>
                  )}
                </div>
                {data.risks.map((risk, i) => (
                  <ConjunctionCard
                    key={risk.pairId}
                    risk={risk}
                    factIndex={i}
                    onAnalyzeWithAI={onAnalyzeWithAI}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Footer note */}
        {data && (
          <div className="px-3 pb-3 text-[9px] text-orbit-dim/50 text-center leading-relaxed">
            Not collision probabilities · Refreshes every {REFRESH_INTERVAL_MS / 1000}s
          </div>
        )}
      </div>
    </div>
  );
}
