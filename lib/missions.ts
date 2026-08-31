/**
 * ORBITAL Mission Seed Data
 * 
 * All data is sourced from publicly available information.
 * Labels indicate data provenance: OBSERVED | DERIVED | AI | ESTIMATED
 * 
 * Sources:
 * - NASA: https://www.nasa.gov / https://api.nasa.gov
 * - CelesTrak: https://celestrak.org
 * - SatNOGS: https://db.satnogs.org
 * - ESA: https://www.esa.int
 * - JPL: https://www.jpl.nasa.gov
 */

import { Mission, MissionStatus } from './types';

export const MISSIONS: Mission[] = [
  // ============================================================
  // EARTH MISSIONS
  // ============================================================
  {
    id: 'iss',
    name: 'International Space Station',
    shortName: 'ISS',
    agency: 'NASA / Roscosmos / ESA / JAXA / CSA',
    agencies: ['NASA', 'Roscosmos', 'ESA', 'JAXA', 'CSA'],
    destination: 'earth',
    missionType: 'crewed',
    status: 'active',
    launchDate: '1998-11-20',
    description:
      'The International Space Station is a modular space station in low Earth orbit. It is a multinational collaborative project between five space agencies and serves as a microgravity and space environment research laboratory.',
    objectives: [
      'Conduct fundamental science in microgravity',
      'Enable human spaceflight research for long-duration missions',
      'Serve as a technology testbed for future exploration',
      'Foster international cooperation in space',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/0701328/0701328~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/0701328/0701328~thumb.jpg',
    currentLocation: {
      description: 'Low Earth Orbit, ~408 km altitude',
      label: 'DERIVED',
      source: 'CelesTrak',
    },
    phases: [
      { id: 'assembly', name: 'Assembly', description: 'Station assembly', isCompleted: true },
      { id: 'operations', name: 'Continuous Operations', description: 'Ongoing crewed operations', isCurrent: true },
    ],
    currentPhase: {
      id: 'operations',
      name: 'Continuous Operations',
      description: 'Ongoing crewed operations since 2000',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'iss-spacecraft',
        missionId: 'iss',
        name: 'ISS',
        type: 'station',
        description: 'Modular space station in low Earth orbit',
        noradId: '25544',
        massKg: { value: 419725, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Multiple international partners',
        orbitalElements: {
          noradId: '25544',
          inclination: { value: 51.6, label: 'DERIVED', source: 'CelesTrak' },
          altitude: { value: 408, label: 'DERIVED', source: 'CelesTrak' },
          period: { value: 92.68, label: 'DERIVED', source: 'CelesTrak' },
          apoapsis: { value: 418, label: 'DERIVED', source: 'CelesTrak' },
          periapsis: { value: 408, label: 'DERIVED', source: 'CelesTrak' },
          source: 'CelesTrak',
          updatedAt: '2024-01-01',
        },
        transmitters: [
          { frequency: 437.55, mode: 'FM', status: 'active', source: 'SatNOGS' },
        ],
      },
    ],
    events: [
      { id: 'e1', missionId: 'iss', eventType: 'launch', timestamp: '1998-11-20', title: 'Zarya Module Launch', description: 'First ISS module launched aboard Proton rocket', source: 'NASA' },
      { id: 'e2', missionId: 'iss', eventType: 'milestone', timestamp: '2000-11-02', title: 'First Crew Arrival', description: 'Expedition 1 crew arrives — ISS has been continuously occupied since', source: 'NASA' },
      { id: 'e3', missionId: 'iss', eventType: 'milestone', timestamp: '2024-01-01', title: 'Year-Round Operations', description: 'ISS continues ongoing science and operations with rotating crew', source: 'NASA' },
    ],
    images: [
      { id: 'iss-img-1', missionId: 'iss', url: 'https://images-assets.nasa.gov/image/0701328/0701328~orig.jpg', title: 'ISS from SpaceX Crew Dragon', date: '2023-10-05', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/0701328' },
      { id: 'iss-img-2', missionId: 'iss', url: 'https://images-assets.nasa.gov/image/KSC-20171017-PH_ISS01_0001/KSC-20171017-PH_ISS01_0001~orig.jpg', title: 'ISS in Orbit', date: '2022-11-14', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/KSC-20171017-PH_ISS01_0001' },
    ],
    sourceUrl: 'https://www.nasa.gov/international-space-station/',
    tags: ['crewed', 'LEO', 'international', 'science', 'active'],
    aiInsights: [
      {
        id: 'iss-ai-1',
        missionId: 'iss',
        type: 'summary',
        content: 'The ISS is humanity\'s continuously crewed outpost in space — an engineering marvel that has hosted more than 270 people from 20 countries since 2000. It serves as both a research platform and a stepping stone for future exploration beyond Earth orbit.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA', 'ESA'],
      },
    ],
  },

  {
    id: 'terra',
    name: 'Terra',
    shortName: 'Terra',
    agency: 'NASA',
    destination: 'earth',
    missionType: 'earth-observation',
    status: 'active',
    launchDate: '1999-12-18',
    description:
      'Terra is NASA\'s flagship Earth Observing System (EOS) satellite, carrying five instruments that study the interactions of Earth\'s atmosphere, land, ocean, and radiant energy.',
    objectives: [
      'Observe Earth\'s changing climate',
      'Monitor land surface changes',
      'Study atmospheric composition and clouds',
      'Understand the global carbon and water cycles',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA01349/PIA01349~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA01349/PIA01349~thumb.jpg',
    currentLocation: {
      description: 'Sun-synchronous orbit, ~705 km altitude',
      label: 'DERIVED',
      source: 'CelesTrak',
    },
    phases: [
      { id: 'ops', name: 'Extended Science Operations', description: 'Ongoing Earth observation', isCurrent: true },
    ],
    currentPhase: { id: 'ops', name: 'Extended Science Operations', description: 'Ongoing Earth observation', isCurrent: true },
    spacecraft: [
      {
        id: 'terra-sc',
        missionId: 'terra',
        name: 'Terra',
        type: 'orbiter',
        description: 'Multi-instrument Earth observation satellite',
        noradId: '25994',
        powerSource: 'Solar arrays',
        manufacturer: 'Ball Aerospace',
        orbitalElements: {
          noradId: '25994',
          inclination: { value: 98.2, label: 'DERIVED', source: 'CelesTrak' },
          altitude: { value: 705, label: 'DERIVED', source: 'CelesTrak' },
          period: { value: 98.8, label: 'DERIVED', source: 'CelesTrak' },
          source: 'CelesTrak',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'terra-e1', missionId: 'terra', eventType: 'launch', timestamp: '1999-12-18', title: 'Terra Launch', description: 'Launched from Vandenberg AFB aboard Atlas IIAS', source: 'NASA' },
      { id: 'terra-e2', missionId: 'terra', eventType: 'milestone', timestamp: '2019-12-18', title: '20-Year Anniversary', description: 'Terra celebrates 20 years of continuous Earth observation', source: 'NASA' },
    ],
    images: [
      { id: 'terra-img-1', missionId: 'terra', url: 'https://images-assets.nasa.gov/image/PIA01349/PIA01349~orig.jpg', title: 'Terra MODIS Earth Image', date: '2000-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA01349' },
    ],
    sourceUrl: 'https://terra.nasa.gov/',
    tags: ['Earth observation', 'climate', 'MODIS'],
    aiInsights: [
      {
        id: 'terra-ai-1',
        missionId: 'terra',
        type: 'summary',
        content: 'Terra has been monitoring Earth\'s systems for over 25 years, generating an invaluable climate record. Its MODIS instrument has produced daily global images that scientists use to track everything from wildfires to sea ice extent.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'aqua',
    name: 'Aqua',
    shortName: 'Aqua',
    agency: 'NASA',
    destination: 'earth',
    missionType: 'earth-observation',
    status: 'active',
    launchDate: '2002-05-04',
    description:
      'Aqua is a NASA Earth Science satellite collecting information about Earth\'s water cycle, including evaporation from the oceans, water vapor in the atmosphere, clouds, precipitation, soil moisture, sea ice, land ice, and snow cover.',
    objectives: [
      'Study Earth\'s water cycle',
      'Monitor sea surface temperature and ocean productivity',
      'Track atmospheric water vapor and precipitation',
      'Observe polar ice changes',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/0201490/0201490~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/0201490/0201490~thumb.jpg',
    currentLocation: {
      description: 'Sun-synchronous orbit, ~705 km altitude',
      label: 'DERIVED',
      source: 'CelesTrak',
    },
    phases: [
      { id: 'ops', name: 'Extended Operations', description: 'Ongoing Earth observation', isCurrent: true },
    ],
    currentPhase: { id: 'ops', name: 'Extended Operations', description: 'Ongoing Earth observation', isCurrent: true },
    spacecraft: [
      {
        id: 'aqua-sc',
        missionId: 'aqua',
        name: 'Aqua',
        type: 'orbiter',
        description: 'Earth observation satellite focused on water cycle',
        noradId: '27424',
        powerSource: 'Solar arrays',
        manufacturer: 'TRW Inc.',
        orbitalElements: {
          noradId: '27424',
          inclination: { value: 98.2, label: 'DERIVED', source: 'CelesTrak' },
          altitude: { value: 705, label: 'DERIVED', source: 'CelesTrak' },
          period: { value: 98.8, label: 'DERIVED', source: 'CelesTrak' },
          source: 'CelesTrak',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'aqua-e1', missionId: 'aqua', eventType: 'launch', timestamp: '2002-05-04', title: 'Aqua Launch', description: 'Launched from Vandenberg AFB', source: 'NASA' },
    ],
    images: [
      { id: 'aqua-img-1', missionId: 'aqua', url: 'https://images-assets.nasa.gov/image/0201490/0201490~orig.jpg', title: 'Aqua Satellite Artist Concept', date: '2002-05-04', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/0201490' },
    ],
    sourceUrl: 'https://aqua.nasa.gov/',
    tags: ['Earth observation', 'water cycle', 'MODIS'],
    aiInsights: [
      {
        id: 'aqua-ai-1',
        missionId: 'aqua',
        type: 'summary',
        content: 'Aqua is a cornerstone of Earth climate monitoring. Its six instruments track global precipitation patterns, sea surface temperatures, and atmospheric humidity — data that underpins modern weather forecasting and climate models.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'landsat-9',
    name: 'Landsat 9',
    shortName: 'Landsat 9',
    agency: 'NASA / USGS',
    agencies: ['NASA', 'USGS'],
    destination: 'earth',
    missionType: 'earth-observation',
    status: 'active',
    launchDate: '2021-09-27',
    description:
      'Landsat 9 is a partnership between NASA and the U.S. Geological Survey that continues the Landsat program\'s 50-year record of Earth\'s land and coastal areas. It carries two instruments: the Operational Land Imager 2 (OLI-2) and the Thermal Infrared Sensor 2 (TIRS-2).',
    objectives: [
      'Extend the 50-year Landsat record of Earth\'s land surface',
      'Monitor global land use and land cover change',
      'Support water resource management',
      'Track forest changes and agricultural production',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001925/GSFC_20171208_Archive_e001925~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001925/GSFC_20171208_Archive_e001925~thumb.jpg',
    currentLocation: {
      description: 'Sun-synchronous orbit, ~705 km altitude',
      label: 'DERIVED',
      source: 'CelesTrak',
    },
    phases: [
      { id: 'ops', name: 'Science Operations', description: 'Routine land imaging operations', isCurrent: true },
    ],
    currentPhase: { id: 'ops', name: 'Science Operations', description: 'Routine land imaging operations', isCurrent: true },
    spacecraft: [
      {
        id: 'landsat-9-sc',
        missionId: 'landsat-9',
        name: 'Landsat 9',
        type: 'orbiter',
        description: 'Land imaging satellite with OLI-2 and TIRS-2 instruments',
        noradId: '49260',
        orbitalElements: {
          noradId: '49260',
          inclination: { value: 98.2, label: 'DERIVED', source: 'CelesTrak' },
          altitude: { value: 705, label: 'DERIVED', source: 'CelesTrak' },
          period: { value: 98.8, label: 'DERIVED', source: 'CelesTrak' },
          source: 'CelesTrak',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'l9-e1', missionId: 'landsat-9', eventType: 'launch', timestamp: '2021-09-27', title: 'Landsat 9 Launch', description: 'Launched aboard Atlas V from Vandenberg Space Force Base', source: 'NASA' },
      { id: 'l9-e2', missionId: 'landsat-9', eventType: 'milestone', timestamp: '2022-02-10', title: 'First Science Images', description: 'Landsat 9 begins routine science operations', source: 'NASA' },
    ],
    images: [
      { id: 'l9-img-1', missionId: 'landsat-9', url: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001925/GSFC_20171208_Archive_e001925~orig.jpg', title: 'Landsat Earth Observation Image', date: '2022-02-10', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e001925' },
    ],
    sourceUrl: 'https://landsat.gsfc.nasa.gov/satellites/landsat-9/',
    tags: ['Earth observation', 'land imaging', 'USGS'],
    aiInsights: [
      {
        id: 'l9-ai-1',
        missionId: 'landsat-9',
        type: 'summary',
        content: 'Landsat 9 continues a half-century land imaging record that has become essential for tracking environmental change. Scientists use Landsat data to monitor deforestation, glacier retreat, urban growth, and drought — a long baseline that no other dataset can replace.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  // ============================================================
  // MOON MISSIONS
  // ============================================================
  {
    id: 'artemis-2',
    name: 'Artemis II',
    shortName: 'Artemis II',
    agency: 'NASA',
    destination: 'moon',
    missionType: 'crewed',
    status: 'planned',
    launchDate: '2025-09-01',
    description:
      'Artemis II is NASA\'s first crewed mission to the vicinity of the Moon since Apollo 17 in 1972. The four-person crew will fly aboard the Orion spacecraft, launched by the Space Launch System, on a 10-day mission that includes a lunar flyby. This mission does not land on the Moon; it is a critical test of crewed deep-space systems.',
    objectives: [
      'First crewed test of the Orion spacecraft in deep space',
      'Validate life support systems beyond low Earth orbit',
      'Test SLS performance with crew',
      'Fly a free-return trajectory around the Moon',
      'Demonstrate deep-space communication and navigation',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/KSC-20260320-PH-JBS01_0171/KSC-20260320-PH-JBS01_0171~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/KSC-20260320-PH-JBS01_0171/KSC-20260320-PH-JBS01_0171~thumb.jpg',
    currentLocation: {
      description: 'Pre-launch at Kennedy Space Center, Florida',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'prelaunch', name: 'Pre-Launch Processing', description: 'Vehicle integration and testing at KSC', isCurrent: true },
      { id: 'launch', name: 'Launch', description: 'SLS launch from Launch Complex 39B', isFuture: true },
      { id: 'earth-orbit', name: 'Earth Orbit', description: 'Orbit checkout and verification', isFuture: true },
      { id: 'tli', name: 'Translunar Injection', description: 'Departure burn for the Moon', isFuture: true },
      { id: 'transit', name: 'Lunar Transit', description: 'Cruise toward the Moon', isFuture: true },
      { id: 'lunar-flyby', name: 'Lunar Flyby', description: 'Close approach and flyby of the Moon', isFuture: true },
      { id: 'return', name: 'Return Transit', description: 'Return cruise to Earth', isFuture: true },
      { id: 'reentry', name: 'Re-Entry & Splashdown', description: 'Orion re-enters atmosphere and splashes down in the Pacific', isFuture: true },
    ],
    currentPhase: {
      id: 'prelaunch',
      name: 'Pre-Launch Processing',
      description: 'Vehicle integration and testing at Kennedy Space Center',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'orion-a2',
        missionId: 'artemis-2',
        name: 'Orion (Artemis II)',
        type: 'capsule',
        description: 'NASA\'s Orion Multi-Purpose Crew Vehicle, carrying four astronauts on a lunar flyby trajectory. Includes a Crew Module and European Service Module.',
        imageUrl: 'https://images-assets.nasa.gov/image/KSC-20260320-PH-JBS01_0171/KSC-20260320-PH-JBS01_0171~orig.jpg',
        massKg: { value: 26520, label: 'OBSERVED', source: 'NASA', notes: 'Approximate launch mass' },
        powerSource: 'Solar arrays (European Service Module)',
        manufacturer: 'Lockheed Martin (Crew Module) / Airbus Defence and Space (European Service Module)',
      },
      {
        id: 'sls-a2',
        missionId: 'artemis-2',
        name: 'Space Launch System Block 1 Crew',
        type: 'rocket',
        description: 'NASA\'s Space Launch System in Block 1 Crew configuration, the most powerful rocket ever to fly. Delivers Orion to a high-energy trajectory toward the Moon.',
        powerSource: 'RS-25 engines + solid rocket boosters',
        manufacturer: 'Boeing (core stage) / Northrop Grumman (SRBs) / Aerojet Rocketdyne (RS-25)',
      },
    ],
    events: [
      { id: 'a2-e1', missionId: 'artemis-2', eventType: 'milestone', timestamp: '2023-04-03', title: 'Crew Announced', description: 'NASA announces four-person Artemis II crew: Reid Wiseman, Victor Glover, Christina Koch, Jeremy Hansen', source: 'NASA', sourceUrl: 'https://www.nasa.gov/artemis-ii' },
      { id: 'a2-e2', missionId: 'artemis-2', eventType: 'milestone', timestamp: '2024-07-09', title: 'Launch Date Target Update', description: 'NASA targets September 2025 for Artemis II launch', source: 'NASA' },
    ],
    images: [
      { id: 'a2-img-1', missionId: 'artemis-2', url: 'https://images-assets.nasa.gov/image/KSC-20260320-PH-JBS01_0171/KSC-20260320-PH-JBS01_0171~orig.jpg', title: 'Artemis II Rollout for Launch', date: '2026-03-20', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/KSC-20260320-PH-JBS01_0171' },
    ],
    sourceUrl: 'https://www.nasa.gov/artemis-ii',
    tags: ['crewed', 'Artemis', 'Orion', 'SLS', 'lunar flyby'],
    aiInsights: [
      {
        id: 'a2-ai-1',
        missionId: 'artemis-2',
        type: 'summary',
        content: 'Artemis II is not a landing — it is a rigorous test drive. Four astronauts will fly farther from Earth than any human has traveled since 1972, validating every system Orion and SLS need before humans attempt to land on the Moon in Artemis III.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
      {
        id: 'a2-ai-2',
        missionId: 'artemis-2',
        type: 'significance',
        content: 'Artemis II matters because it is the final verification step before landing humans on the Moon for the first time in over 50 years. The mission also features the first Black person and first Canadian to travel to lunar distance — a historic milestone in the expansion of human spaceflight.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter',
    shortName: 'LRO',
    agency: 'NASA',
    destination: 'moon',
    missionType: 'orbiter',
    status: 'active',
    launchDate: '2009-06-18',
    description:
      'The Lunar Reconnaissance Orbiter (LRO) is a NASA robotic spacecraft currently in polar orbit around the Moon. It has been mapping the Moon in unprecedented detail since 2009, providing critical data for future human landing sites.',
    objectives: [
      'Create a comprehensive map of the lunar surface',
      'Identify safe landing sites for future human missions',
      'Characterize the lunar radiation environment',
      'Search for water ice in permanently shadowed polar regions',
      'Measure lunar temperatures',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA14021/PIA14021~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA14021/PIA14021~thumb.jpg',
    currentLocation: {
      description: 'Polar orbit around the Moon, ~50–200 km altitude',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'mapping', name: 'Extended Science Operations', description: 'Ongoing polar lunar mapping', isCurrent: true },
    ],
    currentPhase: { id: 'mapping', name: 'Extended Science Operations', description: 'Ongoing polar lunar mapping', isCurrent: true },
    spacecraft: [
      {
        id: 'lro-sc',
        missionId: 'lro',
        name: 'LRO',
        type: 'orbiter',
        description: 'Robotic lunar orbiter carrying seven science instruments',
        massKg: { value: 1916, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Goddard Space Flight Center',
        orbitalElements: {
          inclination: { value: 90, label: 'DERIVED', source: 'NASA', notes: 'Approximate polar orbit' },
          altitude: { value: 100, label: 'ESTIMATED', source: 'NASA', notes: 'Varies, typical value ~50-200 km' },
          source: 'NASA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'lro-e1', missionId: 'lro', eventType: 'launch', timestamp: '2009-06-18', title: 'LRO Launch', description: 'Launched aboard Atlas V along with LCROSS', source: 'NASA' },
      { id: 'lro-e2', missionId: 'lro', eventType: 'milestone', timestamp: '2009-09-17', title: 'Primary Science Orbit', description: 'LRO enters primary mapping orbit', source: 'NASA' },
      { id: 'lro-e3', missionId: 'lro', eventType: 'milestone', timestamp: '2024-01-01', title: 'Ongoing Operations', description: 'LRO continues lunar mapping in extended mission', source: 'NASA' },
    ],
    images: [
      { id: 'lro-img-1', missionId: 'lro', url: 'https://images-assets.nasa.gov/image/PIA14021/PIA14021~orig.jpg', title: 'Lunar South Pole by LRO LROC', date: '2011-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA14021' },
    ],
    sourceUrl: 'https://lunar.gsfc.nasa.gov/',
    tags: ['orbiter', 'lunar mapping', 'ice prospecting'],
    aiInsights: [
      {
        id: 'lro-ai-1',
        missionId: 'lro',
        type: 'summary',
        content: 'LRO has been circling the Moon for over 15 years, building the most detailed map of the lunar surface ever made. Its cameras can resolve objects less than a meter across — sharp enough to photograph the Apollo landing sites. This data directly guides where NASA plans to land Artemis crews.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'kplo',
    name: 'Korea Pathfinder Lunar Orbiter',
    shortName: 'KPLO (Danuri)',
    agency: 'KARI',
    destination: 'moon',
    missionType: 'orbiter',
    status: 'active',
    launchDate: '2022-08-05',
    description:
      'The Korea Pathfinder Lunar Orbiter (KPLO), also known as Danuri, is South Korea\'s first lunar mission. It orbits the Moon collecting imagery and scientific data, and carries a NASA payload (ShadowCam) to image permanently shadowed regions.',
    objectives: [
      'Demonstrate South Korea\'s deep-space capabilities',
      'Image the lunar surface in visible and gamma-ray wavelengths',
      'Map permanently shadowed regions with NASA\'s ShadowCam',
      'Test deep-space communications',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/as8-14-2392/as8-14-2392~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/as8-14-2392/as8-14-2392~thumb.jpg',
    currentLocation: {
      description: 'Polar orbit around the Moon, ~100 km altitude',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'science', name: 'Science Operations', description: 'Ongoing lunar science', isCurrent: true },
    ],
    currentPhase: { id: 'science', name: 'Science Operations', description: 'Ongoing lunar science', isCurrent: true },
    spacecraft: [
      {
        id: 'kplo-sc',
        missionId: 'kplo',
        name: 'Danuri',
        type: 'orbiter',
        description: 'Korea\'s first lunar orbiter, carrying 6 scientific instruments including NASA\'s ShadowCam',
        powerSource: 'Solar arrays',
        manufacturer: 'KARI (Korea Aerospace Research Institute)',
        orbitalElements: {
          altitude: { value: 100, label: 'DERIVED', source: 'NASA' },
          inclination: { value: 90, label: 'DERIVED', source: 'NASA', notes: 'Polar orbit' },
          source: 'NASA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'kplo-e1', missionId: 'kplo', eventType: 'launch', timestamp: '2022-08-05', title: 'Danuri Launch', description: 'Launched on SpaceX Falcon 9 from Cape Canaveral', source: 'NASA' },
      { id: 'kplo-e2', missionId: 'kplo', eventType: 'milestone', timestamp: '2022-12-27', title: 'Lunar Orbit Insertion', description: 'Danuri enters lunar orbit', source: 'NASA' },
    ],
    images: [
      { id: 'kplo-img-1', missionId: 'kplo', url: 'https://images-assets.nasa.gov/image/KSC-20250114-PH-KLS01_0014/KSC-20250114-PH-KLS01_0014~orig.jpg', title: 'Falcon 9 Lunar Mission Launch (representative image)', date: '2022-08-05', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/KSC-20250114-PH-KLS01_0014' },
    ],
    sourceUrl: 'https://www.kari.re.kr/',
    tags: ['orbiter', 'South Korea', 'ShadowCam', 'international'],
    aiInsights: [
      {
        id: 'kplo-ai-1',
        missionId: 'kplo',
        type: 'summary',
        content: 'Danuri marks South Korea\'s entry into deep-space exploration and is a showcase of international collaboration — carrying NASA\'s ShadowCam instrument, which photographs the Moon\'s permanently dark polar craters where water ice may exist.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA', 'ESA'],
      },
    ],
  },

  {
    id: 'lunar-gateway',
    name: 'Lunar Gateway',
    shortName: 'Gateway',
    agency: 'NASA / ESA / JAXA / CSA',
    agencies: ['NASA', 'ESA', 'JAXA', 'CSA'],
    destination: 'moon',
    missionType: 'crewed',
    status: 'planned',
    launchDate: '2025-11-01',
    description:
      'The Lunar Gateway is a planned small space station in a near-rectilinear halo orbit around the Moon. It will serve as a waystation for Artemis missions and future deep-space exploration. The Power and Propulsion Element (PPE) and Habitation and Logistics Outpost (HALO) are the first elements planned for launch.',
    objectives: [
      'Provide a crewed staging point for lunar surface missions',
      'Serve as a long-term orbiting lunar laboratory',
      'Test technologies for future Mars missions',
      'Expand international partnerships in deep space',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/jsc2025e037586/jsc2025e037586~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/jsc2025e037586/jsc2025e037586~thumb.jpg',
    phases: [
      { id: 'development', name: 'Development & Integration', description: 'PPE and HALO development and integration', isCurrent: true },
      { id: 'launch', name: 'First Launch', description: 'PPE and HALO launch on Falcon Heavy', isFuture: true },
      { id: 'ops', name: 'Operational', description: 'Crewed operations begin', isFuture: true },
    ],
    currentPhase: { id: 'development', name: 'Development & Integration', description: 'PPE and HALO development and integration', isCurrent: true },
    spacecraft: [
      {
        id: 'gateway-ppe',
        missionId: 'lunar-gateway',
        name: 'Gateway PPE/HALO',
        type: 'station',
        description: 'Power and Propulsion Element and Habitation and Logistics Outpost — first elements of the Lunar Gateway',
        powerSource: 'Solar Electric Propulsion',
        manufacturer: 'Maxar Technologies (PPE) / Northrop Grumman (HALO)',
      },
    ],
    events: [
      { id: 'gw-e1', missionId: 'lunar-gateway', eventType: 'milestone', timestamp: '2019-05-23', title: 'PPE Contract Awarded', description: 'NASA awards PPE contract to Maxar Technologies', source: 'NASA' },
    ],
    images: [
      { id: 'gw-img-1', missionId: 'lunar-gateway', url: 'https://images-assets.nasa.gov/image/jsc2024e024935/jsc2024e024935~orig.jpg', title: 'Gateway Lunar Space Station Configuration', date: '2024-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/jsc2024e024935' },
    ],
    sourceUrl: 'https://www.nasa.gov/lunar-gateway/',
    tags: ['planned', 'crewed', 'space station', 'Artemis', 'international'],
    aiInsights: [
      {
        id: 'gw-ai-1',
        missionId: 'lunar-gateway',
        type: 'summary',
        content: 'Gateway is designed to be the first space station in deep space — a permanently available waystation in lunar orbit that Artemis crews can visit, use as a staging point for surface missions, and leave between visits. Unlike the ISS, Gateway will go unmanned for extended periods.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  // ============================================================
  // MARS MISSIONS
  // ============================================================
  {
    id: 'perseverance',
    name: 'Mars 2020 / Perseverance',
    shortName: 'Perseverance',
    agency: 'NASA',
    destination: 'mars',
    missionType: 'rover',
    status: 'surface-operations',
    launchDate: '2020-07-30',
    description:
      'Perseverance is NASA\'s most capable Mars rover, currently exploring Jezero Crater — an ancient lake bed and river delta. Its primary mission is to seek signs of ancient microbial life and collect rock and soil samples for potential return to Earth.',
    objectives: [
      'Search for signs of ancient microbial life in Jezero Crater',
      'Collect and cache rock and soil samples for future return to Earth',
      'Test in-situ oxygen production (MOXIE experiment)',
      'Characterize Martian weather and dust',
      'Support Ingenuity helicopter flight operations',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA24546/PIA24546~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA24546/PIA24546~thumb.jpg',
    currentLocation: {
      description: 'Jezero Crater, Mars — exploring the ancient lake delta margin',
      label: 'OBSERVED',
      source: 'NASA',
    },
    surfaceLocation: {
      lat: 18.4447,
      lon: 77.4508,
      siteName: 'Jezero Crater',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'landing', name: 'Landing', description: 'EDL — Entry, Descent, and Landing', isCompleted: true },
      { id: 'checkout', name: 'Checkout & Ingenuity Ops', description: 'Rover system checkout, Ingenuity helicopter flights', isCompleted: true },
      { id: 'crater-floor', name: 'Crater Floor', description: 'Exploration of Jezero Crater floor', isCompleted: true },
      { id: 'delta-front', name: 'Delta Front', description: 'Exploration of ancient river delta', isCompleted: true },
      { id: 'upper-fan', name: 'Upper Delta / Margin', description: 'Exploring upper delta and crater rim', isCurrent: true },
    ],
    currentPhase: {
      id: 'upper-fan',
      name: 'Upper Delta Exploration',
      description: 'Exploring the ancient river delta margin and crater rim for biosignatures and diverse rock types',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'perseverance-rover',
        missionId: 'perseverance',
        name: 'Perseverance Rover',
        type: 'rover',
        description: 'Car-sized rover with 7 science instruments, 23 cameras, 2 microphones, a sample caching system, and the MOXIE oxygen experiment.',
        massKg: { value: 1025, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)',
        manufacturer: 'NASA Jet Propulsion Laboratory',
      },
      {
        id: 'ingenuity',
        missionId: 'perseverance',
        name: 'Ingenuity Helicopter',
        type: 'probe',
        description: 'Technology demonstration helicopter — first powered aircraft to fly on another planet. Flew 72 times before rotor damage ended operations in January 2024.',
        massKg: { value: 1.8, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar-charged lithium-ion batteries',
        manufacturer: 'NASA Jet Propulsion Laboratory',
      },
    ],
    events: [
      { id: 'p-e1', missionId: 'perseverance', eventType: 'launch', timestamp: '2020-07-30', title: 'Launch', description: 'Launched aboard Atlas V 541 from Cape Canaveral', source: 'NASA' },
      { id: 'p-e2', missionId: 'perseverance', eventType: 'landing', timestamp: '2021-02-18', title: 'Landing in Jezero Crater', description: 'Perseverance lands successfully after "Seven Minutes of Terror" EDL', source: 'NASA' },
      { id: 'p-e3', missionId: 'perseverance', eventType: 'milestone', timestamp: '2021-04-19', title: 'Ingenuity First Flight', description: 'Ingenuity helicopter makes first powered flight on Mars', source: 'NASA' },
      { id: 'p-e4', missionId: 'perseverance', eventType: 'science', timestamp: '2021-09-06', title: 'First Core Sample', description: 'Perseverance successfully drills and caches first rock core sample', source: 'NASA' },
      { id: 'p-e5', missionId: 'perseverance', eventType: 'science', timestamp: '2022-09-01', title: 'Delta Exploration Begins', description: 'Rover begins exploring ancient river delta — primary astrobiological target', source: 'NASA' },
      { id: 'p-e6', missionId: 'perseverance', eventType: 'milestone', timestamp: '2024-01-25', title: 'Ingenuity Ends Operations', description: 'Ingenuity\'s 72nd flight ends with rotor blade damage; helicopter operations conclude', source: 'NASA' },
      { id: 'p-e7', missionId: 'perseverance', eventType: 'science', timestamp: '2024-07-01', title: 'Campaign 4 Begins', description: 'Rover begins fourth science campaign exploring crater margin', source: 'NASA' },
    ],
    images: [
      { id: 'p-img-1', missionId: 'perseverance', url: 'https://images-assets.nasa.gov/image/PIA24546/PIA24546~orig.jpg', title: 'Perseverance at Jezero Crater', date: '2021-03-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA24546' },
      { id: 'p-img-2', missionId: 'perseverance', url: 'https://images-assets.nasa.gov/image/PIA24836/PIA24836~orig.jpg', title: 'Ingenuity in Flight over Mars', date: '2021-04-19', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA24836' },
      { id: 'p-img-3', missionId: 'perseverance', url: 'https://images-assets.nasa.gov/image/PIA23764/PIA23764~orig.jpg', title: 'Perseverance Rover Artist Concept', date: '2020-07-30', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA23764' },
    ],
    sourceUrl: 'https://mars.nasa.gov/mars2020/',
    tags: ['rover', 'Jezero', 'astrobiology', 'sample cache', 'Ingenuity'],
    aiInsights: [
      {
        id: 'p-ai-1',
        missionId: 'perseverance',
        type: 'summary',
        content: 'Perseverance is humanity\'s most sophisticated life-hunting rover. It is systematically caching rock samples from one of Mars\'s most scientifically compelling sites — an ancient lake and river delta — for a future mission to retrieve and return to Earth, where scientists can use every available analytical tool to search for biosignatures.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
      {
        id: 'p-ai-2',
        missionId: 'perseverance',
        type: 'current-status',
        content: 'As of mid-2024, Perseverance is exploring the upper reaches of the Jezero Crater delta, a geologically diverse zone where ancient sediments from multiple environments converge. The rover has collected over 20 rock core samples and continues to characterize the crater\'s ancient habitability.',
        confidence: 'high',
        createdAt: '2024-07-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'curiosity',
    name: 'Mars Science Laboratory / Curiosity',
    shortName: 'Curiosity',
    agency: 'NASA',
    destination: 'mars',
    missionType: 'rover',
    status: 'surface-operations',
    launchDate: '2011-11-26',
    description:
      'Curiosity is a car-sized rover that has been exploring Gale Crater on Mars since 2012. Its mission is to determine whether Mars ever had the conditions to support microbial life. The rover has driven over 30 km and climbed more than 700 m of Mt. Sharp.',
    objectives: [
      'Determine the habitability of Gale Crater\'s ancient environment',
      'Study Mars geology and geochemistry',
      'Characterize the radiation environment at the surface',
      'Investigate the role of water in Martian geology',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA16239/PIA16239~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA16239/PIA16239~thumb.jpg',
    currentLocation: {
      description: 'Gale Crater, Mars — climbing the slopes of Mt. Sharp (Aeolis Mons)',
      label: 'OBSERVED',
      source: 'NASA',
    },
    surfaceLocation: {
      lat: -4.5895,
      lon: 137.4417,
      siteName: 'Gale Crater / Mt. Sharp',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'landing', name: 'Landing', description: 'Sky crane EDL', isCompleted: true },
      { id: 'flat-plains', name: 'Crater Floor', description: 'Early exploration of Gale Crater floor', isCompleted: true },
      { id: 'murray', name: 'Murray Formation', description: 'Exploring ancient lake sediments', isCompleted: true },
      { id: 'mt-sharp', name: 'Mt. Sharp Ascent', description: 'Climbing and exploring Aeolis Mons', isCurrent: true },
    ],
    currentPhase: {
      id: 'mt-sharp',
      name: 'Mt. Sharp Ascent',
      description: 'Exploring the stratigraphy of Mt. Sharp to read the Martian climate record',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'curiosity-rover',
        missionId: 'curiosity',
        name: 'Curiosity Rover',
        type: 'rover',
        description: 'The largest Mars rover ever when launched. Carries 10 scientific instruments including ChemCam (laser + spectrometer), SAM (atmospheric and organic chemistry), and MAHLI (close-up imager).',
        massKg: { value: 899, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)',
        manufacturer: 'NASA Jet Propulsion Laboratory',
      },
    ],
    events: [
      { id: 'c-e1', missionId: 'curiosity', eventType: 'launch', timestamp: '2011-11-26', title: 'Launch', description: 'Launched aboard Atlas V from Cape Canaveral Air Force Station', source: 'NASA' },
      { id: 'c-e2', missionId: 'curiosity', eventType: 'landing', timestamp: '2012-08-06', title: 'Sky Crane Landing', description: 'First use of sky crane EDL system — Curiosity lands in Gale Crater', source: 'NASA' },
      { id: 'c-e3', missionId: 'curiosity', eventType: 'science', timestamp: '2013-03-12', title: 'Habitable Environment Confirmed', description: 'Scientists announce Yellowknife Bay showed ancient habitable environment', source: 'NASA' },
      { id: 'c-e4', missionId: 'curiosity', eventType: 'milestone', timestamp: '2022-08-06', title: '10-Year Anniversary on Mars', description: 'Curiosity marks 10 years of surface operations', source: 'NASA' },
      { id: 'c-e5', missionId: 'curiosity', eventType: 'science', timestamp: '2023-07-01', title: 'Organic Molecule Discovery', description: 'Detection of diverse organic molecules in ancient lake sediments', source: 'NASA' },
    ],
    images: [
      { id: 'c-img-1', missionId: 'curiosity', url: 'https://images-assets.nasa.gov/image/PIA16239/PIA16239~orig.jpg', title: 'Curiosity Self-Portrait in Gale Crater', date: '2012-10-31', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA16239' },
      { id: 'c-img-2', missionId: 'curiosity', url: 'https://images-assets.nasa.gov/image/PIA20844/PIA20844~orig.jpg', title: 'Murray Buttes', date: '2016-09-08', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA20844' },
    ],
    sourceUrl: 'https://mars.nasa.gov/msl/',
    tags: ['rover', 'Gale Crater', 'geochemistry', 'Mt. Sharp'],
    aiInsights: [
      {
        id: 'c-ai-1',
        missionId: 'curiosity',
        type: 'summary',
        content: 'Curiosity answered the central question it was sent to answer: Gale Crater was indeed habitable billions of years ago. Now over 12 years into its extended mission, the rover is climbing Mt. Sharp — a layered mountain of sediment that records billions of years of Martian climate history, readable like the pages of a book.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'maven',
    name: 'MAVEN',
    shortName: 'MAVEN',
    agency: 'NASA',
    destination: 'mars',
    missionType: 'orbiter',
    status: 'science-operations',
    launchDate: '2013-11-18',
    description:
      'MAVEN (Mars Atmosphere and Volatile Evolution) is a NASA spacecraft that has been orbiting Mars since 2014. It investigates how and why Mars lost its thick early atmosphere and liquid water.',
    objectives: [
      'Determine the role of solar wind in stripping Mars\'s early atmosphere',
      'Measure the rate of atmospheric escape from Mars',
      'Understand how Martian climate evolved over time',
      'Serve as a communications relay for surface missions',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA18922/PIA18922~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA18922/PIA18922~thumb.jpg',
    currentLocation: {
      description: 'Elliptical orbit around Mars',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'science', name: 'Extended Science Operations', description: 'Ongoing atmospheric science', isCurrent: true },
    ],
    currentPhase: { id: 'science', name: 'Extended Science Operations', description: 'Ongoing atmospheric science and relay support', isCurrent: true },
    spacecraft: [
      {
        id: 'maven-sc',
        missionId: 'maven',
        name: 'MAVEN',
        type: 'orbiter',
        description: 'Atmospheric science orbiter with 8 instruments measuring solar wind interaction with Martian upper atmosphere',
        massKg: { value: 2454, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Lockheed Martin Space',
        orbitalElements: {
          periapsis: { value: 150, label: 'DERIVED', source: 'NASA', notes: 'Approximate — varies with orbit adjustment' },
          apoapsis: { value: 6000, label: 'DERIVED', source: 'NASA', notes: 'Approximate' },
          inclination: { value: 75, label: 'DERIVED', source: 'NASA' },
          source: 'NASA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'm-e1', missionId: 'maven', eventType: 'launch', timestamp: '2013-11-18', title: 'Launch', description: 'Launched aboard Atlas V from Cape Canaveral', source: 'NASA' },
      { id: 'm-e2', missionId: 'maven', eventType: 'milestone', timestamp: '2014-09-22', title: 'Mars Orbit Insertion', description: 'MAVEN enters Mars orbit after 10-month cruise', source: 'NASA' },
      { id: 'm-e3', missionId: 'maven', eventType: 'science', timestamp: '2015-11-05', title: 'Key Results Published', description: 'NASA reveals MAVEN data showing Mars lost atmosphere to solar wind', source: 'NASA' },
      { id: 'm-e4', missionId: 'maven', eventType: 'milestone', timestamp: '2024-01-01', title: 'Ongoing Science & Relay', description: 'MAVEN continues atmospheric science and serves as relay for Mars surface missions', source: 'NASA' },
    ],
    images: [
      { id: 'm-img-1', missionId: 'maven', url: 'https://images-assets.nasa.gov/image/PIA18922/PIA18922~orig.jpg', title: 'MAVEN Artist Concept at Mars', date: '2014-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA18922' },
    ],
    sourceUrl: 'https://lasp.colorado.edu/maven/',
    tags: ['orbiter', 'atmosphere', 'solar wind', 'climate history'],
    aiInsights: [
      {
        id: 'm-ai-1',
        missionId: 'maven',
        type: 'summary',
        content: 'MAVEN answered a fundamental question about Mars: where did the water go? The spacecraft measured the rate at which the solar wind strips Mars\'s upper atmosphere — determining that over billions of years, solar erosion removed most of the atmosphere that once made Mars warm and wet.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'mro',
    name: 'Mars Reconnaissance Orbiter',
    shortName: 'MRO',
    agency: 'NASA',
    destination: 'mars',
    missionType: 'orbiter',
    status: 'science-operations',
    launchDate: '2005-08-12',
    description:
      'The Mars Reconnaissance Orbiter (MRO) is NASA\'s most capable planetary science orbiter. Since 2006, it has studied Martian climate, geology, and weather — and its powerful HiRISE camera has taken images of Mars\'s surface at 25 cm per pixel resolution.',
    objectives: [
      'Characterize Martian climate and weather',
      'Identify landing sites for future missions',
      'Study Martian geology and mineralogy',
      'Search for evidence of past water',
      'Serve as communications relay for surface missions',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA10216/PIA10216~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA10216/PIA10216~thumb.jpg',
    currentLocation: {
      description: 'Near-polar orbit around Mars, ~300 km altitude',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'science', name: 'Extended Science Operations', description: 'Ongoing science and relay support', isCurrent: true },
    ],
    currentPhase: { id: 'science', name: 'Extended Science Operations', description: 'Ongoing science and relay support', isCurrent: true },
    spacecraft: [
      {
        id: 'mro-sc',
        missionId: 'mro',
        name: 'MRO',
        type: 'orbiter',
        description: 'Reconnaissance orbiter carrying HiRISE (high-resolution camera), CRISM (mineral mapper), SHARAD (radar sounder), and other instruments',
        massKg: { value: 2180, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Lockheed Martin Space',
        orbitalElements: {
          altitude: { value: 300, label: 'DERIVED', source: 'NASA' },
          inclination: { value: 92.6, label: 'DERIVED', source: 'NASA' },
          period: { value: 112, label: 'DERIVED', source: 'NASA' },
          source: 'NASA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'mro-e1', missionId: 'mro', eventType: 'launch', timestamp: '2005-08-12', title: 'Launch', description: 'Launched aboard Atlas V from Cape Canaveral', source: 'NASA' },
      { id: 'mro-e2', missionId: 'mro', eventType: 'milestone', timestamp: '2006-03-10', title: 'Mars Orbit Insertion', description: 'MRO begins orbit insertion at Mars', source: 'NASA' },
      { id: 'mro-e3', missionId: 'mro', eventType: 'milestone', timestamp: '2024-01-01', title: 'Ongoing Operations', description: 'MRO continues science and relay operations after nearly 20 years', source: 'NASA' },
    ],
    images: [
      { id: 'mro-img-1', missionId: 'mro', url: 'https://images-assets.nasa.gov/image/PIA10216/PIA10216~orig.jpg', title: 'Recurring Slope Lineae on Mars (HiRISE / MRO)', date: '2011-08-05', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA10216' },
    ],
    sourceUrl: 'https://mars.nasa.gov/mro/',
    tags: ['orbiter', 'HiRISE', 'radar', 'mineralogy', 'relay'],
    aiInsights: [
      {
        id: 'mro-ai-1',
        missionId: 'mro',
        type: 'summary',
        content: 'MRO is the eyes of Mars exploration — its HiRISE camera is so powerful it can photograph Mars rovers from orbit. After nearly 20 years in operation, it has returned more data from Mars than all other spacecraft combined and continues to serve as a critical relay for surface missions.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'mars-express',
    name: 'Mars Express',
    shortName: 'Mars Express',
    agency: 'ESA',
    destination: 'mars',
    missionType: 'orbiter',
    status: 'science-operations',
    launchDate: '2003-06-02',
    description:
      'Mars Express is the European Space Agency\'s first planetary mission. It has been orbiting Mars since December 2003, conducting radar sounding, atmospheric studies, and high-resolution imaging.',
    objectives: [
      'Map the Martian surface and subsurface',
      'Search for water ice using ground-penetrating radar',
      'Characterize Martian atmosphere and ionosphere',
      'Study interactions between solar wind and Mars',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA19952/PIA19952~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA19952/PIA19952~thumb.jpg',
    currentLocation: {
      description: 'Elliptical orbit around Mars',
      label: 'DERIVED',
      source: 'ESA',
    },
    phases: [
      { id: 'science', name: 'Extended Science Operations', description: 'Ongoing Martian science — over 20 years', isCurrent: true },
    ],
    currentPhase: { id: 'science', name: 'Extended Science Operations', description: 'Ongoing Martian science — over 20 years', isCurrent: true },
    spacecraft: [
      {
        id: 'mexpress-sc',
        missionId: 'mars-express',
        name: 'Mars Express',
        type: 'orbiter',
        description: 'ESA orbiter with 7 instruments including MARSIS radar sounder and HRSC high-resolution stereo camera',
        massKg: { value: 1120, label: 'OBSERVED', source: 'ESA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Astrium (EADS)',
        orbitalElements: {
          inclination: { value: 86.6, label: 'DERIVED', source: 'ESA' },
          periapsis: { value: 298, label: 'DERIVED', source: 'ESA' },
          apoapsis: { value: 10107, label: 'DERIVED', source: 'ESA' },
          period: { value: 426, label: 'DERIVED', source: 'ESA' },
          source: 'ESA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'me-e1', missionId: 'mars-express', eventType: 'launch', timestamp: '2003-06-02', title: 'Launch', description: 'Launched from Baikonur Cosmodrome aboard Soyuz-FG/Fregat', source: 'ESA' },
      { id: 'me-e2', missionId: 'mars-express', eventType: 'milestone', timestamp: '2003-12-25', title: 'Mars Orbit Insertion', description: 'Mars Express enters Martian orbit on Christmas Day', source: 'ESA' },
      { id: 'me-e3', missionId: 'mars-express', eventType: 'science', timestamp: '2018-07-25', title: 'Subglacial Lake Detected', description: 'MARSIS radar detects bright radar reflection suggesting liquid water lake beneath south polar cap', source: 'ESA' },
    ],
    images: [
      { id: 'me-img-1', missionId: 'mars-express', url: 'https://images-assets.nasa.gov/image/PIA19952/PIA19952~orig.jpg', title: 'Mars Express HRSC Color View of Mars', date: '2016-01-01', source: 'ESA', sourceUrl: 'https://images.nasa.gov/details/PIA19952' },
    ],
    sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/Mars_Express',
    tags: ['orbiter', 'ESA', 'radar', 'MARSIS', 'subglacial lake'],
    aiInsights: [
      {
        id: 'me-ai-1',
        missionId: 'mars-express',
        type: 'summary',
        content: 'Mars Express is one of the most successful planetary missions in history. Its MARSIS radar made one of the most tantalizing Mars discoveries: a bright radar reflection under the south polar ice cap interpreted by some scientists as liquid water. This potential subglacial lake — if confirmed — would be the best candidate for extant Martian life.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['ESA'],
      },
    ],
  },

  {
    id: 'tgo',
    name: 'ExoMars Trace Gas Orbiter',
    shortName: 'TGO',
    agency: 'ESA / Roscosmos',
    agencies: ['ESA', 'Roscosmos'],
    destination: 'mars',
    missionType: 'orbiter',
    status: 'science-operations',
    launchDate: '2016-03-14',
    description:
      'The ExoMars Trace Gas Orbiter (TGO) is a joint ESA–Roscosmos mission designed to study trace gases in the Martian atmosphere — particularly methane, which could indicate geological or biological activity.',
    objectives: [
      'Detect and characterize trace gases, especially methane',
      'Map the distribution of water and ice in the subsurface',
      'Study solar wind interaction with Mars',
      'Serve as relay for future ExoMars surface missions',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA21131/PIA21131~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA21131/PIA21131~thumb.jpg',
    currentLocation: {
      description: 'Near-circular orbit around Mars, ~400 km altitude',
      label: 'DERIVED',
      source: 'ESA',
    },
    phases: [
      { id: 'aerobraking', name: 'Aerobraking', description: 'Orbit lowering via atmospheric drag', isCompleted: true },
      { id: 'science', name: 'Science Operations', description: 'Ongoing trace gas and atmospheric science', isCurrent: true },
    ],
    currentPhase: { id: 'science', name: 'Science Operations', description: 'Ongoing trace gas and atmospheric science', isCurrent: true },
    spacecraft: [
      {
        id: 'tgo-sc',
        missionId: 'tgo',
        name: 'TGO',
        type: 'orbiter',
        description: 'Trace gas orbiter with NOMAD (nadir/limb spectrometer), ACS (atmospheric chemistry suite), CaSSIS (color camera), and FREND (neutron detector)',
        massKg: { value: 3732, label: 'OBSERVED', source: 'ESA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Thales Alenia Space',
        orbitalElements: {
          altitude: { value: 400, label: 'DERIVED', source: 'ESA' },
          inclination: { value: 74, label: 'DERIVED', source: 'ESA' },
          period: { value: 120, label: 'DERIVED', source: 'ESA' },
          source: 'ESA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'tgo-e1', missionId: 'tgo', eventType: 'launch', timestamp: '2016-03-14', title: 'Launch', description: 'Launched aboard Proton-M/Briz-M from Baikonur', source: 'ESA' },
      { id: 'tgo-e2', missionId: 'tgo', eventType: 'milestone', timestamp: '2016-10-19', title: 'Mars Orbit Insertion', description: 'TGO enters Mars orbit; Schiaparelli lander crashes during EDL test', source: 'ESA' },
      { id: 'tgo-e3', missionId: 'tgo', eventType: 'science', timestamp: '2021-01-01', title: 'No Methane Detection', description: 'TGO finds no detectable global methane — puzzling given Curiosity\'s detections', source: 'ESA' },
    ],
    images: [
      { id: 'tgo-img-1', missionId: 'tgo', url: 'https://images-assets.nasa.gov/image/PIA21131/PIA21131~orig.jpg', title: 'ExoMars Trace Gas Orbiter at Mars — Artist Concept', date: '2016-10-01', source: 'ESA', sourceUrl: 'https://images.nasa.gov/details/PIA21131' },
    ],
    sourceUrl: 'https://exploration.esa.int/web/mars/-/48088-mission-overview',
    tags: ['orbiter', 'ESA', 'methane', 'trace gases', 'ExoMars'],
    aiInsights: [
      {
        id: 'tgo-ai-1',
        missionId: 'tgo',
        type: 'summary',
        content: 'TGO is chasing one of Mars\'s biggest mysteries: methane. On Earth, most methane is biological. Curiosity detected methane spikes, but TGO\'s far more sensitive global measurements have not confirmed a sustained source — setting up one of the most intriguing puzzles in planetary science today.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['ESA'],
      },
    ],
  },

  {
    id: 'insight',
    name: 'InSight',
    shortName: 'InSight',
    agency: 'NASA',
    destination: 'mars',
    missionType: 'lander',
    status: 'completed',
    launchDate: '2018-05-05',
    endDate: '2022-12-21',
    description:
      'InSight (Interior Exploration using Seismic Investigations, Geodesy and Heat Transport) was a Mars lander mission that studied the deep interior of Mars. It detected over 1,300 Marsquakes before dust accumulation on its solar panels ended operations.',
    objectives: [
      'Measure Martian seismic activity',
      'Determine the size, composition, and structure of Mars\'s core, mantle, and crust',
      'Measure the rate of heat escaping from the interior',
      'Study the impacts of meteorites on Mars',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA22743/PIA22743~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA22743/PIA22743~thumb.jpg',
    currentLocation: {
      description: 'Elysium Planitia, Mars — stationary lander, mission ended December 2022',
      label: 'OBSERVED',
      source: 'NASA',
    },
    surfaceLocation: {
      lat: 4.5024,
      lon: 135.6234,
      siteName: 'Elysium Planitia',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'landing', name: 'Landing', description: 'Successful landing in Elysium Planitia', isCompleted: true },
      { id: 'operations', name: 'Science Operations', description: 'Seismic monitoring and heat flow measurements', isCompleted: true },
      { id: 'eom', name: 'End of Mission', description: 'Solar panels incapacitated by dust accumulation', isCompleted: true },
    ],
    currentPhase: {
      id: 'eom',
      name: 'End of Mission',
      description: 'Mission concluded December 21, 2022 when power levels fell too low for operations',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'insight-lander',
        missionId: 'insight',
        name: 'InSight Lander',
        type: 'lander',
        description: 'Stationary lander carrying SEIS seismometer, HP³ heat flow probe, and RISE radio science experiment',
        massKg: { value: 694, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays (dust-covered at end of mission)',
        manufacturer: 'Lockheed Martin Space',
      },
    ],
    events: [
      { id: 'ins-e1', missionId: 'insight', eventType: 'launch', timestamp: '2018-05-05', title: 'Launch', description: 'First interplanetary launch from west coast of the US', source: 'NASA' },
      { id: 'ins-e2', missionId: 'insight', eventType: 'landing', timestamp: '2018-11-26', title: 'Landing in Elysium Planitia', description: 'InSight successfully lands on Mars', source: 'NASA' },
      { id: 'ins-e3', missionId: 'insight', eventType: 'science', timestamp: '2019-04-06', title: 'First Marsquake', description: 'InSight detects first likely seismic signal on Mars', source: 'NASA' },
      { id: 'ins-e4', missionId: 'insight', eventType: 'science', timestamp: '2022-05-04', title: 'Largest Marsquake', description: 'SEIS records magnitude 5 marsquake — largest ever detected', source: 'NASA' },
      { id: 'ins-e5', missionId: 'insight', eventType: 'milestone', timestamp: '2022-12-21', title: 'End of Mission', description: 'Last contact with InSight as power levels fall below operational threshold', source: 'NASA' },
    ],
    images: [
      { id: 'ins-img-1', missionId: 'insight', url: 'https://images-assets.nasa.gov/image/PIA22743/PIA22743~orig.jpg', title: 'InSight Lander Artist Concept', date: '2018-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA22743' },
    ],
    sourceUrl: 'https://mars.nasa.gov/insight/',
    tags: ['lander', 'seismology', 'interior', 'completed'],
    aiInsights: [
      {
        id: 'ins-ai-1',
        missionId: 'insight',
        type: 'summary',
        content: 'InSight revolutionized our understanding of Mars\'s interior — mapping the planet\'s crust, mantle, and core using seismology for the first time. Its data confirmed Mars has a surprisingly large, partially liquid iron core. Though the mission ended, the dataset continues to yield discoveries.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },
  // ============================================================
  // JUPITER MISSIONS
  // ============================================================
  {
    id: 'juno',
    name: 'Juno',
    shortName: 'Juno',
    agency: 'NASA',
    destination: 'jupiter',
    missionType: 'orbiter',
    status: 'science-operations',
    launchDate: '2011-08-05',
    description:
      'Juno is a NASA solar-powered spacecraft in polar orbit around Jupiter. It is the first spacecraft to orbit Jupiter since Galileo and the first to operate in the outer solar system on solar power alone. Juno studies Jupiter\'s composition, gravity field, magnetic field, and polar magnetosphere, seeking to understand the origin and evolution of the solar system\'s largest planet.',
    objectives: [
      'Determine the ratio of oxygen to hydrogen (water abundance) in Jupiter\'s atmosphere',
      'Map Jupiter\'s gravity and magnetic fields to reveal interior structure',
      'Map the three-dimensional structure of Jupiter\'s polar magnetosphere',
      'Explore the origin and evolution of Jupiter',
      'Investigate Jupiter\'s Great Red Spot and atmospheric dynamics',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA21771/PIA21771~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA21771/PIA21771~thumb.jpg',
    currentLocation: {
      description: 'Polar orbit around Jupiter, perijove ~4,200 km, apojove ~8.1 million km',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch & Cruise', description: 'Launched Aug 2011; Earth gravity assist Oct 2013', isCompleted: true },
      { id: 'joi', name: 'Jupiter Orbit Insertion', description: 'Entered Jupiter orbit July 2016', isCompleted: true },
      { id: 'primary', name: 'Primary Mission', description: '37 science orbits of Jupiter', isCompleted: true },
      { id: 'extended', name: 'Extended Mission', description: 'Additional orbits including Ganymede, Europa, and Io flybys', isCurrent: true },
    ],
    currentPhase: {
      id: 'extended',
      name: 'Extended Mission',
      description: 'Conducting close flybys of Jupiter\'s large moons — Ganymede, Europa, and Io — while continuing polar science',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'juno-sc',
        missionId: 'juno',
        name: 'Juno',
        type: 'orbiter',
        description: 'Solar-powered polar orbiter carrying 9 instruments including microwave radiometer (MWR), magnetometer, and JunoCam wide-angle imager.',
        massKg: { value: 3625, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Three 9-metre solar arrays — first deep-space mission powered by solar panels',
        manufacturer: 'Lockheed Martin Space',
        orbitalElements: {
          periapsis: { value: 4200, label: 'DERIVED', source: 'NASA', notes: 'Approximate perijove altitude' },
          apoapsis: { value: 8100000, label: 'DERIVED', source: 'NASA', notes: 'Approximate apojove' },
          inclination: { value: 90, label: 'DERIVED', source: 'NASA', notes: 'Near-polar orbit' },
          source: 'NASA',
          updatedAt: '2024-01-01',
        },
      },
    ],
    events: [
      { id: 'jun-e1', missionId: 'juno', eventType: 'launch', timestamp: '2011-08-05', title: 'Launch', description: 'Launched aboard Atlas V from Cape Canaveral', source: 'NASA' },
      { id: 'jun-e2', missionId: 'juno', eventType: 'flyby', timestamp: '2013-10-09', title: 'Earth Gravity Assist', description: 'Juno swings past Earth to gain speed for Jupiter', source: 'NASA' },
      { id: 'jun-e3', missionId: 'juno', eventType: 'milestone', timestamp: '2016-07-05', title: 'Jupiter Orbit Insertion', description: 'Juno fires main engine for 35 minutes to enter Jupiter orbit — completing a 5-year journey', source: 'NASA' },
      { id: 'jun-e4', missionId: 'juno', eventType: 'science', timestamp: '2021-06-07', title: 'Ganymede Flyby', description: 'Closest flyby of Ganymede since Galileo in 2000 — 1,038 km closest approach', source: 'NASA' },
      { id: 'jun-e5', missionId: 'juno', eventType: 'science', timestamp: '2022-09-29', title: 'Europa Flyby', description: 'Juno flies within 358 km of Europa — first close flyby since Galileo in 2000 — returning high-resolution surface images', source: 'NASA' },
      { id: 'jun-e6', missionId: 'juno', eventType: 'science', timestamp: '2023-12-30', title: 'Io Volcanic Flyby', description: 'Closest flyby of Io in over 20 years at 1,500 km — images reveal hundreds of active volcanic features', source: 'NASA' },
    ],
    images: [
      { id: 'jun-img-1', missionId: 'juno', url: 'https://images-assets.nasa.gov/image/PIA21771/PIA21771~orig.jpg', title: 'Jupiter by JunoCam — Great Red Spot', date: '2017-07-10', source: 'NASA', sourceUrl: 'https://images.nasa.gov/' },
    ],
    sourceUrl: 'https://www.nasa.gov/mission/juno/',
    tags: ['orbiter', 'Jupiter', 'magnetic field', 'interior', 'JunoCam', 'Io', 'Europa'],
    aiInsights: [
      {
        id: 'jun-ai-1',
        missionId: 'juno',
        type: 'summary',
        content: 'Juno has fundamentally changed our understanding of Jupiter. Its microwave radiometer penetrated hundreds of kilometers below the cloud tops, revealing that Jupiter\'s iconic banding and zones extend deep into the atmosphere — not just surface weather. The spacecraft also discovered a previously unknown class of polar storms and measured Jupiter\'s core to be larger and fuzzier than models predicted, suggesting a violent collision in the distant past.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'europa-clipper',
    name: 'Europa Clipper',
    shortName: 'Europa Clipper',
    agency: 'NASA',
    destination: 'jupiter',
    missionType: 'orbiter',
    status: 'cruise',
    launchDate: '2024-10-14',
    description:
      'Europa Clipper is NASA\'s largest planetary science spacecraft, launched in October 2024 on a SpaceX Falcon Heavy. It will conduct ~50 close flybys of Europa — Jupiter\'s ocean moon — to determine whether the icy moon\'s subsurface ocean could support life. Europa Clipper will arrive at Jupiter in April 2030 after a Mars gravity assist.',
    objectives: [
      'Determine the thickness of Europa\'s ice shell and confirm the presence of a subsurface ocean',
      'Investigate the composition of Europa\'s surface and ocean',
      'Characterize the geology of Europa\'s surface',
      'Search for plumes of water vapor erupting from the surface',
      'Assess Europa\'s potential habitability',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA25453/PIA25453~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA25453/PIA25453~thumb.jpg',
    currentLocation: {
      description: 'En route to Jupiter — cruise phase, Mars flyby Feb 2025, Earth flyby Dec 2026',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch', description: 'Launched Oct 14 2024 on SpaceX Falcon Heavy', isCompleted: true },
      { id: 'cruise', name: 'Cruise', description: 'Interplanetary cruise with Mars and Earth gravity assists', isCurrent: true },
      { id: 'joi', name: 'Jupiter Orbit Insertion', description: 'Planned Jupiter arrival April 2030', isFuture: true },
      { id: 'europa-flybys', name: 'Europa Flybys', description: '~50 close flybys of Europa over 4 years', isFuture: true },
    ],
    currentPhase: {
      id: 'cruise',
      name: 'Cruise',
      description: 'En route to Jupiter via Mars gravity assist (Feb 2025) and Earth gravity assist (Dec 2026)',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'clipper-sc',
        missionId: 'europa-clipper',
        name: 'Europa Clipper',
        type: 'orbiter',
        description: 'The largest planetary science spacecraft NASA has built, with solar arrays spanning 30.5 metres. Carries 9 science instruments including ice-penetrating radar (REASON), mass spectrometer (MASPEX), magnetometer, and thermal imager.',
        massKg: { value: 6065, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays (30.5 m span) — largest ever on a planetary science spacecraft',
        manufacturer: 'Johns Hopkins Applied Physics Laboratory / Jet Propulsion Laboratory',
        orbitalElements: {
          source: 'NASA',
          updatedAt: '2024-10-14',
        },
      },
    ],
    events: [
      { id: 'ec-e1', missionId: 'europa-clipper', eventType: 'launch', timestamp: '2024-10-14', title: 'Launch', description: 'Launched on SpaceX Falcon Heavy from Kennedy Space Center — the most powerful rocket ever used for a planetary science mission', source: 'NASA', sourceUrl: 'https://europa.nasa.gov/' },
      { id: 'ec-e2', missionId: 'europa-clipper', eventType: 'flyby', timestamp: '2025-02-28', title: 'Mars Gravity Assist', description: 'Europa Clipper flies past Mars to gain speed toward the outer solar system', source: 'NASA' },
      { id: 'ec-e3', missionId: 'europa-clipper', eventType: 'flyby', timestamp: '2026-12-01', title: 'Earth Gravity Assist', description: 'Final gravity assist — Europa Clipper swings past Earth for final trajectory toward Jupiter', source: 'NASA' },
      { id: 'ec-e4', missionId: 'europa-clipper', eventType: 'milestone', timestamp: '2030-04-11', title: 'Jupiter Orbit Insertion', description: 'Planned arrival at Jupiter and insertion into orbit', source: 'NASA' },
    ],
    images: [
      { id: 'ec-img-1', missionId: 'europa-clipper', url: 'https://images-assets.nasa.gov/image/PIA25453/PIA25453~orig.jpg', title: 'Europa Clipper Artist Concept', date: '2024-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/' },
    ],
    sourceUrl: 'https://europa.nasa.gov/',
    tags: ['orbiter', 'Jupiter', 'Europa', 'ocean', 'habitability', 'cruise'],
    aiInsights: [
      {
        id: 'ec-ai-1',
        missionId: 'europa-clipper',
        type: 'summary',
        content: 'Europa Clipper is one of the most anticipated missions in planetary science. Europa almost certainly harbors a global saltwater ocean twice the volume of all Earth\'s oceans, kept liquid by tidal heating from Jupiter\'s gravity. If the ocean has contact with a rocky seafloor, the ingredients for life — liquid water, chemistry, and energy — could all be present. Europa Clipper will answer, once and for all, whether this ocean world is habitable.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'juice',
    name: 'Jupiter Icy Moons Explorer',
    shortName: 'JUICE',
    agency: 'ESA',
    destination: 'jupiter',
    missionType: 'orbiter',
    status: 'cruise',
    launchDate: '2023-04-14',
    description:
      'JUICE (Jupiter Icy Moons Explorer) is ESA\'s flagship mission to the Jupiter system, launched in April 2023. It will perform detailed observations of Jupiter and three of its large moons — Ganymede, Callisto, and Europa — before becoming the first spacecraft to orbit a moon other than our own, entering orbit around Ganymede in 2034.',
    objectives: [
      'Characterise Ganymede as a potential habitat and planetary body',
      'Study the ocean layers of Ganymede, Europa, and Callisto',
      'Investigate Jupiter\'s atmosphere and magnetosphere',
      'Study the interaction between Jupiter and its icy moons',
      'Become the first spacecraft to orbit Ganymede',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA25977/PIA25977~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA25977/PIA25977~thumb.jpg',
    currentLocation: {
      description: 'En route to Jupiter — cruise phase, Venus/Earth gravity assists 2024–2026',
      label: 'DERIVED',
      source: 'ESA',
    },
    phases: [
      { id: 'launch', name: 'Launch', description: 'Launched Apr 14 2023 on Ariane 5 from Kourou', isCompleted: true },
      { id: 'cruise', name: 'Cruise', description: 'Gravity assists: Earth (Aug 2024), Venus (Aug 2025), Earth (Sep 2026), Earth (Nov 2029)', isCurrent: true },
      { id: 'joi', name: 'Jupiter Orbit Insertion', description: 'Planned Jupiter arrival July 2031', isFuture: true },
      { id: 'moon-flybys', name: 'Moon Flybys', description: 'Multiple Ganymede, Callisto, and Europa flybys', isFuture: true },
      { id: 'ganymede-orbit', name: 'Ganymede Orbit', description: 'First spacecraft to orbit Ganymede — from Dec 2034', isFuture: true },
    ],
    currentPhase: {
      id: 'cruise',
      name: 'Cruise',
      description: 'En route to Jupiter via Venus and multiple Earth gravity assists through 2029',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'juice-sc',
        missionId: 'juice',
        name: 'JUICE',
        type: 'orbiter',
        description: 'ESA flagship planetary orbiter carrying 10 science instruments including RIME ice-penetrating radar, JANUS camera, and MAJIS imaging spectrometer.',
        massKg: { value: 6070, label: 'OBSERVED', source: 'ESA' },
        powerSource: 'Solar arrays (85 m² total area)',
        manufacturer: 'Airbus Defence and Space',
        orbitalElements: {
          source: 'ESA',
          updatedAt: '2023-04-14',
        },
      },
    ],
    events: [
      { id: 'jui-e1', missionId: 'juice', eventType: 'launch', timestamp: '2023-04-14', title: 'Launch', description: 'Launched on Ariane 5 from Guiana Space Centre — last Ariane 5 planetary science mission', source: 'ESA' },
      { id: 'jui-e2', missionId: 'juice', eventType: 'flyby', timestamp: '2024-08-20', title: 'Earth–Moon Flyby', description: 'First-ever simultaneous Earth and Moon gravity assist — JUICE photographs both bodies', source: 'ESA' },
      { id: 'jui-e3', missionId: 'juice', eventType: 'milestone', timestamp: '2031-07-01', title: 'Jupiter Arrival (Planned)', description: 'Planned Jupiter orbit insertion after 8-year cruise', source: 'ESA' },
      { id: 'jui-e4', missionId: 'juice', eventType: 'milestone', timestamp: '2034-12-01', title: 'Ganymede Orbit Insertion (Planned)', description: 'First spacecraft to orbit a moon other than Earth\'s — Ganymede', source: 'ESA' },
    ],
    images: [
      { id: 'jui-img-1', missionId: 'juice', url: 'https://images-assets.nasa.gov/image/PIA25977/PIA25977~orig.jpg', title: 'JUICE Artist Concept near Ganymede', date: '2023-04-14', source: 'ESA', sourceUrl: 'https://images.nasa.gov/details/PIA25977' },
    ],
    sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/Juice',
    tags: ['orbiter', 'Jupiter', 'Ganymede', 'Callisto', 'Europa', 'ocean', 'ESA', 'cruise'],
    aiInsights: [
      {
        id: 'jui-ai-1',
        missionId: 'juice',
        type: 'summary',
        content: 'JUICE will make history as the first spacecraft to orbit a moon other than our own — Ganymede, which is larger than Mercury and harbours a subsurface ocean and its own magnetic field. Together with Europa Clipper, JUICE will give us an unprecedented dual view of the Jovian system, dramatically advancing the search for habitable environments beyond Earth.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['ESA'],
      },
    ],
  },

  {
    id: 'galileo',
    name: 'Galileo',
    shortName: 'Galileo',
    agency: 'NASA',
    destination: 'jupiter',
    missionType: 'orbiter',
    status: 'completed',
    launchDate: '1989-10-18',
    endDate: '2003-09-21',
    description:
      'Galileo was NASA\'s first dedicated Jupiter orbiter, delivering the only atmospheric probe ever sent into Jupiter\'s atmosphere. It orbited Jupiter for 8 years (1995–2003), conducting 35 orbits and making close flybys of all four Galilean moons. Among its greatest discoveries: strong evidence for a liquid saltwater ocean beneath Europa\'s ice crust — the most significant single finding for the possibility of extraterrestrial life in the solar system.',
    objectives: [
      'Study Jupiter\'s atmosphere, clouds, and lightning',
      'Characterise the Galilean moons — Io, Europa, Ganymede, Callisto',
      'Search for evidence of subsurface oceans on Europa, Ganymede, and Callisto',
      'Investigate Jupiter\'s magnetosphere',
      'Deploy an atmospheric probe into Jupiter',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA01299/PIA01299~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA01299/PIA01299~thumb.jpg',
    currentLocation: {
      description: 'Destroyed in Jupiter\'s atmosphere — intentional deorbit 21 September 2003',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch & Venus–Earth Cruise', description: 'Launched Oct 1989; Venus and two Earth gravity assists', isCompleted: true },
      { id: 'probe', name: 'Atmospheric Probe Release', description: 'Probe released July 1995; entered Jupiter July 13 1995', isCompleted: true },
      { id: 'primary', name: 'Primary Mission', description: '11 orbits studying Jupiter and Galilean moons 1995–1997', isCompleted: true },
      { id: 'extended', name: 'Galileo Millennium Mission', description: 'Extended mission with Europa, Io, Ganymede flybys 1997–2003', isCompleted: true },
      { id: 'eom', name: 'End of Mission', description: 'Deorbited into Jupiter Sep 21 2003 to protect Europa from contamination', isCompleted: true },
    ],
    currentPhase: {
      id: 'eom',
      name: 'Mission Concluded',
      description: 'Galileo was intentionally crashed into Jupiter on 21 September 2003 after 8 years in orbit',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'galileo-orbiter',
        missionId: 'galileo',
        name: 'Galileo Orbiter',
        type: 'orbiter',
        description: 'NASA flagship Jupiter orbiter carrying camera, infrared spectrometer, ultraviolet spectrometer, magnetometer, and plasma instruments. Operated 35 orbits over 8 years.',
        massKg: { value: 2223, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Two radioisotope thermoelectric generators (RTGs)',
        manufacturer: 'Jet Propulsion Laboratory',
      },
      {
        id: 'galileo-probe',
        missionId: 'galileo',
        name: 'Galileo Atmospheric Probe',
        type: 'lander',
        description: 'The only spacecraft ever to enter Jupiter\'s atmosphere. Deployed July 13 1995; survived 57.6 minutes, descending 156 km into the atmosphere before being crushed by pressure.',
        massKg: { value: 339, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Lithium sulfur dioxide batteries',
        manufacturer: 'Hughes Aircraft / Ames Research Center',
      },
    ],
    events: [
      { id: 'gal-e1', missionId: 'galileo', eventType: 'launch', timestamp: '1989-10-18', title: 'Launch', description: 'Launched from Space Shuttle Atlantis (STS-34)', source: 'NASA' },
      { id: 'gal-e2', missionId: 'galileo', eventType: 'science', timestamp: '1994-07-16', title: 'Shoemaker–Levy 9 Impact', description: 'Galileo is the only spacecraft with a direct view of comet Shoemaker–Levy 9 impacting Jupiter', source: 'NASA' },
      { id: 'gal-e3', missionId: 'galileo', eventType: 'milestone', timestamp: '1995-07-13', title: 'Atmospheric Probe Released', description: 'Galileo releases its atmospheric probe five months before Jupiter arrival', source: 'NASA' },
      { id: 'gal-e4', missionId: 'galileo', eventType: 'landing', timestamp: '1995-12-07', title: 'Probe Enters Jupiter', description: 'The probe descends into Jupiter\'s atmosphere, transmitting 57 minutes of data before being crushed', source: 'NASA' },
      { id: 'gal-e5', missionId: 'galileo', eventType: 'science', timestamp: '1997-02-20', title: 'Europa Ocean Evidence', description: 'Galileo magnetometer data provides strong evidence for a liquid saltwater ocean beneath Europa\'s ice crust', source: 'NASA' },
      { id: 'gal-e6', missionId: 'galileo', eventType: 'milestone', timestamp: '2003-09-21', title: 'End of Mission', description: 'Galileo deorbited into Jupiter to prevent contamination of Europa\'s ocean — transmitting data to the last second', source: 'NASA' },
    ],
    images: [
      { id: 'gal-img-1', missionId: 'galileo', url: 'https://images-assets.nasa.gov/image/PIA01299/PIA01299~orig.jpg', title: 'Europa Close-Up — Galileo', date: '1998-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/' },
    ],
    sourceUrl: 'https://solarsystem.nasa.gov/missions/galileo/overview/',
    tags: ['orbiter', 'Jupiter', 'Europa', 'ocean', 'atmospheric probe', 'Galilean moons', 'completed'],
    aiInsights: [
      {
        id: 'gal-ai-1',
        missionId: 'galileo',
        type: 'summary',
        content: 'Galileo made one of the most consequential discoveries in planetary science: strong evidence for a global saltwater ocean beneath Europa\'s icy surface. This finding, derived from anomalies in Europa\'s magnetic field, transformed our view of where life might exist in the solar system. It directly inspired both Europa Clipper and the ongoing search for habitable ocean worlds.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  // ============================================================
  // SATURN MISSIONS
  // ============================================================
  {
    id: 'cassini',
    name: 'Cassini–Huygens',
    shortName: 'Cassini',
    agency: 'NASA / ESA / ASI',
    agencies: ['NASA', 'ESA'],
    destination: 'saturn',
    missionType: 'orbiter',
    status: 'completed',
    launchDate: '1997-10-15',
    endDate: '2017-09-15',
    description:
      'Cassini–Huygens was a flagship-class NASA–ESA–ASI robotic spacecraft mission that orbited Saturn for 13 years, studying the planet, its iconic ring system, and its moons. The Huygens probe, built by ESA, descended through the atmosphere of Titan and landed on its surface in 2005 — the most distant landing ever achieved. Cassini concluded its mission with a dramatic "Grand Finale" — 22 dives between Saturn and its rings — before intentionally plunging into the planet on 15 September 2017.',
    objectives: [
      'Characterize Saturn\'s atmosphere, ring system, and magnetic field',
      'Investigate Titan\'s thick atmosphere and hydrocarbon lakes',
      'Explore icy moons, especially Enceladus\'s ocean-venting geysers',
      'Land the Huygens probe on Titan',
      'Study Saturn\'s magnetosphere and aurora',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA17172/PIA17172~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA17172/PIA17172~thumb.jpg',
    currentLocation: {
      description: 'Destroyed in Saturn\'s atmosphere — Grand Finale dive, 15 September 2017',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch & Cruise', description: 'Launched Oct 1997 via Venus-Venus-Earth-Jupiter gravity assists', isCompleted: true },
      { id: 'saturn-orbit', name: 'Saturn Orbit Insertion', description: 'Entered Saturn orbit June 2004', isCompleted: true },
      { id: 'huygens', name: 'Huygens Titan Descent', description: 'Huygens probe released and landed on Titan January 2005', isCompleted: true },
      { id: 'primary', name: 'Primary Mission', description: '4-year primary science mission at Saturn', isCompleted: true },
      { id: 'extended', name: 'Extended Missions (Equinox & Solstice)', description: 'Two extended missions adding 9 more years of observation', isCompleted: true },
      { id: 'grand-finale', name: 'Grand Finale', description: '22 ring-gap dives before final atmospheric entry', isCompleted: true },
    ],
    currentPhase: {
      id: 'grand-finale',
      name: 'Grand Finale — Mission Concluded',
      description: 'Cassini made 22 passes between Saturn and its rings before plunging into the atmosphere on 15 September 2017',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'cassini-orbiter',
        missionId: 'cassini',
        name: 'Cassini Orbiter',
        type: 'orbiter',
        description: 'NASA flagship orbiter carrying 12 scientific instruments including radar (for Titan mapping), visible/infrared cameras, and magnetometer. Operated for 13 years in the Saturn system.',
        massKg: { value: 2523, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Three radioisotope thermoelectric generators (RTGs)',
        manufacturer: 'Jet Propulsion Laboratory / Aerojet',
      },
      {
        id: 'huygens-probe',
        missionId: 'cassini',
        name: 'Huygens Probe',
        type: 'lander',
        description: 'ESA-built atmospheric entry probe that descended through Titan\'s atmosphere over 2.5 hours and survived on the surface for 72 minutes, returning images and atmospheric data.',
        massKg: { value: 320, label: 'OBSERVED', source: 'ESA' },
        powerSource: 'Lithium batteries',
        manufacturer: 'Aerospatiale / Alcatel',
      },
    ],
    events: [
      { id: 'cas-e1', missionId: 'cassini', eventType: 'launch', timestamp: '1997-10-15', title: 'Launch', description: 'Launched aboard Titan IVB/Centaur from Cape Canaveral', source: 'NASA' },
      { id: 'cas-e2', missionId: 'cassini', eventType: 'flyby', timestamp: '2000-12-30', title: 'Jupiter Flyby', description: 'Cassini performs gravity assist at Jupiter, returning the highest-resolution Jupiter images of the time', source: 'NASA' },
      { id: 'cas-e3', missionId: 'cassini', eventType: 'milestone', timestamp: '2004-06-30', title: 'Saturn Orbit Insertion', description: 'Cassini fires its main engine for 96 minutes, successfully entering Saturn orbit', source: 'NASA' },
      { id: 'cas-e4', missionId: 'cassini', eventType: 'landing', timestamp: '2005-01-14', title: 'Huygens Lands on Titan', description: 'Huygens probe descends through Titan\'s thick atmosphere and lands, revealing lakes and river channels of liquid methane', source: 'ESA' },
      { id: 'cas-e5', missionId: 'cassini', eventType: 'science', timestamp: '2005-07-14', title: 'Enceladus Geysers Discovered', description: 'Cassini discovers active water-ice geysers erupting from Enceladus\'s south pole — evidence of a subsurface liquid ocean', source: 'NASA' },
      { id: 'cas-e6', missionId: 'cassini', eventType: 'science', timestamp: '2017-04-26', title: 'Grand Finale Begins', description: 'Cassini begins 22 ring-gap dives — the first spacecraft to enter the gap between Saturn and its innermost ring', source: 'NASA' },
      { id: 'cas-e7', missionId: 'cassini', eventType: 'milestone', timestamp: '2017-09-15', title: 'End of Mission', description: 'Cassini plunges into Saturn\'s atmosphere, transmitting data to the last second to avoid contaminating Enceladus or Titan', source: 'NASA' },
    ],
    images: [
      { id: 'cas-img-1', missionId: 'cassini', url: 'https://images-assets.nasa.gov/image/PIA17172/PIA17172~orig.jpg', title: 'Saturn by Cassini — "The Day the Earth Smiled"', date: '2013-07-19', source: 'NASA', sourceUrl: 'https://images.nasa.gov/' },
      { id: 'cas-img-2', missionId: 'cassini', url: 'https://images-assets.nasa.gov/image/PIA06193/PIA06193~orig.jpg', title: 'Huygens Descent View of Titan', date: '2005-01-14', source: 'ESA', sourceUrl: 'https://images.nasa.gov/' },
    ],
    sourceUrl: 'https://saturn.jpl.nasa.gov/',
    tags: ['orbiter', 'Saturn', 'Titan', 'Enceladus', 'rings', 'Huygens', 'completed'],
    aiInsights: [
      {
        id: 'cas-ai-1',
        missionId: 'cassini',
        type: 'summary',
        content: 'Cassini is one of the most scientifically productive missions in planetary history. It discovered that Enceladus — a small icy moon — erupts salty water geysers from a subsurface ocean, making it one of the most promising places in the solar system to search for life. The Huygens probe revealed Titan as an alien world with rivers, lakes, and rain — all made of methane rather than water.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA', 'ESA'],
      },
    ],
  },

  {
    id: 'dragonfly',
    name: 'Dragonfly',
    shortName: 'Dragonfly',
    agency: 'NASA',
    destination: 'saturn',
    missionType: 'lander',
    status: 'planned',
    launchDate: '2028-07-01',
    description:
      'Dragonfly is a NASA New Frontiers mission that will send a rotorcraft-lander to Saturn\'s moon Titan. Unlike any previous planetary mission, Dragonfly is a drone — it will fly from site to site across Titan\'s surface, covering more than 175 km over its mission lifetime and sampling multiple scientifically diverse locations. Titan\'s thick nitrogen atmosphere and low gravity make aerial mobility feasible. Dragonfly will search for the chemical signatures of prebiotic chemistry and assess Titan\'s habitability.',
    objectives: [
      'Investigate Titan\'s prebiotic chemistry relevant to the origins of life',
      'Characterize the habitability of Titan\'s environment',
      'Explore diverse geological and chemical environments from the air',
      'Study the composition of Titan\'s surface materials',
      'Measure atmospheric and meteorological conditions',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA23491/PIA23491~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA23491/PIA23491~thumb.jpg',
    currentLocation: {
      description: 'Under development at Johns Hopkins APL; planned launch July 2028',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'development', name: 'Development', description: 'Spacecraft design, testing, and assembly', isCurrent: true },
      { id: 'launch', name: 'Launch', description: 'Planned launch from Cape Canaveral', isFuture: true },
      { id: 'cruise', name: 'Cruise', description: '~6 year cruise to Titan', isFuture: true },
      { id: 'titan-ops', name: 'Titan Operations', description: 'Rotorcraft flights and surface science across Titan', isFuture: true },
    ],
    currentPhase: {
      id: 'development',
      name: 'Development',
      description: 'Spacecraft under development; planned launch July 2028 with Titan arrival ~2034',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'dragonfly-sc',
        missionId: 'dragonfly',
        name: 'Dragonfly Rotorcraft-Lander',
        type: 'lander',
        description: 'Dual-quadcopter rotorcraft capable of flying in Titan\'s dense atmosphere. Carries mass spectrometer, meteorological sensors, seismometer, and cameras. Powered by an RTG.',
        massKg: { value: 450, label: 'ESTIMATED', source: 'NASA', notes: 'Approximate pre-launch estimate' },
        powerSource: 'Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)',
        manufacturer: 'Johns Hopkins Applied Physics Laboratory',
      },
    ],
    events: [
      { id: 'drag-e1', missionId: 'dragonfly', eventType: 'milestone', timestamp: '2019-06-27', title: 'Mission Selected', description: 'NASA selects Dragonfly as the fourth New Frontiers mission', source: 'NASA', sourceUrl: 'https://www.nasa.gov/dragonfly' },
      { id: 'drag-e2', missionId: 'dragonfly', eventType: 'milestone', timestamp: '2024-01-01', title: 'Development Phase', description: 'Dragonfly enters full development; launch targeting July 2028', source: 'NASA' },
    ],
    images: [
      { id: 'drag-img-1', missionId: 'dragonfly', url: 'https://images-assets.nasa.gov/image/PIA23491/PIA23491~orig.jpg', title: 'Dragonfly on Titan Artist Concept', date: '2019-06-27', source: 'NASA', sourceUrl: 'https://images.nasa.gov/' },
    ],
    sourceUrl: 'https://dragonfly.jhuapl.edu/',
    tags: ['lander', 'rotorcraft', 'Titan', 'Saturn', 'astrobiology', 'planned'],
    aiInsights: [
      {
        id: 'drag-ai-1',
        missionId: 'dragonfly',
        type: 'summary',
        content: 'Dragonfly is a revolutionary mission concept — a flying laboratory on another world. Titan is the only moon with a thick atmosphere, and its prebiotic chemistry is thought to resemble early Earth before life emerged. By flying across hundreds of kilometers of terrain, Dragonfly can sample a variety of chemical environments in a way no rover ever could.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  // ============================================================
  // URANUS MISSIONS
  // ============================================================
  {
    id: 'voyager-2-uranus',
    name: 'Voyager 2 — Uranus Flyby',
    shortName: 'Voyager 2 / Uranus',
    agency: 'NASA',
    destination: 'uranus',
    missionType: 'flyby',
    status: 'completed',
    launchDate: '1977-08-20',
    endDate: '1986-01-24',
    description:
      'Voyager 2 is the only spacecraft ever to have visited Uranus. Launched in August 1977 on a Grand Tour trajectory exploiting a rare planetary alignment, it flew past Uranus on 24 January 1986 at a closest approach of 81,500 km. In 5.5 hours of close encounter it discovered 10 new moons, 2 new rings, measured Uranus\'s extreme axial tilt of 97.8°, and found a strangely offset magnetic field. Voyager 2 then continued to Neptune and is now in interstellar space.',
    objectives: [
      'Conduct close flyby and imaging of Uranus and its moons',
      'Measure Uranus\'s magnetic field and magnetosphere',
      'Characterize the ring system discovered from Earth in 1977',
      'Map atmospheric composition, temperature, and wind patterns',
      'Discover new moons and rings',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA00033/PIA00033~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA00033/PIA00033~thumb.jpg',
    currentLocation: {
      description: 'Interstellar space — approximately 140 AU from the Sun as of 2024',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch & Cruise', description: 'Launched Aug 1977; gravity assists at Jupiter and Saturn', isCompleted: true },
      { id: 'uranus-flyby', name: 'Uranus Flyby', description: 'Closest approach 24 January 1986', isCompleted: true },
      { id: 'neptune-flyby', name: 'Neptune Flyby', description: 'Closest approach 25 August 1989', isCompleted: true },
      { id: 'vims', name: 'Voyager Interstellar Mission', description: 'Ongoing science in interstellar space', isCompleted: false, isCurrent: true },
    ],
    currentPhase: {
      id: 'vims',
      name: 'Voyager Interstellar Mission',
      description: 'Voyager 2 crossed into interstellar space in November 2018 and continues transmitting data; contact maintained via DSN',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'voyager-2-sc',
        missionId: 'voyager-2-uranus',
        name: 'Voyager 2',
        type: 'probe',
        description: 'Spin-stabilized deep-space probe carrying 10 scientific instruments. The only spacecraft to visit all four ice and gas giants. Still communicating from interstellar space after 47 years.',
        massKg: { value: 722, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Three radioisotope thermoelectric generators (RTGs)',
        manufacturer: 'Jet Propulsion Laboratory',
      },
    ],
    events: [
      { id: 'v2u-e1', missionId: 'voyager-2-uranus', eventType: 'launch', timestamp: '1977-08-20', title: 'Launch', description: 'Launched aboard Titan IIIE/Centaur from Cape Canaveral', source: 'NASA' },
      { id: 'v2u-e2', missionId: 'voyager-2-uranus', eventType: 'flyby', timestamp: '1979-07-09', title: 'Jupiter Flyby', description: 'Gravity assist at Jupiter; discovers active volcanoes on Io', source: 'NASA' },
      { id: 'v2u-e3', missionId: 'voyager-2-uranus', eventType: 'flyby', timestamp: '1981-08-25', title: 'Saturn Flyby', description: 'Gravity assist at Saturn; images Titan and the rings in detail', source: 'NASA' },
      { id: 'v2u-e4', missionId: 'voyager-2-uranus', eventType: 'flyby', timestamp: '1986-01-24', title: 'Uranus Closest Approach', description: 'Only spacecraft to fly past Uranus — discovers 10 new moons, 2 new rings, measures magnetic field offset', source: 'NASA' },
      { id: 'v2u-e5', missionId: 'voyager-2-uranus', eventType: 'flyby', timestamp: '1989-08-25', title: 'Neptune Closest Approach', description: 'Flies past Neptune, discovers Triton geysers and Great Dark Spot', source: 'NASA' },
      { id: 'v2u-e6', missionId: 'voyager-2-uranus', eventType: 'milestone', timestamp: '2018-11-05', title: 'Crosses into Interstellar Space', description: 'Voyager 2 detected crossing the heliopause, entering interstellar space', source: 'NASA' },
    ],
    images: [
      { id: 'v2u-img-1', missionId: 'voyager-2-uranus', url: 'https://images-assets.nasa.gov/image/PIA00033/PIA00033~orig.jpg', title: 'Uranus in True Color — Voyager 2', date: '1986-01-17', source: 'NASA', sourceUrl: 'https://images.nasa.gov/' },
    ],
    sourceUrl: 'https://voyager.jpl.nasa.gov/',
    tags: ['flyby', 'Uranus', 'Grand Tour', 'interstellar', 'Voyager', 'completed'],
    aiInsights: [
      {
        id: 'v2u-ai-1',
        missionId: 'voyager-2-uranus',
        type: 'summary',
        content: 'Everything we know about Uranus from direct observation comes from a single 5.5-hour flyby in 1986. Voyager 2 found a planet tipped almost on its side with a magnetic field offset by 60° from the rotation axis — unlike any other planet. Its moons showed evidence of geological activity, and Miranda displayed one of the most fractured surfaces in the solar system. The 2023 Planetary Science Decadal Survey ranked a Uranus Orbiter and Probe as the highest-priority new flagship mission.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  // ============================================================
  // MERCURY MISSIONS
  // ============================================================
  {
    id: 'messenger',
    name: 'MESSENGER',
    shortName: 'MESSENGER',
    agency: 'NASA',
    destination: 'mercury',
    missionType: 'orbiter',
    status: 'completed',
    launchDate: '2004-08-03',
    endDate: '2015-04-30',
    description:
      'MESSENGER (MErcury Surface, Space ENvironment, GEochemistry, and Ranging) was NASA\'s first spacecraft to orbit Mercury. Launched in August 2004, it reached Mercury orbit in March 2011 after a 6.6-year journey that included flybys of Earth, Venus, and Mercury itself. MESSENGER mapped the entire surface of Mercury for the first time and made several major discoveries before its intentional impact on the surface on 30 April 2015.',
    objectives: [
      'Map the entire surface of Mercury in multiple wavelengths',
      'Characterize the chemical composition of Mercury\'s surface',
      'Determine the structure of Mercury\'s core',
      'Characterize Mercury\'s magnetic field and its interaction with the solar wind',
      'Determine whether ice exists in permanently shadowed polar craters',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA16853/PIA16853~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA16853/PIA16853~thumb.jpg',
    currentLocation: {
      description: 'Impact site on Mercury\'s surface — intentional deorbit 30 April 2015',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch & Cruise', description: 'Launched Aug 2004; Earth, Venus, and Mercury gravity assists', isCompleted: true },
      { id: 'mercury-orbit', name: 'Mercury Orbit Insertion', description: 'Entered Mercury orbit 18 March 2011', isCompleted: true },
      { id: 'primary', name: 'Primary Mission', description: 'One Earth year of systematic Mercury mapping', isCompleted: true },
      { id: 'extended', name: 'Extended Mission', description: 'Two extended missions with low-altitude science passes', isCompleted: true },
      { id: 'eom', name: 'End of Mission', description: 'Fuel exhausted; impacted Mercury surface 30 April 2015', isCompleted: true },
    ],
    currentPhase: {
      id: 'eom',
      name: 'Mission Concluded',
      description: 'MESSENGER impacted Mercury at ~3.91 km/s on 30 April 2015 after exhausting all propellant',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'messenger-sc',
        missionId: 'messenger',
        name: 'MESSENGER',
        type: 'orbiter',
        description: 'Compact orbiter carrying 7 scientific instruments including MDIS imager, XRS/GRS spectrometers, magnetometer, and laser altimeter. Designed to survive Mercury\'s intense solar environment.',
        massKg: { value: 1107, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays with ceramic cloth sunshade',
        manufacturer: 'Johns Hopkins Applied Physics Laboratory',
      },
    ],
    events: [
      { id: 'msg-e1', missionId: 'messenger', eventType: 'launch', timestamp: '2004-08-03', title: 'Launch', description: 'Launched aboard Boeing Delta II from Cape Canaveral', source: 'NASA', sourceUrl: 'https://messenger.jhuapl.edu/' },
      { id: 'msg-e2', missionId: 'messenger', eventType: 'flyby', timestamp: '2008-01-14', title: 'First Mercury Flyby', description: 'First of three Mercury gravity-assist flybys — first spacecraft at Mercury since Mariner 10', source: 'NASA' },
      { id: 'msg-e3', missionId: 'messenger', eventType: 'milestone', timestamp: '2011-03-18', title: 'Mercury Orbit Insertion', description: 'MESSENGER becomes the first spacecraft to orbit Mercury', source: 'NASA' },
      { id: 'msg-e4', missionId: 'messenger', eventType: 'science', timestamp: '2012-01-01', title: 'Full Surface Map Complete', description: 'MESSENGER completes first-ever global map of Mercury', source: 'NASA' },
      { id: 'msg-e5', missionId: 'messenger', eventType: 'science', timestamp: '2012-11-29', title: 'Water Ice Confirmed', description: 'MESSENGER confirms water ice in permanently shadowed polar craters', source: 'NASA' },
      { id: 'msg-e6', missionId: 'messenger', eventType: 'milestone', timestamp: '2015-04-30', title: 'End of Mission', description: 'MESSENGER impacts Mercury surface at ~3.91 km/s after fuel exhaustion', source: 'NASA' },
    ],
    images: [
      { id: 'msg-img-1', missionId: 'messenger', url: 'https://images-assets.nasa.gov/image/PIA16853/PIA16853~orig.jpg', title: 'Mercury from MESSENGER — Color Global View', date: '2013-02-14', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA16853' },
    ],
    sourceUrl: 'https://messenger.jhuapl.edu/',
    tags: ['orbiter', 'Mercury', 'completed', 'surface mapping', 'water ice', 'magnetic field'],
    aiInsights: [
      {
        id: 'msg-ai-1',
        missionId: 'messenger',
        type: 'summary',
        content: 'MESSENGER transformed our understanding of Mercury — the most underexplored terrestrial planet. It discovered that Mercury has a surprisingly large iron core comprising ~85% of the planet\'s radius, confirmed water ice in permanently shadowed polar craters despite Mercury being the closest planet to the Sun, and found evidence of past volcanic activity across the entire surface. These findings directly motivate the BepiColombo mission now en route.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'bepicolombo',
    name: 'BepiColombo',
    shortName: 'BepiColombo',
    agency: 'ESA / JAXA',
    agencies: ['ESA', 'JAXA'],
    destination: 'mercury',
    missionType: 'orbiter',
    status: 'cruise',
    launchDate: '2018-10-20',
    description:
      'BepiColombo is a joint ESA–JAXA mission to Mercury, the least explored inner planet. The spacecraft stack comprises two orbiters — ESA\'s Mercury Planetary Orbiter (MPO) and JAXA\'s Mercury Magnetospheric Orbiter (Mio) — riding together during a 7-year cruise phase with six Mercury flybys. Mercury orbit insertion is planned for November 2026, with routine science operations beginning in early 2027.',
    objectives: [
      'Investigate Mercury\'s origin and evolution',
      'Study the structure and dynamics of Mercury\'s magnetic field',
      'Characterize Mercury\'s exosphere and its interaction with the solar wind',
      'Map Mercury\'s surface composition and geology',
      'Investigate Mercury\'s internal structure and large iron core',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA24031/PIA24031~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA24031/PIA24031~thumb.jpg',
    currentLocation: {
      description: 'En route to Mercury — sixth Mercury flyby completed Jan 2025; Mercury orbit insertion planned Nov 2026',
      label: 'DERIVED',
      source: 'ESA',
    },
    phases: [
      { id: 'launch', name: 'Launch', description: 'Launched 20 Oct 2018 on Ariane 5 from Kourou', isCompleted: true },
      { id: 'cruise', name: 'Cruise & Flybys', description: 'Earth flyby (Apr 2020), two Venus flybys (Oct 2020, Aug 2021), six Mercury gravity-assist flybys (2021–2025)', isCurrent: true },
      { id: 'moi', name: 'Mercury Orbit Insertion', description: 'Planned November 2026 — separation of MPO and Mio into their science orbits', isFuture: true },
      { id: 'science', name: 'Science Operations', description: 'Routine science operations from early 2027', isFuture: true },
    ],
    currentPhase: {
      id: 'cruise',
      name: 'Cruise',
      description: 'Sixth Mercury flyby completed January 2025; spacecraft on final approach for Mercury orbit insertion in November 2026',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'mpo',
        missionId: 'bepicolombo',
        name: 'Mercury Planetary Orbiter (MPO)',
        type: 'orbiter',
        description: 'ESA\'s three-axis stabilised orbiter carrying 11 scientific instruments including BELA laser altimeter, SIMBIO-SYS camera suite, and MERMAG magnetometer. Will operate in a 480 × 1500 km Mercury orbit.',
        massKg: { value: 1150, label: 'OBSERVED', source: 'ESA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Airbus Defence and Space',
      },
      {
        id: 'mio',
        missionId: 'bepicolombo',
        name: 'Mercury Magnetospheric Orbiter (Mio)',
        type: 'orbiter',
        description: 'JAXA\'s spin-stabilised orbiter carrying 5 instruments focused on Mercury\'s magnetosphere, exosphere, and solar wind interaction. Will operate in a 590 × 11640 km orbit.',
        massKg: { value: 255, label: 'OBSERVED', source: 'JAXA' },
        powerSource: 'Solar arrays',
        manufacturer: 'NEC Corporation',
      },
    ],
    events: [
      { id: 'bep-e1', missionId: 'bepicolombo', eventType: 'launch', timestamp: '2018-10-20', title: 'Launch', description: 'Launched on Ariane 5 from Guiana Space Centre', source: 'ESA', sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo' },
      { id: 'bep-e2', missionId: 'bepicolombo', eventType: 'flyby', timestamp: '2021-10-01', title: 'First Mercury Flyby', description: 'BepiColombo conducts its first gravity-assist flyby of Mercury on 1 October 2021', source: 'ESA' },
      { id: 'bep-e3', missionId: 'bepicolombo', eventType: 'flyby', timestamp: '2025-01-08', title: 'Sixth Mercury Flyby', description: 'Sixth and final Mercury gravity-assist flyby completed 8 January 2025', source: 'ESA' },
      { id: 'bep-e4', missionId: 'bepicolombo', eventType: 'milestone', timestamp: '2026-11-01', title: 'Mercury Orbit Insertion (Planned)', description: 'Planned Mercury orbit insertion — ESA lists November 2026 as the target date', source: 'ESA' },
      { id: 'bep-e5', missionId: 'bepicolombo', eventType: 'milestone', timestamp: '2027-03-01', title: 'Routine Science Operations (Planned)', description: 'Routine science operations from MPO and Mio expected to begin in early 2027', source: 'ESA' },
    ],
    images: [
      { id: 'bep-img-1', missionId: 'bepicolombo', url: 'https://images-assets.nasa.gov/image/PIA24031/PIA24031~orig.jpg', title: 'BepiColombo Artist Concept at Mercury', date: '2018-10-20', source: 'ESA', sourceUrl: 'https://images.nasa.gov/details/PIA24031' },
    ],
    sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/BepiColombo',
    tags: ['orbiter', 'Mercury', 'ESA', 'JAXA', 'cruise', 'magnetosphere'],
    aiInsights: [
      {
        id: 'bep-ai-1',
        missionId: 'bepicolombo',
        type: 'summary',
        content: 'BepiColombo is Europe and Japan\'s most ambitious inner solar system mission. By flying two complementary orbiters simultaneously — one focused on the surface and interior, the other on the magnetosphere — it will deliver a more complete picture of Mercury than MESSENGER alone could achieve. Its arrival in November 2026 will reopen the book on the solar system\'s most enigmatic terrestrial planet.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['ESA', 'JAXA'],
      },
      {
        id: 'bep-ai-2',
        missionId: 'bepicolombo',
        type: 'current-status',
        content: 'As of 2025, BepiColombo is on its final approach to Mercury following its sixth and last gravity-assist flyby in January 2025. ESA has confirmed Mercury orbit insertion for November 2026, with MPO and Mio separating into their individual science orbits. Routine science operations are expected to begin in early 2027. The spacecraft is healthy and all instruments are nominal.',
        confidence: 'high',
        createdAt: '2025-01-01',
        basedOn: ['ESA'],
      },
    ],
  },

  // ============================================================
  // VENUS MISSIONS
  // ============================================================
  {
    id: 'akatsuki',
    name: 'Akatsuki (Venus Climate Orbiter)',
    shortName: 'Akatsuki',
    agency: 'JAXA',
    destination: 'venus',
    missionType: 'orbiter',
    status: 'completed',
    launchDate: '2010-05-21',
    endDate: '2025-09-01',
    description:
      'Akatsuki (あかつき, "Dawn") was JAXA\'s Venus Climate Orbiter — Japan\'s first planetary orbiter to study another planet. After a failed Venus orbit insertion in 2010, mission controllers improvised a rescue trajectory using the spacecraft\'s attitude-control thrusters, successfully entering Venus orbit in December 2015. Akatsuki studied Venusian cloud dynamics, lightning, and atmospheric circulation until JAXA officially ended operations in September 2025.',
    objectives: [
      'Observe Venus\'s cloud structure and atmospheric dynamics in multiple wavelengths',
      'Investigate the super-rotation of Venus\'s atmosphere',
      'Search for active volcanism and lightning on Venus',
      'Study Venus\'s heat balance and atmospheric chemistry',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA23791/PIA23791~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA23791/PIA23791~thumb.jpg',
    currentLocation: {
      description: 'Heliocentric orbit — operations ended September 2025 after loss of attitude control',
      label: 'OBSERVED',
      source: 'JAXA',
    },
    phases: [
      { id: 'launch', name: 'Launch', description: 'Launched 21 May 2010 on H-IIA from Tanegashima', isCompleted: true },
      { id: 'failed-voi', name: 'Failed Venus Orbit Insertion', description: 'Main engine failure on 7 December 2010; spacecraft placed in heliocentric orbit', isCompleted: true },
      { id: 'rescue', name: 'Rescue Trajectory', description: 'Five-year heliocentric orbit; attitude thrusters used for second VOI attempt', isCompleted: true },
      { id: 'venus-orbit', name: 'Venus Orbit', description: 'Successfully entered Venus orbit 7 December 2015; science operations conducted', isCompleted: true },
      { id: 'eom', name: 'End of Mission', description: 'JAXA officially ended Akatsuki operations September 2025 following loss of attitude control', isCompleted: true },
    ],
    currentPhase: {
      id: 'eom',
      name: 'Mission Concluded',
      description: 'JAXA officially ended Akatsuki operations in September 2025 following progressive loss of attitude control capability',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'akatsuki-sc',
        missionId: 'akatsuki',
        name: 'Akatsuki',
        type: 'orbiter',
        description: 'Spin-stabilised Venus orbiter carrying five cameras observing Venus at ultraviolet, visible, and infrared wavelengths to study clouds, lightning, and atmospheric dynamics.',
        massKg: { value: 517, label: 'OBSERVED', source: 'JAXA' },
        powerSource: 'Solar arrays',
        manufacturer: 'NEC Toshiba Space Systems / JAXA',
      },
    ],
    events: [
      { id: 'aka-e1', missionId: 'akatsuki', eventType: 'launch', timestamp: '2010-05-21', title: 'Launch', description: 'Launched aboard H-IIA rocket from Tanegashima Space Center', source: 'JAXA' },
      { id: 'aka-e2', missionId: 'akatsuki', eventType: 'milestone', timestamp: '2010-12-07', title: 'Failed Venus Orbit Insertion', description: 'Main engine fails during Venus orbit insertion burn; spacecraft escapes into heliocentric orbit', source: 'JAXA' },
      { id: 'aka-e3', missionId: 'akatsuki', eventType: 'milestone', timestamp: '2015-12-07', title: 'Successful Venus Orbit Insertion', description: 'Using attitude control thrusters, Akatsuki enters Venus orbit exactly 5 years after the failed attempt', source: 'JAXA' },
      { id: 'aka-e4', missionId: 'akatsuki', eventType: 'science', timestamp: '2017-01-16', title: 'Bow Shock Wave Discovered', description: 'Akatsuki images a massive stationary gravity wave spanning Venus\'s entire southern hemisphere', source: 'JAXA' },
      { id: 'aka-e5', missionId: 'akatsuki', eventType: 'milestone', timestamp: '2025-09-01', title: 'End of Mission', description: 'JAXA officially ends Akatsuki operations following progressive loss of attitude control capability', source: 'JAXA' },
    ],
    images: [
      { id: 'aka-img-1', missionId: 'akatsuki', url: 'https://images-assets.nasa.gov/image/PIA23791/PIA23791~orig.jpg', title: 'Venus Ultraviolet View — Akatsuki', date: '2018-01-01', source: 'JAXA', sourceUrl: 'https://images.nasa.gov/details/PIA23791' },
    ],
    sourceUrl: 'https://global.jaxa.jp/projects/sas/planet_c/',
    tags: ['orbiter', 'Venus', 'JAXA', 'atmosphere', 'completed'],
    aiInsights: [
      {
        id: 'aka-ai-1',
        missionId: 'akatsuki',
        type: 'summary',
        content: 'Akatsuki\'s story is one of the most remarkable rescues in planetary science history. A stuck thruster valve that ended its first orbit insertion attempt should have been mission-ending — but JAXA engineers devised a 5-year rescue plan using only attitude-control thrusters, successfully inserting the spacecraft into a very different Venus orbit in 2015. From this orbit, Akatsuki observed Venus\'s super-rotating atmosphere and discovered an enormous stationary gravity wave in its cloud tops. Operations concluded in September 2025.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['JAXA'],
      },
    ],
  },

  {
    id: 'magellan',
    name: 'Magellan',
    shortName: 'Magellan',
    agency: 'NASA',
    destination: 'venus',
    missionType: 'orbiter',
    status: 'completed',
    launchDate: '1989-05-04',
    endDate: '1994-10-12',
    description:
      'Magellan was a NASA Venus radar-mapping orbiter that produced the first near-global map of Venus\'s surface using synthetic aperture radar (SAR). Launched from Space Shuttle Atlantis in May 1989, it reached Venus in August 1990 and mapped approximately 98% of the surface at resolutions as fine as 100 metres — revealing a geologically young, volcanically resurfaced world. Magellan was intentionally deorbited into Venus\'s atmosphere on 12 October 1994.',
    objectives: [
      'Map the surface of Venus at high resolution using synthetic aperture radar',
      'Characterize Venus\'s geological and tectonic features',
      'Measure the global topography of Venus',
      'Study Venus\'s gravity field',
      'Investigate atmospheric entry dynamics during final aerobraking',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA00271/PIA00271~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA00271/PIA00271~thumb.jpg',
    currentLocation: {
      description: 'Destroyed in Venus\'s atmosphere — intentional deorbit 12 October 1994',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'launch', name: 'Launch', description: 'Launched from Space Shuttle Atlantis (STS-30)', isCompleted: true },
      { id: 'cruise', name: 'Cruise', description: '15-month cruise to Venus', isCompleted: true },
      { id: 'mapping', name: 'Radar Mapping', description: 'Three primary mapping cycles covering ~98% of Venus', isCompleted: true },
      { id: 'gravity', name: 'Gravity Mapping', description: 'Aerobraking and gravitational science', isCompleted: true },
      { id: 'eom', name: 'End of Mission', description: 'Intentional deorbit for atmospheric entry experiment', isCompleted: true },
    ],
    currentPhase: {
      id: 'eom',
      name: 'Mission Concluded',
      description: 'Magellan was intentionally deorbited into Venus\'s atmosphere on 12 October 1994',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'magellan-sc',
        missionId: 'magellan',
        name: 'Magellan',
        type: 'orbiter',
        description: 'Venus radar mapper carrying a synthetic aperture radar (SAR) with 12.6 cm wavelength, altimeter, and radiometer. Used Magellan\'s antenna to map Venus through its perpetual cloud cover.',
        massKg: { value: 3445, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Solar arrays',
        manufacturer: 'Martin Marietta',
      },
    ],
    events: [
      { id: 'mag-e1', missionId: 'magellan', eventType: 'launch', timestamp: '1989-05-04', title: 'Launch', description: 'Deployed from Space Shuttle Atlantis during STS-30 mission', source: 'NASA' },
      { id: 'mag-e2', missionId: 'magellan', eventType: 'milestone', timestamp: '1990-08-10', title: 'Venus Orbit Insertion', description: 'Magellan enters Venus orbit and begins radar mapping', source: 'NASA' },
      { id: 'mag-e3', missionId: 'magellan', eventType: 'science', timestamp: '1991-01-29', title: 'First Radar Map Released', description: 'NASA releases first high-resolution radar maps of Venus — revealing volcanoes, lava plains, and impact craters', source: 'NASA' },
      { id: 'mag-e4', missionId: 'magellan', eventType: 'milestone', timestamp: '1994-10-12', title: 'End of Mission', description: 'Magellan intentionally deorbited; last signal received before atmospheric entry', source: 'NASA' },
    ],
    images: [
      { id: 'mag-img-1', missionId: 'magellan', url: 'https://images-assets.nasa.gov/image/PIA00271/PIA00271~orig.jpg', title: 'Venus Radar Map — Magellan Global View', date: '1996-01-01', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA00271' },
    ],
    sourceUrl: 'https://science.nasa.gov/mission/magellan/',
    tags: ['orbiter', 'Venus', 'radar', 'surface mapping', 'completed', 'NASA'],
    aiInsights: [
      {
        id: 'mag-ai-1',
        missionId: 'magellan',
        type: 'summary',
        content: 'Before Magellan, Venus\'s surface was almost entirely unknown — hidden beneath permanent cloud cover impenetrable to visible light. Magellan\'s synthetic aperture radar pierced those clouds and revealed a world reshaped by volcanism: lava plains covering 80% of the surface, thousands of volcanoes, and a surprising near-total absence of impact craters — evidence that Venus was geologically resurfaced relatively recently. Magellan\'s global topographic dataset remains the primary reference for Venus surface science.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'venus-express',
    name: 'Venus Express',
    shortName: 'Venus Express',
    agency: 'ESA',
    destination: 'venus',
    missionType: 'orbiter',
    status: 'completed',
    launchDate: '2005-11-09',
    endDate: '2015-01-18',
    description:
      'Venus Express was ESA\'s first mission to Venus, orbiting the planet from April 2006 to January 2015. Reusing the Mars Express platform, it studied Venus\'s atmosphere, plasma environment, and surface temperatures in unprecedented detail. Key findings included the first direct evidence of recent volcanic activity on Venus and detailed characterisation of the global SO₂ emissions that shape Venus\'s clouds.',
    objectives: [
      'Study the structure, chemistry, and dynamics of Venus\'s atmosphere',
      'Characterize Venus\'s plasma environment and its interaction with the solar wind',
      'Map surface temperatures to search for volcanic hot spots',
      'Investigate Venus\'s southern polar vortex',
      'Search for lightning and active volcanism',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA23791/PIA23791~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA23791/PIA23791~thumb.jpg',
    currentLocation: {
      description: 'Destroyed in Venus\'s atmosphere — last contact 18 January 2015 after fuel exhaustion',
      label: 'OBSERVED',
      source: 'ESA',
    },
    phases: [
      { id: 'launch', name: 'Launch', description: 'Launched 9 Nov 2005 on Soyuz-FG/Fregat from Baikonur', isCompleted: true },
      { id: 'venus-orbit', name: 'Venus Orbit', description: 'Entered Venus orbit 11 April 2006; primary and extended missions', isCompleted: true },
      { id: 'aerobraking', name: 'Aerobraking', description: 'Periapsis-lowering aerobraking campaign 2014', isCompleted: true },
      { id: 'eom', name: 'End of Mission', description: 'Final contact 18 January 2015 after propellant exhaustion', isCompleted: true },
    ],
    currentPhase: {
      id: 'eom',
      name: 'Mission Concluded',
      description: 'Venus Express lost contact on 18 January 2015 after the spacecraft exhausted its propellant during an extended aerobraking campaign',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'venus-express-sc',
        missionId: 'venus-express',
        name: 'Venus Express',
        type: 'orbiter',
        description: 'Three-axis stabilized orbiter based on Mars Express bus, carrying 7 instruments including VIRTIS imaging spectrometer, VMC camera, SOIR occultation spectrometer, and MAG magnetometer.',
        massKg: { value: 1270, label: 'OBSERVED', source: 'ESA' },
        powerSource: 'Solar arrays',
        manufacturer: 'EADS Astrium (now Airbus)',
      },
    ],
    events: [
      { id: 've-e1', missionId: 'venus-express', eventType: 'launch', timestamp: '2005-11-09', title: 'Launch', description: 'Launched on Soyuz-FG/Fregat from Baikonur Cosmodrome', source: 'ESA' },
      { id: 've-e2', missionId: 'venus-express', eventType: 'milestone', timestamp: '2006-04-11', title: 'Venus Orbit Insertion', description: 'Venus Express enters Venus orbit; begins studying atmosphere and plasma environment', source: 'ESA' },
      { id: 've-e3', missionId: 'venus-express', eventType: 'science', timestamp: '2010-04-01', title: 'Recent Volcanic Activity Evidence', description: 'VIRTIS data reveals hot spots consistent with recent or active lava flows on Venus — first direct evidence of active volcanism', source: 'ESA' },
      { id: 've-e4', missionId: 'venus-express', eventType: 'milestone', timestamp: '2015-01-18', title: 'End of Mission', description: 'Last contact with Venus Express; spacecraft lost after propellant exhaustion following aerobraking', source: 'ESA' },
    ],
    images: [
      { id: 've-img-1', missionId: 'venus-express', url: 'https://images-assets.nasa.gov/image/PIA23791/PIA23791~orig.jpg', title: 'Venus Ultraviolet Cloud View', date: '2010-01-01', source: 'ESA', sourceUrl: 'https://images.nasa.gov/details/PIA23791' },
    ],
    sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/Venus_Express',
    tags: ['orbiter', 'Venus', 'ESA', 'atmosphere', 'volcanism', 'completed'],
    aiInsights: [
      {
        id: 've-ai-1',
        missionId: 'venus-express',
        type: 'summary',
        content: 'Venus Express achieved something remarkable: operating at Venus for nearly 9 years using a spacecraft bus designed for Mars. Its VIRTIS spectrometer revealed thermal hot spots on the surface consistent with recent or active volcanism — a key open question for understanding Venus today. The mission also mapped Venus\'s southern polar vortex in detail and discovered a permanent cold collar at 60°S, reshaping our understanding of Venusian atmospheric circulation.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['ESA'],
      },
    ],
  },

  {
    id: 'davinci',
    name: 'DAVINCI',
    shortName: 'DAVINCI',
    agency: 'NASA',
    destination: 'venus',
    missionType: 'lander',
    status: 'planned',
    launchDate: '2030-01-01',
    description:
      'DAVINCI (Deep Atmosphere Venus Investigation of Noble gases, Chemistry, and Imaging) is a planned NASA Discovery mission to Venus. It will drop a spherical descent probe through Venus\'s atmosphere, making in situ measurements of noble gases, atmospheric chemistry, and surface conditions across the descent. A carrier/flyby spacecraft will capture ultraviolet images of Venus\'s clouds. DAVINCI targets Venus\'s tessera terrain — ancient, highly deformed highlands that may preserve the record of a once-habitable Venus.',
    objectives: [
      'Measure the noble gas abundances and chemical composition of Venus\'s atmosphere during descent',
      'Determine the origin of Venus\'s water and how Venus lost a potential early ocean',
      'Characterize Venus\'s deep atmosphere and clouds',
      'Image the tessera highlands of Alpha Regio at fine scale',
      'Measure surface conditions at the landing site',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA24818/PIA24818~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA24818/PIA24818~thumb.jpg',
    currentLocation: {
      description: 'Under development at NASA Goddard Space Flight Center; launch target ~2030',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'development', name: 'Development', description: 'Phase B/C development at NASA Goddard; launch targeting ~2030', isCurrent: true },
      { id: 'launch', name: 'Launch', description: 'Planned ~2030 launch', isFuture: true },
      { id: 'cruise', name: 'Cruise', description: '~6-month cruise to Venus', isFuture: true },
      { id: 'probe-entry', name: 'Atmospheric Probe Descent', description: '~63-minute probe descent through Venus atmosphere', isFuture: true },
    ],
    currentPhase: {
      id: 'development',
      name: 'Development',
      description: 'In development at NASA GSFC; selected as NASA Discovery mission in June 2021. Launch targeting approximately 2030.',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'davinci-carrier',
        missionId: 'davinci',
        name: 'DAVINCI Carrier/Relay/Flyby Spacecraft',
        type: 'probe',
        description: 'Flyby spacecraft that releases the descent sphere and relays its data to Earth. Carries UV cameras to image Venus\'s clouds and the Alpha Regio tessera highlands.',
        powerSource: 'Solar arrays',
        manufacturer: 'NASA Goddard Space Flight Center',
      },
      {
        id: 'davinci-probe',
        missionId: 'davinci',
        name: 'DAVINCI Descent Sphere',
        type: 'lander',
        description: 'Titanium pressure vessel descending for ~63 minutes through Venus\'s atmosphere, measuring noble gases, sulfur chemistry, and D/H ratio. Designed to survive to the surface.',
        powerSource: 'Lithium-ion batteries',
        manufacturer: 'NASA Goddard Space Flight Center',
      },
    ],
    events: [
      { id: 'dav-e1', missionId: 'davinci', eventType: 'milestone', timestamp: '2021-06-02', title: 'Mission Selected', description: 'NASA selects DAVINCI and VERITAS as two new Discovery missions to Venus — the first dedicated US Venus missions in decades', source: 'NASA', sourceUrl: 'https://www.nasa.gov/solar-system/nasa-selects-2-missions-to-study-lost-habitable-world-of-venus/' },
    ],
    images: [
      { id: 'dav-img-1', missionId: 'davinci', url: 'https://images-assets.nasa.gov/image/PIA24818/PIA24818~orig.jpg', title: 'DAVINCI Descent Sphere Artist Concept', date: '2021-06-02', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA24818' },
    ],
    sourceUrl: 'https://davincimission.gsfc.nasa.gov/',
    tags: ['lander', 'Venus', 'atmosphere', 'noble gases', 'tessera', 'planned', 'NASA'],
    aiInsights: [
      {
        id: 'dav-ai-1',
        missionId: 'davinci',
        type: 'summary',
        content: 'DAVINCI is targeting one of Venus\'s most profound mysteries: was Venus ever habitable? By measuring noble gas isotope ratios in Venus\'s deep atmosphere — gases that haven\'t been measured since the Soviet Venera probes in the 1970s–80s — DAVINCI can determine whether Venus once had an ocean and lost it, or was never habitable at all. The tessera imaging adds a geological dimension: these ancient highlands may be Venus\'s only surviving record of a potentially watery past.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'veritas',
    name: 'VERITAS',
    shortName: 'VERITAS',
    agency: 'NASA',
    destination: 'venus',
    missionType: 'orbiter',
    status: 'planned',
    launchDate: '2031-01-01',
    description:
      'VERITAS (Venus Emissivity, Radio Science, InSAR, Topography, and Spectroscopy) is a planned NASA Discovery mission to Venus that will produce the first high-resolution global topographic and geologic map of Venus since Magellan. Using a synthetic aperture radar capable of 30-metre resolution — three times better than Magellan — VERITAS will determine whether Venus is geologically active today and characterize its tectonic history. Currently under development; launch targeted for the early 2030s.',
    objectives: [
      'Produce a global high-resolution topographic and geologic map of Venus at 30-metre resolution',
      'Determine whether Venus is geologically active by detecting surface changes',
      'Characterize Venus\'s tectonic and volcanic history',
      'Measure surface emissivity to constrain crustal composition',
      'Investigate why Venus and Earth evolved so differently',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA24813/PIA24813~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA24813/PIA24813~thumb.jpg',
    currentLocation: {
      description: 'Under development at NASA JPL; launch target early 2030s',
      label: 'OBSERVED',
      source: 'NASA',
    },
    phases: [
      { id: 'development', name: 'Development', description: 'Phase development at NASA JPL; launch targeting early 2030s', isCurrent: true },
      { id: 'launch', name: 'Launch', description: 'Planned early 2030s launch', isFuture: true },
      { id: 'venus-orbit', name: 'Venus Orbit Operations', description: 'Radar mapping and emissivity measurements from Venus orbit', isFuture: true },
    ],
    currentPhase: {
      id: 'development',
      name: 'Development',
      description: 'Selected as NASA Discovery mission June 2021. Launch targeting early 2030s pending final mission confirmation.',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'veritas-sc',
        missionId: 'veritas',
        name: 'VERITAS',
        type: 'orbiter',
        description: 'Venus orbiter carrying X-band and S-band synthetic aperture radar (VISAR) for 30-metre resolution surface mapping, and VEMS infrared emissivity mapper for surface composition.',
        powerSource: 'Solar arrays',
        manufacturer: 'NASA Jet Propulsion Laboratory',
      },
    ],
    events: [
      { id: 'ver-e1', missionId: 'veritas', eventType: 'milestone', timestamp: '2021-06-02', title: 'Mission Selected', description: 'NASA selects VERITAS and DAVINCI as two new Discovery missions to Venus', source: 'NASA', sourceUrl: 'https://www.nasa.gov/solar-system/nasa-selects-2-missions-to-study-lost-habitable-world-of-venus/' },
    ],
    images: [
      { id: 'ver-img-1', missionId: 'veritas', url: 'https://images-assets.nasa.gov/image/PIA24813/PIA24813~orig.jpg', title: 'VERITAS Artist Concept at Venus', date: '2021-06-02', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA24813' },
    ],
    sourceUrl: 'https://www.jpl.nasa.gov/missions/veritas',
    tags: ['orbiter', 'Venus', 'radar', 'surface mapping', 'geology', 'planned', 'NASA'],
    aiInsights: [
      {
        id: 'ver-ai-1',
        missionId: 'veritas',
        type: 'summary',
        content: 'VERITAS will do for Venus what was done for Mars over the past 25 years: replace a coarse, decades-old global map with a modern, high-resolution dataset. Its 30-metre radar will detect surface changes over time — the first definitive way to determine whether Venus is geologically active today. Combined with DAVINCI\'s atmospheric measurements, these two missions will answer the central question about Venus: why did Earth\'s twin become so radically different?',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },

  {
    id: 'envision',
    name: 'EnVision',
    shortName: 'EnVision',
    agency: 'ESA',
    destination: 'venus',
    missionType: 'orbiter',
    status: 'planned',
    launchDate: '2031-01-01',
    description:
      'EnVision is ESA\'s Medium-class mission to Venus, planned for launch in the early 2030s. It will conduct a holistic investigation of Venus from its deep interior to the top of its atmosphere, studying the planet\'s geological activity, volcanism, surface composition, and atmospheric chemistry. EnVision is designed to work synergistically with NASA\'s DAVINCI and VERITAS missions to deliver the most comprehensive Venus exploration since the Magellan era.',
    objectives: [
      'Determine the history and current state of geological activity on Venus',
      'Characterize the surface composition and identify volcanic and tectonic features',
      'Investigate the exchange between Venus\'s surface and atmosphere',
      'Study the structure and dynamics of Venus\'s atmosphere',
      'Establish the geological context for potential future Venus surface missions',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA24817/PIA24817~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA24817/PIA24817~thumb.jpg',
    currentLocation: {
      description: 'Under development at ESA; launch targeted for early 2030s',
      label: 'OBSERVED',
      source: 'ESA',
    },
    phases: [
      { id: 'development', name: 'Development', description: 'ESA M5 mission in development; launch targeting early 2030s', isCurrent: true },
      { id: 'launch', name: 'Launch', description: 'Planned early 2030s launch on Ariane 6 or equivalent', isFuture: true },
      { id: 'venus-orbit', name: 'Venus Orbit Operations', description: 'Multi-instrument orbital science at Venus', isFuture: true },
    ],
    currentPhase: {
      id: 'development',
      name: 'Development',
      description: 'Selected as ESA M5 mission in 2021. Detailed design phase underway; launch targeting early 2030s.',
      isCurrent: true,
    },
    spacecraft: [
      {
        id: 'envision-sc',
        missionId: 'envision',
        name: 'EnVision',
        type: 'orbiter',
        description: 'Venus orbiter carrying VenSAR synthetic aperture radar (S-band), SRS subsurface radar sounder, VenSpec spectrometer suite (UV + IR), and radio science experiment.',
        powerSource: 'Solar arrays',
        manufacturer: 'TBD (ESA industrial prime contractor)',
      },
    ],
    events: [
      { id: 'env-e1', missionId: 'envision', eventType: 'milestone', timestamp: '2021-06-10', title: 'Mission Selected', description: 'ESA selects EnVision as its M5 medium-class science mission to Venus', source: 'ESA', sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/EnVision' },
    ],
    images: [
      { id: 'env-img-1', missionId: 'envision', url: 'https://images-assets.nasa.gov/image/PIA24817/PIA24817~orig.jpg', title: 'EnVision Artist Concept at Venus', date: '2021-06-10', source: 'ESA', sourceUrl: 'https://images.nasa.gov/details/PIA24817' },
    ],
    sourceUrl: 'https://www.esa.int/Science_Exploration/Space_Science/EnVision',
    tags: ['orbiter', 'Venus', 'ESA', 'radar', 'geology', 'atmosphere', 'planned'],
    aiInsights: [
      {
        id: 'env-ai-1',
        missionId: 'envision',
        type: 'summary',
        content: 'EnVision is designed to answer the most fundamental question about Venus: is it geologically alive today? By combining a synthetic aperture radar, a subsurface sounding radar, and spectrometers into a single mission, EnVision can detect active volcanism, characterize surface composition, and map subsurface structure — the full toolkit for planetary geology. Working alongside NASA\'s DAVINCI and VERITAS, the three missions together represent the most ambitious Venus exploration program since Magellan.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['ESA'],
      },
    ],
  },

  // ============================================================
  // NEPTUNE MISSIONS
  // ============================================================
  {
    id: 'voyager-2-neptune',
    name: 'Voyager 2 — Neptune Flyby',
    shortName: 'Voyager 2 / Neptune',
    agency: 'NASA',
    destination: 'neptune',
    missionType: 'flyby',
    status: 'completed',
    launchDate: '1977-08-20',
    endDate: '1989-08-25',
    description:
      'The Neptune flyby on 25 August 1989 was the grand finale of Voyager 2\'s Grand Tour of the outer planets. Passing within 4,950 km of Neptune\'s cloud tops — closer than any other planetary encounter of the mission — Voyager 2 discovered 6 new moons, 4 new rings, a massive storm called the Great Dark Spot, and nitrogen geysers erupting from the surface of the moon Triton. To this day, Voyager 2 remains the only spacecraft ever to visit Neptune.',
    objectives: [
      'Conduct close flyby and imaging of Neptune and its moons',
      'Measure Neptune\'s magnetic field, atmosphere, and ring system',
      'Investigate Triton — Neptune\'s large retrograde moon',
      'Study interactions between Neptune and the solar wind',
      'Complete the Grand Tour of all four outer planets',
    ],
    heroImageUrl: 'https://images-assets.nasa.gov/image/PIA00046/PIA00046~orig.jpg',
    thumbnailUrl: 'https://images-assets.nasa.gov/image/PIA00046/PIA00046~thumb.jpg',
    currentLocation: {
      description: 'Interstellar space — same spacecraft as the Uranus flyby, now ~140 AU from the Sun',
      label: 'DERIVED',
      source: 'NASA',
    },
    phases: [
      { id: 'neptune-approach', name: 'Neptune Approach', description: 'Final approach and ring plane crossing', isCompleted: true },
      { id: 'neptune-flyby', name: 'Neptune Closest Approach', description: '25 August 1989 — 4,950 km from cloud tops', isCompleted: true },
      { id: 'triton-flyby', name: 'Triton Flyby', description: 'Closest approach to Triton — discovers nitrogen geysers', isCompleted: true },
    ],
    currentPhase: {
      id: 'triton-flyby',
      name: 'Mission Concluded',
      description: 'Neptune and Triton science phase completed; Voyager 2 continued into interstellar space',
      isCompleted: true,
    },
    spacecraft: [
      {
        id: 'voyager-2-nep-sc',
        missionId: 'voyager-2-neptune',
        name: 'Voyager 2',
        type: 'probe',
        description: 'The same spacecraft that conducted the Uranus flyby three years earlier. At Neptune, the mission team navigated Voyager 2 to within 4,950 km of the cloud tops — the closest approach of any planetary encounter on the mission.',
        massKg: { value: 722, label: 'OBSERVED', source: 'NASA' },
        powerSource: 'Three radioisotope thermoelectric generators (RTGs)',
        manufacturer: 'Jet Propulsion Laboratory',
      },
    ],
    events: [
      { id: 'v2n-e1', missionId: 'voyager-2-neptune', eventType: 'flyby', timestamp: '1989-08-25', title: 'Neptune Closest Approach', description: 'Voyager 2 passes 4,950 km above Neptune\'s cloud tops — still the closest any spacecraft has come to Neptune', source: 'NASA' },
      { id: 'v2n-e2', missionId: 'voyager-2-neptune', eventType: 'science', timestamp: '1989-08-25', title: 'Great Dark Spot Imaged', description: 'Voyager 2 images the Great Dark Spot — a storm the size of Earth — in Neptune\'s atmosphere', source: 'NASA' },
      { id: 'v2n-e3', missionId: 'voyager-2-neptune', eventType: 'science', timestamp: '1989-08-25', title: 'Triton Geysers Discovered', description: 'Dark streaks on Triton identified as nitrogen geyser plumes erupting from the surface — active geology on a moon colder than −235 °C', source: 'NASA' },
      { id: 'v2n-e4', missionId: 'voyager-2-neptune', eventType: 'milestone', timestamp: '1989-08-26', title: '6 New Moons Discovered', description: 'Voyager 2\'s flyby reveals six previously unknown Neptunian moons', source: 'NASA' },
    ],
    images: [
      { id: 'v2n-img-1', missionId: 'voyager-2-neptune', url: 'https://images-assets.nasa.gov/image/PIA00046/PIA00046~orig.jpg', title: 'Neptune by Voyager 2', date: '1989-08-20', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA00046' },
      { id: 'v2n-img-2', missionId: 'voyager-2-neptune', url: 'https://images-assets.nasa.gov/image/PIA02210/PIA02210~orig.jpg', title: 'Triton — Voyager 2', date: '1989-08-25', source: 'NASA', sourceUrl: 'https://images.nasa.gov/details/PIA02210' },
    ],
    sourceUrl: 'https://voyager.jpl.nasa.gov/',
    tags: ['flyby', 'Neptune', 'Triton', 'Grand Tour', 'Voyager', 'completed'],
    aiInsights: [
      {
        id: 'v2n-ai-1',
        missionId: 'voyager-2-neptune',
        type: 'summary',
        content: 'Neptune is the most remote planet in the solar system, and only one spacecraft has ever visited it. Voyager 2\'s 1989 flyby was a triumph of celestial mechanics — the spacecraft was guided to within 4,950 km of Neptune\'s clouds after 12 years of flight and gravity assists across four planets. Triton\'s nitrogen geysers were a stunning surprise: active geology on the coldest measured surface in the solar system. A future Neptune–Triton mission remains a science community priority.',
        confidence: 'high',
        createdAt: '2024-01-01',
        basedOn: ['NASA'],
      },
    ],
  },
];

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function getMissionsByDestination(destination: string): Mission[] {
  return MISSIONS.filter((m) => m.destination === destination);
}

export function getMissionsByStatus(status: MissionStatus): Mission[] {
  return MISSIONS.filter((m) => m.status === status);
}

export function getActiveMissions(): Mission[] {
  return MISSIONS.filter((m) =>
    ['active', 'science-operations', 'surface-operations', 'extended', 'cruise'].includes(m.status)
  );
}

export function searchMissions(query: string): Mission[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MISSIONS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.shortName?.toLowerCase().includes(q) ||
      m.agency.toLowerCase().includes(q) ||
      m.destination.includes(q) ||
      m.missionType.includes(q) ||
      m.tags?.some((t) => t.toLowerCase().includes(q)) ||
      m.spacecraft.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.noradId === q
      )
  );
}
