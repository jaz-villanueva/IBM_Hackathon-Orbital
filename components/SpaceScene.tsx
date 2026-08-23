'use client';

/**
 * SpaceScene — Interactive 3D Space Mission Map
 *
 * Upgrades in this version:
 *  • Earth rendered as a geographic globe (procedural continent texture)
 *  • Night-side city-lights layer
 *  • Procedural cloud layer (separate sphere, labeled ESTIMATED)
 *  • Real Keplerian orbital motion driven by SimClock
 *  • Simulation time controls (1× / 10× / 100× / 1,000× / 10,000×)
 *  • Distinct 3D spacecraft models per object type (ISS, rovers, landers…)
 *  • LOD: 3D model when close, sprite icon when far
 *  • Orbit path shown when spacecraft selected
 *  • Mission popup with VIEW MISSION link
 *  • Search, filter layers, mission counter, AI pulse
 *  • Data provenance labels throughout
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
} from '@/lib/orbital-mechanics';
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

const PLANET_CONFIG = {
  earth: { color: 0x1e6fa5, emissive: 0x0a2040, radius: 1.2, position: [-4, 0, 0] as [number, number, number], atmosphere: 0x4db8ff },
  moon:  { color: 0x8a8f9e, emissive: 0x1a1e28, radius: 0.35, position: [0, 1.2, -3] as [number, number, number], atmosphere: 0x9ca3af },
  mars:  { color: 0xc2410c, emissive: 0x3a0d02, radius: 0.65, position: [4, -0.5, 0] as [number, number, number], atmosphere: 0xe05c30 },
};

const DEST_CAMERA: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  home:  { pos: [0, 3, 12],     target: [0, 0, 0] },
  earth: { pos: [-4, 1.2, 4.5], target: [-4, 0, 0] },
  moon:  { pos: [0, 2.2, 1.5],  target: [0, 1.2, -3] },
  mars:  { pos: [4, 0.5, 4.5],  target: [4, -0.5, 0] },
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

// Scene-unit orbit radius per mission (planet-relative)
// Derived from actual SMA ratios scaled to visual planet size
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

// ─── Component ────────────────────────────────────────────────────────────────

export function SpaceScene({ selectedPlanet, onPlanetSelect, onMissionSelect }: SpaceSceneProps) {
  const mountRef     = useRef<HTMLDivElement>(null);
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef     = useRef<THREE.Scene | null>(null);
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef     = useRef<number>(0);
  const planetsRef   = useRef<Record<string, THREE.Mesh>>({});
  // missionId → { sprite, model3d }
  const objectsRef   = useRef<Map<string, { sprite: THREE.Sprite; model: THREE.Group }>>(new Map());
  const orbitRingsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  // Selected orbit path line
  const orbitPathRef  = useRef<THREE.Line | null>(null);

  const lastMouseRef  = useRef({ x: 0, y: 0 });
  const rotationRef   = useRef({ x: 0, y: 0 });
  const targetRotRef  = useRef({ x: 0, y: 0 });

  // Simulation clock stored in ref (mutated without re-render)
  const clockRef = useRef<SimClock>(makeSimClock());

  // UI state
  const [hoveredPlanet,  setHoveredPlanet]  = useState<string | null>(null);
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

  const lerpCamera = useCallback((dest: string) => {
    const cfg = DEST_CAMERA[dest] || DEST_CAMERA.home;
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    let t = 0;
    const startPos = cam.position.clone();
    const endPos   = new THREE.Vector3(...cfg.pos);
    const endTarget = new THREE.Vector3(...cfg.target);
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

    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.01, 1000);
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Stars ──
    const starPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const r  = 150 + Math.random() * 100;
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.3, sizeAttenuation: true, transparent: true, opacity: 0.8,
    })));

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x1a2840, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(20, 10, 20);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x2040a0, 0.3);
    fill.position.set(-10, -5, -10);
    scene.add(fill);

    // ── EARTH — geographic globe ──
    const earthPos = new THREE.Vector3(...PLANET_CONFIG.earth.position);
    const earthR   = PLANET_CONFIG.earth.radius;

    // Day texture (procedural continents)
    const dayTex   = makeEarthDayTexture();
    const nightTex = makeEarthNightTexture();

    // Earth main sphere
    const earthGeo = new THREE.SphereGeometry(earthR, 64, 64);
    const earthMat = new THREE.MeshStandardMaterial({
      map:              dayTex,
      emissiveMap:      nightTex,
      emissive:         new THREE.Color(0x112244),
      emissiveIntensity: 0.35,
      roughness: 0.85,
      metalness: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.copy(earthPos);
    earthMesh.name = 'earth';
    scene.add(earthMesh);
    planetsRef.current['earth'] = earthMesh;

    // Cloud layer
    const cloudTex = makeCloudTexture();
    const cloudGeo = new THREE.SphereGeometry(earthR * 1.012, 40, 40);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudMesh.position.copy(earthPos);
    cloudMesh.name = 'earth-clouds';
    scene.add(cloudMesh);

    // Atmosphere glow (Earth)
    const atmGeo = new THREE.SphereGeometry(earthR * 1.09, 32, 32);
    const atmMat = new THREE.MeshBasicMaterial({ color: 0x4db8ff, transparent: true, opacity: 0.055, side: THREE.BackSide });
    const atm = new THREE.Mesh(atmGeo, atmMat);
    atm.position.copy(earthPos);
    scene.add(atm);

    // ── MOON ──
    const moonPos  = new THREE.Vector3(...PLANET_CONFIG.moon.position);
    const moonR    = PLANET_CONFIG.moon.radius;
    const moonMat  = new THREE.MeshStandardMaterial({
      color: 0x8a8f9e, emissive: 0x1a1e28, emissiveIntensity: 0.2, roughness: 0.9, metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moonR, 48, 48), moonMat);
    moonMesh.position.copy(moonPos);
    moonMesh.name = 'moon';
    scene.add(moonMesh);
    planetsRef.current['moon'] = moonMesh;

    // Moon atmosphere
    const moonAtm = new THREE.Mesh(
      new THREE.SphereGeometry(moonR * 1.06, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.04, side: THREE.BackSide })
    );
    moonAtm.position.copy(moonPos);
    scene.add(moonAtm);

    // ── MARS ──
    const marsPos = new THREE.Vector3(...PLANET_CONFIG.mars.position);
    const marsR   = PLANET_CONFIG.mars.radius;
    const marsMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, emissive: 0x3a0d02, emissiveIntensity: 0.25, roughness: 0.88, metalness: 0.05,
    });
    const marsMesh = new THREE.Mesh(new THREE.SphereGeometry(marsR, 56, 56), marsMat);
    marsMesh.position.copy(marsPos);
    marsMesh.name = 'mars';
    scene.add(marsMesh);
    planetsRef.current['mars'] = marsMesh;

    // Mars polar ice caps
    const iceMat = new THREE.MeshStandardMaterial({ color: 0xddeeff, roughness: 0.6 });
    [-1, 1].forEach(pole => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(marsR * 0.22, 16, 8, 0, Math.PI * 2, 0, 0.3), iceMat.clone());
      cap.position.set(marsPos.x, marsPos.y + pole * marsR * 0.97, marsPos.z);
      cap.rotation.x = pole === 1 ? 0 : Math.PI;
      scene.add(cap);
    });

    // Mars wire grid
    const wireGeo = new THREE.SphereGeometry(marsR + 0.001, 16, 16);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x401808, wireframe: true, transparent: true, opacity: 0.1 });
    const marsWire = new THREE.Mesh(wireGeo, wireMat);
    marsWire.position.copy(marsPos);
    scene.add(marsWire);

    // Mars atmosphere
    const marsAtm = new THREE.Mesh(
      new THREE.SphereGeometry(marsR * 1.07, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xe05c30, transparent: true, opacity: 0.04, side: THREE.BackSide })
    );
    marsAtm.position.copy(marsPos);
    scene.add(marsAtm);

    // ── Interplanetary arcs ──
    const addArc = (a: THREE.Vector3, b: THREE.Vector3, color: number, opacity: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const p = new THREE.Vector3().lerpVectors(a, b, t);
        p.y += Math.sin(t * Math.PI) * 0.85;
        pts.push(p);
      }
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      ));
    };
    addArc(earthPos, moonPos, 0x3b82f6, 0.18);
    addArc(earthPos, marsPos, 0xe05c30, 0.1);

    // ── Raycaster ──
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
        setHoveredPlanet(null);
        if (e.buttons === 1) { lastMouseRef.current = { x: e.clientX, y: e.clientY }; }
        return;
      }

      const pHits = raycaster.intersectObjects(Object.values(planetsRef.current));
      if (pHits.length) {
        setHoveredPlanet(pHits[0].object.name);
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, label: pHits[0].object.name.toUpperCase() });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredPlanet(null);
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

      const pHits = raycaster.intersectObjects(Object.values(planetsRef.current));
      if (pHits.length) {
        onPlanetSelect(pHits[0].object.name);
        setSelectedObject(null); setPopupPos(null);
      }
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
    window.addEventListener('resize', onResize);

    // ── Animation loop ──
    let sceneT = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      sceneT += 0.005;

      // Scene rotation (drag)
      rotationRef.current.x += (targetRotRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotRef.current.y - rotationRef.current.y) * 0.08;
      scene.rotation.x = rotationRef.current.x * 0.3;
      scene.rotation.y = rotationRef.current.y * 0.3 + sceneT * 0.02;

      // Planet self-rotation
      if (planetsRef.current['earth']) planetsRef.current['earth'].rotation.y += 0.0015;
      const cloudMeshLocal = scene.getObjectByName('earth-clouds');
      if (cloudMeshLocal) cloudMeshLocal.rotation.y += 0.0018;
      if (planetsRef.current['moon']) planetsRef.current['moon'].rotation.y += 0.0005;
      if (planetsRef.current['mars']) planetsRef.current['mars'].rotation.y += 0.001;

      // Keplerian orbital positions
      const elapsed = simElapsedSeconds(clockRef.current);
      objectsRef.current.forEach(({ sprite, model }, missionId) => {
        const scObj = ALL_SCENE_OBJECTS.find(o => o.missionId === missionId);
        if (!scObj || !scObj.isOrbiter) return;

        const params = ORBITAL_PARAMS[missionId];
        const vr     = VISUAL_ORBIT_RADIUS[missionId] || scObj.orbitRadius || 1.5;
        const pCfg   = PLANET_CONFIG[scObj.destination];
        const pPos   = new THREE.Vector3(...pCfg.position);

        let dx: number, dy: number, dz: number;
        if (params) {
          const dir = keplerPosition(params, elapsed);
          dx = dir.x * vr; dy = dir.y * vr; dz = dir.z * vr;
        } else {
          // Fallback: simple circular
          const ang = elapsed * (scObj.orbitSpeed || 1) * 0.0001 + (scObj.orbitPhase || 0);
          const inc = scObj.orbitInclination || 0;
          dx = vr * Math.cos(ang);
          dy = vr * Math.sin(ang) * Math.sin(inc);
          dz = vr * Math.sin(ang) * Math.cos(inc);
        }

        const wx = pPos.x + dx;
        const wy = pPos.y + dy;
        const wz = pPos.z + dz;
        sprite.position.set(wx, wy, wz);
        model.position.set(wx, wy, wz);

        // LOD: show model if camera is close enough
        const camDist = camera.position.distanceTo(new THREE.Vector3(wx, wy, wz));
        const showModel = camDist < 3.5;
        sprite.visible = !showModel;
        model.visible  = showModel;
        if (showModel) {
          model.rotation.y += 0.005;
          model.lookAt(pPos);
        }
      });

      // Planet glow
      Object.entries(planetsRef.current).forEach(([name, mesh]) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const target = (hoveredPlanet === name || selectedPlanet === name) ? 0.6 : 0.3;
        mat.emissiveIntensity += (target - mat.emissiveIntensity) * 0.1;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Sim clock display ticker (updates UI without rerender per frame)
    const clockTick = setInterval(() => {
      setSimTimeStr(formatSimTime(simNow(clockRef.current)));
    }, 250);

    return () => {
      clearInterval(clockTick);
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      document.body.style.cursor = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync visibleObjects → scene objects ─────────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old
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

      const pCfg  = PLANET_CONFIG[obj.destination];
      const pPos  = new THREE.Vector3(...pCfg.position);

      if (obj.isOrbiter) {
        // Position based on orbital phase at t=0
        const params = ORBITAL_PARAMS[obj.missionId];
        const vr     = VISUAL_ORBIT_RADIUS[obj.missionId] || obj.orbitRadius || 1.5;
        let dx = vr, dy = 0, dz = 0;
        if (params) {
          const dir = keplerPosition(params, 0);
          dx = dir.x * vr; dy = dir.y * vr; dz = dir.z * vr;
        }
        sprite.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);
        model.position.set(pPos.x + dx, pPos.y + dy, pPos.z + dz);

        // Orbit ring
        const ringR = VISUAL_ORBIT_RADIUS[obj.missionId] || obj.orbitRadius || 1.5;
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
        const lat = obj.surfaceLat ?? 0;
        const lon = obj.surfaceLon ?? 0;
        const sv  = latLonToVec3(lat, lon, pCfg.radius + 0.06);
        sprite.position.set(pPos.x + sv.x, pPos.y + sv.y, pPos.z + sv.z);
        model.position.set(pPos.x + sv.x, pPos.y + sv.y, pPos.z + sv.z);
      }

      scene.add(sprite);
      scene.add(model);
      objectsRef.current.set(obj.missionId, { sprite, model });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleObjects]);

  // ─── Orbit path when object selected ─────────────────────────────────────

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old path
    if (orbitPathRef.current) { scene.remove(orbitPathRef.current); orbitPathRef.current = null; }

    if (!selectedObject?.isOrbiter) return;
    const params = ORBITAL_PARAMS[selectedObject.missionId];
    if (!params) return;

    const vr   = VISUAL_ORBIT_RADIUS[selectedObject.missionId] || selectedObject.orbitRadius || 1.5;
    const pPos = new THREE.Vector3(...PLANET_CONFIG[selectedObject.destination].position);

    const pts3d = orbitPath(params, 128).map(d => new THREE.Vector3(
      pPos.x + d.x * vr,
      pPos.y + d.y * vr,
      pPos.z + d.z * vr,
    ));
    pts3d.push(pts3d[0].clone()); // close the loop

    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts3d),
      new THREE.LineBasicMaterial({
        color: STATUS_COLOR[selectedObject.status] || 0x3b82f6,
        transparent: true, opacity: 0.55,
      })
    );
    scene.add(pathLine);
    orbitPathRef.current = pathLine;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject]);

  // ─── Highlight selected sprite ────────────────────────────────────────────

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

      {/* ── Simulation Clock (top-left) ── */}
      <div className="absolute top-4 left-4 z-20">
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

      {/* ── Data provenance label ── */}
      <div className="absolute top-4 left-4 z-20 mt-[130px]">
        <div className="glass border border-space-border/40 rounded px-2 py-1">
          <div className="text-[8px] text-orbit-dim/60 tracking-widest">
            EARTH TEXTURE · ESTIMATED · NATURAL EARTH
          </div>
          <div className="text-[8px] text-orbit-dim/60 tracking-widest">
            ORBITS · DERIVED · KEPLERIAN PROPAGATION
          </div>
        </div>
      </div>

      {/* ── Search (top-right) ── */}
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
      <div className="absolute bottom-4 left-4 space-y-1 pointer-events-none z-10">
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
      <div className="absolute bottom-28 left-4 text-[10px] text-orbit-dim/40 tracking-wider pointer-events-none z-10">
        <div>DRAG to rotate · SCROLL to zoom</div>
        <div>CLICK spacecraft or planet</div>
        {simSpeed > 1 && (
          <div className="mt-1 text-amber-400/50">SIM SPEED {simSpeed}×</div>
        )}
      </div>
    </div>
  );
}

// ─── Mission Popup ────────────────────────────────────────────────────────────

interface MissionPopupProps {
  obj: SceneObject; mission: Mission;
  x: number; y: number;
  onClose: () => void;
}

function MissionPopup({ obj, mission, x, y, onClose }: MissionPopupProps) {
  const STATUS: Record<string, { text: string; dot: string; color: string }> = {
    active:    { text: 'ACTIVE',      dot: 'bg-emerald-400 animate-pulse', color: 'text-emerald-400' },
    science:   { text: 'SCIENCE OPS', dot: 'bg-purple-400 animate-pulse',  color: 'text-purple-400' },
    surface:   { text: 'SURFACE OPS', dot: 'bg-amber-400 animate-pulse',   color: 'text-amber-400' },
    planned:   { text: 'PLANNED',     dot: 'bg-sky-400',                   color: 'text-sky-400' },
    completed: { text: 'COMPLETED',   dot: 'bg-slate-500',                 color: 'text-slate-400' },
  };
  const sc = STATUS[obj.status] || STATUS.active;

  const W = 228, H = 190;
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.min(Math.max(x - W / 2, 8), vw - W - 8);
  const top  = Math.min(Math.max(y - H - 18, 8), vh - H - 8);

  const params = ORBITAL_PARAMS[obj.missionId];

  return (
    <div className="absolute z-30 animate-slide-up" style={{ left, top, width: W }}>
      <div className="glass border border-space-border rounded-xl p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[8px] text-orbit-dim tracking-widest mb-0.5 capitalize">
              {obj.objectType} · {obj.destination}
            </div>
            <div className="text-sm font-semibold text-orbit-white leading-tight">{obj.shortName}</div>
            <div className="text-[10px] text-orbit-dim mt-0.5">{obj.agency}</div>
          </div>
          <button onClick={onClose} className="text-orbit-dim hover:text-orbit-white mt-0.5"><X size={12} /></button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          <span className={`text-[9px] font-medium tracking-widest ${sc.color}`}>{sc.text}</span>
        </div>

        <div className="text-[10px] text-orbit-dim leading-snug mb-2">{obj.statusNote}</div>

        {params && (
          <div className="mb-3 space-y-0.5 border-t border-space-border/30 pt-2">
            <div className="flex justify-between text-[9px]">
              <span className="text-orbit-dim tracking-wider">PERIOD</span>
              <span className="text-orbit-white font-mono">
                {params.periodMin >= 60
                  ? `${(params.periodMin / 60).toFixed(1)} hr`
                  : `${Math.round(params.periodMin)} min`}
              </span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-orbit-dim tracking-wider">INCLINATION</span>
              <span className="text-orbit-white font-mono">{params.incDeg.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-orbit-dim tracking-wider">SOURCE</span>
              <span className={`font-medium tracking-wider ${params.source === 'DERIVED' ? 'text-blue-400' : 'text-amber-400'}`}>
                {params.source}
              </span>
            </div>
          </div>
        )}

        <Link
          href={`/missions/${mission.id}`}
          className="block w-full text-center px-3 py-2 rounded-lg bg-orbit-blue/10 border border-orbit-blue/30 text-orbit-blue hover:bg-orbit-blue/20 transition-colors text-[10px] tracking-widest font-medium"
        >
          VIEW MISSION →
        </Link>
      </div>
    </div>
  );
}
