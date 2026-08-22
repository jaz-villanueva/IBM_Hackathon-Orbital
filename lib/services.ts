/**
 * Data Services
 * 
 * Abstraction layer for fetching data from external sources.
 * In production, these functions call real APIs.
 * In development/demo, they use the seeded mission data.
 * 
 * External data source integration points:
 *   - CelesTrak: https://celestrak.org/SOCRATES/ and TLE data
 *   - SatNOGS: https://db.satnogs.org/api/
 *   - NASA APIs: https://api.nasa.gov/
 *   - NASA Images: https://images-api.nasa.gov/
 */

import { MISSIONS, getMissionsByDestination, getMissionById } from './missions';
import { Mission, Destination, GlobalPulse, MissionPulse } from './types';

// ─── CelesTrak Integration ────────────────────────────────────────────────────

/**
 * Fetch current TLE data for a satellite from CelesTrak.
 * @param noradId NORAD catalog number
 * 
 * In production, calls:
 *   https://celestrak.org/SOCRATES/query.php?CATNR={noradId}&DAYS=3&MAX=10&FORMAT=json
 *   or TLE: https://celestrak.org/satcat/query.php?CATNR={noradId}
 */
export async function fetchCelestrakData(noradId: string): Promise<{
  tleLine1?: string;
  tleLine2?: string;
  epoch?: string;
  name?: string;
} | null> {
  try {
    // In production: fetch from CelesTrak API
    // const response = await fetch(`https://celestrak.org/SOCRATES/query.php?CATNR=${noradId}&DAYS=3&MAX=10&FORMAT=json`);
    // return await response.json();
    
    // Demo: return mock data for known satellites
    const knownSats: Record<string, { name: string; tleLine1: string; tleLine2: string }> = {
      '25544': {
        name: 'ISS (ZARYA)',
        // These TLEs are illustrative examples — not real-time data
        tleLine1: '1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9994',
        tleLine2: '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391486800',
      },
    };
    
    return knownSats[noradId] || null;
  } catch {
    return null;
  }
}

// ─── SatNOGS Integration ──────────────────────────────────────────────────────

/**
 * Fetch satellite and transmitter data from SatNOGS DB.
 * @param noradId NORAD catalog number
 * 
 * In production, calls:
 *   https://db.satnogs.org/api/satellites/?norad_cat_id={noradId}
 *   https://db.satnogs.org/api/transmitters/?satellite__norad_cat_id={noradId}
 */
export async function fetchSatnogsData(noradId: string): Promise<{
  name?: string;
  transmitters?: Array<{ frequency: number; mode: string; status: string }>;
} | null> {
  try {
    // In production:
    // const response = await fetch(`https://db.satnogs.org/api/satellites/?norad_cat_id=${noradId}`, {
    //   headers: { 'Authorization': `Token ${process.env.SATNOGS_API_KEY}` }
    // });
    
    // Demo: return representative data
    if (noradId === '25544') {
      return {
        name: 'ISS',
        transmitters: [
          { frequency: 437.55, mode: 'FM', status: 'active' },
          { frequency: 145.8, mode: 'FM', status: 'active' },
        ],
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── NASA API Integration ─────────────────────────────────────────────────────

/**
 * Fetch images from NASA Image and Video Library.
 * @param query Search query (mission name, spacecraft, etc.)
 * @param count Number of results
 * 
 * In production, calls:
 *   https://images-api.nasa.gov/search?q={query}&media_type=image
 */
export async function fetchNasaImages(query: string, count: number = 5): Promise<Array<{
  url: string;
  title: string;
  date: string;
  description: string;
  nasaId: string;
}>> {
  try {
    // In production:
    // const response = await fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image&page_size=${count}`);
    // const data = await response.json();
    // return data.collection.items.map(...)
    
    // Demo: return empty to use seeded data
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch Mars rover photos from NASA Mars Rover Photos API.
 * @param rover 'perseverance' | 'curiosity'
 * @param sol Martian sol number (or 'latest')
 * 
 * In production, calls:
 *   https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/latest_photos?api_key={NASA_API_KEY}
 */
export async function fetchMarsRoverPhotos(
  rover: 'perseverance' | 'curiosity',
  sol: number | 'latest' = 'latest'
): Promise<Array<{
  url: string;
  title: string;
  date: string;
  camera: string;
  sol: number;
}>> {
  try {
    // In production:
    // const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    // const endpoint = sol === 'latest'
    //   ? `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=${apiKey}`
    //   : `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${sol}&api_key=${apiKey}`;
    // const response = await fetch(endpoint);
    // const data = await response.json();
    // return data.latest_photos?.slice(0, 12).map(...)
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch NASA APOD (Astronomy Picture of the Day).
 * 
 * In production, calls:
 *   https://api.nasa.gov/planetary/apod?api_key={NASA_API_KEY}
 */
export async function fetchNasaApod(): Promise<{
  url: string;
  title: string;
  explanation: string;
  date: string;
} | null> {
  try {
    // In production:
    // const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    // const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
    // return await response.json();
    return null;
  } catch {
    return null;
  }
}

// ─── Mission Data ─────────────────────────────────────────────────────────────

/**
 * Fetch normalized mission data.
 * Combines seeded data with any live API updates.
 */
export async function fetchNasaMissionData(missionId: string): Promise<Mission | null> {
  const mission = getMissionById(missionId);
  if (!mission) return null;

  // In production, augment with live data:
  // const liveData = await fetchLiveMissionStatus(missionId);
  // return mergeMissionData(mission, liveData);
  
  return mission;
}

export function normalizeMissionData(raw: Partial<Mission>): Mission | null {
  if (!raw.id || !raw.name || !raw.agency) return null;
  return {
    ...raw,
    phases: raw.phases || [],
    spacecraft: raw.spacecraft || [],
    events: raw.events || [],
    images: raw.images || [],
    objectives: raw.objectives || [],
  } as Mission;
}

export function normalizeOrbitalData(tle1: string, tle2: string) {
  // Parse TLE lines into orbital elements
  // TLE format: https://celestrak.org/IOD/tle-format.php
  try {
    const inclination = parseFloat(tle2.substring(8, 16));
    const eccentricity = parseFloat('0.' + tle2.substring(26, 33));
    const meanMotion = parseFloat(tle2.substring(52, 63));
    const period = 1440 / meanMotion; // minutes
    const mu = 398600.4418; // Earth's gravitational parameter km³/s²
    const n = meanMotion * 2 * Math.PI / 86400; // rad/s
    const a = Math.cbrt(mu / (n * n)); // semi-major axis km
    const altitude = a - 6371; // approximate altitude km

    return {
      inclination,
      eccentricity,
      meanMotion,
      period,
      altitude,
      source: 'CelesTrak' as const,
      label: 'DERIVED' as const,
    };
  } catch {
    return null;
  }
}

// ─── Global Pulse ─────────────────────────────────────────────────────────────

export function computeGlobalPulse(): GlobalPulse {
  const buildPulse = (dest: Destination): MissionPulse => {
    const missions = getMissionsByDestination(dest);
    const active = missions.filter((m) =>
      ['active', 'science-operations', 'surface-operations', 'extended', 'cruise'].includes(m.status)
    );

    const highlights: string[] = [];
    if (dest === 'mars') {
      const rovers = missions.filter((m) => m.missionType === 'rover' && m.status !== 'completed');
      if (rovers.length >= 2) {
        highlights.push(`${rovers.length} rovers currently active on the Martian surface.`);
      }
      highlights.push('Multiple orbiters conducting atmospheric science and surface relay.');
    }
    if (dest === 'moon') {
      const crewed = missions.filter((m) => m.missionType === 'crewed');
      if (crewed.some((m) => m.status === 'planned')) {
        highlights.push('Artemis II crewed lunar flyby targeted for 2025.');
      }
      highlights.push('LRO continues detailed polar mapping after 15+ years in orbit.');
    }
    if (dest === 'earth') {
      highlights.push('ISS maintains continuous crewed presence in low Earth orbit.');
      highlights.push('Multiple Earth observation satellites tracking climate change.');
    }

    return {
      destination: dest,
      activeMissions: active.length,
      totalMissions: missions.length,
      highlights,
      missions,
    };
  };

  return {
    earth: buildPulse('earth'),
    moon: buildPulse('moon'),
    mars: buildPulse('mars'),
    lastUpdated: new Date().toISOString(),
  };
}
