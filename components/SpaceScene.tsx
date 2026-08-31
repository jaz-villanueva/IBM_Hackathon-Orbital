'use client';

/**
 * SpaceScene — Interactive 3D Solar System Mission Map
 *
 * Architecture:
 *  • Full heliocentric solar system (Sun + 8 planets) with JPL Keplerian
 *    orbital mechanics driven by the existing SimClock.
 *  • Earth → Moon (hierarchical), Mars → Phobos + Deimos (hierarchical).
 *  • Mission spacecraft (Earth/Moon/Mars) remain attached to moving parent bodies.
 *  • Static orbital-path lines built once at init (thin, gray, semi-transparent).
 *  • Camera targets Earth/Moon/Mars at their CURRENT simulated positions.
 *  • All existing UI (search, filters, sim clock, mission popup, AI pulse) preserved.
 *
 * Coordinate system:
 *   Sun at origin [0, 0, 0].
 *   1 AU → AU_TO_SCENE scene units.
 *   Planet & moon visual radii are exaggerated (see lib/solar-system.ts).
 *   Moon/Phobos/Deimos orbit radii are also scaled by KM_TO_SCENE.
 *
 * Data sources:
 *   Planet elements: JPL/Caltech "Approximate Keplerian Elements" (1800–2050)
 *   Moon elements: JPL Planetary Satellite Mean Orbital Parameters
 *   Spacecraft: lib/orbital-mechanics.ts, lib/spacecraft-positions.ts
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { Search, X, Layers, ChevronDown, ChevronUp, Sparkles, Clock, Play } from 'lucide-react';
import { MISSIONS, searchMissions } from '@/lib/missions';
import { ALL_SCENE_OBJECTS, SceneObject, ObjectType } from '@/lib/spacecraft-positions';
import {
  ORBITAL_PARAMS,
  OrbitalParams,
  keplerPosition,
  orbitPath,
  makeSimClock,
  simElapsedSeconds,
  formatSimTime,
  simNow,
  SIM_SPEEDS,
  SimClock,
  SimSpeed,
  dateToJD,
  jdToT,
  jplPlanetPosition,
  moonPosition,
  planetOrbitPath,
  moonOrbitPath,
} from '@/lib/orbital-mechanics';
import {
  SOLAR_SYSTEM,
  AU_TO_SCENE,
} from '@/lib/solar-system';
import { buildSpacecraftModel } from '@/lib/spacecraft-geometry';
import { classifySatelliteMarkerType, buildSatelliteMarker, markerTypeLabel } from '@/lib/satellites/marker-geometry';
import { PlanetIcon } from './PlanetIcon';
import { makeEarthDayTexture, makeEarthNightTexture, makeCloudTexture } from '@/lib/earth-texture';
import type { Mission } from '@/lib/types';

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * A dynamically-supplied orbiter (e.g. from a live CelesTrak fetch) to render
 * alongside the static ALL_SCENE_OBJECTS/ORBITAL_PARAMS catalog. Used by the
 * Satellite Explorer to show a live satellite's marker + orbit ring reusing
 * this scene's existing rendering pipeline, without mutating the shared
 * ORBITAL_PARAMS/ALL_SCENE_OBJECTS module state.
 */
export interface ExtraOrbiter {
  id: string;
  params: OrbitalParams;
  sceneObject: SceneObject;
}

interface SpaceSceneProps {
  selectedPlanet: string | null;
  missions: Mission[];
  onPlanetSelect: (planet: string) => void;
  /** Called when the scene selects a mission; called with null when deselecting. */
  onMissionSelect: (mission: Mission | null) => void;
  selectedMission?: Mission | null;
  /** Called each animation frame with the simulation elapsed seconds. */
  onSimTimeUpdate?: (elapsedSeconds: number) => void;
  /** Live-fetched satellites to render in addition to the static catalog (see ExtraOrbiter). */
  extraOrbiters?: ExtraOrbiter[];
  /**
   * Called whenever a scene object is selected/deselected by click, regardless
   * of whether it resolves to an Orbital Mission (unlike onMissionSelect, which
   * only fires for objects with a matching Mission record). Used by Earth Mode
   * to know which satellite was clicked even for live satellites that
   * aren't Orbital missions.
   */
  onObjectSelect?: (obj: SceneObject | null) => void;
  /**
   * Controlled focus target: when set to a missionId, the camera continuously
   * tracks that orbiter's live position (close-up), and the internal selection
   * state is synced to match — this lets a parent-owned HUD (e.g. clicking a
   * satellite in a list, or a "back to satellites" control) drive camera focus
   * without reaching into the scene's internal state. Pass null to release
   * focus back to the current planet view.
   */
  focusedOrbiterId?: string | null;
  /**
   * When set to a mission id, selects that mission's SceneObject on the 3D map
   * (highlights its orbit ring, fires onMissionSelect) without requiring a
   * canvas click. Used by the Planet Widget to focus a mission from the sidebar.
   * Pass null to clear the selection.
   */
  focusedMissionId?: string | null;
  // Note: onMissionSelect kept nullable for popup close compatibility
}

// ─── Scene constants ──────────────────────────────────────────────────────────

/**
 * Fallback scale: km → scene units for moon orbit radii.
 * Used for Earth's Moon (Luna already sits at a comfortable 2.5× Earth's visual
 * radius with this value).  All other planets use per-planet overrides below.
 */
const KM_TO_SCENE = 2.8e-6;

/**
 * Per-planet km → scene scale for moon orbital distances (Option C).
 *
 * Rationale: planets are rendered at heavily exaggerated visual radii, but moon
 * orbital distances are converted from raw km.  Without compensation, inner moons
 * of Mars, Jupiter, Saturn and Neptune end up inside their parent planet's mesh.
 *
 * Method:
 *  - Earth:   unchanged (KM_TO_SCENE) — Luna already sits at 2.5× visual radius.
 *  - Mars:    planet-relative scaling (visualRadius / radiusKm) so every moon
 *             orbit is expressed in multiples of Mars' own exaggerated radius.
 *             (Phobos ≈ 4.1×, Deimos ≈ 10.4× the visual radius.)
 *  - Others:  clearance formula → scale = (visualRadius × 1.8) / innermostMoonKm
 *             guarantees the innermost moon orbits at ≥ 1.8× the visual radius
 *             while all relative inter-moon distances remain proportional.
 *
 * A soft outer cap (40× the planet's visual radius in scene units) is applied at
 * render time to prevent distant irregular moons (Himalia, Phoebe, Nereid…) from
 * drifting so far they overlap neighbouring planet orbits.
 */
const MOON_ORBIT_SCALE: Record<string, number> = {
  earth:   2.800e-6,   // unchanged — Luna at 2.5× Earth visual radius
  mars:    1.239e-4,   // planet-relative (0.42 / 3390) — Phobos at 4.1×, Deimos at 10.4×
  jupiter: 6.563e-6,   // 1.8× clearance on Metis  (192 000 km innermost)
  saturn:  5.210e-6,   // 1.8× clearance on Pan    (200 376 km innermost)
  uranus:  3.510e-6,   // 1.8× clearance on Miranda (194 850 km innermost)
  neptune: 8.958e-6,   // 1.8× clearance on Naiad   (72 341 km innermost)
};

/** Max moon orbit distance = 40× parent visual radius (caps distant irregular moons). */
const MOON_ORBIT_CAP_MULT = 40;

/**
 * Return the km→scene scale for a moon's parent planet, then clamp the
 * resulting scene-unit distance to the outer cap.
 *
 * @param parentId  CelestialBody.id of the parent planet
 * @param parentVisualRadius  parent's visualRadius in scene units
 * @param kmOffset  scalar distance from parent centre in km (magnitude of offset)
 * @returns scale factor to multiply the km-space offset vector by
 */
function moonKmScale(parentId: string, parentVisualRadius: number, kmOffset: number): number {
  const baseScale = MOON_ORBIT_SCALE[parentId] ?? KM_TO_SCENE;
  const raw       = kmOffset * baseScale;
  const cap       = parentVisualRadius * MOON_ORBIT_CAP_MULT;
  // If the raw distance exceeds the cap, return a reduced scale so the vector
  // magnitude stays at the cap while direction is preserved.
  return raw > cap ? cap / kmOffset : baseScale;
}

/**
 * Visual radii (scene units) for non-Earth celestial bodies.
 * These are stored in lib/solar-system.ts CelestialBody.visualRadius but
 * we also apply an extra multiplier for distant outer planets.
 */
const OUTER_PLANET_RADIUS_BOOST = 1.0; // set >1 to further enlarge outer planets

/**
 * Home camera: framed to show the inner solar system clearly while
 * communicating the full scale. Earth sits at ~10 scene units.
 * FOV is widened in home mode to capture more context.
 */
const HOME_CAMERA = {
  target: [0, 0, 0] as [number, number, number],
  // Spherical orbit coords for home view
  azimuth: 0,
  elevation: 0.42,  // ~24° above ecliptic plane
  radius: 55,       // much closer — Earth visible at ~10 units
};

/** Zoom-in radius (distance from body) when a planet is selected */
const PLANET_CAM_RADIUS: Record<string, number> = {
  mercury: 2,
  venus:   3.5,
  earth:   5,
  moon:    2.5,
  mars:    4,
  jupiter: 10,
  saturn:  12,
  uranus:  9,
  neptune: 9,
}; // outer planet radii kept for visual zoom compatibility

/**
 * Live satellites (Earth Mode) are rendered as a single fixed-scale 3D model
 * regardless of orbit regime — nothing in this scene is to physical scale
 * (see the module doc comment), so there is no "real size" to vary by regime.
 * A deliberately exaggerated fixed scale keeps every satellite recognisable
 * and clickable rather than shrinking into an unreadable point.
 */
const SATELLITE_MARKER_SCALE = 0.55;
/** Invisible click-target sphere radius — larger than the visible model for reliable selection. */
const SATELLITE_HIT_RADIUS = 0.12;
/** Base (non-selected) orbit ring opacity for live satellites — orbit paths are secondary context, not the primary visual. */
const SATELLITE_RING_OPACITY = 0.04;
/** Ring opacity for the currently focused/selected satellite. */
const SATELLITE_RING_OPACITY_SELECTED = 0.70;
/**
 * Close-up camera radius (scene units) when a satellite is focused via
 * focusedOrbiterId. Tuned to SATELLITE_MARKER_SCALE — since every satellite
 * marker is the same fixed visual size (see above), one focus distance is
 * appropriate for all orbit regimes; there's no varying physical size to
 * adapt to.
 */
const SATELLITE_FOCUS_RADIUS = 0.65;

const STATUS_COLOR: Record<string, number> = {
  active:    0x22c55e,
  science:   0x3b82f6,
  surface:   0xf59e0b,
  planned:   0x60a5fa,
  completed: 0x64748b,
};

const TYPE_CHAR: Record<ObjectType, string> = {
  station:   '⬡',
  orbiter:   '◈',
  rover:     '◉',
  lander:    '◆',
  capsule:   '▲',
  telescope: '✦',
};

// Scene-unit orbit radii for mission spacecraft.
// Each value = planet.visualRadius × (smaKm / planet.radiusKm),
// floored at planet.visualRadius × 1.15 to prevent clipping into the parent mesh.
// Highly elliptical / flyby missions use a representative value noted in comments.
const VISUAL_ORBIT_RADIUS: Record<string, number> = {
  // ── Earth (vR=0.55, rKm=6371) ──────────────────────────────────────────────
  iss:                  0.72,   // ~408 km  → 1.31× vR
  terra:                0.78,   // ~705 km  → 1.42× vR
  aqua:                 0.78,   // ~705 km  → 1.42× vR
  'landsat-9':          0.78,   // ~705 km  → 1.42× vR
  // ── Moon (vR=0.19, rKm=1737) ───────────────────────────────────────────────
  lro:                  0.22,   // ~100 km  → 1.16× vR
  kplo:                 0.22,   // ~100 km  → 1.16× vR
  'artemis-2':          0.65,   // wide lunar flyby → 3.42× vR (unchanged)
  // ── Mars (vR=0.42, rKm=3390) ───────────────────────────────────────────────
  mro:                  0.50,   // ~300 km  → 1.19× vR
  tgo:                  0.50,   // ~400 km  → 1.19× vR
  maven:                0.80,   // elliptical sma ~6500 km → 1.90× vR
  'mars-express':       1.19,   // highly elliptical sma ~9630 km → 2.83× vR
  // ── Jupiter (vR=0.70, rKm=69911) ───────────────────────────────────────────
  juno:                 0.82,   // perijove ~74 100 km → 1.17× vR
  'europa-clipper':     1.10,   // Europa-vicinity orbit → 1.57× vR
  juice:                1.30,   // Ganymede-vicinity orbit → 1.86× vR
  // ── Saturn (vR=0.58, rKm=58232) ────────────────────────────────────────────
  cassini:              0.68,   // Grand Finale ~62 000 km → 1.17× vR
  dragonfly:            1.00,   // Titan-vicinity → 1.72× vR
  // ── Uranus (vR=0.38, rKm=25362) ────────────────────────────────────────────
  'voyager-2-uranus':   0.55,   // flyby closest approach ~81 500 km → 1.45× vR
  // ── Neptune (vR=0.36, rKm=24622) ───────────────────────────────────────────
  'voyager-2-neptune':  0.48,   // flyby closest approach ~29 200 km → 1.33× vR
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}

function makeSprite(char: string, color: string, size = 64): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  const ctx = cv.getContext('2d')!;
  const half = size / 2;
  ctx.beginPath(); ctx.arc(half, half, half * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = color + '44'; ctx.fill();
  ctx.beginPath(); ctx.arc(half, half, half * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = color + 'aa'; ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.3)}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(char, half, half + 1);
  return new THREE.CanvasTexture(cv);
}

function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

function eio(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Get current heliocentric scene position for a body, reading from the live
 * world-positions map (populated each frame).
 */
function getBodyPos(id: string, bodyWorldPos: Map<string, THREE.Vector3>): THREE.Vector3 {
  return bodyWorldPos.get(id) ?? new THREE.Vector3(0, 0, 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpaceScene({ selectedPlanet, onPlanetSelect, onMissionSelect, selectedMission, onSimTimeUpdate, extraOrbiters, onObjectSelect, focusedOrbiterId, focusedMissionId }: SpaceSceneProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef      = useRef<number>(0);

  // id → planet/moon mesh (interactive bodies go into planetsRef for raycasting)
  const planetsRef    = useRef<Map<string, THREE.Mesh>>(new Map());
  // id → all moon meshes (used for hover raycasting of non-interactive moons)
  const moonMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  // id → parent group that moves with the body (children: mesh + satellites)
  const bodyGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  // Live world-space positions (centre of each body), updated every frame
  const bodyWorldPos  = useRef<Map<string, THREE.Vector3>>(new Map());

  // Mission spacecraft (+ an invisible larger click-target sphere for live satellites)
  const objectsRef    = useRef<Map<string, { sprite: THREE.Sprite; model: THREE.Group; hitSphere?: THREE.Mesh }>>(new Map());
  const orbitRingsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const orbitPathRef  = useRef<THREE.Line | null>(null);

  const lastMouseRef    = useRef({ x: 0, y: 0 });
  const isDraggingRef   = useRef(false);
  const pointerDownPos  = useRef({ x: 0, y: 0 });

  /**
   * Spherical camera orbit state.
   * The camera is always placed at:
   *   orbitTarget + spherical(azimuth, elevation, radius)
   * and always looks at orbitTarget.
   * Drag changes azimuth/elevation; wheel changes radius.
   */
  const orbitRef = useRef({
    // current (smoothed) values
    azimuth:   HOME_CAMERA.azimuth,
    elevation: HOME_CAMERA.elevation,
    radius:    HOME_CAMERA.radius,
    // target values (we lerp toward these)
    tAzimuth:   HOME_CAMERA.azimuth,
    tElevation: HOME_CAMERA.elevation,
    tRadius:    HOME_CAMERA.radius,
    // orbit centre
    target:    new THREE.Vector3(...HOME_CAMERA.target),
    tTarget:   new THREE.Vector3(...HOME_CAMERA.target),
  });

  // Simulation clock stored in ref (mutated without re-render)
  const clockRef = useRef<SimClock>(makeSimClock());

  // Live-fetched extra orbiters, kept in a ref so the once-only animate loop
  // (empty-dep effect) always reads the latest value without re-subscribing.
  const extraOrbitersRef = useRef<ExtraOrbiter[]>(extraOrbiters ?? []);
  useEffect(() => { extraOrbitersRef.current = extraOrbiters ?? []; }, [extraOrbiters]);

  // Parent-controlled camera focus target (see SpaceSceneProps.focusedOrbiterId).
  const focusedOrbiterIdRef = useRef<string | null>(focusedOrbiterId ?? null);
  useEffect(() => { focusedOrbiterIdRef.current = focusedOrbiterId ?? null; }, [focusedOrbiterId]);

  /** Live satellite currently under the pointer — drives the per-frame hover glow/scale in the animate loop. */
  const hoveredSatelliteIdRef = useRef<string | null>(null);

  /** OrbitalParams for a mission id, preferring a live extraOrbiter over the static catalog. */
  const paramsFor = useCallback((missionId: string): OrbitalParams | undefined => {
    return extraOrbitersRef.current.find((e) => e.id === missionId)?.params ?? ORBITAL_PARAMS[missionId];
  }, []);

  /** SceneObject for a mission id, preferring a live extraOrbiter over the static catalog. */
  const sceneObjectFor = useCallback((missionId: string): SceneObject | undefined => {
    return extraOrbitersRef.current.find((e) => e.id === missionId)?.sceneObject
      ?? ALL_SCENE_OBJECTS.find((o) => o.missionId === missionId);
  }, []);

  // UI state
  const [hoveredBody,    setHoveredBody]    = useState<string | null>(null);
  const [tooltip,        setTooltip]        = useState<{ x: number; y: number; label: string; sublabel?: string } | null>(null);
  const [selectedObject, setSelectedObject] = useState<SceneObject | null>(null);
  const [popupPos,       setPopupPos]       = useState<{ x: number; y: number } | null>(null);
  const [simSpeed,       setSimSpeed]       = useState<SimSpeed>(1);
  const [simTimeStr,     setSimTimeStr]     = useState(() => formatSimTime(new Date()));

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState<Record<ObjectType, boolean>>({
    station: true, orbiter: true, rover: true, lander: true, capsule: true, telescope: true,
  });
  const [statusFilters, setStatusFilters] = useState({
    active: true, science: true, surface: true, planned: true, completed: true,
  });
  const [destFilters, setDestFilters] = useState({ mercury: true, venus: true, earth: true, moon: true, mars: true, jupiter: true, saturn: true, uranus: true, neptune: true });

  // Search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<Mission[]>([]);

  // AI Pulse
  const [aiPulseText,    setAiPulseText]    = useState<string | null>(null);
  const [aiPulseLoading, setAiPulseLoading] = useState(false);

  // Visible objects after filtering.
  // Completed missions are never shown as 3D sprites — they only appear in the
  // mission catalog (/missions).  All other status-based filters still apply.
  // When a planet/moon is selected, only show missions belonging to that destination.
  const visibleObjects = useMemo(() => {
    const extraIds = new Set((extraOrbiters ?? []).map((e) => e.id));
    const base = ALL_SCENE_OBJECTS.filter(obj => {
      if (extraIds.has(obj.missionId)) return false; // extraOrbiters take precedence — avoid duplicate markers/rings
      if (obj.status === 'completed') return false;
      if (!typeFilters[obj.objectType]) return false;
      if (!statusFilters[obj.status as keyof typeof statusFilters]) return false;
      if (!destFilters[obj.destination]) return false;
      // When a destination is selected, hide missions for other destinations.
      if (selectedPlanet && obj.destination !== selectedPlanet) return false;
      return true;
    });
    return [...base, ...(extraOrbiters ?? []).map((e) => e.sceneObject)];
  }, [typeFilters, statusFilters, destFilters, selectedPlanet, extraOrbiters]);

  const counts = useMemo(() => {
    const c = { mercury: 0, venus: 0, earth: 0, moon: 0, mars: 0, jupiter: 0, saturn: 0, uranus: 0, neptune: 0 };
    visibleObjects.forEach(o => { if (o.destination in c) c[o.destination as keyof typeof c]++; });
    return c;
  }, [visibleObjects]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setSearchResults(q.trim() ? searchMissions(q).slice(0, 6) : []);
  }, []);

  const handleSearchSelect = useCallback((mission: Mission) => {
    setSearchQuery(''); setSearchResults([]);
    onPlanetSelect(mission.destination === 'deep-space' ? '' : mission.destination);
    const obj = ALL_SCENE_OBJECTS.find(o => o.missionId === mission.id);
    if (obj) { setSelectedObject(obj); onMissionSelect(mission); }
  }, [onPlanetSelect, onMissionSelect]);

  // ─── Camera orbit update ──────────────────────────────────────────────────

  /**
   * Transition the orbit controller to a new target body (or home).
   * We set the TARGET values; the animation loop smoothly lerps toward them.
   */
  const goToDestination = useCallback((dest: string | null) => {
    const o = orbitRef.current;
    if (!dest || dest === '' || dest === 'home') {
      o.tTarget.set(...HOME_CAMERA.target);
      o.tAzimuth   = HOME_CAMERA.azimuth;
      o.tElevation = HOME_CAMERA.elevation;
      o.tRadius    = HOME_CAMERA.radius;
    } else {
      const bodyPos = bodyWorldPos.current.get(dest);
      if (bodyPos) o.tTarget.copy(bodyPos);
      o.tRadius    = PLANET_CAM_RADIUS[dest] ?? 5;
      // Keep azimuth/elevation from wherever user is currently looking — feels natural
      // but clamp elevation to a reasonable range
      o.tElevation = Math.max(0.1, Math.min(1.2, o.elevation));
    }
  }, []);

  useEffect(() => {
    goToDestination(selectedPlanet);
  }, [selectedPlanet, goToDestination]);

  // ─── Parent-controlled satellite focus (focusedOrbiterId prop) ────────────
  // Keeps the internal selectedObject in sync when selection originates
  // outside the 3D canvas (e.g. a HUD list click, or a "back to fleet"
  // control) rather than a direct click on a marker. Camera tracking itself
  // happens per-frame in the animate loop via focusedOrbiterIdRef.
  useEffect(() => {
    if (focusedOrbiterId === undefined) return; // prop unused by this consumer
    if (focusedOrbiterId === null) {
      setSelectedObject(null);
      setPopupPos(null);
      goToDestination(selectedPlanet); // restore the normal planet-view camera radius/target
      return;
    }
    const obj = sceneObjectFor(focusedOrbiterId);
    if (obj) setSelectedObject(obj);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedOrbiterId, sceneObjectFor, goToDestination]);

  // ─── Parent-controlled mission focus (focusedMissionId prop) ─────────────
  // Selects a mission on the 3D map from outside the canvas — e.g. from the
  // Planet Widget sidebar — without requiring a canvas click.
  useEffect(() => {
    if (focusedMissionId === undefined) return;
    if (focusedMissionId === null) {
      setSelectedObject(null);
      setPopupPos(null);
      return;
    }
    const obj = ALL_SCENE_OBJECTS.find((o) => o.missionId === focusedMissionId);
    if (!obj) return;
    setSelectedObject(obj);
    const mission = MISSIONS.find((m) => m.id === focusedMissionId);
    if (mission) onMissionSelect(mission);

    // Compute popup screen position by projecting the destination planet's
    // world position through the camera. We defer one rAF so the animate loop
    // has had a chance to update bodyWorldPos for the current frame.
    const computePos = () => {
      const camera = cameraRef.current;
      const mount  = mountRef.current;
      if (!camera || !mount) {
        // Fallback: place popup at a sensible fixed position (clamped by MissionPopup)
        setPopupPos({ x: 0, y: 0 });
        return;
      }
      const dest    = obj.destination;
      const worldPos = bodyWorldPos.current.get(dest) ?? new THREE.Vector3();
      const sp      = worldPos.clone().project(camera);
      const rect    = mount.getBoundingClientRect();
      setPopupPos({
        x: (sp.x + 1) / 2 * rect.width,
        y: (-sp.y + 1) / 2 * rect.height,
      });
    };
    const rafId = requestAnimationFrame(computePos);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedMissionId]);

  // ─── Sim speed changes ─────────────────────────────────────────────────────

  useEffect(() => {
    const now = simNow(clockRef.current);
    clockRef.current = { wallBase: Date.now(), simBase: now, speed: simSpeed };
  }, [simSpeed]);

  // ─── THREE.js scene init ───────────────────────────────────────────────────

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.01,
      5000,
    );
    // Place camera at initial spherical position
    {
      const o = orbitRef.current;
      const x = o.target.x + o.radius * Math.cos(o.elevation) * Math.sin(o.azimuth);
      const y = o.target.y + o.radius * Math.sin(o.elevation);
      const z = o.target.z + o.radius * Math.cos(o.elevation) * Math.cos(o.azimuth);
      camera.position.set(x, y, z);
    }
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Stars ──
    const starPos = new Float32Array(4000 * 3);
    for (let i = 0; i < 4000; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const r  = 800 + Math.random() * 400;
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.6, sizeAttenuation: true, transparent: true, opacity: 0.75,
    })));

    // ── Lights ──
    // Point light at Sun's position
    const sunLight = new THREE.PointLight(0xfff5e0, 3.5, 2000, 0.4);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    // Ambient fill so dark sides aren't pure black
    scene.add(new THREE.AmbientLight(0x0d1a2e, 0.6));

    // ── Compute initial T (Julian centuries from J2000) for orbital paths ──
    const initDate = simNow(clockRef.current);
    const initT    = jdToT(dateToJD(initDate));

    // ─── Build Sun ──────────────────────────────────────────────────────────
    {
      const sunBody = SOLAR_SYSTEM.find(b => b.id === 'sun')!;
      const sunGeo  = new THREE.SphereGeometry(sunBody.visualRadius, 32, 32);
      const sunMat  = new THREE.MeshBasicMaterial({ color: sunBody.color ?? 0xffdd88 });
      const sunMesh = new THREE.Mesh(sunGeo, sunMat);
      sunMesh.name  = 'sun';
      scene.add(sunMesh);
      // Corona glow
      const coronaGeo = new THREE.SphereGeometry(sunBody.visualRadius * 1.5, 24, 24);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0xff8800, transparent: true, opacity: 0.08, side: THREE.BackSide,
      });
      scene.add(new THREE.Mesh(coronaGeo, coronaMat));
      bodyWorldPos.current.set('sun', new THREE.Vector3(0, 0, 0));
    }

    // ─── Orbital-path material (shared, thin gray semi-transparent) ─────────
    const orbitLineMat = new THREE.LineBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.18,
    });

    // ─── Build heliocentric planets ─────────────────────────────────────────
    for (const body of SOLAR_SYSTEM) {
      if (!body.planetaryElements) continue; // skip Sun and moons here

      // Static orbital path (built once from current epoch T)
      if (body.showOrbit) {
        const pathPts = planetOrbitPath(body.planetaryElements, initT, 256);
        const pathVecs = pathPts.map(p => new THREE.Vector3(
          p.x * AU_TO_SCENE,
          p.z * AU_TO_SCENE, // ecliptic Z → scene Y (ecliptic is near XZ plane → map Z to Y to get slight tilt)
          -p.y * AU_TO_SCENE,
        ));
        pathVecs.push(pathVecs[0].clone()); // close loop
        const pathGeo  = new THREE.BufferGeometry().setFromPoints(pathVecs);
        const pathLine = new THREE.Line(pathGeo, orbitLineMat.clone());
        scene.add(pathLine);
      }

      // Planet mesh
      const r = body.visualRadius * (body.id === 'jupiter' || body.id === 'saturn' ||
                                      body.id === 'uranus'  || body.id === 'neptune'
                                      ? OUTER_PLANET_RADIUS_BOOST : 1);

      let mesh: THREE.Mesh;

      if (body.id === 'earth') {
        // ── Earth: special rendering (texture, clouds, atmosphere) ──
        const dayTex   = makeEarthDayTexture();
        const nightTex = makeEarthNightTexture();
        const earthMat = new THREE.MeshStandardMaterial({
          map:               dayTex,
          emissiveMap:       nightTex,
          emissive:          new THREE.Color(0x112244),
          emissiveIntensity: 0.35,
          roughness:         0.85,
          metalness:         0.05,
        });
        mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 64), earthMat);
        mesh.name = 'earth';

        // Clouds
        const cloudMat = new THREE.MeshStandardMaterial({
          map: makeCloudTexture(), transparent: true, opacity: 0.38, depthWrite: false,
          roughness: 1, metalness: 0,
        });
        const clouds = new THREE.Mesh(new THREE.SphereGeometry(r * 1.012, 40, 40), cloudMat);
        clouds.name = 'earth-clouds';
        mesh.add(clouds); // parent so clouds move with Earth

        // Atmosphere
        const atmMat = new THREE.MeshBasicMaterial({
          color: 0x4db8ff, transparent: true, opacity: 0.055, side: THREE.BackSide,
        });
        mesh.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.09, 24, 24), atmMat));

      } else if (body.id === 'mars') {
        // ── Mars: special rendering ──
        const marsMat = new THREE.MeshStandardMaterial({
          color: body.color ?? 0xc2410c,
          emissive: new THREE.Color(body.emissive ?? 0x3a0d02),
          emissiveIntensity: 0.25, roughness: 0.88, metalness: 0.05,
        });
        mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 56, 56), marsMat);
        mesh.name = 'mars';

        // Polar caps
        const iceMat = new THREE.MeshStandardMaterial({ color: 0xddeeff, roughness: 0.6 });
        [-1, 1].forEach(pole => {
          const cap = new THREE.Mesh(
            new THREE.SphereGeometry(r * 0.22, 16, 8, 0, Math.PI * 2, 0, 0.3),
            iceMat.clone(),
          );
          cap.position.y = pole * r * 0.97;
          cap.rotation.x = pole === 1 ? 0 : Math.PI;
          mesh.add(cap);
        });
        // Wire grid
        const wireGeo = new THREE.SphereGeometry(r + 0.001, 16, 16);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0x401808, wireframe: true, transparent: true, opacity: 0.1,
        });
        mesh.add(new THREE.Mesh(wireGeo, wireMat));
        // Atmosphere
        mesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(r * 1.07, 24, 24),
          new THREE.MeshBasicMaterial({ color: 0xe05c30, transparent: true, opacity: 0.04, side: THREE.BackSide }),
        ));

      } else if (body.id === 'saturn') {
        // ── Saturn: add ring ──
        const satMat = new THREE.MeshStandardMaterial({
          color: body.color ?? 0xe4d191,
          emissive: new THREE.Color(body.emissive ?? 0x1e1804),
          emissiveIntensity: 0.15, roughness: 0.9, metalness: 0.0,
        });
        mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), satMat);
        mesh.name = 'saturn';

        const ringGeo = new THREE.RingGeometry(r * 1.3, r * 2.2, 80);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd4c090, transparent: true, opacity: 0.45, side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        mesh.add(ring);

      } else {
        // ── Generic planet ──
        const mat = new THREE.MeshStandardMaterial({
          color: body.color ?? 0xaaaaaa,
          emissive: new THREE.Color(body.emissive ?? 0x000000),
          emissiveIntensity: 0.15,
          roughness: 0.85,
          metalness: 0.0,
        });
        mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), mat);
        mesh.name = body.id;

        // Atmosphere glow for planets that have one
        if (body.atmosphereColor) {
          const atmMesh = new THREE.Mesh(
            new THREE.SphereGeometry(r * 1.06, 24, 24),
            new THREE.MeshBasicMaterial({
              color: body.atmosphereColor, transparent: true, opacity: 0.05, side: THREE.BackSide,
            }),
          );
          mesh.add(atmMesh);
        }
      }

      // Compute initial position and place mesh
      const p0 = jplPlanetPosition(body.planetaryElements, initT);
      // Map ecliptic coords to scene: scene X = ecliptic X, scene Y = ecliptic Z, scene Z = -ecliptic Y
      const initScenePos = new THREE.Vector3(
        p0.x * AU_TO_SCENE,
        p0.z * AU_TO_SCENE,
        -p0.y * AU_TO_SCENE,
      );
      mesh.position.copy(initScenePos);
      scene.add(mesh);
      planetsRef.current.set(body.id, mesh);
      bodyWorldPos.current.set(body.id, initScenePos.clone());

      // Moon orbit path for Earth's Moon (built here, referenced in moon section below)
      // (handled in the moons loop below)
    }

    // ─── Build all moons ────────────────────────────────────────────────────
    // Reuse geometry instances by radius bucket (rounded to 3 dp) to avoid
    // creating a new SphereGeometry per moon — important for outer planets
    // which have many small moons with essentially identical visual sizes.
    const moonGeoCache = new Map<number, THREE.SphereGeometry>();
    const getMoonGeo = (r: number): THREE.SphereGeometry => {
      // bucket radius to 3 decimal places so nearby radii share geometry
      const key = Math.round(r * 1000) / 1000;
      let geo = moonGeoCache.get(key);
      if (!geo) {
        // Small moons get fewer segments for performance; large ones get more.
        const segs = r >= 0.10 ? 32 : r >= 0.06 ? 20 : 14;
        geo = new THREE.SphereGeometry(key, segs, segs);
        moonGeoCache.set(key, geo);
      }
      return geo;
    };

    for (const body of SOLAR_SYSTEM) {
      if (!body.moonElements) continue;

      const parentPos = bodyWorldPos.current.get(body.parentId!) ?? new THREE.Vector3();
      const r = body.visualRadius;
      const parentVR = SOLAR_SYSTEM.find(b => b.id === body.parentId)?.visualRadius ?? 1;

      // Moon orbital path (if shown) — built relative to parent's current pos
      if (body.showOrbit) {
        const moonPathPts = moonOrbitPath(body.moonElements, 128);
        const moonPathVecs = moonPathPts.map(p => {
          // Use a representative km distance (semi-major axis) for the cap check
          const ptKm = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
          const s = moonKmScale(body.parentId!, parentVR, ptKm || body.moonElements!.smaKm);
          return new THREE.Vector3(
            parentPos.x + p.x * s,
            parentPos.y + p.z * s,
            parentPos.z - p.y * s,
          );
        });
        moonPathVecs.push(moonPathVecs[0].clone());
        const moonPathLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(moonPathVecs),
          orbitLineMat.clone(),
        );
        // Tag it so we can update its position when the parent planet moves
        moonPathLine.name = `orbit-path-${body.id}`;
        scene.add(moonPathLine);
      }

      // Moon mesh — reuse geometry; each moon still gets its own material so
      // emissive intensity can be animated on hover independently.
      const moonMat = new THREE.MeshStandardMaterial({
        color: body.color ?? 0x888888,
        emissive: new THREE.Color(body.emissive ?? 0x000000),
        emissiveIntensity: 0.15,
        roughness: 0.9,
        metalness: 0.05,
      });
      const moonMesh = new THREE.Mesh(getMoonGeo(r), moonMat);
      moonMesh.name = body.id;

      // Atmosphere glow for Earth's Moon only
      if (body.id === 'moon') {
        moonMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(r * 1.06, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.04, side: THREE.BackSide }),
        ));
      }

      // Compute initial moon position
      const moonOff = moonPosition(body.moonElements, initDate);
      const moonKm  = Math.sqrt(moonOff.x ** 2 + moonOff.y ** 2 + moonOff.z ** 2) || body.moonElements.smaKm;
      const ms      = moonKmScale(body.parentId!, parentVR, moonKm);
      const moonScenePos = new THREE.Vector3(
        parentPos.x + moonOff.x * ms,
        parentPos.y + moonOff.z * ms,
        parentPos.z - moonOff.y * ms,
      );
      moonMesh.position.copy(moonScenePos);
      scene.add(moonMesh);
      // All moons go into moonMeshesRef for hover detection
      moonMeshesRef.current.set(body.id, moonMesh);
      // Interactive moons (Earth's Moon) also go into planetsRef for click selection
      if (body.interactive) planetsRef.current.set(body.id, moonMesh);
      bodyWorldPos.current.set(body.id, moonScenePos.clone());
    }

    // ─── Raycaster ──────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    raycaster.params.Sprite = { threshold: 0.1 };
    const pointer = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // Live satellites raycast against an invisible, larger hit-sphere (see
      // SATELLITE_HIT_RADIUS) rather than their small visible model, so
      // clicking/hovering stays reliable even though the model itself is
      // deliberately compact. Regular mission markers keep using their sprite.
      const pickTargets: THREE.Object3D[] = [];
      objectsRef.current.forEach(({ sprite, hitSphere }) => pickTargets.push(hitSphere ?? sprite));
      const sHits = raycaster.intersectObjects(pickTargets);
      if (sHits.length) {
        const mId = sHits[0].object.name;
        const obj = sceneObjectFor(mId);
        const sublabel = obj?.isLiveSatellite
          ? markerTypeLabel(classifySatelliteMarkerType(obj.name, obj.objectType === 'station'))
          : undefined;
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 14, label: obj?.shortName || mId, sublabel });
        document.body.style.cursor = 'pointer';
        setHoveredBody(null);
        hoveredSatelliteIdRef.current = obj?.isLiveSatellite ? mId : null;
        if (isDraggingRef.current) { lastMouseRef.current = { x: e.clientX, y: e.clientY }; }
        return;
      }
      hoveredSatelliteIdRef.current = null;

      // Hover: test planets (interactive) first, then all moons (name display only)
      const hoverMeshes = Array.from(planetsRef.current.values());
      const hoverIds = new Set(Array.from(planetsRef.current.keys()));
      // Also include non-interactive moon meshes so they show tooltips
      const allMoonMeshes = Array.from(moonMeshesRef.current.values());
      const allMoonIds = new Set(Array.from(moonMeshesRef.current.keys()));
      const combinedMeshes = [...hoverMeshes, ...allMoonMeshes.filter(m => !hoverIds.has(m.name))];
      const combinedIds = new Set([...hoverIds, ...allMoonIds]);
      const pHits = raycaster.intersectObjects(combinedMeshes, true);
      if (pHits.length) {
        // Walk up to find the named body
        let hitObj: THREE.Object3D | null = pHits[0].object;
        let hoverBodyId: string | null = null;
        while (hitObj) {
          if (combinedIds.has(hitObj.name)) { hoverBodyId = hitObj.name; break; }
          hitObj = hitObj.parent;
        }
        const displayName = hoverBodyId ?? pHits[0].object.name;
        setHoveredBody(displayName);
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, label: displayName.toUpperCase() });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredBody(null);
        setTooltip(null);
        document.body.style.cursor = '';
      }

      if (isDraggingRef.current) {
        const dx = (e.clientX - lastMouseRef.current.x) * 0.007;
        const dy = (e.clientY - lastMouseRef.current.y) * 0.007;
        // Orbit around current target — change azimuth and elevation
        orbitRef.current.tAzimuth   -= dx;
        orbitRef.current.tElevation  = Math.max(0.05, Math.min(1.4, orbitRef.current.tElevation + dy));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      lastMouseRef.current   = { x: e.clientX, y: e.clientY };
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current  = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      isDraggingRef.current = false;
      if (!mountRef.current) return;
      // Compare against the original mousedown position (not the last mousemove
      // position) so that a pan/drag never accidentally triggers selection.
      if (Math.abs(e.clientX - pointerDownPos.current.x) > 4 ||
          Math.abs(e.clientY - pointerDownPos.current.y) > 4) return;

      // Raycast at the original click-down position, not the release position.
      const rect = mountRef.current.getBoundingClientRect();
      pointer.x = ((pointerDownPos.current.x - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((pointerDownPos.current.y - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const pickTargets: THREE.Object3D[] = [];
      objectsRef.current.forEach(({ sprite, hitSphere }) => pickTargets.push(hitSphere ?? sprite));
      const sHits = raycaster.intersectObjects(pickTargets);
      if (sHits.length) {
        const mId = sHits[0].object.name;
        const obj = sceneObjectFor(mId);
        if (obj) {
          setSelectedObject(obj);
          onObjectSelect?.(obj);
          const mission = MISSIONS.find(m => m.id === obj.missionId);
          if (mission) onMissionSelect(mission);
          const sp = sHits[0].object.position.clone().project(camera);
          setPopupPos({ x: (sp.x + 1) / 2 * rect.width, y: (-sp.y + 1) / 2 * rect.height });
        }
        return;
      }

      // Use recursive=true so child meshes (clouds, atmosphere) are also tested,
      // then walk up the hit object's ancestry to find the interactive body id.
      const interactiveMeshes = Array.from(planetsRef.current.entries())
        .filter(([id]) => SOLAR_SYSTEM.find(b => b.id === id)?.interactive)
        .map(([, mesh]) => mesh);
      const interactiveIds = new Set(
        Array.from(planetsRef.current.keys()).filter(id => SOLAR_SYSTEM.find(b => b.id === id)?.interactive)
      );
      const pHits = raycaster.intersectObjects(interactiveMeshes, true);
      if (pHits.length) {
        // Walk up from the hit object to find the interactive body (e.g. 'earth', not 'earth-clouds')
        let hitObj: THREE.Object3D | null = pHits[0].object;
        let bodyId: string | null = null;
        while (hitObj) {
          if (interactiveIds.has(hitObj.name)) { bodyId = hitObj.name; break; }
          hitObj = hitObj.parent;
        }
        if (bodyId) {
          onPlanetSelect(bodyId);
          setSelectedObject(null); setPopupPos(null);
          onObjectSelect?.(null);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.10 : 0.91;
      orbitRef.current.tRadius = Math.max(0.5, Math.min(1200, orbitRef.current.tRadius * factor));
    };

    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    const el = mountRef.current;
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    // Reset drag state if the mouse is released anywhere outside the canvas
    // (e.g. on a UI element above the scene or outside the browser window).
    // Without this, isDraggingRef can get stuck at `true`, causing the orbit
    // to continue rotating on every mousemove — and on some Chromium/Windows
    // builds with hardware-accelerated compositing this stale drag state
    // prevents fixed-position nav elements (Missions, Timeline) from
    // receiving pointer events correctly.  Alt+Tab normally flushes the
    // compositor and happens to clear the symptom, but the right fix is to
    // keep drag state consistent at the source.
    const onWindowMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mouseup', onWindowMouseUp);

    // ─── Animation loop ─────────────────────────────────────────────────────
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      // ── Orbit controller: smoothly lerp orbit params toward targets ──
      const o = orbitRef.current;
      const lerpK = 0.09; // smoothing factor per frame

      // When tracking a planet (non-home), keep tTarget locked to the
      // body's live world position so we follow a moving planet.
      const sel = selectedPlanetRef.current;
      if (sel && sel !== '' && sel !== 'home') {
        const livePos = bodyWorldPos.current.get(sel);
        if (livePos) o.tTarget.copy(livePos);
      }

      // When a satellite is focused (Earth Mode HUD selection), override the
      // planet-level target with the satellite's live WORLD-SPACE position —
      // same "continuously re-lock to a moving target" technique as the
      // planet tracking above, just targeting a tracked orbiter instead.
      // We use getWorldPosition() so that any parent-group transforms are
      // correctly resolved — this is the fix for the "camera zooms to empty
      // space" bug where model.position was read as local coords.
      const focusedId = focusedOrbiterIdRef.current;
      if (focusedId) {
        const tracked = objectsRef.current.get(focusedId);
        if (tracked) {
          const _wp = new THREE.Vector3();
          // Prefer the hit-sphere world position (always in sync with the model
          // and most reliably kept in scene coords), fall back to model.
          const source = tracked.hitSphere ?? tracked.model;
          source.getWorldPosition(_wp);
          o.tTarget.copy(_wp);
          o.tRadius = SATELLITE_FOCUS_RADIUS;
        }
      }

      o.azimuth   += (o.tAzimuth   - o.azimuth)   * lerpK;
      o.elevation += (o.tElevation - o.elevation)  * lerpK;
      o.radius    += (o.tRadius    - o.radius)     * lerpK;
      o.target.lerp(o.tTarget, lerpK);

      // Compute camera position from spherical coords around orbit target
      const camX = o.target.x + o.radius * Math.cos(o.elevation) * Math.sin(o.azimuth);
      const camY = o.target.y + o.radius * Math.sin(o.elevation);
      const camZ = o.target.z + o.radius * Math.cos(o.elevation) * Math.cos(o.azimuth);
      camera.position.set(camX, camY, camZ);
      camera.lookAt(o.target);

      // Current sim date → Julian centuries
      const now   = simNow(clockRef.current);
      const T     = jdToT(dateToJD(now));

      // ── Update heliocentric planet positions ──
      for (const body of SOLAR_SYSTEM) {
        if (!body.planetaryElements) continue;
        const p = jplPlanetPosition(body.planetaryElements, T);
        const scenePos = new THREE.Vector3(
          p.x * AU_TO_SCENE,
          p.z * AU_TO_SCENE,
          -p.y * AU_TO_SCENE,
        );
        const mesh = planetsRef.current.get(body.id);
        if (mesh) mesh.position.copy(scenePos);
        bodyWorldPos.current.set(body.id, scenePos.clone());

        // Planet self-rotation (visual only)
        if (mesh) {
          const rotSpeed: Record<string, number> = {
            mercury: 0.0003, venus: 0.0002, earth: 0.0015,
            mars: 0.001, jupiter: 0.003, saturn: 0.0028,
            uranus: 0.0018, neptune: 0.0016,
          };
          mesh.rotation.y += rotSpeed[body.id] ?? 0.001;

          // Rotate Earth's cloud child (index 0 child = clouds)
          if (body.id === 'earth') {
            const clouds = mesh.getObjectByName('earth-clouds');
            if (clouds) clouds.rotation.y += 0.0018;
          }
        }
      }

      // ── Update moon positions (parent-relative) ──
      for (const body of SOLAR_SYSTEM) {
        if (!body.moonElements) continue;
        const parentPos = bodyWorldPos.current.get(body.parentId!) ?? new THREE.Vector3();
        const parentVR  = SOLAR_SYSTEM.find(b => b.id === body.parentId)?.visualRadius ?? 1;
        const off = moonPosition(body.moonElements, now);
        const offKm = Math.sqrt(off.x ** 2 + off.y ** 2 + off.z ** 2) || body.moonElements.smaKm;
        const ms    = moonKmScale(body.parentId!, parentVR, offKm);
        const moonScenePos = new THREE.Vector3(
          parentPos.x + off.x * ms,
          parentPos.y + off.z * ms,
          parentPos.z - off.y * ms,
        );
        // moonMeshesRef holds all moons; planetsRef only has interactive ones
        const mesh = moonMeshesRef.current.get(body.id);
        if (mesh) {
          mesh.position.copy(moonScenePos);
          mesh.rotation.y += 0.0004;
        }
        bodyWorldPos.current.set(body.id, moonScenePos.clone());

        // Slide moon orbital path with parent
        const pathLine = scene.getObjectByName(`orbit-path-${body.id}`) as THREE.Line | undefined;
        if (pathLine && body.moonElements) {
          const moonPathPts = moonOrbitPath(body.moonElements, 128);
          const pathVecs = moonPathPts.map(pp => {
            const ptKm = Math.sqrt(pp.x * pp.x + pp.y * pp.y + pp.z * pp.z);
            const s = moonKmScale(body.parentId!, parentVR, ptKm || body.moonElements!.smaKm);
            return new THREE.Vector3(
              parentPos.x + pp.x * s,
              parentPos.y + pp.z * s,
              parentPos.z - pp.y * s,
            );
          });
          pathVecs.push(pathVecs[0].clone());
          (pathLine.geometry as THREE.BufferGeometry).setFromPoints(pathVecs);
        }
      }

      // ── Update mission spacecraft positions ──
      const elapsed = simElapsedSeconds(clockRef.current);
      onSimTimeUpdate?.(elapsed);
      objectsRef.current.forEach(({ sprite, model, hitSphere }, missionId) => {
        const scObj = sceneObjectFor(missionId);
        if (!scObj) return;

        // Parent body world position (now dynamic)
        const pPos = bodyWorldPos.current.get(scObj.destination) ?? new THREE.Vector3();

        if (scObj.isOrbiter) {
          const params = paramsFor(missionId);
          const vr     = VISUAL_ORBIT_RADIUS[missionId] || scObj.orbitRadius || 1.5;
          let dx: number, dy: number, dz: number;
          if (params) {
            const dir = keplerPosition(params, elapsed);
            dx = dir.x * vr; dy = dir.y * vr; dz = dir.z * vr;
          } else {
            const ang = elapsed * (scObj.orbitSpeed || 1) * 0.0001 + (scObj.orbitPhase || 0);
            const inc = scObj.orbitInclination || 0;
            dx = vr * Math.cos(ang);
            dy = vr * Math.sin(ang) * Math.sin(inc);
            dz = vr * Math.sin(ang) * Math.cos(inc);
          }
          const wx = pPos.x + dx, wy = pPos.y + dy, wz = pPos.z + dz;
          sprite.position.set(wx, wy, wz);
          model.position.set(wx, wy, wz);
          if (hitSphere) hitSphere.position.set(wx, wy, wz);

          // Move orbit ring with parent
          const ring = orbitRingsRef.current.get(missionId);
          if (ring) ring.position.copy(pPos);

          if (scObj.isLiveSatellite) {
            // Live satellites always show their 3D marker — no sprite/model
            // distance swap. They're deliberately scaled (SATELLITE_MARKER_SCALE)
            // to stay recognisable at both overview and focused distances.
            model.rotation.y += 0.004;

            // Smoothly ease the model's scale toward a target based on
            // focus/hover state — a gentle, continuous alternative to an
            // instant jump, giving satellites a "discoverable" feel on hover
            // (subtle grow) and a stronger emphasis once selected.
            const isFocused = focusedOrbiterIdRef.current === missionId;
            const isHovered = hoveredSatelliteIdRef.current === missionId;
            const targetFactor = isFocused ? 1.35 : isHovered ? 1.2 : 1;
            const prevFactor = (model.userData.scaleFactor as number | undefined) ?? 1;
            const nextFactor = prevFactor + (targetFactor - prevFactor) * 0.15;
            model.userData.scaleFactor = nextFactor;
            model.scale.setScalar(SATELLITE_MARKER_SCALE * nextFactor);
          } else {
            // Distance threshold tuned down from 4→2 alongside the more
            // accurate mission-orbit distances from branch-for-minor-adjustments.
            const camDist = camera.position.distanceTo(new THREE.Vector3(wx, wy, wz));
            const showModel = camDist < 2;
            sprite.visible = !showModel;
            model.visible  = showModel;
            if (showModel) { model.rotation.y += 0.005; model.lookAt(pPos); }
          }
        } else {
          // Surface mission: position relative to parent body
          const bodyDef  = SOLAR_SYSTEM.find(b => b.missionDestination === scObj.destination);
          const bodyR    = bodyDef?.visualRadius ?? 0.3;
          const lat = scObj.surfaceLat ?? 0;
          const lon = scObj.surfaceLon ?? 0;
          const sv  = latLonToVec3(lat, lon, bodyR + 0.06);
          sprite.position.set(pPos.x + sv.x, pPos.y + sv.y, pPos.z + sv.z);
          model.position.set(pPos.x + sv.x, pPos.y + sv.y, pPos.z + sv.z);
        }
      });

      // ── Planet emissive glow on hover/select (interactive bodies only) ──
      planetsRef.current.forEach((mesh, name) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat || !('emissiveIntensity' in mat)) return;
        const isSelected = SOLAR_SYSTEM.find(b => b.id === name)?.missionDestination === selectedPlanetRef.current;
        const isHovered  = name === hoveredBodyRef.current;
        const target = (isHovered || isSelected) ? 0.6 : 0.15;
        mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
      });

      // ── Moon emissive glow on hover (non-interactive moons) ──
      moonMeshesRef.current.forEach((mesh, name) => {
        if (planetsRef.current.has(name)) return; // already handled above
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat || !('emissiveIntensity' in mat)) return;
        const isHovered = name === hoveredBodyRef.current;
        const target = isHovered ? 0.5 : 0.15;
        mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Sim clock UI update (no re-render per frame)
    const clockTick = setInterval(() => {
      setSimTimeStr(formatSimTime(simNow(clockRef.current)));
    }, 250);

    return () => {
      clearInterval(clockTick);
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onWindowMouseUp);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      document.body.style.cursor = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refs for values used inside the animation loop (avoid stale closures)
  const selectedPlanetRef = useRef(selectedPlanet);
  const hoveredBodyRef    = useRef<string | null>(null);
  useEffect(() => { selectedPlanetRef.current = selectedPlanet; }, [selectedPlanet]);
  useEffect(() => { hoveredBodyRef.current = hoveredBody; }, [hoveredBody]);

  // ─── Sync visibleObjects → scene mission spacecraft ───────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old spacecraft
    objectsRef.current.forEach(({ sprite, model, hitSphere }) => {
      scene.remove(sprite); scene.remove(model);
      if (hitSphere) scene.remove(hitSphere);
    });
    objectsRef.current.clear();
    orbitRingsRef.current.forEach(r => scene.remove(r));
    orbitRingsRef.current.clear();

    visibleObjects.forEach(obj => {
      const color     = STATUS_COLOR[obj.status] || STATUS_COLOR.active;
      const char      = TYPE_CHAR[obj.objectType] || '◈';
      const spriteTex = makeSprite(char, hexToCSS(color));
      const scaleSpr  = obj.objectType === 'station' ? 0.28 : obj.objectType === 'rover' ? 0.22 : 0.18;

      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: spriteTex, transparent: true, opacity: 0.92, depthTest: false,
      }));
      sprite.scale.set(scaleSpr, scaleSpr, scaleSpr);
      sprite.name = obj.missionId;
      sprite.visible = !obj.isLiveSatellite;

      // 3D model — live satellites (Earth Mode) get the dedicated marker
      // system (bigger, always visible, recognisable shape); everything
      // else keeps the existing mission-catalog model.
      const model = obj.isLiveSatellite
        ? buildSatelliteMarker(classifySatelliteMarkerType(obj.name, obj.objectType === 'station'), obj.orbitColor ?? color, SATELLITE_MARKER_SCALE)
        : buildSpacecraftModel(obj.missionId, 0.12);
      model.name  = obj.missionId + '-model';
      model.visible = !!obj.isLiveSatellite; // live satellites: always on; others: distance-toggled per-frame

      // Invisible larger click-target for live satellites — the visible
      // model stays compact/recognisable, but the hit area is bigger for
      // reliable selection (opacity:0 + visible:true so it still raycasts).
      let hitSphere: THREE.Mesh | undefined;
      if (obj.isLiveSatellite) {
        hitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(SATELLITE_HIT_RADIUS, 8, 8),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
        );
        hitSphere.name = obj.missionId;
      }

      // Get current parent position
      const pPos = bodyWorldPos.current.get(obj.destination) ?? new THREE.Vector3();

      if (obj.isOrbiter) {
        const params = extraOrbiters?.find((e) => e.id === obj.missionId)?.params ?? ORBITAL_PARAMS[obj.missionId];
        const vr     = VISUAL_ORBIT_RADIUS[obj.missionId] || obj.orbitRadius || 1.5;
        let dx = vr, dy = 0, dz = 0;
        if (params) {
          const dir = keplerPosition(params, 0);
          dx = dir.x * vr; dy = dir.y * vr; dz = dir.z * vr;
        }
        sprite.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);
        model.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);
        if (hitSphere) hitSphere.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);

        // Orbit ring (positioned at parent body). Live satellite rings start
        // dim — orbital paths are secondary context, not the primary visual —
        // and get boosted only for the focused/selected satellite (see the
        // selection-highlight effect below).
        const ringR   = vr;
        const ringGeo = new THREE.RingGeometry(ringR - 0.005, ringR + 0.005, 96);
        const ringMat = new THREE.MeshBasicMaterial({
          color: obj.orbitColor || color,
          transparent: true,
          opacity: obj.isLiveSatellite ? SATELLITE_RING_OPACITY : 0.2,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pPos);
        ring.rotation.x = obj.orbitInclination || (params ? params.incDeg * Math.PI / 180 : 0);
        ring.rotation.z = params ? params.raanDeg * Math.PI / 180 : 0;
        scene.add(ring);
        orbitRingsRef.current.set(obj.missionId, ring);
      } else {
        // Surface mission
        const bodyDef = SOLAR_SYSTEM.find(b => b.missionDestination === obj.destination);
        const bodyR   = bodyDef?.visualRadius ?? 0.3;
        const lat = obj.surfaceLat ?? 0;
        const lon = obj.surfaceLon ?? 0;
        const sv  = latLonToVec3(lat, lon, bodyR + 0.06);
        sprite.position.set(pPos.x + sv.x, pPos.y + sv.y, pPos.z + sv.z);
        model.position.set(pPos.x + sv.x, pPos.y + sv.y, pPos.z + sv.z);
      }

      scene.add(sprite);
      scene.add(model);
      if (hitSphere) scene.add(hitSphere);
      objectsRef.current.set(obj.missionId, { sprite, model, hitSphere });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleObjects, extraOrbiters]);

  // ─── Orbit path when mission object selected ──────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (orbitPathRef.current) { scene.remove(orbitPathRef.current); orbitPathRef.current = null; }
    if (!selectedObject?.isOrbiter) return;
    const params = extraOrbiters?.find((e) => e.id === selectedObject.missionId)?.params ?? ORBITAL_PARAMS[selectedObject.missionId];
    if (!params) return;

    const vr   = VISUAL_ORBIT_RADIUS[selectedObject.missionId] || selectedObject.orbitRadius || 1.5;
    const pPos = bodyWorldPos.current.get(selectedObject.destination) ?? new THREE.Vector3();

    const pts3d = orbitPath(params, 128).map(d => new THREE.Vector3(
      pPos.x + d.x * vr,
      pPos.y + d.y * vr,
      pPos.z + d.z * vr,
    ));
    pts3d.push(pts3d[0].clone());

    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts3d),
      new THREE.LineBasicMaterial({
        color: selectedObject.orbitColor ?? STATUS_COLOR[selectedObject.status] ?? 0x3b82f6,
        transparent: true, opacity: selectedObject.isLiveSatellite ? 0.75 : 0.55,
      }),
    );
    scene.add(pathLine);
    orbitPathRef.current = pathLine;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject, extraOrbiters]);

  // ─── Highlight selected spacecraft sprite + satellite model/ring ──────────

  useEffect(() => {
    objectsRef.current.forEach(({ sprite, model }, mId) => {
      const mat = sprite.material as THREE.SpriteMaterial;
      const isSelected = mId === selectedObject?.missionId;
      mat.opacity = isSelected ? 1.0 : 0.88;
      const base = extraOrbiters?.find((e) => e.id === mId)?.sceneObject ?? ALL_SCENE_OBJECTS.find(o => o.missionId === mId);
      const s = isSelected ? 0.36 : base?.objectType === 'station' ? 0.28 : 0.18;
      sprite.scale.set(s, s, s);

      if (base?.isLiveSatellite) {
        // Selected satellite: brighter model, others dim slightly so the
        // selection reads clearly. Scale itself is handled per-frame in the
        // animate loop (smooth ease toward a focus/hover target) rather than
        // set instantly here.
        model.traverse((child) => {
          if (child instanceof THREE.Mesh && 'opacity' in child.material) {
            const mm = child.material as THREE.MeshStandardMaterial;
            mm.transparent = true;
            mm.opacity = isSelected ? 1 : 0.8;
          }
        });

        const ring = orbitRingsRef.current.get(mId);
        if (ring) {
          const ringMat = ring.material as THREE.MeshBasicMaterial;
          ringMat.opacity = isSelected ? SATELLITE_RING_OPACITY_SELECTED : SATELLITE_RING_OPACITY;
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject, extraOrbiters]);

  // ─── AI Pulse ─────────────────────────────────────────────────────────────

  const handleAIPulse = async () => {
    setAiPulseLoading(true); setAiPulseText(null);
    const dest     = selectedPlanet || 'the visible solar system';
    const destObjs = selectedPlanet ? visibleObjects.filter(o => o.destination === selectedPlanet) : visibleObjects;
    const names    = destObjs.map(o => o.shortName).join(', ');
    const prompt   = selectedPlanet
      ? `Summarise current active spacecraft missions at ${dest} in 2-3 sentences. Known objects: ${names}.`
      : `Summarise what humanity currently has operating across Earth, Moon and Mars in 2-3 sentences. Known objects: ${names}.`;
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      setAiPulseText(res.ok ? (data.content || 'AI analysis unavailable.') : 'AI analysis unavailable.');
    } catch {
      const n = destObjs.filter(o => ['active', 'science', 'surface'].includes(o.status)).length;
      setAiPulseText(`${n} active mission object${n !== 1 ? 's' : ''} currently tracked: ${names}.`);
    }
    setAiPulseLoading(false);
  };

  const selectedMissionData = useMemo(() =>
    selectedObject ? MISSIONS.find(m => m.id === selectedObject.missionId) || null : null,
  [selectedObject]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full select-none pointer-events-auto" ref={mountRef}>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-20"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}>
          <div className="glass px-2 py-1.5 rounded text-xs text-orbit-white tracking-widest whitespace-nowrap border border-space-border/60">
            <div>{tooltip.label}</div>
            {tooltip.sublabel && (
              <div className="text-[9px] text-orbit-dim tracking-wider normal-case mt-0.5">{tooltip.sublabel}</div>
            )}
          </div>
        </div>
      )}

      {/* Mission Popup */}
      {/* Earth Mode uses the parent-owned SatelliteHUDPanel instead of this floating
          popup — a live satellite (e.g. a GPS satellite) has no Mission record
          and can't resolve selectedMissionData anyway, but even for Orbital missions
          like ISS, Earth's selection surface is the HUD, not this card. */}
      {selectedObject && selectedMissionData && popupPos && selectedPlanet !== 'earth' && (
        <MissionPopup
          obj={selectedObject}
          mission={selectedMissionData}
          x={popupPos.x} y={popupPos.y}
          onClose={() => { setSelectedObject(null); setPopupPos(null); onObjectSelect?.(null); }}
        />
      )}

      {/* ── Simulation Clock ── */}
      <div className="absolute top-[385px] right-4 z-20">
        <div className="glass border border-space-border/70 rounded-lg px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <Clock size={10} className="text-orbit-dim" />
            <span className="text-[9px] text-orbit-dim tracking-widest">SIMULATION CLOCK</span>
          </div>
          <div className="text-[11px] font-mono text-orbit-white tracking-wide">{simTimeStr}</div>
          <div className="flex items-center gap-1 pt-0.5">
            {SIM_SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[9px] tracking-wider transition-colors ${
                  simSpeed === s
                    ? 'bg-orbit-blue/20 border border-orbit-blue/50 text-orbit-blue'
                    : 'border border-space-border/40 text-orbit-dim hover:text-orbit-white'
                }`}
              >
                {s === 1 ? '1×' : s >= 1000 ? `${s / 1000}K×` : `${s}×`}
              </button>
            ))}
          </div>
          {simSpeed > 1 && (
            <div className="text-[9px] text-orbit-dim/60 tracking-wider">
              <Play size={8} className="inline mr-1" />
              1 sec = {simSpeed >= 1000 ? `${simSpeed / 1000}K` : simSpeed} sim-sec
            </div>
          )}
          {simSpeed === 1 && (
            <div className="text-[9px] text-emerald-400/70 tracking-wider">REAL TIME</div>
          )}
        </div>
      </div>

      {/* ── Data provenance ── */}
      <div className="absolute bottom-[65px] left-4 z-20">
        <div className="glass border border-space-border/40 rounded px-2 py-1">
          <div className="text-[8px] text-orbit-dim/60 tracking-widest">
            PLANETS · DERIVED · JPL KEPLERIAN ELEMENTS (1800–2050)
          </div>
          <div className="text-[8px] text-orbit-dim/60 tracking-widest">
            SPACECRAFT · DERIVED · KEPLERIAN PROPAGATION
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="absolute top-4 right-4 z-20 w-56">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orbit-dim pointer-events-none" />
          <input
            type="text" value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search missions..."
            className="w-full glass border border-space-border rounded-lg pl-7 pr-8 py-2 text-[11px] text-orbit-white placeholder:text-orbit-dim/50 outline-none focus:border-orbit-blue/50 tracking-wide"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-orbit-dim hover:text-orbit-white">
              <X size={11} />
            </button>
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-1 glass border border-space-border rounded-lg overflow-hidden">
            {searchResults.map(m => (
              <button key={m.id} onClick={() => handleSearchSelect(m)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left border-b border-space-border/30 last:border-0">
                <span className="text-[9px] text-orbit-dim capitalize w-10 shrink-0">{m.destination}</span>
                <span className="text-[11px] text-orbit-white truncate">{m.shortName || m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mission Layers filter ── */}
      <div className="absolute top-16 right-4 z-20 w-56">
        <button onClick={() => setFiltersOpen(p => !p)}
          className="w-full flex items-center justify-between glass border border-space-border rounded-lg px-3 py-2 text-[10px] text-orbit-dim hover:text-orbit-white tracking-wider">
          <div className="flex items-center gap-2"><Layers size={11} /><span>MISSION LAYERS</span></div>
          {filtersOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {filtersOpen && (
          <div className="mt-1 glass border border-space-border rounded-lg p-3 space-y-3 max-h-72 overflow-y-auto">
            <div>
              <div className="text-[9px] text-orbit-dim tracking-widest mb-1.5">OBJECT TYPE</div>
              <div className="space-y-1">
                {(Object.keys(typeFilters) as ObjectType[]).map(type => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={typeFilters[type]} className="w-3 h-3 accent-blue-500"
                      onChange={e => setTypeFilters(p => ({ ...p, [type]: e.target.checked }))} />
                    <span className="text-[10px] text-orbit-dim group-hover:text-orbit-white capitalize tracking-wide">{type}s</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-orbit-dim tracking-widest mb-1.5">STATUS</div>
              <div className="space-y-1">
                {(Object.keys(statusFilters) as (keyof typeof statusFilters)[]).map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={statusFilters[s]} className="w-3 h-3 accent-blue-500"
                      onChange={e => setStatusFilters(p => ({ ...p, [s]: e.target.checked }))} />
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: hexToCSS(STATUS_COLOR[s]) }} />
                      <span className="text-[10px] text-orbit-dim group-hover:text-orbit-white capitalize tracking-wide">{s}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-orbit-dim tracking-widest mb-1.5">DESTINATION</div>
              <div className="space-y-1">
                {(['mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'] as const).map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={destFilters[d]} className="w-3 h-3 accent-blue-500"
                      onChange={e => setDestFilters(p => ({ ...p, [d]: e.target.checked }))} />
                    <span className="text-[10px] text-orbit-dim group-hover:text-orbit-white capitalize tracking-wide">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mission Counter ── */}
      <div className="absolute bottom-28 right-4 z-20">
        <div className="glass border border-space-border/50 rounded-lg p-3 text-right">
          <div className="text-[9px] text-orbit-dim tracking-widest mb-2">TRACKED OBJECTS</div>
          {([
            { key: 'mercury', label: 'MERCURY', color: 'text-stone-400' },
            { key: 'venus',   label: 'VENUS',   color: 'text-yellow-600' },
            { key: 'earth',   label: 'EARTH',   color: 'text-blue-400' },
            { key: 'moon',    label: 'MOON',    color: 'text-slate-300' },
            { key: 'mars',    label: 'MARS',    color: 'text-orange-400' },
            { key: 'jupiter', label: 'JUPITER', color: 'text-orange-300' },
            { key: 'saturn',  label: 'SATURN',  color: 'text-yellow-300' },
            { key: 'uranus',  label: 'URANUS',  color: 'text-cyan-300' },
            { key: 'neptune', label: 'NEPTUNE', color: 'text-blue-300' },
          ] as const).map(({ key, label, color }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className={`flex items-center gap-1.5 text-[9px] ${color} tracking-wider`}>
                <PlanetIcon planet={key} size={9} />
                {label}
              </span>
              <span className="text-[11px] font-semibold text-orbit-white tabular-nums">{counts[key]}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-space-border/30 pt-1 mt-1">
            <span className="text-[9px] text-orbit-dim tracking-wider">TOTAL</span>
            <span className="text-[11px] font-semibold text-orbit-white tabular-nums">{counts.mercury + counts.venus + counts.earth + counts.moon + counts.mars + counts.jupiter + counts.saturn + counts.uranus + counts.neptune}</span>
          </div>
        </div>
      </div>

      {/* ── AI Mission Pulse ── */}
      <div className="absolute bottom-4 right-4 z-20 max-w-xs">
        <button onClick={handleAIPulse} disabled={aiPulseLoading}
          className="flex items-center gap-2 px-4 py-2.5 glass rounded-lg border border-purple-400/30 text-purple-400 hover:bg-purple-400/10 transition-colors text-xs tracking-wider disabled:opacity-50">
          <Sparkles size={13} className={aiPulseLoading ? 'animate-spin' : ''} />
          <span>AI MISSION PULSE</span>
        </button>
        {aiPulseText && (
          <div className="mt-2 glass border border-purple-400/20 rounded-lg p-3 text-[11px] text-orbit-dim leading-relaxed animate-slide-up">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-[9px] text-purple-400 tracking-widest">AI ANALYSIS</span>
              <button onClick={() => setAiPulseText(null)} className="text-orbit-dim hover:text-orbit-white"><X size={10} /></button>
            </div>
            {aiPulseText}
          </div>
        )}
      </div>

      {/* ── Bottom legend ── */}
      <div className={`absolute bottom-[100px] left-4 space-y-1 pointer-events-none z-10 transition-opacity duration-300 ${selectedPlanet === 'earth' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-[8px] text-orbit-dim/50 tracking-widest mb-1">LEGEND</div>
        {[
          { color: '#22c55e', label: 'Active' },
          { color: '#3b82f6', label: 'Science ops' },
          { color: '#f59e0b', label: 'Surface ops' },
          { color: '#60a5fa', label: 'Planned' },
          { color: '#64748b', label: 'Completed' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-[10px] text-orbit-dim tracking-wider">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
        <div className="pt-1 border-t border-space-border/30 mt-1">
          {selectedObject?.isOrbiter && (
            <div className="text-[9px] text-orbit-blue/80 tracking-wider">ORBIT PATH SHOWN</div>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className={`absolute bottom-[220px] left-4 text-[10px] text-orbit-dim/40 tracking-wider pointer-events-none z-10 transition-opacity duration-300 ${selectedPlanet === 'earth' ? 'opacity-0' : 'opacity-100'}`}>
        <div>DRAG to rotate · SCROLL to zoom</div>
        <div>CLICK planet or spacecraft</div>
        {simSpeed > 1 && (
          <div className="mt-1 text-amber-400/50">SIM SPEED {simSpeed}×</div>
        )}
      </div>
    </div>
  );
}

// ─── MissionPopup ─────────────────────────────────────────────────────────────

interface MissionPopupProps {
  obj: SceneObject; mission: Mission;
  x: number; y: number;
  onClose: () => void;
}

function MissionPopup({ obj, mission, x, y, onClose }: MissionPopupProps) {
  const statusLabels: Record<string, string> = {
    active: 'ACTIVE', science: 'SCIENCE OPS', surface: 'SURFACE OPS',
    planned: 'PLANNED', completed: 'COMPLETED',
  };
  const statusColors: Record<string, string> = {
    active: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    science: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    surface: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    planned: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
    completed: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
  };

  const left = Math.max(320, Math.min(x - 110, window.innerWidth - 240));
  const top  = Math.max(160, y - 10);

  return (
    <div className="absolute z-30 animate-slide-up"
      style={{ left, top, width: 220 }}>
      <div className="glass border border-space-border rounded-xl p-4 shadow-xl">
        <button onClick={onClose}
          className="absolute top-2.5 right-2.5 text-orbit-dim hover:text-orbit-white transition-colors">
          <X size={12} />
        </button>
        <div className="text-[9px] text-orbit-dim tracking-widest mb-1">{obj.agency}</div>
        <div className="text-[13px] font-semibold text-orbit-white tracking-wide mb-1">{obj.name}</div>
        <div className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[8px] tracking-widest mb-2 ${statusColors[obj.status] ?? statusColors.active}`}>
          {statusLabels[obj.status] ?? obj.status.toUpperCase()}
        </div>
        <div className="text-[11px] text-orbit-dim leading-relaxed mb-3">{obj.statusNote}</div>
        {mission.description && (
          <div className="text-[10px] text-orbit-dim/70 leading-relaxed mb-3 line-clamp-3">
            {mission.description}
          </div>
        )}
        <Link
          href={`/missions/${mission.id}`}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-orbit-blue/10 border border-orbit-blue/30 text-orbit-blue text-[10px] tracking-wider hover:bg-orbit-blue/20 transition-colors"
        >
          VIEW MISSION
        </Link>
      </div>
    </div>
  );
}
