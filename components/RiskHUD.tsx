'use client';

/**
 * RiskHUD — Orbital Safety Monitor
 *
 * Floating HUD panel that polls /api/risk with the current simulation
 * elapsed time and displays the top orbital conjunction risks.
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
 *   • No physics or risk calculations in this component.
 *   • Fetches /api/risk?t=<simulationTimeSec>&limit=3
 *   • Refreshes every REFRESH_INTERVAL_MS wall-clock milliseconds.
 *   • simulationTimeSec is stored in a ref so the interval closure always
 *     reads the latest value without being recreated.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';

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
}> = {
  CRITICAL: {
    badge:  'bg-red-500/20 border-red-500/40 text-red-400',
    bar:    'bg-red-500',
    border: 'border-red-500/30',
    dot:    'bg-red-500 animate-pulse',
    text:   'text-red-400',
  },
  HIGH: {
    badge:  'bg-orange-500/20 border-orange-500/40 text-orange-400',
    bar:    'bg-orange-400',
    border: 'border-orange-500/20',
    dot:    'bg-orange-400 animate-pulse',
    text:   'text-orange-400',
  },
  MODERATE: {
    badge:  'bg-amber-500/20 border-amber-500/40 text-amber-400',
    bar:    'bg-amber-400',
    border: 'border-amber-500/20',
    dot:    'bg-amber-400',
    text:   'text-amber-400',
  },
  LOW: {
    badge:  'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    bar:    'bg-emerald-500',
    border: 'border-emerald-500/10',
    dot:    'bg-emerald-500',
    text:   'text-emerald-400',
  },
};

const DATA_QUALITY_STYLES: Record<string, string> = {
  DERIVED:   'text-blue-400 bg-blue-400/10 border-blue-400/30',
  ESTIMATED: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  OBSERVED:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  AI:        'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

const DEST_EMOJI: Record<string, string> = {
  earth: '🌎',
  moon: '🌙',
  mars: '🔴',
};

// ─── TCA reason → human-readable ─────────────────────────────────────────────

function formatTCAReason(reason: string | null): string {
  if (!reason) return '';
  switch (reason) {
    case 'PAST_APPROACH':          return 'Closest approach already passed';
    case 'ZERO_RELATIVE_VELOCITY': return 'Objects have negligible relative motion';
    case 'BEYOND_HORIZON':         return 'Closest approach beyond analysis horizon';
    default:                       return reason;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
      <span className={clsx('text-sm font-semibold tabular-nums', color)}>{value}</span>
      <span className="text-[9px] text-orbit-dim tracking-wider uppercase">{label}</span>
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1 w-full rounded-full bg-space-border overflow-hidden">
      <div
        className={clsx('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

interface ConjunctionCardProps {
  risk: RiskEntry;
  onAnalyzeWithAI?: (risk: RiskEntry) => void;
}

function ConjunctionCard({ risk, onAnalyzeWithAI }: ConjunctionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const styles = RISK_LEVEL_STYLES[risk.riskLevel];

  const tcaDisplay = risk.timeToClosestApproachSec !== null
    ? risk.timeToClosestApproachSec < 60
      ? `${Math.round(risk.timeToClosestApproachSec)}s`
      : `${(risk.timeToClosestApproachSec / 60).toFixed(1)} min`
    : null;

  const missDisplay = risk.predictedMissDistanceKm !== null
    ? `${risk.predictedMissDistanceKm.toLocaleString()} km`
    : null;

  return (
    <div className={clsx(
      'rounded-lg border overflow-hidden transition-colors',
      styles.border,
      'glass-subtle',
    )}>
      {/* Card header — always visible */}
      <div className="p-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-orbit-white truncate">
                {risk.objectA.name}
              </span>
              <span className="text-orbit-dim text-[10px]">↔</span>
              <span className="text-[11px] font-semibold text-orbit-white truncate">
                {risk.objectB.name}
              </span>
            </div>
            <div className="text-[9px] text-orbit-dim mt-0.5">
              {DEST_EMOJI[risk.objectA.destination]} {risk.objectA.destination.toUpperCase()}
              {' · '}
              {risk.objectA.altitudeKm.toFixed(0)} km / {risk.objectB.altitudeKm.toFixed(0)} km
            </div>
          </div>
          {/* Risk level badge */}
          <div className={clsx(
            'px-2 py-0.5 rounded border text-[9px] font-semibold tracking-wider shrink-0',
            styles.badge,
          )}>
            {risk.riskLevel}
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center gap-2 mb-2">
          <span className={clsx('text-lg font-semibold tabular-nums leading-none', styles.text)}>
            {risk.compositeScore}
          </span>
          <span className="text-[10px] text-orbit-dim">/100</span>
          <span className="text-[8px] text-orbit-dim/60 leading-tight">orbital compatibility<br/>index</span>
          <div className="flex-1">
            <ScoreBar score={risk.compositeScore} color={styles.bar} />
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div>
            <div className="text-orbit-dim tracking-wider">SEP</div>
            <div className="text-orbit-white font-mono tabular-nums">
              {risk.currentSeparationKm.toLocaleString()} km
            </div>
          </div>
          <div>
            <div className="text-orbit-dim tracking-wider">REL SPD</div>
            <div className="text-orbit-white font-mono tabular-nums">
              {risk.relativeSpeedKmS.toFixed(2)} km/s
            </div>
          </div>
          <div>
            <div className="text-orbit-dim tracking-wider">
              {risk.isApproaching ? 'CLOSING' : 'RECEDING'}
            </div>
            <div className={clsx(
              'font-mono tabular-nums',
              risk.isApproaching ? 'text-red-400' : 'text-emerald-400',
            )}>
              {Math.abs(risk.closingSpeedKmS).toFixed(2)} km/s
            </div>
          </div>
        </div>

        {/* TCA row — only when valid */}
        {tcaDisplay && missDisplay ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            <div>
              <div className="text-orbit-dim tracking-wider">TCA IN</div>
              <div className="text-orbit-white font-mono tabular-nums">{tcaDisplay}</div>
            </div>
            <div>
              <div className="text-orbit-dim tracking-wider">MISS DIST</div>
              <div className="text-orbit-white font-mono tabular-nums">{missDisplay}</div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-[9px] text-orbit-dim/70 italic leading-snug">
            {formatTCAReason(risk.tcaInvalidReason)}
          </div>
        )}

        {/* Scores breakdown + expand toggle */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-space-border/40">
          <div className="flex items-center gap-2 text-[9px] text-orbit-dim">
            <span>OCS <span className="text-orbit-white">{risk.orbitalCompatibilityScore}</span></span>
            {risk.trajectoryRiskScore !== null && (
              <span>TRS <span className="text-orbit-white">{risk.trajectoryRiskScore}</span></span>
            )}
            <span className={clsx(
              'px-1.5 py-px rounded border text-[8px] tracking-wider',
              DATA_QUALITY_STYLES[risk.dataQuality] ?? 'text-orbit-dim',
            )}>
              {risk.dataQuality}
            </span>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-orbit-dim hover:text-orbit-white transition-colors p-0.5"
            aria-label={expanded ? 'Collapse' : 'Expand explanation'}
          >
            {expanded
              ? <ChevronUp size={12} />
              : <ChevronDown size={12} />
            }
          </button>
        </div>
      </div>

      {/* Expanded — explanation + AI button */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-space-border/30">
          <p className="text-[10px] text-orbit-dim/80 leading-relaxed mt-2">
            {risk.explanation}
          </p>
          <p className="text-[9px] text-orbit-dim/50 mt-1.5 italic">
            Scores are NOT collision probabilities. Based on simplified Keplerian propagation.
          </p>
          {onAnalyzeWithAI && (
            <button
              onClick={() => onAnalyzeWithAI(risk)}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded glass border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-[10px] tracking-wider w-full justify-center"
            >
              <Sparkles size={10} />
              ANALYZE WITH AI
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RiskHUD({ simulationTimeSec, onAnalyzeWithAI }: RiskHUDProps) {
  const [data,       setData]       = useState<RiskApiResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [minimized,  setMinimized]  = useState(false);
  const [dismissed,  setDismissed]  = useState(false);

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

  // Fetch on mount + refresh on interval
  useEffect(() => {
    fetchRisk();
    const id = setInterval(fetchRisk, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchRisk]);

  if (dismissed) return null;

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (minimized) {
    const critical = data?.summary.critical ?? 0;
    const high     = data?.summary.high ?? 0;
    const urgent   = critical + high;
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setMinimized(false)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 glass rounded-lg border text-[11px] tracking-wider transition-colors',
            urgent > 0
              ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
              : 'border-space-border text-orbit-dim hover:text-orbit-white hover:border-space-muted',
          )}
        >
          <Shield size={12} />
          <span>SAFETY MONITOR</span>
          {urgent > 0 && (
            <span className="px-1.5 py-px rounded bg-red-500/30 border border-red-500/40 text-red-300 text-[9px] font-semibold">
              {urgent}
            </span>
          )}
        </button>
      </div>
    );
  }

  // ── Full panel ────────────────────────────────────────────────────────────
  return (
    <div className={clsx(
      'fixed bottom-4 left-4 z-40',
      'glass rounded-xl border border-space-border shadow-2xl',
      'w-72 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden',
    )}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-space-border shrink-0">
        <Shield size={13} className="text-orbit-blue shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-orbit-white tracking-widest">
            ORBITAL SAFETY MONITOR
          </div>
          {data && (
            <div className="text-[9px] text-orbit-dim mt-0.5">
              {data.totals.orbitersTracked} orbiters · {data.totals.pairsEvaluated} pairs · t={Math.round(data.elapsedSeconds)}s
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {loading && <RefreshCw size={10} className="text-orbit-dim animate-spin" />}
          <button
            onClick={() => setMinimized(true)}
            className="p-1 text-orbit-dim hover:text-orbit-white transition-colors"
            aria-label="Minimize"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-orbit-dim hover:text-orbit-white transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="overflow-y-auto flex-1">

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

        {/* Summary bar */}
        {data && (
          <div className="px-4 py-2.5 border-b border-space-border/50">
            <div className="flex items-center justify-between">
              <SummaryCount label="critical" value={data.summary.critical} color="text-red-400" />
              <SummaryCount label="high"     value={data.summary.high}     color="text-orange-400" />
              <SummaryCount label="moderate" value={data.summary.moderate} color="text-amber-400" />
              <SummaryCount label="low"      value={data.summary.low}      color="text-emerald-400" />
              <div className="h-6 w-px bg-space-border" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-semibold text-orbit-white tabular-nums">
                  {data.totals.orbitersTracked}
                </span>
                <span className="text-[9px] text-orbit-dim tracking-wider">TRACKED</span>
              </div>
            </div>
          </div>
        )}

        {/* Conjunction cards */}
        {data && (
          <div className="p-3 space-y-2">
            {data.risks.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                  <Shield size={14} className="text-emerald-400" />
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                    No high-compatibility pairs detected
                  </div>
                <div className="text-[10px] text-orbit-dim mt-1">
                  All tracked pairs within safe parameters
                </div>
              </div>
            ) : (
              <>
                <div className="text-[9px] text-orbit-dim tracking-widest mb-1">
                  TOP {data.risks.length} MONITORING PAIR{data.risks.length !== 1 ? 'S' : ''}
                </div>
                {data.risks.map(risk => (
                  <ConjunctionCard
                    key={risk.pairId}
                    risk={risk}
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
            Scores are NOT collision probabilities.
            Simplified Keplerian propagation · DERIVED/ESTIMATED data only.
            Refreshes every {REFRESH_INTERVAL_MS / 1000}s.
          </div>
        )}
      </div>
    </div>
  );
}
