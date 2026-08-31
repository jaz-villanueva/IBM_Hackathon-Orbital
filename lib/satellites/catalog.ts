/**
 * Static catalog of satellites the Satellite Explorer can track.
 *
 * This is metadata only — names, NORAD IDs, and what kind of public
 * observation data (if any) exists for each satellite. It is NOT orbital
 * data; live orbital elements are always fetched via lib/satellites/celestrak.ts.
 */

import type { SatelliteCatalogEntry } from '../types';

export const SATELLITE_CATALOG: SatelliteCatalogEntry[] = [
  {
    id: 'iss',
    name: 'International Space Station',
    shortName: 'ISS',
    noradId: '25544',
    agency: 'NASA / Roscosmos / ESA / JAXA / CSA',
    description: 'A crewed, continuously occupied space station in low Earth orbit — humanity\'s permanent research outpost.',
    obsCapability: {
      type: 'LIVE_VIDEO',
      source: 'NASA',
      url: 'https://www.nasa.gov/live/',
    },
    missionId: 'iss',
  },
  {
    id: 'terra',
    name: 'Terra (EOS AM-1)',
    shortName: 'Terra',
    noradId: '25994',
    agency: 'NASA',
    description: 'A NASA Earth-observation satellite studying climate, land, oceans, and atmosphere since 1999.',
    obsCapability: {
      type: 'NEAR_REAL_TIME',
      source: 'NASA Worldview',
      url: 'https://worldview.earthdata.nasa.gov/',
    },
    missionId: 'terra',
  },
  {
    id: 'aqua',
    name: 'Aqua',
    shortName: 'Aqua',
    noradId: '27424',
    agency: 'NASA',
    description: 'A NASA Earth-observation satellite focused on the water cycle — evaporation, precipitation, and ice.',
    obsCapability: {
      type: 'NEAR_REAL_TIME',
      source: 'NASA Worldview',
      url: 'https://worldview.earthdata.nasa.gov/',
    },
    missionId: 'aqua',
  },
  {
    id: 'landsat-9',
    name: 'Landsat 9',
    shortName: 'Landsat 9',
    noradId: '49260',
    agency: 'NASA / USGS',
    description: 'The latest in the 50+ year Landsat program, imaging Earth\'s land surface for science and land management.',
    obsCapability: {
      type: 'NEAR_REAL_TIME',
      source: 'USGS EarthExplorer',
      url: 'https://earthexplorer.usgs.gov/',
    },
    missionId: 'landsat-9',
  },
  {
    id: 'noaa-20',
    name: 'NOAA-20 (JPSS-1)',
    shortName: 'NOAA-20',
    noradId: '43013',
    agency: 'NOAA / NASA',
    description: 'A polar-orbiting weather satellite providing daily global imagery and atmospheric data for forecasting.',
    obsCapability: { type: 'RADIO', source: 'SatNOGS' },
  },
  {
    id: 'noaa-18',
    name: 'NOAA-18',
    shortName: 'NOAA-18',
    noradId: '28654',
    agency: 'NOAA',
    description: 'A NOAA polar-orbiting weather satellite, part of the long-running POES program.',
    obsCapability: { type: 'RADIO', source: 'SatNOGS' },
  },
  {
    id: 'goes-16',
    name: 'GOES-16',
    shortName: 'GOES-16',
    noradId: '41866',
    agency: 'NOAA',
    description: 'A geostationary weather satellite providing continuous visible and infrared imagery of the Americas.',
    obsCapability: { type: 'NONE' },
  },
  {
    id: 'goes-18',
    name: 'GOES-18',
    shortName: 'GOES-18',
    noradId: '51850',
    agency: 'NOAA',
    description: 'NOAA\'s operational geostationary weather satellite covering the western United States and Pacific.',
    obsCapability: { type: 'NONE' },
  },
  {
    id: 'sentinel-6a',
    name: 'Sentinel-6A (Michael Freilich)',
    shortName: 'Sentinel-6A',
    noradId: '46984',
    agency: 'ESA / EUMETSAT / NASA',
    description: 'A European-American ocean altimetry satellite measuring sea level rise to centimetre accuracy.',
    obsCapability: {
      type: 'NEAR_REAL_TIME',
      source: 'Copernicus Open Access Hub',
      url: 'https://browser.dataspace.copernicus.eu/',
    },
  },
  {
    id: 'noaa-21',
    name: 'NOAA-21 (JPSS-2)',
    shortName: 'NOAA-21',
    noradId: '54234',
    agency: 'NOAA / NASA',
    description: 'The latest NOAA polar-orbiting weather satellite, launched November 2022, carrying five advanced instruments for weather forecasting.',
    obsCapability: { type: 'RADIO', source: 'SatNOGS' },
  },
  {
    id: 'suomi-npp',
    name: 'Suomi NPP',
    shortName: 'Suomi NPP',
    noradId: '37849',
    agency: 'NASA / NOAA',
    description: 'A bridge mission between older NOAA satellites and the JPSS series, providing daily global environmental monitoring.',
    obsCapability: { type: 'RADIO', source: 'SatNOGS' },
  },
];

export function getSatelliteCatalogEntry(id: string): SatelliteCatalogEntry | undefined {
  return SATELLITE_CATALOG.find((s) => s.id === id);
}

export function getSatelliteCatalogEntryByNoradId(noradId: string): SatelliteCatalogEntry | undefined {
  return SATELLITE_CATALOG.find((s) => s.noradId === noradId);
}

export function searchSatelliteCatalog(query: string): SatelliteCatalogEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return SATELLITE_CATALOG;
  return SATELLITE_CATALOG.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.shortName?.toLowerCase().includes(q) ||
      s.noradId.includes(q) ||
      s.agency?.toLowerCase().includes(q)
  );
}
