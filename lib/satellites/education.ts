/**
 * Educational profiles for satellites shown in Earth Mode.
 *
 * Keyed by NORAD catalog number (string).
 *
 * DATA INTEGRITY RULES:
 * - All facts must come from authoritative sources (NASA, NOAA, ESA, CelesTrak, official mission pages).
 * - Never invent or embellish facts.
 * - didYouKnow must be factual and verifiable.
 * - didYouKnowSource should cite the source (e.g. "NASA").
 * - Satellites without a curated profile will use generic descriptions from their catalog entry.
 *
 * Sources used:
 *   NASA: https://www.nasa.gov/
 *   NASA Space Place: https://spaceplace.nasa.gov/
 *   NOAA: https://www.noaa.gov/
 *   ESA: https://www.esa.int/
 *   CelesTrak: https://celestrak.org/ (orbital data only)
 */

export interface SatelliteEducationProfile {
  /** Short descriptive category shown under the satellite name */
  category: string;
  /** One-sentence tagline shown in italics */
  tagline?: string;
  /** Plain-language description of what this spacecraft is */
  description: string;
  /** Why this satellite matters to everyday life */
  whyItMatters?: string;
  /** A single genuinely interesting, verifiable fact */
  didYouKnow?: string;
  /** Source for the Did You Know fact */
  didYouKnowSource?: string;
}

/**
 * Map from NORAD catalog number (string) → education profile.
 * GPS NAVSTAR satellites share a common profile by prefix matching in getEducationProfile().
 */
export const SATELLITE_EDUCATION: Record<string, SatelliteEducationProfile> = {

  // ── International Space Station ─────────────────────────────────────────────
  '25544': {
    category: 'Human Spaceflight · NASA / Roscosmos / ESA / JAXA / CSA',
    tagline: "Humanity's laboratory in orbit",
    description:
      'The International Space Station is a large spacecraft where astronauts live and work in orbit about 400 km above Earth. It has been continuously occupied since November 2000 — making it the longest continuously inhabited place in space.',
    whyItMatters:
      'The ISS gives scientists a unique laboratory where experiments can be conducted in microgravity — conditions impossible to reproduce on Earth. Research there helps us understand human health, materials science, and biology in ways that benefit people back on the ground.',
    didYouKnow:
      'The ISS travels so fast — about 28,000 km/h — that it experiences roughly 16 sunrises and sunsets every single day.',
    didYouKnowSource: 'NASA',
  },

  // ── Terra (EOS AM-1) ────────────────────────────────────────────────────────
  '25994': {
    category: 'Earth Observation · NASA',
    tagline: "Watching over our planet since 1999",
    description:
      'Terra is a NASA Earth-observing satellite that studies how Earth\'s land, oceans, atmosphere, and life interact with each other. It carries five scientific instruments that collect data across multiple wavelengths.',
    whyItMatters:
      'Terra helps scientists monitor deforestation, track wildfires, study ocean temperatures, and understand long-term climate trends. Its data is freely available to researchers worldwide.',
    didYouKnow:
      'Terra\'s MODIS instrument captures a nearly complete image of the entire Earth\'s surface every 1 to 2 days.',
    didYouKnowSource: 'NASA',
  },

  // ── Aqua ────────────────────────────────────────────────────────────────────
  '27424': {
    category: 'Earth Observation · NASA',
    tagline: "Studying Earth's water from above",
    description:
      'Aqua is a NASA Earth-observation satellite focused on studying water in all its forms — evaporation, precipitation, sea ice, snowcover, soil moisture, and ocean temperatures.',
    whyItMatters:
      'Understanding Earth\'s water cycle is essential for weather forecasting, predicting floods and droughts, and studying how climate change affects fresh water around the world.',
    didYouKnow:
      'Aqua was one of the first satellites to directly measure global sea surface temperatures with the precision needed to track ocean warming trends.',
    didYouKnowSource: 'NASA',
  },

  // ── Landsat 9 ───────────────────────────────────────────────────────────────
  '49260': {
    category: 'Earth Observation · NASA / USGS',
    tagline: "50+ years of watching Earth change",
    description:
      'Landsat 9 is the latest satellite in the world\'s longest-running Earth observation program. It photographs Earth\'s land surfaces in high resolution, continuing a record that stretches back to 1972.',
    whyItMatters:
      'The Landsat archive is one of science\'s most valuable datasets. It lets scientists compare how forests, farmland, cities, glaciers, and coastlines have changed over more than five decades.',
    didYouKnow:
      'Landsat 9 images the same spot on Earth every 16 days, and all of its imagery is freely available to anyone in the world through the USGS.',
    didYouKnowSource: 'USGS',
  },

  // ── NOAA-20 (JPSS-1) ────────────────────────────────────────────────────────
  '43013': {
    category: 'Weather Satellite · NOAA / NASA',
    tagline: "Improving your weather forecast from above",
    description:
      'NOAA-20 is a polar-orbiting weather satellite operated by the National Oceanic and Atmospheric Administration. It orbits from pole to pole and scans the entire globe twice daily.',
    whyItMatters:
      'NOAA-20 provides critical data that feeds into numerical weather prediction models, directly improving the accuracy of weather forecasts — especially for severe storm warnings up to a week in advance.',
    didYouKnow:
      'Polar-orbiting weather satellites like NOAA-20 provide about 84% of the data that goes into global weather forecast models.',
    didYouKnowSource: 'NOAA',
  },

  // ── NOAA-18 ─────────────────────────────────────────────────────────────────
  '28654': {
    category: 'Weather Satellite · NOAA',
    tagline: "A veteran weather watcher in orbit",
    description:
      'NOAA-18 is a polar-orbiting weather satellite that has been providing atmospheric and surface data to forecasters since 2005. It is part of NOAA\'s Polar Operational Environmental Satellites program.',
    whyItMatters:
      'Even older weather satellites like NOAA-18 continue to contribute useful atmospheric temperature and moisture profiles that improve weather forecasts.',
    didYouKnow:
      'NOAA-18 orbits Earth about 14 times per day, scanning atmospheric temperatures and humidity levels that help meteorologists predict weather patterns.',
    didYouKnowSource: 'NOAA',
  },

  // ── GOES-16 ─────────────────────────────────────────────────────────────────
  '41866': {
    category: 'Geostationary Weather Satellite · NOAA',
    tagline: "Always watching the Americas",
    description:
      'GOES-16 (also called GOES-East) is a geostationary weather satellite positioned 35,786 km above the equator. From this fixed spot, it continuously watches weather patterns across North and South America.',
    whyItMatters:
      'GOES-16 provides the real-time imagery you see in weather apps and on TV forecasts. It tracks hurricane development, monitors severe thunderstorms, and images Earth every 30 seconds during extreme events.',
    didYouKnow:
      'Because GOES-16 orbits at exactly the right altitude to match Earth\'s rotation, it appears to hover completely stationary above the same point on the equator all day, every day.',
    didYouKnowSource: 'NOAA',
  },
};

/**
 * Look up an education profile by NORAD ID, with pattern-based fallbacks
 * for satellite classes that share a common profile (e.g. GPS NAVSTAR).
 */
export function getEducationProfile(noradId: string, name: string): SatelliteEducationProfile | null {
  // Direct NORAD ID match first
  if (SATELLITE_EDUCATION[noradId]) return SATELLITE_EDUCATION[noradId];

  // Pattern match on satellite name for recognizable classes
  const upper = name.toUpperCase();

  if (/NAVSTAR|GPS\s+(?:BLOCK|IIF|IIR|III)/.test(upper)) {
    return {
      category: 'GPS / Navigation Satellite · U.S. Space Force',
      tagline: "Helping the world know where it is",
      description:
        'This is one of the GPS satellites that form the Global Positioning System — a constellation of navigation satellites operated by the U.S. Space Force. Together, roughly 31 active GPS satellites orbit Earth at about 20,200 km altitude.',
      whyItMatters:
        'GPS satellites enable navigation on smartphones, in cars, ships, and aircraft — and provide the precise timing that modern telecommunications, financial systems, and power grids depend on.',
      didYouKnow:
        'GPS satellites don\'t actually know where you are — your receiver calculates its own position by measuring tiny timing differences between signals from multiple satellites simultaneously.',
      didYouKnowSource: 'NASA',
    };
  }

  if (/GLONASS/.test(upper)) {
    return {
      category: 'Navigation Satellite · Roscosmos',
      description:
        'This is a GLONASS satellite — part of Russia\'s Global Navigation Satellite System, which serves a similar purpose to GPS and provides positioning and timing services across the globe.',
      didYouKnow:
        'Most modern smartphones use both GPS and GLONASS signals simultaneously for faster, more accurate positioning.',
      didYouKnowSource: 'ESA',
    };
  }

  if (/GALILEO/.test(upper)) {
    return {
      category: 'Navigation Satellite · ESA / European Union',
      tagline: "Europe's own GPS",
      description:
        "Galileo is Europe's own satellite navigation system, operated by the European Union. It provides precise positioning services and is independent of GPS, giving Europe its own capability.",
      whyItMatters:
        'Galileo provides higher accuracy positioning than GPS alone, and most modern phones use both systems simultaneously.',
      didYouKnow:
        'Galileo is the only civilian-controlled global satellite navigation system — unlike GPS which is run by the U.S. military.',
      didYouKnowSource: 'ESA',
    };
  }

  if (/NOAA[\s-]\d+/.test(upper)) {
    return {
      category: 'Weather Satellite · NOAA',
      description:
        'This is a NOAA polar-orbiting weather satellite, circling Earth from pole to pole and scanning the entire planet twice daily for atmospheric temperature, humidity, and surface data.',
      whyItMatters:
        'NOAA weather satellites provide essential data that powers weather forecasts — especially for regions far from weather stations like the open ocean and polar areas.',
      didYouKnow:
        'Polar-orbiting weather satellites provide the majority of data used by global weather forecast models.',
      didYouKnowSource: 'NOAA',
    };
  }

  if (/ISS/.test(upper) || /ZARYA|ZVEZDA|NAUKA/.test(upper)) {
    return SATELLITE_EDUCATION['25544'];
  }

  return null;
}
