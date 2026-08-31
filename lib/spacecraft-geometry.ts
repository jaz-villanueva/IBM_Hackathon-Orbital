/**
 * Procedural 3D spacecraft geometry builders.
 *
 * Creates recognisable stylised THREE.Group representations for each
 * spacecraft class. No external model files required — everything is
 * built from Three.js primitives.
 *
 * Hierarchy:
 *   Level 1  — detailed 3D group (shown when close / selected)
 *   Level 2  — simplified mesh (shown at medium distance)
 *   Level 3  — sprite icon (shown far away / default)
 *
 * All models are schematic/stylised, not photorealistic.
 * Label: ESTIMATED (visual representation).
 */

import * as THREE from 'three';

// ─── Common materials ────────────────────────────────────────────────────────

const MAT = {
  solar: new THREE.MeshStandardMaterial({ color: 0x1a3a6a, emissive: 0x0a1e40, metalness: 0.6, roughness: 0.4 }),
  body:  new THREE.MeshStandardMaterial({ color: 0xc0c8d8, metalness: 0.7, roughness: 0.3 }),
  truss: new THREE.MeshStandardMaterial({ color: 0xa0a8b8, metalness: 0.8, roughness: 0.2 }),
  gold:  new THREE.MeshStandardMaterial({ color: 0xd4a820, metalness: 0.9, roughness: 0.1, emissive: 0x4a3000, emissiveIntensity: 0.3 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8edf5, metalness: 0.4, roughness: 0.5 }),
  dark:  new THREE.MeshStandardMaterial({ color: 0x1a1e28, metalness: 0.5, roughness: 0.6 }),
  rover: new THREE.MeshStandardMaterial({ color: 0xb87a30, metalness: 0.3, roughness: 0.7 }),
  dish:  new THREE.MeshStandardMaterial({ color: 0xd0d8e0, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }),
};

function clone(m: THREE.MeshStandardMaterial) { return m.clone(); }

// ─── ISS ─────────────────────────────────────────────────────────────────────
// Main truss + multiple solar array pairs + hab modules

export function buildISS(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Main truss
  const truss = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.03), clone(MAT.truss));
  g.add(truss);

  // Hab modules (centre cluster)
  const habConfigs = [
    [0, 0, 0], [0.06, 0, 0.04], [-0.06, 0, 0.04],
    [0, 0, -0.04], [0.03, 0, 0.08],
  ];
  habConfigs.forEach(([x, y, z]) => {
    const hab = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8), clone(MAT.body));
    hab.rotation.z = Math.PI / 2;
    hab.position.set(x, y, z);
    g.add(hab);
  });

  // Solar array pairs (4 pairs along truss)
  const arrayPositions = [-0.35, -0.18, 0.18, 0.35];
  arrayPositions.forEach((x, i) => {
    const side = i < 2 ? 1 : -1;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.08), clone(MAT.solar));
    panel.position.set(x, 0, side * 0.12);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
    // panel frame
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.15, 0.003, 0.08)),
      new THREE.LineBasicMaterial({ color: 0x2a4a8a })
    );
    frame.position.copy(panel.position);
    g.add(frame);
  });

  g.scale.setScalar(scale);
  return g;
}

// ─── Hubble Space Telescope ───────────────────────────────────────────────────

export function buildHubble(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Cylindrical body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 12), clone(MAT.body));
  body.rotation.z = Math.PI / 2;
  g.add(body);

  // Solar panels (2)
  [-1, 1].forEach(side => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.05), clone(MAT.solar));
    panel.position.set(0, 0, side * 0.1);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
  });

  // Aperture ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.042, 0.004, 8, 24),
    clone(MAT.truss)
  );
  ring.position.set(0.09, 0, 0);
  ring.rotation.y = Math.PI / 2;
  g.add(ring);

  g.scale.setScalar(scale);
  return g;
}

// ─── Generic orbiter/satellite ────────────────────────────────────────────────

export function buildSatellite(scale = 1, color = 0xc0c8d8): THREE.Group {
  const g = new THREE.Group();

  // Bus
  const mat = clone(MAT.body);
  mat.color.setHex(color);
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.06), mat);
  g.add(bus);

  // Two solar panels
  [-1, 1].forEach(side => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.05), clone(MAT.solar));
    panel.position.set(side * 0.1, 0, 0);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
  });

  // Antenna dish
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), clone(MAT.dish));
  dish.position.set(0, 0.03, 0);
  dish.rotation.x = Math.PI;
  g.add(dish);

  g.scale.setScalar(scale);
  return g;
}

// ─── Communications satellite (large dish, small bus) ─────────────────────────
// Used by Earth Mode's live satellite marker system for satellites classified
// as comms-type (see lib/satellites/marker-geometry.ts).

export function buildCommsSatellite(scale = 1, color = 0xc0c8d8): THREE.Group {
  const g = new THREE.Group();

  const mat = clone(MAT.body);
  mat.color.setHex(color);
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), mat);
  g.add(bus);

  // One large parabolic dish — the recognisable "comms satellite" silhouette
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), clone(MAT.dish));
  dish.position.set(0, 0.05, 0);
  dish.rotation.x = Math.PI;
  g.add(dish);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.03, 6), clone(MAT.truss));
  feed.position.set(0, 0.03, 0);
  g.add(feed);

  // Small solar panels
  [-1, 1].forEach(side => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), clone(MAT.solar));
    panel.position.set(side * 0.07, 0, 0);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
  });

  g.scale.setScalar(scale);
  return g;
}

// ─── Navigation satellite (GPS-style twin cross panels) ───────────────────────

export function buildNavSatellite(scale = 1, color = 0xc0c8d8): THREE.Group {
  const g = new THREE.Group();

  const mat = clone(MAT.body);
  mat.color.setHex(color);
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.045), mat);
  g.add(bus);

  // Characteristic wide double solar-panel "wings"
  [-1, 1].forEach(side => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.045), clone(MAT.solar));
    panel.position.set(side * 0.12, 0, 0);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.16, 0.003, 0.045)),
      new THREE.LineBasicMaterial({ color: 0x2a4a8a })
    );
    frame.position.copy(panel.position);
    g.add(frame);
  });

  // Small nadir-pointing antenna array
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 8), clone(MAT.dark));
  antenna.position.set(0, -0.028, 0);
  g.add(antenna);

  g.scale.setScalar(scale);
  return g;
}

// ─── Orion capsule ────────────────────────────────────────────────────────────

export function buildOrion(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Cone (crew module)
  const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.055, 0.1, 12), clone(MAT.white));
  cm.rotation.z = Math.PI / 2;
  g.add(cm);

  // ESM cylinder
  const esm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), clone(MAT.gold));
  esm.rotation.z = Math.PI / 2;
  esm.position.set(-0.1, 0, 0);
  g.add(esm);

  // Solar panels
  [-1, 1].forEach(side => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.04), clone(MAT.solar));
    panel.position.set(-0.1, 0, side * 0.09);
    panel.rotation.x = Math.PI / 2;
    g.add(panel);
  });

  g.scale.setScalar(scale);
  return g;
}

// ─── Mars rover (Perseverance / Curiosity style) ──────────────────────────────

export function buildRover(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.07), clone(MAT.rover));
  g.add(body);

  // Mast (camera tower)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 5), clone(MAT.truss));
  mast.position.set(0.03, 0.05, 0);
  g.add(mast);

  // Camera head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.015, 0.02), clone(MAT.dark));
  head.position.set(0.03, 0.082, 0);
  g.add(head);

  // 6 wheels (3 per side)
  const wheelPos = [
    [-0.04, 0], [0, 0], [0.04, 0],
  ];
  wheelPos.forEach(([wx]) => {
    [-1, 1].forEach(side => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.01, 10),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.8 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, -0.022, side * 0.044);
      g.add(wheel);
    });
  });

  // RTG power source
  const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.045, 8), clone(MAT.dark));
  rtg.rotation.z = Math.PI / 2;
  rtg.position.set(-0.065, 0, 0);
  g.add(rtg);

  g.scale.setScalar(scale);
  return g;
}

// ─── Lander (InSight style) ───────────────────────────────────────────────────

export function buildLander(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Lander deck (hexagonal base)
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 6), clone(MAT.body));
  g.add(deck);

  // Three legs
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 4), clone(MAT.truss));
    leg.position.set(Math.cos(angle) * 0.06, -0.04, Math.sin(angle) * 0.06);
    leg.rotation.z = angle + Math.PI * 0.15;
    g.add(leg);
    // Footpad
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.004, 8), clone(MAT.truss));
    pad.position.set(Math.cos(angle) * 0.075, -0.078, Math.sin(angle) * 0.075);
    g.add(pad);
  }

  // Solar panels
  [-1, 1].forEach(side => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), clone(MAT.solar));
    panel.position.set(side * 0.1, 0.01, 0);
    panel.rotation.x = Math.PI / 2;
    panel.rotation.z = side * 0.3;
    g.add(panel);
  });

  // Seismometer dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), clone(MAT.white));
  dome.position.set(0.04, 0.01, 0.04);
  dome.rotation.x = Math.PI;
  g.add(dome);

  g.scale.setScalar(scale);
  return g;
}

// ─── Lunar orbiter (LRO style) ────────────────────────────────────────────────

export function buildLunarOrbiter(scale = 1): THREE.Group {
  const g = new THREE.Group();

  // Bus
  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.05), clone(MAT.body));
  g.add(bus);

  // Single large solar panel
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.06), clone(MAT.solar));
  panel.position.set(0.13, 0, 0);
  panel.rotation.x = Math.PI / 2;
  g.add(panel);

  // HGA dish
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.6), clone(MAT.dish));
  dish.position.set(-0.04, 0.04, 0);
  g.add(dish);

  // MiniRF horn
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.015, 0.04, 6), clone(MAT.truss));
  horn.position.set(0, -0.04, 0);
  g.add(horn);

  g.scale.setScalar(scale);
  return g;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export type SpacecraftModelType =
  | 'iss'
  | 'hubble'
  | 'satellite'
  | 'orion'
  | 'rover'
  | 'lander'
  | 'lunar-orbiter';

/** Map missionId → model type */
export const MISSION_MODEL: Record<string, SpacecraftModelType> = {
  iss:          'iss',
  terra:        'satellite',
  aqua:         'satellite',
  'landsat-9':  'satellite',
  lro:          'lunar-orbiter',
  kplo:         'satellite',
  'artemis-2':  'orion',
  mro:          'satellite',
  maven:        'satellite',
  'mars-express': 'satellite',
  tgo:          'satellite',
  perseverance: 'rover',
  curiosity:    'rover',
  insight:      'lander',
};

export function buildSpacecraftModel(missionId: string, scale = 1): THREE.Group {
  const type = MISSION_MODEL[missionId] || 'satellite';
  switch (type) {
    case 'iss':           return buildISS(scale);
    case 'hubble':        return buildHubble(scale);
    case 'orion':         return buildOrion(scale);
    case 'rover':         return buildRover(scale);
    case 'lander':        return buildLander(scale);
    case 'lunar-orbiter': return buildLunarOrbiter(scale);
    default:              return buildSatellite(scale);
  }
}
