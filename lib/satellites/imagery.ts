/**
 * Real satellite imagery for the "WHAT DOES IT LOOK LIKE?" panel section.
 *
 * EDUCATIONAL DATA, not live/derived data — this never changes based on the
 * satellite's current orbital state. Keyed by NORAD catalog number, with a
 * name-pattern fallback for satellite classes (matches lib/satellites/
 * education.ts's approach) so common families (GPS, NOAA, GOES) get an
 * honestly-labeled representative image instead of nothing.
 *
 * DATA INTEGRITY RULES:
 * - Every URL below was verified to actually load (HTTP 200) before being
 *   added here — none are guessed.
 * - `isRepresentative: true` means the image shows the satellite's design/
 *   class, not the exact confirmed spacecraft (e.g. an "artist's impression"
 *   of a GPS Block IIR, used for any Block IIR/IIF/III satellite in the
 *   fleet — there is no public photo of each individual GPS satellite in
 *   orbit). `isRepresentative: false`/omitted means the image is confirmed
 *   to depict this exact spacecraft.
 * - No entry exists for a satellite without a real, verified source — the
 *   component falls back to an honest "image unavailable" state rather than
 *   showing an unrelated stock photo.
 *
 * Sources: NASA (images-assets.nasa.gov, public domain / US government
 * work), Wikimedia Commons (public domain, credited).
 */

export interface SatelliteImageInfo {
  url: string;
  source: string;
  /** Shown only when the source's license/attribution terms call for it. */
  attribution?: string;
  isRepresentative?: boolean;
  alt: string;
}

export const SATELLITE_IMAGES: Record<string, SatelliteImageInfo> = {
  // International Space Station
  '25544': {
    url: 'https://images-assets.nasa.gov/image/0701328/0701328~orig.jpg',
    source: 'NASA',
    alt: 'The International Space Station photographed in orbit',
  },
  // Terra (EOS AM-1)
  '25994': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/TERRA_am1.jpg',
    source: 'Wikimedia Commons',
    alt: 'The Terra (EOS AM-1) spacecraft',
  },
  // Aqua
  '27424': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Aqua_Spacecraft_Configuration.jpg',
    source: 'Wikimedia Commons',
    alt: 'The Aqua spacecraft configuration',
  },
  // Landsat 9
  '49260': {
    url: 'https://images-assets.nasa.gov/image/KSC-20210811-PH-RNB01_0028/KSC-20210811-PH-RNB01_0028~orig.jpg',
    source: 'NASA',
    alt: 'The Landsat 9 spacecraft during launch preparations',
  },
  // NOAA-20 (JPSS-1)
  '43013': {
    url: 'https://images-assets.nasa.gov/image/VAFB-20171024-PH_BEV01_0010/VAFB-20171024-PH_BEV01_0010~thumb.jpg',
    source: 'NASA',
    alt: 'The NOAA-20 (JPSS-1) spacecraft before launch',
  },
  // GOES-16 — GOES-U shown as representative (same GOES-R series design)
  '41866': {
    url: 'https://images-assets.nasa.gov/image/KSC-20240124-PH-JBS01_0102/KSC-20240124-PH-JBS01_0102~orig.jpg',
    source: 'NASA',
    isRepresentative: true,
    alt: 'A GOES-R series weather satellite, the same design as GOES-16',
  },
};

/**
 * Class-level fallback for satellites without a curated NORAD-keyed entry —
 * matched by name pattern, same technique as
 * lib/satellites/education.ts#getEducationProfile. Always representative.
 */
function classImage(name: string): SatelliteImageInfo | null {
  const n = name.toUpperCase();
  if (/\bGPS\b|NAVSTAR/.test(n)) {
    return {
      url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/GPS-IIR.jpg',
      source: 'Wikimedia Commons (US Government)',
      isRepresentative: true,
      alt: "Artist's impression of a GPS Block IIR satellite in orbit",
    };
  }
  if (/\bNOAA[\s-]?\d+/.test(n)) {
    return {
      url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/NOAA-L_satellite_tilted_in_Vandenberg_AFB_clean_room.jpg',
      source: 'Wikimedia Commons (NOAA/NASA)',
      isRepresentative: true,
      alt: 'A NOAA polar-orbiting weather satellite of the same series',
    };
  }
  if (/\bGOES[\s-]?\d+/.test(n)) {
    return {
      url: 'https://images-assets.nasa.gov/image/KSC-20240124-PH-JBS01_0102/KSC-20240124-PH-JBS01_0102~orig.jpg',
      source: 'NASA',
      isRepresentative: true,
      alt: 'A GOES-R series geostationary weather satellite',
    };
  }
  return null;
}

/** Look up a satellite's image: exact NORAD match first, then satellite-class fallback, else null. */
export function getSatelliteImage(noradId: string, name: string): SatelliteImageInfo | null {
  return SATELLITE_IMAGES[noradId] ?? classImage(name);
}
