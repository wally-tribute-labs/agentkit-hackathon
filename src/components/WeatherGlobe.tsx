'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import type { WeatherCondition } from '@/types/weather';

// Always-visible demo dots when no observations are passed
const DEMO_DOTS = [
  { lat: 40.7,  lon: -74.0  }, // New York
  { lat: 51.5,  lon: -0.1   }, // London
  { lat: 35.7,  lon: 139.7  }, // Tokyo
  { lat: -33.9, lon: 151.2  }, // Sydney
  { lat: 48.8,  lon: 2.3    }, // Paris
  { lat: 37.8,  lon: -122.4 }, // San Francisco
  { lat: 1.3,   lon: 103.8  }, // Singapore
  { lat: 55.8,  lon: 37.6   }, // Moscow
  { lat: -23.5, lon: -46.6  }, // São Paulo
  { lat: 28.6,  lon: 77.2   }, // Delhi
];

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
function buildWireframeLines(radius: number, latCount = 10, lonCount = 16) {
  const lines: THREE.Vector3[][] = [];
  const segments = 80;

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
function ObservationDot({ position, index }: { position: THREE.Vector3; index: number }) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const ringRef  = useRef<THREE.Mesh>(null);
  const phase    = index * 0.9;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      const pulse = 0.8 + 0.2 * Math.sin(t * 2.5 + phase);
      meshRef.current.scale.setScalar(pulse);
    }
    if (ringRef.current) {
      const ringScale = 1 + 0.8 * ((Math.sin(t * 1.5 + phase) + 1) / 2);
      ringRef.current.scale.setScalar(ringScale);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 * (1 - (Math.sin(t * 1.5 + phase) + 1) / 2);
    }
  });

  return (
    <group position={position}>
      {/* Core dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={1.0} />
      </mesh>
      {/* Expanding ring */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ── Outer atmospheric glow ─────────────────────────────────────────────────
function AtmosphericGlow({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.22 + 0.08 * Math.sin(clock.getElapsedTime() * 0.4);
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius * 1.22, 48, 48]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.22} side={THREE.BackSide} />
    </mesh>
  );
}

// ── Mid atmosphere ─────────────────────────────────────────────────────────
function MidGlow({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.1, 48, 48]} />
      <meshBasicMaterial color="#0ea5e9" transparent opacity={0.14} side={THREE.BackSide} />
    </mesh>
  );
}

// ── Inner glow ─────────────────────────────────────────────────────────────
function InnerGlow({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.04, 48, 48]} />
      <meshBasicMaterial color="#0284c7" transparent opacity={0.1} side={THREE.BackSide} />
    </mesh>
  );
}

// ── Wireframe ──────────────────────────────────────────────────────────────
function WireframeGrid({ radius }: { radius: number }) {
  const lines = useMemo(() => buildWireframeLines(radius), [radius]);
  return (
    <>
      {lines.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#22d3ee"
          transparent
          opacity={0.45}
          lineWidth={1.2}
        />
      ))}
    </>
  );
}

// ── Equator highlight ──────────────────────────────────────────────────────
function EquatorRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= 128; j++) {
      pts.push(latLonToVec3(0, -180 + (360 / 128) * j, radius + 0.002));
    }
    return pts;
  }, [radius]);
  return <Line points={points} color="#06b6d4" transparent opacity={0.7} lineWidth={1.8} />;
}

// ── Main rotating globe group ──────────────────────────────────────────────
function Globe({ allDots, shouldAnimate }: { allDots: THREE.Vector3[]; shouldAnimate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const RADIUS = 1.7;

  useFrame(() => {
    if (!groupRef.current || !shouldAnimate) return;
    groupRef.current.rotation.y += 0.001;
  });

  return (
    <group ref={groupRef}>
      {/* Sphere body */}
      <Sphere args={[RADIUS, 64, 64]}>
        <meshPhongMaterial
          color="#0d1f3c"
          transparent
          opacity={0.95}
          shininess={60}
          specular={new THREE.Color(0x2a6090)}
          emissive={new THREE.Color(0x040d1a)}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Wireframe + equator highlight */}
      <WireframeGrid radius={RADIUS} />
      <EquatorRing radius={RADIUS} />

      {/* Atmosphere */}
      <AtmosphericGlow radius={RADIUS} />
      <MidGlow radius={RADIUS} />
      <InnerGlow radius={RADIUS} />

      {/* Observation dots */}
      {allDots.map((pos, i) => (
        <ObservationDot key={i} position={pos} index={i} />
      ))}
    </group>
  );
}

// ── Lighting ───────────────────────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#3a5080" />
      <pointLight position={[-5, 4, 4]} intensity={3.0} color="#06b6d4" />
      <pointLight position={[4, -2, -4]} intensity={0.8} color="#7c3aed" />
      <pointLight position={[0, 3, 5]} intensity={1.0} color="#ffffff" />
    </>
  );
}

// ── Camera ────────────────────────────────────────────────────────────────
function CameraRig() {
  const cam = useThree((state) => state.camera);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    cam.position.set(0.3 * Math.sin(t * 0.05), 0.15 * Math.sin(t * 0.035), 4.5);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

// ── Public component ───────────────────────────────────────────────────────
interface WeatherGlobeProps {
  observations?: Array<{ lat: number; lon: number; condition: WeatherCondition }>;
  height?: number;
  className?: string;
}

export function WeatherGlobe({ observations = [], height = 420, className }: WeatherGlobeProps) {
  const shouldReduce = useReducedMotion();

  const RADIUS = 1.7;
  const allDots = useMemo(() => {
    const src = observations.length > 0 ? observations : DEMO_DOTS;
    return src.map((o) => latLonToVec3(o.lat, o.lon, RADIUS + 0.015));
  }, [observations]);

  if (shouldReduce) {
    return (
      <div
        className={className ?? 'w-full rounded-full flex items-center justify-center'}
        style={className ? undefined : {
          height,
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        }}
      />
    );
  }

  return (
    <div className={`relative ${className ?? ''}`} style={className ? undefined : { width: '100%', height }} aria-hidden>
      {/* CSS-level glow that's always visible regardless of WebGL alpha */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.04) 50%, transparent 75%)',
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0), 0);
        }}
      >
        <SceneLights />
        <CameraRig />
        <Globe allDots={allDots} shouldAnimate={!shouldReduce} />
      </Canvas>
    </div>
  );
}
