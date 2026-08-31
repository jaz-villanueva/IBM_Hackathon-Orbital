// Core type definitions for ORBITAL AI Mission Atlas

import type { OrbitalParams } from './orbital-mechanics';

export type Destination = 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'deep-space';

export type MissionType =
  | 'orbiter'
  | 'rover'
  | 'lander'
  | 'crewed'
  | 'earth-observation'
  | 'science'
  | 'communications'
  | 'technology'
  | 'flyby';

export type MissionStatus =
  | 'active'
  | 'cruise'
  | 'science-operations'
  | 'surface-operations'
  | 'extended'
  | 'completed'
  | 'planned'
  | 'unknown';

export type DataSource = 'NASA' | 'CelesTrak' | 'SatNOGS' | 'ESA' | 'JAXA' | 'ISRO' | 'CNSA' | 'AI';

export type DataLabel = 'OBSERVED' | 'DERIVED' | 'AI' | 'ESTIMATED';

export interface DataPoint<T = string | number> {
  value: T;
  label: DataLabel;
  source: DataSource;
  sourceUrl?: string;
  lastUpdated?: string;
  notes?: string;
}

export interface OrbitalElements {
  noradId?: string;
  tleLine1?: string;
  tleLine2?: string;
  epoch?: string;
  inclination?: DataPoint<number>;     // degrees
  eccentricity?: DataPoint<number>;
  meanMotion?: DataPoint<number>;      // revs/day
  period?: DataPoint<number>;          // minutes
  altitude?: DataPoint<number>;        // km
  apoapsis?: DataPoint<number>;        // km
  periapsis?: DataPoint<number>;       // km
  source: DataSource;
  updatedAt: string;
}

export interface SpacecraftTransmitter {
  frequency?: number;      // MHz
  mode?: string;
  status?: string;
  source: 'SatNOGS' | 'NASA' | 'other';
}

export interface Spacecraft {
  id: string;
  missionId: string;
  name: string;
  type: 'capsule' | 'rover' | 'orbiter' | 'lander' | 'rocket' | 'station' | 'probe';
  description: string;
  imageUrl?: string;
  noradId?: string;
  orbitalElements?: OrbitalElements;
  transmitters?: SpacecraftTransmitter[];
  massKg?: DataPoint<number>;
  powerSource?: string;
  manufacturer?: string;
}

export interface MissionPhase {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
  isFuture?: boolean;
}

export interface MissionEvent {
  id: string;
  missionId: string;
  eventType: 'launch' | 'milestone' | 'science' | 'anomaly' | 'maneuver' | 'landing' | 'flyby';
  timestamp: string;
  title: string;
  description: string;
  source: DataSource;
  sourceUrl?: string;
}

export interface MissionImage {
  id: string;
  missionId?: string;
  spacecraftId?: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  date?: string;
  source: DataSource;
  sourceUrl?: string;
  description?: string;
  nasaId?: string;
}

export interface AIInsight {
  id: string;
  missionId: string;
  type: 'summary' | 'current-status' | 'significance' | 'explainer' | 'prediction';
  content: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: string;
  basedOn?: string[];  // data sources used
}

export interface Mission {
  id: string;
  name: string;
  shortName?: string;
  agency: string;
  agencies?: string[];
  destination: Destination;
  missionType: MissionType;
  status: MissionStatus;
  launchDate?: string;
  endDate?: string;
  description: string;
  objectives: string[];
  currentPhase?: MissionPhase;
  phases: MissionPhase[];
  spacecraft: Spacecraft[];
  events: MissionEvent[];
  images: MissionImage[];
  aiInsights?: AIInsight[];
  sourceUrl?: string;
  heroImageUrl?: string;
  thumbnailUrl?: string;
  // Positional data (where known from public sources)
  currentLocation?: {
    description: string;
    label: DataLabel;
    source: DataSource;
  };
  // For surface missions
  surfaceLocation?: {
    lat?: number;
    lon?: number;
    siteName?: string;
    label: DataLabel;
    source: DataSource;
  };
  tags?: string[];
}

export interface MissionPulse {
  destination: Destination;
  activeMissions: number;
  totalMissions: number;
  highlights: string[];
  missions: Mission[];
}

export interface GlobalPulse {
  mercury: MissionPulse;
  venus: MissionPulse;
  earth: MissionPulse;
  moon: MissionPulse;
  mars: MissionPulse;
  jupiter: MissionPulse;
  saturn: MissionPulse;
  uranus: MissionPulse;
  neptune: MissionPulse;
  lastUpdated: string;
}

export interface SearchResult {
  type: 'mission' | 'spacecraft' | 'event';
  mission: Mission;
  spacecraft?: Spacecraft;
  relevance: number;
  matchedOn: string;
}

// AI Analyst types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: DataSource[];
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Orbital risk context injected from the RiskHUD into the AI copilot.
 * These values come directly from lib/risk.ts — the AI must not recompute them.
 */
export interface OrbitalRiskContext {
  pairId: string;
  objectAName: string;
  objectBName: string;
  destination: string;
  objectAAltitudeKm: number;
  objectBAltitudeKm: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  compositeScore: number;
  orbitalCompatibilityScore: number;
  trajectoryRiskScore: number | null;
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

export interface AIContext {
  selectedMission?: Mission;
  selectedPlanet?: Destination;
  visibleMissions?: Mission[];
  /** Set when the user clicks "Analyze with AI" on a RiskHUD card. */
  selectedRisk?: OrbitalRiskContext;
  /** Set when the user opens the AI Analyst from a satellite detail page. */
  selectedSatellite?: SatelliteAIContext;
}

// ─── Satellite Explorer types ──────────────────────────────────────────────

/** Progressive-disclosure capability for what public observation data exists for a satellite. */
export type ObservationCapabilityType = 'LIVE_VIDEO' | 'NEAR_REAL_TIME' | 'RADIO' | 'NONE';

export interface ObservationCapability {
  type: ObservationCapabilityType;
  /** Human-readable source name, e.g. "NASA", "SatNOGS". */
  source?: string;
  /** Deep link to the official source (e.g. NASA's live stream page). */
  url?: string;
}

/** Static catalog metadata for a trackable satellite — not orbital data itself. */
export interface SatelliteCatalogEntry {
  /** Stable slug id, e.g. 'iss'. */
  id: string;
  name: string;
  shortName?: string;
  noradId: string;
  agency?: string;
  description: string;
  obsCapability: ObservationCapability;
  /** Set when this satellite corresponds to an existing Orbital Mission (e.g. 'iss'). */
  missionId?: string;
}

/** A single SatNOGS-style radio observation of a satellite pass. */
export interface SatelliteObservation {
  id: string;
  station: string;
  /** ISO-8601 timestamp of the observation. */
  time: string;
  frequencyHz: number;
  mode: string;
  signalDbm: number | null;
  status: 'good' | 'bad' | 'failed' | 'unknown';
  source: DataSource;
}

/** Full live orbital state for a satellite, assembled server-side from a CelesTrak GP fetch. */
export interface SatelliteOrbitalState {
  noradId: string;
  name: string;
  epoch: string;
  elements: {
    inclination: DataPoint<number>;
    eccentricity: DataPoint<number>;
    meanMotion: DataPoint<number>;
    raan: DataPoint<number>;
    argPerigee: DataPoint<number>;
  };
  derived: {
    altitudeKm: DataPoint<number>;
    periodMin: DataPoint<number>;
    velocityKmS: DataPoint<number>;
    apogeeKm: DataPoint<number>;
    perigeeKm: DataPoint<number>;
    position: { lat: number; lon: number; label: DataLabel; source: DataSource };
    groundTrack: Array<{ lat: number; lon: number }>;
  };
  /** OBSERVED when this came from a fresh live CelesTrak fetch, ESTIMATED when served from a stale cache/fallback. */
  dataQuality: DataLabel;
  fetchedAt: string;
  /** Present when dataQuality is ESTIMATED — explains why live data wasn't available. */
  fallbackReason?: string;
}

export type OrbitRegime = 'LEO' | 'MEO' | 'GEO';

/**
 * A satellite in the live Earth Mode fleet — assembled server-side by
 * lib/satellites/fleet.ts from a real CelesTrak group fetch. Carries both
 * catalog-shaped metadata and the derived quantities needed to render it
 * (orbitalParams for the 3D scene) and describe it (altitude/velocity/etc.
 * for the HUD), so the client never has to re-derive anything.
 */
export interface FleetSatelliteEntry {
  id: string;
  name: string;
  shortName?: string;
  agency?: string;
  noradId: string;
  orbitRegime: OrbitRegime;
  description: string;
  obsCapability: ObservationCapability;
  missionId?: string;
  orbitalParams: OrbitalParams;
  altitudeKm: number;
  velocityKmS: number;
  periodMin: number;
  inclinationDeg: number;
  dataQuality: DataLabel;
  /**
   * The full orbital state already computed while assembling the fleet —
   * carried through so the satellite detail panel can render a fleet
   * satellite immediately from this, instead of firing a second, separate
   * CelesTrak fetch on click (which in practice runs as an isolated route
   * with its own cache, so it can fail independently of the fleet fetch
   * that already succeeded).
   */
  orbitalState: SatelliteOrbitalState;
}

/** Flat, pre-computed satellite context injected into the AI copilot — mirrors OrbitalRiskContext. */
export interface SatelliteAIContext {
  noradId: string;
  name: string;
  altitudeKm: number;
  velocityKmS: number;
  periodMin: number;
  inclinationDeg: number;
  eccentricity: number;
  lat: number;
  lon: number;
  epoch: string;
  dataQuality: DataLabel;
  hasObservations: boolean;
  latestObservation?: {
    station: string;
    time: string;
    signalDbm: number | null;
    frequencyMHz: number;
    mode: string;
  };
  /** DERIVED heuristic flags (never AI-labeled — see lib/satellites/anomaly.ts). */
  anomalyFlags: string[];
}
