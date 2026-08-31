/**
 * Simplified continent outlines for the ground-track world map.
 *
 * These are deliberately stylised (a dozen-ish vertices per landmass, hand-
 * plotted from approximate coastline extents) — the goal is "immediately
 * recognisable as Earth's continents" at a ~280px panel width, not survey
 * accuracy. No mapping library/tileset dependency was added for this; the
 * polygons are plain [lon, lat] point lists reusing the same equirectangular
 * projection as the ground track itself.
 *
 * Also used for a coarse "currently over <continent/ocean>" label via a
 * point-in-polygon test — continent-scale only (never a country), so the
 * false-positive rate stays low without needing a real reverse-geocoding
 * service. When a point falls in no polygon it's over open ocean.
 */

export type LonLat = [number, number];

export interface ContinentShape {
  name: string;
  points: LonLat[];
}

export const CONTINENTS: ContinentShape[] = [
  {
    name: 'North America',
    points: [
      [-165, 68], [-155, 71], [-125, 71], [-95, 68], [-80, 62], [-65, 60],
      [-55, 50], [-65, 45], [-70, 42], [-75, 35], [-80, 25], [-97, 26],
      [-105, 22], [-110, 24], [-117, 33], [-124, 42], [-130, 55], [-140, 60],
      [-165, 68],
    ],
  },
  {
    name: 'South America',
    points: [
      [-80, 10], [-60, 10], [-50, 0], [-35, -8], [-40, -20], [-48, -25],
      [-58, -35], [-68, -55], [-72, -50], [-70, -30], [-71, -18], [-78, -5],
      [-80, 5], [-80, 10],
    ],
  },
  {
    name: 'Africa',
    points: [
      [-17, 15], [-17, 21], [-10, 35], [10, 37], [25, 32], [35, 30],
      [43, 12], [50, 12], [42, -1], [40, -15], [35, -25], [20, -35],
      [15, -30], [12, -18], [9, -5], [9, 4], [0, 5], [-10, 8], [-17, 15],
    ],
  },
  {
    name: 'Europe',
    points: [
      [-10, 36], [-9, 43], [-5, 48], [2, 51], [10, 54], [20, 60],
      [30, 60], [40, 65], [30, 45], [27, 40], [15, 38], [10, 44],
      [3, 43], [-6, 37], [-10, 36],
    ],
  },
  {
    name: 'Asia',
    points: [
      [27, 40], [45, 40], [60, 25], [70, 20], [72, 8], [80, 8], [90, 22],
      [100, 10], [110, 22], [122, 30], [130, 43], [140, 45], [145, 60],
      [170, 65], [180, 68], [140, 73], [100, 78], [60, 72], [40, 66],
      [30, 60], [27, 40],
    ],
  },
  {
    name: 'Australia',
    points: [
      [113, -22], [113, -32], [118, -35], [140, -38], [150, -37], [153, -28],
      [145, -15], [132, -12], [122, -18], [113, -22],
    ],
  },
  {
    name: 'Greenland',
    points: [
      [-45, 60], [-20, 65], [-20, 80], [-45, 83], [-55, 70], [-45, 60],
    ],
  },
];

/** Ray-casting point-in-polygon test. `point` and polygon vertices are [lon, lat]. */
function pointInPolygon(point: LonLat, polygon: LonLat[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Coarse "what's below the satellite right now" — a continent name, or null
 * for open ocean. Deliberately continent-scale only; never invents a country
 * or city. Callers should fall back to showing raw lat/lon when this is null.
 */
export function continentAt(lat: number, lon: number): string | null {
  for (const c of CONTINENTS) {
    if (pointInPolygon([lon, lat], c.points)) return c.name;
  }
  return null;
}
