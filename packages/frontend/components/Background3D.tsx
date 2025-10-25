"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Individual particle component
function Particle({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPosition = useMemo(
    () => [...position] as [number, number, number],
    [position]
  );

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    // Enhanced rotation with different speeds for variety
    meshRef.current.rotation.x = time * (0.2 + initialPosition[0] * 0.01);
    meshRef.current.rotation.y = time * (0.15 + initialPosition[1] * 0.01);
    meshRef.current.rotation.z = time * (0.1 + initialPosition[2] * 0.01);

    // More dynamic floating motion with 3D movement
    meshRef.current.position.y =
      initialPosition[1] + Math.sin(time * 0.4 + initialPosition[0]) * 1.2;
    meshRef.current.position.x =
      initialPosition[0] + Math.sin(time * 0.3 + initialPosition[2]) * 0.8;
    meshRef.current.position.z =
      initialPosition[2] + Math.cos(time * 0.25 + initialPosition[1]) * 1.0;

    // Dynamic scaling for breathing effect
    const scale =
      1 + Math.sin(time * 0.5 + initialPosition[0] + initialPosition[1]) * 0.3;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        wireframe={true} // All boxes are wireframe
      />
    </mesh>
  );
}

// Grid lines component for depth
function GridLines() {
  const linesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!linesRef.current) return;
    const time = state.clock.getElapsedTime();

    // Enhanced grid rotation with multiple axes
    linesRef.current.rotation.y = time * 0.05;
    linesRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;

    // Subtle floating motion for the grid
    linesRef.current.position.y = -8 + Math.sin(time * 0.2) * 0.5;
  });

  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ccff00",
        transparent: true,
        opacity: 0.2,
      }),
    []
  );

  const createGridGeometry = () => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Horizontal lines
    for (let i = -20; i <= 20; i += 2) {
      vertices.push(-20, 0, i, 20, 0, i);
    }

    // Vertical lines
    for (let i = -20; i <= 20; i += 2) {
      vertices.push(i, 0, -20, i, 0, 20);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    return geometry;
  };

  return (
    <group ref={linesRef} position={[0, -8, 0]}>
      <lineSegments geometry={createGridGeometry()} material={gridMaterial} />
    </group>
  );
}

// Main particle system
function ParticleSystem() {
  const particles = useMemo(() => {
    const particleArray = [];
    const colors = ["#ccff00", "#ffd700", "#ffffff"];

    for (let i = 0; i < 30; i++) {
      particleArray.push({
        position: [
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 30,
        ] as [number, number, number],
        scale: Math.random() * 0.3 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    return particleArray;
  }, []);

  return (
    <>
      {particles.map((particle, index) => (
        <Particle
          key={index}
          position={particle.position}
          scale={particle.scale}
          color={particle.color}
        />
      ))}
    </>
  );
}

// Performance and accessibility hooks
function usePerformanceSettings() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    // Simple performance detection
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      setIsLowPerformance(true);
    } else {
      // Check for mobile devices or low-end hardware
      const renderer = gl.getParameter(gl.RENDERER) || "";
      const isLowEnd = /Mali|PowerVR|Adreno [1-4]|Intel.*HD|Intel.*UHD/.test(
        renderer
      );
      setIsLowPerformance(
        isLowEnd ||
          (navigator.hardwareConcurrency
            ? navigator.hardwareConcurrency <= 2
            : false)
      );
    }

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { prefersReducedMotion, isLowPerformance };
}

// Main Background3D component
export function Background3D() {
  const { prefersReducedMotion, isLowPerformance } = usePerformanceSettings();

  // Don't render 3D background if user prefers reduced motion or on low-performance devices
  if (prefersReducedMotion || isLowPerformance) {
    return (
      <div className="-z-10 fixed inset-0 pointer-events-none">
        {/* Fallback to subtle static grid pattern */}
        <div className="grid-pattern opacity-20 w-full h-full" />
      </div>
    );
  }

  return (
    <div className="-z-10 fixed inset-0 pointer-events-none">
      <Canvas
        camera={{
          position: [0, 0, 10],
          fov: 60,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: false, // Reduce performance cost
          alpha: true,
          powerPreference: "low-power",
          precision: "lowp", // Use low precision for better performance
        }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        frameloop="always" // Continuous animation
        performance={{ min: 0.8 }} // Automatically reduce quality if FPS drops
      >
        {/* Ambient lighting */}
        <ambientLight intensity={0.1} />

        {/* Particle system */}
        <ParticleSystem />

        {/* Grid lines for depth */}
        <GridLines />

        {/* Fog for depth effect */}
        <fog attach="fog" args={["#0a0a0a", 15, 35]} />
      </Canvas>
    </div>
  );
}
