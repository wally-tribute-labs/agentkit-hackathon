'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import type { WeatherCondition } from '@/types/weather';

// Convert lat/lon to 3D sphere coordinates
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}

// Generate wireframe latitude/longitude lines
function buildWireframeLines(radius: number, latCount = 8, lonCount = 12) {
  const lines: THREE.Vector3[][] = [];
  const segments = 64;

  // Latitude circles
  for (let i = 1; i < latCount; i++) {
    const lat = -90 + (180 / latCount) * i;
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= segments; j++) {
      const lon = -180 + (360 / segments) * j;
      points.push(latLonToVec3(lat, lon, radius));
    }
    lines.push(points);
  }

  // Longitude lines
  for (let i = 0; i < lonCount; i++) {
    const lon = -180 + (360 / lonCount) * i;
    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= segments; j++) {
      const lat = -90 + (180 / segments) * j;
      points.push(latLonToVec3(lat, lon, radius));
    }
    lines.push(points);
  }

  return lines;
}

// ── Observation dot on the globe ──────────────────────────────────────────
function ObservationDot({
  position,
  index,
}: {
  position: THREE.Vector3;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = index * 0.7;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 0.85 + 0.15 * Math.sin(t * 2 + phase);
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.022, 12, 12]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.9} />
    </mesh>
  );
}

// ── Glow ring around the globe ─────────────────────────────────────────────
function AtmosphericGlow({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.06 + 0.02 * Math.sin(t * 0.5);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius * 1.12, 48, 48]} />
      <meshBasicMaterial
        color="#06b6d4"
        transparent
        opacity={0.07}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ── Inner atmosphere layer ─────────────────────────────────────────────────
function InnerGlow({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.04, 48, 48]} />
      <meshBasicMaterial
        color="#0284c7"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ── Wireframe lines ────────────────────────────────────────────────────────
function WireframeGrid({ radius }: { radius: number }) {
  const lines = useMemo(() => buildWireframeLines(radius), [radius]);
  return (
    <>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#06b6d4"
          transparent
          opacity={0.12}
          lineWidth={0.6}
        />
      ))}
    </>
  );
}

// ── Main rotating globe group ──────────────────────────────────────────────
function Globe({
  observations,
  shouldAnimate,
}: {
  observations: Array<{ lat: number; lon: number }>;
  shouldAnimate: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const RADIUS = 1.7;

  useFrame(() => {
    if (!groupRef.current || !shouldAnimate) return;
    groupRef.current.rotation.y += 0.0015;
  });

  const dotPositions = useMemo(
    () => observations.map((o) => latLonToVec3(o.lat, o.lon, RADIUS + 0.01)),
    [observations],
  );

  return (
    <group ref={groupRef}>
      {/* Dark sphere body */}
      <Sphere args={[RADIUS, 64, 64]}>
        <meshPhongMaterial
          color="#050810"
          transparent
          opacity={0.92}
          shininess={15}
          specular={new THREE.Color(0x0a2040)}
        />
      </Sphere>

      {/* Wireframe grid */}
      <WireframeGrid radius={RADIUS} />

      {/* Atmospheric glow layers */}
      <AtmosphericGlow radius={RADIUS} />
      <InnerGlow radius={RADIUS} />

      {/* Observation dots */}
      {dotPositions.map((pos, i) => (
        <ObservationDot key={i} position={pos} index={i} />
      ))}
    </group>
  );
}

// ── Scene lighting ─────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.3} color="#1a2040" />
      <pointLight position={[-4, 3, 3]} intensity={1.2} color="#06b6d4" />
      <pointLight position={[3, -2, -3]} intensity={0.5} color="#7c3aed" />
      <directionalLight position={[0, 5, 5]} intensity={0.2} color="#ffffff" />
    </>
  );
}

// ── Camera rig ─────────────────────────────────────────────────────────────
function CameraRig() {
  const cam = useThree((state) => state.camera);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Gentle breathing motion — three.js objects are mutable by design
    cam.position.set(0.3 * Math.sin(t * 0.06), 0.15 * Math.sin(t * 0.04), 4.5);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

// ── Public component ───────────────────────────────────────────────────────
interface WeatherGlobeProps {
  observations?: Array<{ lat: number; lon: number; condition: WeatherCondition }>;
  height?: number;
}

export function WeatherGlobe({ observations = [], height = 420 }: WeatherGlobeProps) {
  const shouldReduce = useReducedMotion();

  // Static fallback for reduced motion
  if (shouldReduce) {
    return (
      <div
        className="w-full rounded-full flex items-center justify-center"
        style={{
          height,
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          border: '1px solid rgba(6,182,212,0.15)',
        }}
      />
    );
  }

  return (
    <div style={{ width: '100%', height }} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneLights />
        <CameraRig />
        <Globe observations={observations} shouldAnimate={!shouldReduce} />
      </Canvas>
    </div>
  );
}
