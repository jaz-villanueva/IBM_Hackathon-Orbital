// Core type definitions for ORBITAL AI Mission Atlas

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
}
