/**
 * Turns a satellite (fleet entry or catalog entry) into a SceneObject for
 * SpaceScene's extraOrbiters pipeline. Pure, presentation-only — no data
 * fetching. Shared by the Earth Mode fleet layer and the single-satellite
 * deep-link fallback so there's one definition of "what a satellite marker
 * looks like" in the 3D scene.
 */

import type { SceneObject } from '../spacecraft-positions';
import type { OrbitRegime } from '../types';

export interface SceneObjectSource {
  id: string;
  name: string;
  shortName?: string;
  agency?: string;
  missionId?: string;
  orbitRegime?: OrbitRegime;
}

/** Orbit ring color by regime, for visual distinction (LEO cyan, MEO purple, GEO amber). */
const REGIME_COLOR: Record<OrbitRegime, number> = {
  LEO: 0x06b6d4,
  MEO: 0x8b5cf6,
  GEO: 0xf59e0b,
};

/**
 * Visual orbit radius (scene units) by regime — deliberately stylised, not to
 * physical scale (nothing in this scene is; see SpaceScene.tsx's doc comment),
 * but distinct enough that LEO/MEO/GEO satellites are visually distinguishable
 * around Earth rather than all sharing one ring.
 */
const REGIME_ORBIT_RADIUS: Record<OrbitRegime, number> = {
  LEO: 1.35,
  MEO: 2.3,
  GEO: 3.3,
};

export function buildSceneObject(src: SceneObjectSource): SceneObject {
  return {
    missionId: src.id,
    name: src.name,
    shortName: src.shortName || src.name,
    agency: src.agency || 'Unknown',
    objectType: src.id === 'iss' ? 'station' : 'orbiter',
    status: 'active',
    destination: 'earth',
    isOrbiter: true,
    statusNote: '',
    orbitColor: src.orbitRegime ? REGIME_COLOR[src.orbitRegime] : undefined,
    orbitRadius: src.orbitRegime ? REGIME_ORBIT_RADIUS[src.orbitRegime] : undefined,
    isLiveSatellite: true,
  };
}
