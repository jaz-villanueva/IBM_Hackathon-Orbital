/**
 * Chooses and builds the 3D marker used for a live satellite in Earth Mode.
 *
 * Reuses lib/spacecraft-geometry.ts's existing procedural builders (same
 * materials/aesthetic as the rest of Orbital's spacecraft) rather than
 * introducing a second model system. Classification is name-based pattern
 * matching over the real CelesTrak OBJECT_NAME — when uncertain, falls back
 * to the generic satellite model, never invents a satellite's actual type.
 */

import * as THREE from 'three';
import { buildSatellite, buildCommsSatellite, buildNavSatellite, buildISS } from '../spacecraft-geometry';

export type SatelliteMarkerType = 'generic' | 'comms' | 'nav' | 'station';

const MARKER_TYPE_LABEL: Record<SatelliteMarkerType, string> = {
  generic: 'Satellite',
  comms: 'Communications satellite',
  nav: 'GPS / navigation satellite',
  station: 'Space station',
};

/**
 * Classify a satellite's marker variant from its name. This is a display
 * heuristic only (which stylised model to draw) — it is never surfaced as
 * an authoritative classification of the spacecraft's actual mission.
 */
export function classifySatelliteMarkerType(name: string, isStation: boolean): SatelliteMarkerType {
  if (isStation) return 'station';
  const n = name.toUpperCase();
  if (/\bGPS\b|NAVSTAR|GLONASS|GALILEO|BEIDOU/.test(n)) return 'nav';
  if (/\bTDRS\b|INTELSAT|INMARSAT|EUTELSAT|COMSAT|SES-\d|GOES/.test(n)) return 'comms';
  return 'generic';
}

export function markerTypeLabel(type: SatelliteMarkerType): string {
  return MARKER_TYPE_LABEL[type];
}

/** Build the 3D marker group for a satellite. `scale` sets overall visual size. */
export function buildSatelliteMarker(type: SatelliteMarkerType, color: number, scale: number): THREE.Group {
  switch (type) {
    case 'nav':     return buildNavSatellite(scale, color);
    case 'comms':   return buildCommsSatellite(scale, color);
    case 'station': return buildISS(scale * 0.6); // ISS model is proportioned larger internally
    default:        return buildSatellite(scale, color);
  }
}
