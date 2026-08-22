'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { Mission } from '@/lib/types';

interface SpaceSceneProps {
  selectedPlanet: string;
  missions: Mission[];
  onPlanetSelect: (planet: string) => void;
  onMissionSelect: (mission: Mission) => void;
  selectedMission?: Mission | null;
}

const PLANET_CONFIG = {
  earth: { color: 0x1e6fa5, emissive: 0x0a2040, radius: 1.2, position: [-4, 0, 0] as [number, number, number], atmosphere: 0x4db8ff },
  moon:  { color: 0x8a8f9e, emissive: 0x1a1e28, radius: 0.35, position: [0, 1.2, -3] as [number, number, number], atmosphere: 0x9ca3af },
  mars:  { color: 0xc2410c, emissive: 0x3a0d02, radius: 0.65, position: [4, -0.5, 0] as [number, number, number], atmosphere: 0xe05c30 },
};

const DEST_CAMERA: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  home:  { pos: [0, 3, 12], target: [0, 0, 0] },
  earth: { pos: [-4, 1, 5],  target: [-4, 0, 0] },
  moon:  { pos: [0, 2, 2],   target: [0, 1.2, -3] },
  mars:  { pos: [4, 0, 5],   target: [4, -0.5, 0] },
};

export function SpaceScene({ selectedPlanet, onPlanetSelect, onMissionSelect, selectedMission }: SpaceSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameRef = useRef<number>(0);
  const planetsRef = useRef<Record<string, THREE.Mesh>>({});
  const missionDotsRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetRotRef = useRef({ x: 0, y: 0 });
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null);

  const lerpCamera = useCallback(
    (dest: string) => {
      const cfg = DEST_CAMERA[dest] || DEST_CAMERA.home;
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      let t = 0;
      const startPos = cam.position.clone();
      const endPos = new THREE.Vector3(...cfg.pos);
      const endTarget = new THREE.Vector3(...cfg.target);
      
      const animate = () => {
        t += 0.02;
        if (t > 1) return;
        cam.position.lerpVectors(startPos, endPos, t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
        cam.lookAt(endTarget);
        frameRef.current = requestAnimationFrame(animate);
      };
      animate();
    },
    []
  );

  useEffect(() => {
    lerpCamera(selectedPlanet === '' ? 'home' : selectedPlanet);
  }, [selectedPlanet, lerpCamera]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 3, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 150 + Math.random() * 100;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
      starSizes[i] = Math.random() * 2.5 + 0.5;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3, sizeAttenuation: true, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Ambient light
    scene.add(new THREE.AmbientLight(0x1a2840, 1));
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(20, 10, 20);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x2040a0, 0.3);
    fill.position.set(-10, -5, -10);
    scene.add(fill);

    // Planets
    Object.entries(PLANET_CONFIG).forEach(([name, cfg]) => {
      const geo = new THREE.SphereGeometry(cfg.radius, 64, 64);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.3,
        roughness: 0.8,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...cfg.position);
      mesh.name = name;
      scene.add(mesh);
      planetsRef.current[name] = mesh;

      // Atmosphere glow
      const atmGeo = new THREE.SphereGeometry(cfg.radius * 1.08, 32, 32);
      const atmMat = new THREE.MeshBasicMaterial({
        color: cfg.atmosphere,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
      });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.position.set(...cfg.position);
      scene.add(atm);

      // Grid lines on planet surface
      if (name === 'earth' || name === 'mars') {
        const wireGeo = new THREE.SphereGeometry(cfg.radius + 0.001, 16, 16);
        const wireMat = new THREE.MeshBasicMaterial({
          color: 0x204060,
          wireframe: true,
          transparent: true,
          opacity: 0.15,
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        wire.position.set(...cfg.position);
        scene.add(wire);
      }
    });

    // Moon orbit path
    const moonOrbitGeo = new THREE.RingGeometry(3.0, 3.02, 128);
    const moonOrbitMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const moonOrbit = new THREE.Mesh(moonOrbitGeo, moonOrbitMat);
    moonOrbit.rotation.x = Math.PI * 0.15;
    moonOrbit.rotation.z = Math.PI * 0.05;
    moonOrbit.position.set(-2, 0.5, -1.5);
    scene.add(moonOrbit);

    // Mission dots group
    const missionGroup = new THREE.Group();
    missionDotsRef.current = missionGroup;
    scene.add(missionGroup);

    // Connection lines (Earth to Moon, Earth to Mars paths)
    const addPath = (from: THREE.Vector3, to: THREE.Vector3, color: number, opacity: number) => {
      const points = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const pos = new THREE.Vector3().lerpVectors(from, to, t);
        const arc = Math.sin(t * Math.PI) * 0.8;
        pos.y += arc;
        points.push(pos);
      }
      const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
      const pathMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      scene.add(new THREE.Line(pathGeo, pathMat));
    };

    addPath(
      new THREE.Vector3(...PLANET_CONFIG.earth.position),
      new THREE.Vector3(...PLANET_CONFIG.moon.position),
      0x3b82f6, 0.25
    );
    addPath(
      new THREE.Vector3(...PLANET_CONFIG.earth.position),
      new THREE.Vector3(...PLANET_CONFIG.mars.position),
      0xe05c30, 0.15
    );

    // ISS orbit ring around Earth
    const issOrbitGeo = new THREE.RingGeometry(1.45, 1.46, 64);
    const issOrbitMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const issOrbit = new THREE.Mesh(issOrbitGeo, issOrbitMat);
    issOrbit.position.set(-4, 0, 0);
    issOrbit.rotation.x = Math.PI / 3;
    issOrbit.rotation.y = Math.PI / 6;
    scene.add(issOrbit);

    // ISS dot
    const issDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    issDot.position.set(-4 + 1.45, 0, 0);
    issDot.name = 'iss-dot';
    scene.add(issDot);

    // Mars rover dots
    const roverDotGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const roverDotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const roverDot1 = new THREE.Mesh(roverDotGeo, roverDotMat);
    roverDot1.position.set(4 + 0.4, -0.4, 0.2);
    scene.add(roverDot1);
    const roverDot2 = new THREE.Mesh(roverDotGeo, roverDotMat);
    roverDot2.position.set(4 - 0.3, -0.6, 0.4);
    scene.add(roverDot2);

    // Raycaster for click/hover
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(Object.values(planetsRef.current));
      if (hits.length > 0) {
        const name = hits[0].object.name;
        setHoveredPlanet(name);
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top - 10,
          label: name.toUpperCase(),
        });
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredPlanet(null);
        setTooltip(null);
        document.body.style.cursor = '';
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      isDraggingRef.current = false;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const dx = Math.abs(e.clientX - lastMouseRef.current.x);
      const dy = Math.abs(e.clientY - lastMouseRef.current.y);
      if (dx < 3 && dy < 3) {
        // Click
        const rect = mountRef.current.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(Object.values(planetsRef.current));
        if (hits.length > 0) {
          onPlanetSelect(hits[0].object.name);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons === 1) {
        const dx = (e.clientX - lastMouseRef.current.x) * 0.005;
        const dy = (e.clientY - lastMouseRef.current.y) * 0.005;
        targetRotRef.current.y += dx;
        targetRotRef.current.x += dy;
        targetRotRef.current.x = Math.max(-0.6, Math.min(0.6, targetRotRef.current.x));
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const el = mountRef.current;
    el.addEventListener('mousemove', onPointerMove);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mousedown', onPointerDown);
    el.addEventListener('mouseup', onPointerUp);

    // Resize
    const onResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.005;

      // Smooth rotation interpolation
      rotationRef.current.x += (targetRotRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotRef.current.y - rotationRef.current.y) * 0.08;

      // Rotate scene group slightly
      scene.rotation.x = rotationRef.current.x * 0.3;
      scene.rotation.y = rotationRef.current.y * 0.3 + t * 0.02;

      // Rotate planets slowly
      Object.entries(planetsRef.current).forEach(([name, mesh]) => {
        const speed = name === 'earth' ? 0.003 : name === 'mars' ? 0.002 : 0.001;
        mesh.rotation.y += speed;
      });

      // ISS orbit animation
      const issMesh = scene.getObjectByName('iss-dot') as THREE.Mesh;
      if (issMesh) {
        const issAngle = t * 8;
        issMesh.position.x = -4 + Math.cos(issAngle) * 1.45;
        issMesh.position.y = Math.sin(issAngle * 0.7) * 0.4;
        issMesh.position.z = Math.sin(issAngle) * 1.2;
      }

      // Planet hover glow
      Object.entries(planetsRef.current).forEach(([name, mesh]) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isHovered = hoveredPlanet === name;
        const isSelected = selectedPlanet === name;
        mat.emissiveIntensity += ((isHovered || isSelected ? 0.6 : 0.3) - mat.emissiveIntensity) * 0.1;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      el.removeEventListener('mousemove', onPointerMove);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mousedown', onPointerDown);
      el.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
      document.body.style.cursor = '';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full select-none" ref={mountRef}>
      {/* Planet labels */}
      {Object.entries(PLANET_CONFIG).map(([name]) => (
        <div
          key={name}
          className={`absolute pointer-events-none transition-opacity duration-300 ${
            hoveredPlanet === name ? 'opacity-100' : 'opacity-0'
          }`}
          style={
            tooltip?.label === name.toUpperCase()
              ? { left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }
              : {}
          }
        >
          <div className="glass px-2 py-1 rounded text-xs text-orbit-white tracking-widest whitespace-nowrap">
            {name.toUpperCase()}
          </div>
        </div>
      ))}

      {/* Overlay labels */}
      <div className="absolute bottom-4 left-4 space-y-1 pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] text-orbit-dim tracking-wider">
          <div className="w-2 h-0.5 bg-blue-400/50" />
          <span>Artemis trajectory</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-orbit-dim tracking-wider">
          <div className="w-2 h-0.5 bg-orange-400/30" />
          <span>Earth–Mars transfer</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-orbit-dim tracking-wider">
          <div className="w-2 h-2 rounded-full bg-cyan-400/70" />
          <span>ISS (LEO)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-orbit-dim tracking-wider">
          <div className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span>Mars surface assets</span>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 text-[10px] text-orbit-dim/50 tracking-wider pointer-events-none text-right">
        <div>DRAG to rotate</div>
        <div>CLICK planet to explore</div>
      </div>
    </div>
  );
}
