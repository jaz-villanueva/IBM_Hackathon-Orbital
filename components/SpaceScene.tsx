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
import { makeEarthDayTexture, makeEarthNightTexture, makeCloudTexture } from '@/lib/earth-texture';
import type { Mission } from '@/lib/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SpaceSceneProps {
  selectedPlanet: string;
  missions: Mission[];
  onPlanetSelect: (planet: string) => void;
  onMissionSelect: (mission: Mission) => void;
  selectedMission?: Mission | null;
}

// ─── Scene constants ──────────────────────────────────────────────────────────

/**
 * Scale: km → scene units for moon orbit radii.
 * Chosen so Luna's orbit (~384 400 km) maps to ~1.2 scene units around Earth
 * (which sits at ~10 scene units from Sun).
 * 384400 km × KM_TO_SCENE ≈ 1.2 → KM_TO_SCENE ≈ 3.12e-6
 * We use 2.8e-6 for a slightly tighter fit that keeps moons visible.
 */
const KM_TO_SCENE = 2.8e-6;

/**
 * Visual radii (scene units) for non-Earth celestial bodies.
 * These are stored in lib/solar-system.ts CelestialBody.visualRadius but
 * we also apply an extra multiplier for distant outer planets.
 */
const OUTER_PLANET_RADIUS_BOOST = 1.0; // set >1 to further enlarge outer planets

/**
 * Home camera: pulled back far enough to show the full solar system.
 * Neptune at ~30 AU → 300 scene units; camera at z=380 with y elevation.
 */
const HOME_CAMERA = { pos: [0, 80, 360] as [number, number, number], target: [0, 0, 0] as [number, number, number] };

/** Camera offset relative to planet when zoomed in (scene units) */
const PLANET_CAM_OFFSET: Record<string, [number, number, number]> = {
  earth: [0, 3, 8],
  moon:  [0, 1.5, 3.5],
  mars:  [0, 2.5, 6],
};

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

// Scene-unit orbit radii for mission spacecraft (planet-relative, unchanged)
const VISUAL_ORBIT_RADIUS: Record<string, number> = {
  iss:            1.45,
  terra:          1.72,
  aqua:           1.72,
  'landsat-9':    1.74,
  lro:            0.52,
  kplo:           0.52,
  'artemis-2':    0.68,
  mro:            0.92,
  maven:          1.12,
  'mars-express': 1.18,
  tgo:            0.98,
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

export function SpaceScene({ selectedPlanet, onPlanetSelect, onMissionSelect }: SpaceSceneProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const rendererRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef      = useRef<THREE.Scene | null>(null);
  const cameraRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef      = useRef<number>(0);

  // id → planet/moon mesh (interactive bodies go into planetsRef for raycasting)
  const planetsRef    = useRef<Map<string, THREE.Mesh>>(new Map());
  // id → parent group that moves with the body (children: mesh + satellites)
  const bodyGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  // Live world-space positions (centre of each body), updated every frame
  const bodyWorldPos  = useRef<Map<string, THREE.Vector3>>(new Map());

  // Mission spacecraft
  const objectsRef    = useRef<Map<string, { sprite: THREE.Sprite; model: THREE.Group }>>(new Map());
  const orbitRingsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const orbitPathRef  = useRef<THREE.Line | null>(null);

  const lastMouseRef  = useRef({ x: 0, y: 0 });
  const rotationRef   = useRef({ x: 0, y: 0 });
  const targetRotRef  = useRef({ x: 0, y: 0 });

  // Simulation clock stored in ref (mutated without re-render)
  const clockRef = useRef<SimClock>(makeSimClock());

  // UI state
  const [hoveredBody,    setHoveredBody]    = useState<string | null>(null);
  const [tooltip,        setTooltip]        = useState<{ x: number; y: number; label: string } | null>(null);
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
  const [destFilters, setDestFilters] = useState({ earth: true, moon: true, mars: true });

  // Search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<Mission[]>([]);

  // AI Pulse
  const [aiPulseText,    setAiPulseText]    = useState<string | null>(null);
  const [aiPulseLoading, setAiPulseLoading] = useState(false);

  // Visible objects after filtering
  const visibleObjects = useMemo(() => ALL_SCENE_OBJECTS.filter(obj => {
    if (!typeFilters[obj.objectType]) return false;
    if (!statusFilters[obj.status as keyof typeof statusFilters]) return false;
    if (!destFilters[obj.destination]) return false;
    return true;
  }), [typeFilters, statusFilters, destFilters]);

  const counts = useMemo(() => {
    const c = { earth: 0, moon: 0, mars: 0 };
    visibleObjects.forEach(o => { c[o.destination]++; });
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

  // ─── Camera lerp ──────────────────────────────────────────────────────────

  /**
   * Smoothly lerp the camera to a destination.
   * For Earth/Moon/Mars, target = body's current world position (from bodyWorldPos).
   * Offset is applied in camera-relative space so the body fills the view.
   */
  const lerpCamera = useCallback((dest: string) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;

    let endTarget: THREE.Vector3;
    let endPos: THREE.Vector3;

    if (dest === '' || dest === 'home') {
      endTarget = new THREE.Vector3(...HOME_CAMERA.target);
      endPos    = new THREE.Vector3(...HOME_CAMERA.pos);
    } else {
      const bodyPos = bodyWorldPos.current.get(dest) ?? new THREE.Vector3(0, 0, 0);
      endTarget = bodyPos.clone();
      const off = PLANET_CAM_OFFSET[dest] || [0, 2, 6];
      endPos = bodyPos.clone().add(new THREE.Vector3(...off));
    }

    const startPos = cam.position.clone();
    let t = 0;
    const step = () => {
      t += 0.018;
      if (t > 1) { cam.lookAt(endTarget); return; }
      cam.position.lerpVectors(startPos, endPos, eio(Math.min(t, 1)));
      cam.lookAt(endTarget);
      frameRef.current = requestAnimationFrame(step);
    };
    step();
  }, []);

  useEffect(() => {
    lerpCamera(selectedPlanet === '' ? 'home' : selectedPlanet);
  }, [selectedPlanet, lerpCamera]);

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
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.01,
      5000,
    );
    camera.position.set(...HOME_CAMERA.pos);
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

    // ─── Build moons (Moon, Phobos, Deimos) ────────────────────────────────
    for (const body of SOLAR_SYSTEM) {
      if (!body.moonElements) continue;

      const parentPos = bodyWorldPos.current.get(body.parentId!) ?? new THREE.Vector3();
      const r = body.visualRadius;

      // Moon orbital path (if shown) — built relative to parent's current pos
      if (body.showOrbit) {
        const moonPathPts = moonOrbitPath(body.moonElements, 128);
        const scale = KM_TO_SCENE;
        const moonPathVecs = moonPathPts.map(p => new THREE.Vector3(
          parentPos.x + p.x * scale,
          parentPos.y + p.z * scale,
          parentPos.z - p.y * scale,
        ));
        moonPathVecs.push(moonPathVecs[0].clone());
        const moonPathLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(moonPathVecs),
          orbitLineMat.clone(),
        );
        // Tag it so we can update its position when Earth/Mars moves
        moonPathLine.name = `orbit-path-${body.id}`;
        scene.add(moonPathLine);
      }

      // Moon mesh
      const moonMat = new THREE.MeshStandardMaterial({
        color: body.color ?? 0x888888,
        emissive: new THREE.Color(body.emissive ?? 0x000000),
        emissiveIntensity: 0.2,
        roughness: 0.9,
        metalness: 0.05,
      });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), moonMat);
      moonMesh.name = body.id;

      // Atmosphere glow for Moon
      if (body.id === 'moon') {
        moonMesh.add(new THREE.Mesh(
          new THREE.SphereGeometry(r * 1.06, 24, 24),
          new THREE.MeshBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.04, side: THREE.BackSide }),
        ));
      }

      // Compute initial moon position
      const moonOff = moonPosition(body.moonElements, initDate);
      const moonScenePos = new THREE.Vector3(
        parentPos.x + moonOff.x * KM_TO_SCENE,
        parentPos.y + moonOff.z * KM_TO_SCENE,
        parentPos.z - moonOff.y * KM_TO_SCENE,
      );
      moonMesh.position.copy(moonScenePos);
      scene.add(moonMesh);
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

      const sprites = Array.from(objectsRef.current.values()).map(v => v.sprite);
      const sHits = raycaster.intersectObjects(sprites);
      if (sHits.length) {
        const mId = sHits[0].object.name;
        const obj = ALL_SCENE_OBJECTS.find(o => o.missionId === mId);
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 14, label: obj?.shortName || mId });
        document.body.style.cursor = 'pointer';
        setHoveredBody(null);
        if (e.buttons === 1) { lastMouseRef.current = { x: e.clientX, y: e.clientY }; }
        return;
      }

      const pHits = raycaster.intersectObjects(Array.from(planetsRef.current.values()));
      if (pHits.length) {
        setHoveredBody(pHits[0].object.name);
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, label: pHits[0].object.name.toUpperCase() });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredBody(null);
        setTooltip(null);
        document.body.style.cursor = '';
      }

      if (e.buttons === 1) {
        const dx = (e.clientX - lastMouseRef.current.x) * 0.005;
        const dy = (e.clientY - lastMouseRef.current.y) * 0.005;
        targetRotRef.current.y += dx;
        targetRotRef.current.x = Math.max(-0.6, Math.min(0.6, targetRotRef.current.x + dy));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!mountRef.current) return;
      if (Math.abs(e.clientX - lastMouseRef.current.x) > 4 ||
          Math.abs(e.clientY - lastMouseRef.current.y) > 4) return;

      const rect = mountRef.current.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const sprites = Array.from(objectsRef.current.values()).map(v => v.sprite);
      const sHits = raycaster.intersectObjects(sprites);
      if (sHits.length) {
        const mId = sHits[0].object.name;
        const obj = ALL_SCENE_OBJECTS.find(o => o.missionId === mId);
        if (obj) {
          setSelectedObject(obj);
          const mission = MISSIONS.find(m => m.id === obj.missionId);
          if (mission) onMissionSelect(mission);
          const sp = sHits[0].object.position.clone().project(camera);
          setPopupPos({ x: (sp.x + 1) / 2 * rect.width, y: (-sp.y + 1) / 2 * rect.height });
        }
        return;
      }

      const interactiveMeshes = Array.from(planetsRef.current.entries())
        .filter(([id]) => SOLAR_SYSTEM.find(b => b.id === id)?.interactive)
        .map(([, mesh]) => mesh);
      const pHits = raycaster.intersectObjects(interactiveMeshes);
      if (pHits.length) {
        onPlanetSelect(pHits[0].object.name);
        setSelectedObject(null); setPopupPos(null);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.08 : 0.93;
      const dir = camera.position.clone().normalize();
      camera.position.addScaledVector(dir, (camera.position.length() * (factor - 1)));
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

    // ─── Animation loop ─────────────────────────────────────────────────────
    let sceneT = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      sceneT += 0.005;

      // Scene rotation (drag)
      rotationRef.current.x += (targetRotRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotRef.current.y - rotationRef.current.y) * 0.08;
      scene.rotation.x = rotationRef.current.x * 0.3;
      scene.rotation.y = rotationRef.current.y * 0.3 + sceneT * 0.01;

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
        const off = moonPosition(body.moonElements, now);
        const moonScenePos = new THREE.Vector3(
          parentPos.x + off.x * KM_TO_SCENE,
          parentPos.y + off.z * KM_TO_SCENE,
          parentPos.z - off.y * KM_TO_SCENE,
        );
        const mesh = planetsRef.current.get(body.id);
        if (mesh) {
          mesh.position.copy(moonScenePos);
          mesh.rotation.y += 0.0004;
        }
        bodyWorldPos.current.set(body.id, moonScenePos.clone());

        // Slide moon orbital path with parent
        const pathLine = scene.getObjectByName(`orbit-path-${body.id}`) as THREE.Line | undefined;
        if (pathLine && body.moonElements) {
          const moonPathPts = moonOrbitPath(body.moonElements, 128);
          const scale = KM_TO_SCENE;
          const pathVecs = moonPathPts.map(pp => new THREE.Vector3(
            parentPos.x + pp.x * scale,
            parentPos.y + pp.z * scale,
            parentPos.z - pp.y * scale,
          ));
          pathVecs.push(pathVecs[0].clone());
          (pathLine.geometry as THREE.BufferGeometry).setFromPoints(pathVecs);
        }
      }

      // ── Update mission spacecraft positions ──
      const elapsed = simElapsedSeconds(clockRef.current);
      objectsRef.current.forEach(({ sprite, model }, missionId) => {
        const scObj = ALL_SCENE_OBJECTS.find(o => o.missionId === missionId);
        if (!scObj) return;

        // Parent body world position (now dynamic)
        const pPos = bodyWorldPos.current.get(scObj.destination) ?? new THREE.Vector3();

        if (scObj.isOrbiter) {
          const params = ORBITAL_PARAMS[missionId];
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

          // Move orbit ring with parent
          const ring = orbitRingsRef.current.get(missionId);
          if (ring) ring.position.copy(pPos);

          const camDist = camera.position.distanceTo(new THREE.Vector3(wx, wy, wz));
          const showModel = camDist < 4;
          sprite.visible = !showModel;
          model.visible  = showModel;
          if (showModel) { model.rotation.y += 0.005; model.lookAt(pPos); }
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
    objectsRef.current.forEach(({ sprite, model }) => { scene.remove(sprite); scene.remove(model); });
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

      // 3D model
      const model = buildSpacecraftModel(obj.missionId, 0.12);
      model.name  = obj.missionId + '-model';
      model.visible = false;

      // Get current parent position
      const pPos = bodyWorldPos.current.get(obj.destination) ?? new THREE.Vector3();

      if (obj.isOrbiter) {
        const params = ORBITAL_PARAMS[obj.missionId];
        const vr     = VISUAL_ORBIT_RADIUS[obj.missionId] || obj.orbitRadius || 1.5;
        let dx = vr, dy = 0, dz = 0;
        if (params) {
          const dir = keplerPosition(params, 0);
          dx = dir.x * vr; dy = dir.y * vr; dz = dir.z * vr;
        }
        sprite.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);
        model.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);

        // Orbit ring (positioned at parent body)
        const ringR   = vr;
        const ringGeo = new THREE.RingGeometry(ringR - 0.005, ringR + 0.005, 96);
        const ringMat = new THREE.MeshBasicMaterial({
          color: obj.orbitColor || color,
          transparent: true, opacity: 0.2, side: THREE.DoubleSide,
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
      objectsRef.current.set(obj.missionId, { sprite, model });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleObjects]);

  // ─── Orbit path when mission object selected ──────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (orbitPathRef.current) { scene.remove(orbitPathRef.current); orbitPathRef.current = null; }
    if (!selectedObject?.isOrbiter) return;
    const params = ORBITAL_PARAMS[selectedObject.missionId];
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
        color: STATUS_COLOR[selectedObject.status] || 0x3b82f6,
        transparent: true, opacity: 0.55,
      }),
    );
    scene.add(pathLine);
    orbitPathRef.current = pathLine;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject]);

  // ─── Highlight selected spacecraft sprite ─────────────────────────────────

  useEffect(() => {
    objectsRef.current.forEach(({ sprite }, mId) => {
      const mat = sprite.material as THREE.SpriteMaterial;
      const isSelected = mId === selectedObject?.missionId;
      mat.opacity = isSelected ? 1.0 : 0.88;
      const base = ALL_SCENE_OBJECTS.find(o => o.missionId === mId);
      const s = isSelected ? 0.36 : base?.objectType === 'station' ? 0.28 : 0.18;
      sprite.scale.set(s, s, s);
    });
  }, [selectedObject]);

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
    <div className="relative w-full h-full select-none" ref={mountRef}>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-20"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}>
          <div className="glass px-2 py-1 rounded text-xs text-orbit-white tracking-widest whitespace-nowrap border border-space-border/60">
            {tooltip.label}
          </div>
        </div>
      )}

      {/* Mission Popup */}
      {selectedObject && selectedMissionData && popupPos && (
        <MissionPopup
          obj={selectedObject}
          mission={selectedMissionData}
          x={popupPos.x} y={popupPos.y}
          onClose={() => { setSelectedObject(null); setPopupPos(null); }}
        />
      )}

      {/* ── Simulation Clock ── */}
      <div className="absolute top-[375px] left-10 z-20">
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
      <div className="absolute bottom-[10px] left-4 z-20">
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
                {(['earth', 'moon', 'mars'] as const).map(d => (
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
            { key: 'earth', label: '🌎 EARTH', color: 'text-blue-400' },
            { key: 'moon',  label: '🌙 MOON',  color: 'text-slate-300' },
            { key: 'mars',  label: '🔴 MARS',  color: 'text-orange-400' },
          ] as const).map(({ key, label, color }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className={`text-[9px] ${color} tracking-wider`}>{label}</span>
              <span className="text-[11px] font-semibold text-orbit-white tabular-nums">{counts[key]}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-space-border/30 pt-1 mt-1">
            <span className="text-[9px] text-orbit-dim tracking-wider">TOTAL</span>
            <span className="text-[11px] font-semibold text-orbit-white tabular-nums">{counts.earth + counts.moon + counts.mars}</span>
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
      <div className="absolute bottom-[20px] left-4 space-y-1 pointer-events-none z-10">
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
      <div className="absolute bottom-[140px] left-4 text-[10px] text-orbit-dim/40 tracking-wider pointer-events-none z-10">
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

  const left = Math.max(10, Math.min(x - 110, window.innerWidth - 240));
  const top  = Math.max(10, y - 10);

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
