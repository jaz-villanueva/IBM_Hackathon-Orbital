/**
 * lib/satellites/education.ts
 *
 * Curated educational profiles for well-known satellites.
 *
 * Philosophy:
 *  - Every statement in this file is sourced from an authoritative public source.
 *  - No facts are invented. If unsure, we use only what can be derived from orbital data.
 *  - Fun facts must be accurate and specific to the actual satellite.
 *  - Sources are listed per profile so provenance is transparent.
 *
 * Sources used:
 *  - NASA mission pages:  https://www.nasa.gov
 *  - NASA Space Place:    https://spaceplace.nasa.gov
 *  - NOAA:                https://www.noaa.gov / https://www.nesdis.noaa.gov
 *  - USGS Landsat:        https://landsat.usgs.gov
 *  - ESA:                 https://www.esa.int
 *  - CelesTrak:           https://celestrak.org  (orbital elements only)
 *  - EUMETSAT:            https://www.eumetsat.int
 *
 * For satellites without a curated profile, a conservative generic profile
 * is generated from the satellite's name, NORAD ID, and live orbital data.
 * Generic profiles never invent mission details.
 */

export interface SatelliteEducationProfile {
  /** Short category label, shown under the satellite name. */
  category: string;

  /** One-sentence tagline shown prominently under the name. */
  tagline: string;

  /**
   * Plain-language answer to "What is it?"
   * 1–3 sentences. No jargon. Appropriate for a 12-year-old.
   */
  whatIsIt: string;

  /**
   * Plain-language answer to "What does it do?"
   * 1–3 sentences.
   */
  whatDoesItDo: string;

  /**
   * Answer to "Why does it matter?" — the human-relevance hook.
   * 1–3 sentences.
   */
  whyItMatters: string;

  /**
   * One specific, verified, interesting fact about this satellite.
   * Must be factual and sourced. Not generic. Not invented.
   */
  didYouKnow: string;

  /**
   * Optional: additional context / unique detail.
   * Used when there is something especially notable.
   */
  extraNote?: string;

  /**
   * Authoritative source(s) for the educational content.
   * Displayed as a small attribution at the bottom.
   */
  sources: string[];
}

// ─── Curated profiles ─────────────────────────────────────────────────────────

const PROFILES: Record<string, SatelliteEducationProfile> = {

  // ── International Space Station ────────────────────────────────────────────
  // Sources: NASA ISS Program (nasa.gov/international-space-station),
  //          NASA Space Station Facts (nasa.gov)
  iss: {
    category: 'SPACE STATION · HUMAN SPACEFLIGHT',
    tagline: "Humanity's laboratory in orbit",
    whatIsIt:
      'The International Space Station (ISS) is a large spacecraft where astronauts live and work while orbiting Earth. It is about the size of a football field and has been continuously occupied since November 2, 2000.',
    whatDoesItDo:
      'Crew members aboard the ISS conduct experiments in biology, physics, astronomy, meteorology, and materials science — research that can only be done in the microgravity environment of space. The station also serves as a testbed for technology needed for future deep-space missions.',
    whyItMatters:
      'The ISS gives scientists a unique laboratory in space where experiments that cannot be done on Earth are carried out every day. Discoveries from the station have improved our understanding of the human body, created new materials, and advanced medical research.',
    didYouKnow:
      'Because the ISS orbits Earth roughly every 90 minutes, the crew experiences about 16 sunrises and 16 sunsets every single day.',
    extraNote:
      'The ISS is a collaboration between NASA (USA), Roscosmos (Russia), ESA (Europe), JAXA (Japan), and CSA (Canada) — one of the largest international scientific partnerships in history.',
    sources: ['NASA International Space Station', 'nasa.gov/international-space-station'],
  },

  // ── Terra (EOS AM-1) ───────────────────────────────────────────────────────
  // Sources: NASA Terra mission (terra.nasa.gov), NASA Earthdata
  terra: {
    category: 'EARTH OBSERVATION · CLIMATE SCIENCE',
    tagline: "Earth's eyes on land, ocean, and atmosphere",
    whatIsIt:
      'Terra is a NASA satellite that has been observing Earth continuously since December 1999. It carries five scientific instruments designed to study the entire Earth system — land surfaces, oceans, and the atmosphere.',
    whatDoesItDo:
      'Terra monitors global changes such as deforestation, snow and ice cover, ocean surface temperatures, the health of crops and forests, and how much of the Sun\'s energy Earth reflects back to space. Scientists around the world use its data every day.',
    whyItMatters:
      'Over 20 years of Terra data give scientists a long-term record of how our planet is changing. This helps researchers understand climate trends, track the impacts of extreme weather, and improve models for the future.',
    didYouKnow:
      'Terra\'s MODIS instrument captures a complete image of the entire surface of Earth every one to two days, producing a continuous global view of our planet that has been running for over two decades.',
    sources: ['NASA Terra mission', 'terra.nasa.gov', 'earthdata.nasa.gov'],
  },

  // ── Aqua ───────────────────────────────────────────────────────────────────
  // Sources: NASA Aqua mission (aqua.nasa.gov)
  aqua: {
    category: 'EARTH OBSERVATION · WATER CYCLE',
    tagline: "Tracking Earth's water from space",
    whatIsIt:
      'Aqua is a NASA Earth-observing satellite launched in May 2002. Its name means "water" in Latin — it was built specifically to study the role of water in Earth\'s climate system.',
    whatDoesItDo:
      'Aqua measures the movement of water through the atmosphere, land, and oceans. It tracks ocean surface temperatures, sea ice, evaporation, precipitation, and soil moisture — all the pieces of Earth\'s global water cycle.',
    whyItMatters:
      'Understanding the water cycle is essential for tracking climate change, forecasting weather, managing freshwater supplies, and studying how the oceans affect global temperatures.',
    didYouKnow:
      'Aqua is part of the NASA "A-Train" — a constellation of satellites that fly in close formation and cross the equator within minutes of each other, allowing different instruments to observe the same location almost simultaneously.',
    sources: ['NASA Aqua mission', 'aqua.nasa.gov'],
  },

  // ── Landsat 9 ──────────────────────────────────────────────────────────────
  // Sources: USGS Landsat (landsat.usgs.gov), NASA Landsat 9
  'landsat-9': {
    category: 'EARTH OBSERVATION · LAND IMAGING',
    tagline: "50 years of watching Earth change",
    whatIsIt:
      'Landsat 9 is the latest satellite in the longest-running continuous land-imaging program in history. The Landsat program has been photographing Earth\'s land surface from space since 1972 — over 50 years of uninterrupted data.',
    whatDoesItDo:
      'Landsat 9 photographs every piece of Earth\'s land surface every 16 days, creating detailed images used by farmers, foresters, geologists, city planners, and climate scientists.',
    whyItMatters:
      'Landsat images help farmers manage crops more efficiently, allow scientists to track deforestation and glacier retreat, and help emergency responders map damage from wildfires and floods. The entire archive of Landsat images is freely available to anyone in the world.',
    didYouKnow:
      'The Landsat archive is one of the largest collections of remotely sensed land data in the world. When the full archive was made free to the public in 2008, researchers worldwide downloaded over one million images in the first year alone.',
    sources: ['USGS Landsat program', 'landsat.usgs.gov', 'NASA Landsat 9'],
  },

  // ── NOAA-20 (JPSS-1) ──────────────────────────────────────────────────────
  // Sources: NOAA JPSS (nesdis.noaa.gov), NASA JPSS-1
  'noaa-20': {
    category: 'WEATHER SATELLITE · POLAR ORBIT',
    tagline: "Daily global weather from pole to pole",
    whatIsIt:
      'NOAA-20 (also called JPSS-1) is a polar-orbiting weather satellite operated by the US National Oceanic and Atmospheric Administration (NOAA). It circles Earth from pole to pole, building up a complete global picture of the atmosphere every day.',
    whatDoesItDo:
      'NOAA-20 carries instruments that measure temperature, moisture, clouds, sea surface conditions, snow cover, and other atmospheric properties. This data feeds directly into the weather forecasts millions of people check every day.',
    whyItMatters:
      'Polar-orbiting weather satellites like NOAA-20 are essential for hurricane tracking, severe storm warnings, and accurate multi-day weather forecasts. They observe the entire planet every day, including remote areas where ground-based weather stations do not exist.',
    didYouKnow:
      'NOAA-20\'s instruments can detect temperature differences in the atmosphere smaller than 1°C at multiple altitude levels simultaneously — giving forecasters a detailed three-dimensional picture of the atmosphere around the globe.',
    sources: ['NOAA JPSS program', 'nesdis.noaa.gov', 'NASA JPSS-1'],
  },

  // ── NOAA-18 ───────────────────────────────────────────────────────────────
  // Sources: NOAA POES program (noaa.gov)
  'noaa-18': {
    category: 'WEATHER SATELLITE · POLAR ORBIT',
    tagline: "A veteran weather watcher in polar orbit",
    whatIsIt:
      'NOAA-18 is a polar-orbiting weather satellite launched in 2005 as part of NOAA\'s long-running Polar Operational Environmental Satellites (POES) program. It has been continuously monitoring Earth\'s atmosphere and surface for nearly two decades.',
    whatDoesItDo:
      'Like other NOAA polar satellites, NOAA-18 measures atmospheric temperature, humidity, clouds, sea surface temperatures, and sea ice — providing global coverage every day.',
    whyItMatters:
      'NOAA-18\'s data is ingested into weather forecast models used around the world. Even after decades of operation, its measurements continue to improve the accuracy of weather predictions.',
    didYouKnow:
      'NOAA-18 transmits weather data using the Automatic Picture Transmission (APT) system, which operates at a radio frequency that anyone with a simple antenna and software-defined radio receiver can pick up — amateur radio enthusiasts regularly decode real weather images directly from the satellite.',
    sources: ['NOAA POES program', 'noaa.gov/satellites'],
  },

  // ── GOES-16 ───────────────────────────────────────────────────────────────
  // Sources: NOAA GOES-R series (goes.noaa.gov)
  'goes-16': {
    category: 'WEATHER SATELLITE · GEOSTATIONARY',
    tagline: "Watching weather over the Americas around the clock",
    whatIsIt:
      'GOES-16 is a geostationary weather satellite operated by NOAA. "Geostationary" means it orbits at exactly the same speed Earth rotates, so it stays fixed above one spot over the Americas — giving a continuous, real-time view of the same region.',
    whatDoesItDo:
      'GOES-16 captures full-disk images of the Western Hemisphere every 15 minutes (and targeted areas every 30 seconds during storms). It monitors hurricanes, thunderstorms, fires, floods, fog, and volcanic eruptions.',
    whyItMatters:
      'GOES-16 is the primary source of satellite imagery used by US weather forecasters. Its rapid scanning capability gives meteorologists an almost live view of developing severe weather, helping save lives through earlier and more accurate warnings.',
    didYouKnow:
      'GOES-16 orbits about 35,786 km above Earth — so far out that it can see an entire hemisphere in a single image. At this altitude, it takes exactly 24 hours to complete one orbit, keeping it fixed over the same spot on Earth.',
    sources: ['NOAA GOES-R Series program', 'goes.noaa.gov', 'nesdis.noaa.gov'],
  },

  // ── GOES-18 ───────────────────────────────────────────────────────────────
  // Sources: NOAA GOES-R series (goes.noaa.gov)
  'goes-18': {
    category: 'WEATHER SATELLITE · GEOSTATIONARY',
    tagline: "Watching the Pacific and western US from high orbit",
    whatIsIt:
      'GOES-18 is NOAA\'s operational geostationary weather satellite covering the western United States and the Pacific Ocean. It operates from a fixed position approximately 35,786 km above the equator.',
    whatDoesItDo:
      'GOES-18 provides continuous imagery of weather systems forming in the Pacific before they reach North America, giving forecasters advance notice of approaching storms. It also monitors wildfires across the American West.',
    whyItMatters:
      'Because Pacific storms can reach the US West Coast with little warning if not detected early, GOES-18\'s watch over the Pacific is critical for disaster preparedness and weather warning systems.',
    didYouKnow:
      'GOES-18 carries the same advanced imager as GOES-16, which can observe 16 spectral bands at once — from visible light to infrared — allowing meteorologists to see cloud heights, fire temperatures, smoke plumes, and wind patterns all at the same time.',
    sources: ['NOAA GOES-R Series program', 'goes.noaa.gov'],
  },

  // ── Sentinel-6A ───────────────────────────────────────────────────────────
  // Sources: ESA Sentinel-6 (esa.int), Copernicus programme, NASA/NOAA partners
  'sentinel-6a': {
    category: 'OCEAN ALTIMETRY · SEA LEVEL',
    tagline: "Measuring Earth's rising seas to the centimetre",
    whatIsIt:
      'Sentinel-6A (also called Michael Freilich, named after the former director of NASA\'s Earth Science Division) is a satellite built to measure sea levels with extraordinary precision. It is a joint mission involving ESA, EUMETSAT, the European Commission, NASA, and NOAA.',
    whatDoesItDo:
      'Sentinel-6A uses radar altimetry — bouncing radio pulses off the ocean surface and timing their return — to map sea surface height across the globe. It measures ocean levels to within a few centimetres.',
    whyItMatters:
      'Global sea levels are rising due to climate change. Sentinel-6A gives scientists the most accurate continuous record of this rise, which is essential for assessing flood risk for coastal cities, islands, and the billions of people who live near the sea.',
    didYouKnow:
      'Sentinel-6A continues a continuous sea-level record that stretches back to 1992, begun by the TOPEX/Poseidon mission. This 30+ year record is one of the most important datasets in climate science.',
    sources: ['ESA Sentinel-6', 'esa.int/Applications/Observing_the_Earth/Copernicus', 'NASA'],
  },

  // ── NOAA-21 (JPSS-2) ──────────────────────────────────────────────────────
  // Sources: NOAA JPSS-2 (nesdis.noaa.gov), NASA JPSS-2 launch 2022
  'noaa-21': {
    category: 'WEATHER SATELLITE · POLAR ORBIT',
    tagline: "The newest generation of global weather eyes",
    whatIsIt:
      'NOAA-21 (also known as JPSS-2) is the latest in NOAA\'s Joint Polar Satellite System series, launched in November 2022. It represents the newest generation of American polar-orbiting weather satellites.',
    whatDoesItDo:
      'NOAA-21 carries five scientific instruments that measure atmospheric temperature and moisture profiles, cloud properties, sea surface temperatures, ozone levels, and land surface conditions — covering the entire planet every day.',
    whyItMatters:
      'Polar-orbiting weather satellites are the backbone of global weather forecasting. NOAA-21\'s improved instruments provide higher resolution data, leading to more accurate forecasts and earlier warnings for extreme weather events like hurricanes.',
    didYouKnow:
      'NOAA-21\'s primary instrument — the VIIRS imager — produces stunning true-color images of Earth at 375-metre resolution, sharp enough to see individual large storm cells, wildfire smoke plumes, and even river deltas from space.',
    sources: ['NOAA JPSS-2 program', 'nesdis.noaa.gov', 'NASA JPSS-2'],
  },

  // ── Suomi NPP ─────────────────────────────────────────────────────────────
  // Sources: NASA/NOAA Suomi NPP (npp.gsfc.nasa.gov), NESDIS
  'suomi-npp': {
    category: 'EARTH OBSERVATION · ENVIRONMENTAL MONITORING',
    tagline: "A bridge between two eras of Earth observation",
    whatIsIt:
      'Suomi NPP is a joint NASA/NOAA satellite launched in October 2011. Named after meteorologist Verner Suomi, it was designed as a bridge between older weather satellites and the modern JPSS series.',
    whatDoesItDo:
      'Suomi NPP carries five instruments monitoring vegetation, sea and land surface temperatures, ocean colour, ozone levels, clouds, and aerosols. It also carries the first operational Day/Night Band sensor, which can image Earth at night using moonlight and city lights.',
    whyItMatters:
      'Suomi NPP has been providing critical continuity of Earth observation data between satellite generations, ensuring researchers and forecasters have an unbroken stream of global measurements.',
    didYouKnow:
      'Suomi NPP\'s Day/Night Band sensor creates striking images of Earth at night — revealing the patterns of city lights, gas flares, fires, and moonlit clouds. These "night lights" images have become one of the most iconic views of human civilization from space.',
    sources: ['NASA Suomi NPP', 'nesdis.noaa.gov', 'npp.gsfc.nasa.gov'],
  },
};

// ─── Category patterns for unknown satellites ─────────────────────────────────

/**
 * Infers a satellite category from its name.
 * Used only as a display hint — never as an authoritative mission classification.
 */
function inferCategory(name: string): string {
  const n = name.toUpperCase();
  if (/\bISS\b|SPACE STATION|ZARYA|ZVEZDA|UNITY|DESTINY/.test(n)) return 'SPACE STATION';
  if (/\bGPS\b|NAVSTAR|GLONASS|GALILEO|BEIDOU|COMPASS/.test(n)) return 'NAVIGATION SATELLITE';
  if (/\bGOES\b|METEOSAT|HIMAWARI|MTSAT|MSG/.test(n)) return 'WEATHER SATELLITE · GEOSTATIONARY';
  if (/\bNOAA\b|METOP|JPSS|SUOMI|NPP|DMSP|POES/.test(n)) return 'WEATHER SATELLITE · POLAR ORBIT';
  if (/\bSTARLINK\b/.test(n)) return 'COMMUNICATIONS SATELLITE · CONSTELLATION';
  if (/\bONEWEB\b/.test(n)) return 'COMMUNICATIONS SATELLITE · CONSTELLATION';
  if (/\bINTELSAT\b|INMARSAT|EUTELSAT|SES-\d|COMSAT/.test(n)) return 'COMMUNICATIONS SATELLITE';
  if (/\bTDRS\b/.test(n)) return 'RELAY SATELLITE';
  if (/\bLANDSAT\b|SENTINEL|SPOT-|PLEIADES|WORLDVIEW|GEOEYE/.test(n)) return 'EARTH OBSERVATION SATELLITE';
  if (/\bTERRA\b|AQUA\b|AURA\b/.test(n)) return 'EARTH OBSERVATION SATELLITE';
  if (/\bHUBBLE\b|HST\b/.test(n)) return 'SPACE TELESCOPE';
  if (/\bCHANDRA\b/.test(n)) return 'SPACE TELESCOPE';
  return 'SATELLITE';
}

/**
 * Infers what a satellite likely does, based only on its name pattern.
 * Deliberately conservative — returns generic text for unknown satellites.
 */
function inferWhatItDoes(name: string): string {
  const n = name.toUpperCase();
  if (/\bGPS\b|NAVSTAR/.test(n))
    return 'This is a GPS navigation satellite. It transmits precise timing signals that GPS receivers on Earth use to calculate your location.';
  if (/GLONASS/.test(n))
    return 'This is a GLONASS navigation satellite — Russia\'s counterpart to the American GPS system. It provides positioning signals for receivers around the world.';
  if (/GALILEO/.test(n))
    return 'This is a Galileo navigation satellite — Europe\'s civilian satellite navigation system, providing positioning signals for receivers across the globe.';
  if (/\bGOES\b/.test(n))
    return 'This is a geostationary weather satellite that continuously monitors weather patterns over its designated region from a fixed position high above Earth.';
  if (/\bNOAA\b|METOP|JPSS|POES/.test(n))
    return 'This is a polar-orbiting weather satellite that scans the entire surface of Earth every day, providing data for weather forecasts and climate monitoring.';
  if (/\bSTARLINK\b/.test(n))
    return 'This is a Starlink satellite, part of SpaceX\'s broadband internet constellation providing internet coverage to locations around the world.';
  if (/\bONEWEB\b/.test(n))
    return 'This is a OneWeb satellite, part of a broadband internet constellation providing connectivity to underserved and remote areas.';
  if (/\bINTELSAT\b|INMARSAT|EUTELSAT/.test(n))
    return 'This is a commercial communications satellite that relays television broadcasts, telephone calls, and internet traffic between ground stations.';
  if (/\bTDRS\b/.test(n))
    return 'This is a NASA Tracking and Data Relay Satellite (TDRS) — it acts as a relay station in space, allowing NASA to communicate with the ISS and other spacecraft even when they are not in line-of-sight with a ground station.';
  if (/\bLANDSAT\b/.test(n))
    return 'This is a Landsat satellite that photographs Earth\'s land surface in visible and infrared light, tracking changes to forests, farms, ice sheets, and cities over time.';
  if (/SENTINEL/.test(n))
    return 'This is a Sentinel satellite, part of the European Union\'s Copernicus Earth observation programme, monitoring environmental and land use changes across the globe.';
  return 'This is an Earth-orbiting satellite tracked by CelesTrak\'s public orbital element catalog.';
}

/**
 * Generates a conservative "Did You Know?" for satellites without a curated profile.
 * Only states things that can be verified from orbital mechanics or well-known class facts.
 */
function genericDidYouKnow(name: string, altitudeKm: number, periodMin: number): string {
  const n = name.toUpperCase();
  if (/\bGPS\b|NAVSTAR/.test(n))
    return 'GPS satellites orbit approximately 20,200 km above Earth — about 50 times higher than the ISS. Your phone needs signals from at least four GPS satellites simultaneously to determine your location.';
  if (/GLONASS/.test(n))
    return 'GLONASS satellites orbit at about 19,100 km altitude. Modern smartphones typically receive signals from both GPS and GLONASS satellites at the same time, improving positioning accuracy.';
  if (/GALILEO/.test(n))
    return 'Galileo is Europe\'s own satellite navigation system, independent of the American GPS. It was designed to provide higher civilian accuracy than GPS — down to about one metre in optimal conditions.';
  if (/\bGOES\b/.test(n))
    return 'Geostationary satellites orbit at approximately 35,786 km above the equator. At this precise altitude, one orbit takes exactly 24 hours — matching Earth\'s rotation, so the satellite appears to hover motionless over one spot.';
  if (/\bNOAA\b|JPSS|POES/.test(n))
    return 'Polar-orbiting weather satellites cross the equator about 14 times per day. Over the course of 24 hours, Earth\'s rotation brings every point on the surface within range of the satellite\'s sensors.';
  if (/\bSTARLINK\b/.test(n))
    return 'Starlink satellites fly in low Earth orbit at around 550 km altitude. They are visible to the naked eye shortly after sunset or before sunrise as a line of moving lights, before Earth\'s shadow crosses their orbit.';
  if (altitudeKm > 34000)
    return `At geostationary orbit (~36,000 km), this satellite stays fixed above one point on Earth's equator. One orbit takes exactly 24 hours — the same as Earth's rotation period.`;
  if (periodMin < 100)
    return `At low Earth orbit altitudes, this satellite circles Earth in roughly ${Math.round(periodMin)} minutes — fast enough that a person watching from the ground would see it cross the sky in just a few minutes.`;
  return `This satellite orbits Earth every ${Math.round(periodMin)} minutes, completing multiple orbits every day while travelling at several kilometres per second.`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the educational profile for a satellite.
 *
 * Lookup priority:
 *  1. Exact catalog ID match (e.g. 'iss', 'terra')
 *  2. NORAD-ID-based lookup against known IDs
 *  3. Name-pattern based generic profile
 *
 * The generic profile is clearly limited — it never invents mission details.
 */
export function getSatelliteEducationProfile(
  id: string,
  name: string,
  altitudeKm: number,
  periodMin: number,
): SatelliteEducationProfile {
  // 1. Direct catalog ID match
  if (PROFILES[id]) return PROFILES[id];

  // 2. Try stripping common suffixes to find a base match
  //    e.g. 'noaa-20-something' → 'noaa-20'
  const baseId = id.replace(/-\d+$/, '');
  if (PROFILES[baseId]) return PROFILES[baseId];

  // 3. Name-pattern based generic profile
  const category = inferCategory(name);
  const whatDoesItDo = inferWhatItDoes(name);
  const didYouKnow = genericDidYouKnow(name, altitudeKm, periodMin);

  // Determine a generic tagline based on category
  let tagline = 'An Earth-orbiting spacecraft';
  const nc = category.toUpperCase();
  if (nc.includes('NAVIGATION')) tagline = 'Helping the world know where it is';
  else if (nc.includes('WEATHER') && nc.includes('GEOSTATIONARY')) tagline = 'A constant watch over Earth\'s weather';
  else if (nc.includes('WEATHER')) tagline = 'Monitoring Earth\'s atmosphere from orbit';
  else if (nc.includes('COMMUNICATIONS')) tagline = 'Connecting people across the globe from orbit';
  else if (nc.includes('EARTH OBSERVATION')) tagline = 'Watching over our planet from space';
  else if (nc.includes('SPACE TELESCOPE')) tagline = 'Observing the universe from above the atmosphere';
  else if (nc.includes('RELAY')) tagline = 'A relay station in space';

  const n = name.toUpperCase();
  const isGPS = /\bGPS\b|NAVSTAR/.test(n);
  const isGEO = altitudeKm > 34000;

  return {
    category,
    tagline,
    whatIsIt: isGPS
      ? `${name} is a GPS navigation satellite operated by the US Space Force. It is one of a constellation of satellites that together make the Global Positioning System work.`
      : isGEO
      ? `${name} is a geostationary satellite orbiting approximately ${Math.round(altitudeKm).toLocaleString()} km above Earth's equator.`
      : `${name} is a satellite orbiting Earth at approximately ${Math.round(altitudeKm).toLocaleString()} km altitude, tracked in public orbital element catalogs.`,
    whatDoesItDo,
    whyItMatters: isGPS
      ? 'The GPS constellation makes modern navigation possible — for smartphones, vehicles, aircraft, ships, precision farming, earthquake monitoring, and many other applications that billions of people rely on every day.'
      : isGEO
      ? 'Geostationary satellites are essential for continuous, uninterrupted communication and weather monitoring over large regions of the Earth.'
      : 'Satellites in low and medium Earth orbit perform a wide range of functions that support scientific research, communications, navigation, and Earth monitoring.',
    didYouKnow,
    sources: ['CelesTrak orbital element catalog', 'celestrak.org'],
  };
}

/**
 * Returns true if a rich curated profile exists for this satellite ID.
 */
export function hasCuratedProfile(id: string): boolean {
  return id in PROFILES || id.replace(/-\d+$/, '') in PROFILES;
}
