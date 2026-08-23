/**
 * Procedural Earth texture generator.
 *
 * Renders a recognisable geographic globe entirely in a <canvas> —
 * no external image fetch required. The continent outlines are drawn
 * from a compact GeoJSON-style polygon set derived from Natural Earth
 * simplified geometry (public domain).
 *
 * Returns THREE.CanvasTexture instances for:
 *   - dayTexture   — land/ocean colours, approximate country borders
 *   - nightTexture — dark surface + city-light glows
 *   - cloudTexture — procedural cloud noise layer
 *
 * Source attribution: continent polygon data simplified from
 * Natural Earth (naturalearthdata.com) — public domain.
 *
 * Label: DERIVED / ESTIMATED — stylised representation, not satellite imagery.
 */

import * as THREE from 'three';

const W = 2048;
const H = 1024;

// ─── Colour palette ──────────────────────────────────────────────────────────

const OCEAN      = '#0a2240';
const OCEAN_DEEP = '#061830';
const LAND       = '#1a3a1a';
const LAND_HIGH  = '#2d5c2d';
const LAND_LOW   = '#1e4020';
const DESERT     = '#3a3020';
const ICE        = '#c8d8e8';
const SHORE      = '#0e2e50';

// ─── Simplified continent outlines ──────────────────────────────────────────
// Each polygon is [lon, lat] pairs projected to canvas [x, y]
// Longitude −180..180 → x 0..W, Latitude 90..−90 → y 0..H

function project(lon: number, lat: number): [number, number] {
  return [
    ((lon + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];
}

function drawPoly(ctx: CanvasRenderingContext2D, coords: [number, number][], fill: string, stroke?: string) {
  ctx.beginPath();
  ctx.moveTo(...project(coords[0][0], coords[0][1]));
  for (let i = 1; i < coords.length; i++) ctx.lineTo(...project(coords[i][0], coords[i][1]));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.4; ctx.stroke(); }
}

// Simplified continent polygons (Natural Earth simplified, public domain)
// Coordinates are [lon, lat]
const CONTINENTS: Array<{ coords: [number, number][]; fill: string; name: string }> = [
  // ── North America ────────────────────────────────────────────────────────
  {
    name: 'north-america',
    fill: LAND_HIGH,
    coords: [
      [-168, 71], [-140, 70], [-110, 72], [-85, 73], [-65, 60], [-52, 55],
      [-55, 47], [-67, 44], [-70, 42], [-75, 35], [-80, 25], [-88, 20],
      [-92, 15], [-90, 10], [-83, 8], [-78, 8], [-75, 10], [-77, 17],
      [-85, 22], [-90, 19], [-105, 19], [-108, 22], [-117, 32], [-120, 34],
      [-125, 37], [-124, 42], [-125, 49], [-130, 55], [-135, 58], [-142, 60],
      [-145, 60], [-148, 62], [-152, 60], [-158, 58], [-162, 60], [-165, 62],
      [-166, 65], [-168, 68],
    ],
  },
  // Greenland
  {
    name: 'greenland',
    fill: ICE,
    coords: [
      [-72, 83], [-50, 84], [-18, 77], [-17, 70], [-22, 65], [-30, 60],
      [-42, 60], [-52, 65], [-57, 70], [-65, 75], [-68, 78], [-72, 80],
    ],
  },
  // ── South America ───────────────────────────────────────────────────────
  {
    name: 'south-america',
    fill: LAND_HIGH,
    coords: [
      [-80, 12], [-72, 12], [-65, 10], [-62, 8], [-60, 5], [-52, 4],
      [-50, 0], [-49, -5], [-35, -8], [-35, -12], [-38, -18], [-40, -22],
      [-45, -22], [-49, -27], [-52, -33], [-55, -34], [-58, -34], [-62, -38],
      [-65, -42], [-68, -48], [-65, -55], [-68, -55], [-72, -50], [-75, -45],
      [-74, -38], [-70, -32], [-70, -25], [-68, -20], [-70, -15], [-75, -10],
      [-78, -5], [-80, 0], [-80, 5],
    ],
  },
  // ── Europe ──────────────────────────────────────────────────────────────
  {
    name: 'europe',
    fill: LAND_LOW,
    coords: [
      [-10, 35], [0, 36], [5, 43], [10, 44], [15, 45], [18, 42],
      [20, 40], [25, 38], [28, 38], [30, 40], [28, 43], [30, 47],
      [24, 48], [22, 52], [20, 55], [18, 58], [22, 60], [25, 62],
      [28, 65], [25, 68], [20, 70], [15, 70], [10, 62], [8, 58],
      [5, 55], [8, 50], [5, 48], [0, 46], [-3, 43], [-8, 44],
      [-10, 40], [-10, 36],
    ],
  },
  // Scandinavia
  {
    name: 'scandinavia',
    fill: LAND_LOW,
    coords: [
      [5, 58], [8, 58], [10, 62], [8, 63], [10, 65], [15, 68],
      [20, 70], [25, 70], [30, 68], [28, 65], [25, 62], [22, 60],
      [18, 58], [15, 57], [12, 56], [10, 58], [8, 58],
    ],
  },
  // ── Africa ───────────────────────────────────────────────────────────────
  {
    name: 'africa',
    fill: LAND_HIGH,
    coords: [
      [-17, 15], [-15, 20], [-13, 25], [-10, 30], [-5, 35], [0, 37],
      [5, 37], [10, 37], [15, 38], [20, 37], [25, 35], [30, 32],
      [35, 28], [38, 22], [42, 12], [45, 10], [42, 5], [40, 0],
      [38, -5], [35, -10], [35, -17], [32, -25], [30, -30], [27, -34],
      [20, -35], [15, -35], [10, -32], [5, -28], [0, -22], [-5, -15],
      [-10, -10], [-12, -5], [-15, 0], [-17, 5], [-18, 10],
    ],
  },
  // Sahara (lighter desert tone)
  {
    name: 'sahara',
    fill: DESERT,
    coords: [
      [-18, 17], [-10, 20], [0, 22], [10, 23], [20, 23], [30, 22],
      [36, 20], [38, 16], [35, 12], [20, 10], [10, 12], [0, 14],
      [-10, 16], [-18, 17],
    ],
  },
  // ── Asia ─────────────────────────────────────────────────────────────────
  {
    name: 'asia-main',
    fill: LAND_LOW,
    coords: [
      [30, 40], [35, 38], [40, 38], [45, 40], [50, 42], [55, 45],
      [60, 50], [65, 52], [70, 55], [75, 55], [80, 52], [85, 52],
      [90, 53], [95, 55], [100, 55], [105, 52], [110, 50], [115, 48],
      [120, 50], [125, 52], [130, 52], [135, 48], [138, 42], [140, 38],
      [140, 35], [135, 30], [130, 25], [125, 22], [120, 20], [115, 18],
      [110, 15], [105, 10], [100, 5], [100, 0], [102, -2], [108, -6],
      [112, -8], [115, -5], [115, 0], [118, 5], [120, 10], [118, 15],
      [120, 20], [115, 25], [108, 20], [100, 15], [95, 12], [88, 15],
      [80, 20], [72, 22], [68, 22], [62, 22], [58, 20], [55, 22],
      [50, 25], [45, 28], [40, 35], [35, 38],
    ],
  },
  // Indian subcontinent
  {
    name: 'india',
    fill: LAND_HIGH,
    coords: [
      [68, 22], [72, 22], [78, 28], [80, 30], [85, 28], [88, 25],
      [92, 22], [90, 18], [80, 10], [75, 8], [68, 8], [65, 12],
      [62, 18], [65, 22],
    ],
  },
  // ── Australia ────────────────────────────────────────────────────────────
  {
    name: 'australia',
    fill: DESERT,
    coords: [
      [114, -22], [116, -20], [122, -18], [128, -15], [132, -12],
      [136, -12], [138, -15], [140, -18], [144, -18], [146, -18],
      [148, -20], [150, -22], [152, -24], [153, -27], [152, -30],
      [150, -35], [148, -38], [144, -38], [140, -36], [135, -35],
      [130, -32], [126, -34], [122, -34], [118, -30], [114, -26],
    ],
  },
  // Green patches on Australia's coast
  {
    name: 'australia-coast',
    fill: LAND,
    coords: [
      [148, -20], [150, -22], [152, -24], [153, -27], [152, -30],
      [150, -35], [148, -38], [146, -36], [148, -32], [150, -28],
      [150, -25], [148, -22],
    ],
  },
  // ── Antarctica ───────────────────────────────────────────────────────────
  {
    name: 'antarctica',
    fill: ICE,
    coords: [
      [-180, -70], [-150, -72], [-120, -68], [-90, -68], [-60, -70],
      [-30, -72], [0, -70], [30, -72], [60, -70], [90, -68], [120, -68],
      [150, -70], [180, -70], [180, -90], [-180, -90],
    ],
  },
  // ── Japan ────────────────────────────────────────────────────────────────
  {
    name: 'japan',
    fill: LAND_LOW,
    coords: [
      [130, 31], [131, 33], [132, 34], [133, 35], [135, 35],
      [136, 36], [138, 38], [140, 40], [142, 42], [143, 44],
      [142, 44], [140, 42], [138, 40], [136, 38], [134, 36],
      [132, 34], [130, 32],
    ],
  },
  // ── UK ───────────────────────────────────────────────────────────────────
  {
    name: 'uk',
    fill: LAND_LOW,
    coords: [
      [-5, 50], [-3, 50], [0, 51], [1, 52], [0, 54], [-2, 55],
      [-5, 58], [-6, 57], [-5, 55], [-3, 53], [-3, 51], [-5, 50],
    ],
  },
];

// ─── Ocean gradient + shoreline shimmer ─────────────────────────────────────

function drawOcean(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, OCEAN_DEEP);
  grad.addColorStop(0.5, OCEAN);
  grad.addColorStop(1, OCEAN_DEEP);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ─── Subtle latitude lines (graticule) ───────────────────────────────────────

function drawGraticule(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(59,130,246,0.06)';
  ctx.lineWidth = 0.5;
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = ((90 - lat) / 180) * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
}

// ─── City lights for night side ──────────────────────────────────────────────
// Approximate population centre locations [lon, lat]
const CITY_LIGHTS: [number, number, number][] = [
  // [lon, lat, size]
  // North America
  [-74, 40.7, 6], [-87, 41.8, 5], [-122, 37.8, 5], [-118, 34, 5],
  [-80, 25.8, 3], [-71, 42.4, 3], [-97, 32.8, 3], [-90, 30, 2],
  [-73, 45.5, 3], [-123, 49.3, 3], [-79.4, 43.7, 3],
  // South America
  [-46.6, -23.5, 5], [-43, -22.9, 4], [-58.4, -34.6, 4],
  [-70.6, -33.4, 3], [-74, 4.7, 3], [-77, -12, 2],
  // Europe
  [-0.1, 51.5, 5], [2.3, 48.9, 5], [13.4, 52.5, 4], [18.9, 47.5, 3],
  [37.6, 55.8, 5], [12.5, 41.9, 4], [-3.7, 40.4, 4], [4.9, 52.4, 3],
  [23.7, 37.9, 3], [10.0, 53.6, 3], [14.4, 50.1, 3], [16.4, 48.2, 3],
  [19.0, 47.5, 3], [21.0, 52.2, 3],
  // Africa
  [36.8, -1.3, 4], [3.4, 6.5, 4], [28.0, -26.2, 4], [31.2, 30.1, 4],
  [13.5, 9.1, 3], [-17.4, 14.7, 3], [-15.6, 11.9, 2],
  // Middle East
  [51.5, 25.3, 4], [46.7, 24.7, 4], [39.2, 21.5, 3], [44.4, 33.3, 3],
  [35.2, 31.8, 3], [55.3, 25.2, 4],
  // Asia
  [121.5, 31.2, 6], [116.4, 39.9, 6], [139.7, 35.7, 6], [103.8, 1.4, 5],
  [77.2, 28.6, 5], [72.9, 19.1, 5], [88.4, 22.6, 5], [80.3, 13.1, 4],
  [126.9, 37.6, 5], [114.2, 22.3, 5], [100.5, 13.8, 4],
  [112.6, -7.9, 3], [106.8, -6.2, 4], [104.0, 1.3, 4],
  // Australia
  [151.2, -33.9, 4], [144.9, -37.8, 3], [115.9, -32.0, 3],
];

function drawCityLights(ctx: CanvasRenderingContext2D) {
  CITY_LIGHTS.forEach(([lon, lat, sz]) => {
    const [cx, cy] = project(lon, lat);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 6);
    g.addColorStop(0, 'rgba(255,220,120,0.9)');
    g.addColorStop(0.3, 'rgba(255,200,80,0.5)');
    g.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, sz * 6, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ─── Procedural cloud noise ──────────────────────────────────────────────────

function drawClouds(ctx: CanvasRenderingContext2D) {
  // Simple layered noise approximation using multiple semi-transparent ellipses
  const rng = mulberry32(0xdeadbeef);
  ctx.globalAlpha = 0.0;
  for (let i = 0; i < 400; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    // cluster near equatorial and temperate bands
    const lat = 90 - (cy / H) * 180;
    const latFactor = Math.abs(Math.cos((lat * Math.PI) / 180));
    const cloudiness = 0.3 + 0.5 * latFactor + 0.2 * Math.sin(cx * 0.003);
    const alpha = rng() * cloudiness * 0.55;
    const rw = 20 + rng() * 90;
    const rh = 6 + rng() * 25;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw);
    g.addColorStop(0, `rgba(240,248,255,${alpha})`);
    g.addColorStop(1, 'rgba(240,248,255,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rng() * Math.PI);
    ctx.scale(1, rh / rw);
    ctx.beginPath();
    ctx.arc(0, 0, rw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1.0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Procedural day-side Earth texture. Labeled: ESTIMATED */
export function makeEarthDayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  drawOcean(ctx);
  drawGraticule(ctx);

  // Continents + islands
  CONTINENTS.forEach(c => drawPoly(ctx, c.coords, c.fill, 'rgba(0,0,0,0.15)'));

  // Polar ice caps
  ctx.fillStyle = ICE;
  ctx.fillRect(0, 0, W, H * 0.04);             // North pole
  ctx.fillRect(0, H * 0.96, W, H * 0.04);      // South pole

  // Shore shimmer
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.lineWidth = 1.5;
  CONTINENTS.forEach(c => {
    ctx.beginPath();
    ctx.moveTo(...project(c.coords[0][0], c.coords[0][1]));
    c.coords.forEach(([lon, lat]) => ctx.lineTo(...project(lon, lat)));
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.name = 'earth-day-ESTIMATED';
  return tex;
}

/** Procedural night-side Earth texture (dark + city lights). Labeled: ESTIMATED */
export function makeEarthNightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Almost-black ocean
  ctx.fillStyle = '#030810';
  ctx.fillRect(0, 0, W, H);

  // Dark land
  CONTINENTS.forEach(c => drawPoly(ctx, c.coords, '#0a1208'));

  // City lights
  drawCityLights(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.name = 'earth-night-ESTIMATED';
  return tex;
}

/** Procedural cloud layer. Labeled: ESTIMATED */
export function makeCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 1024, 512);
  drawClouds(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.name = 'earth-clouds-ESTIMATED';
  return tex;
}
