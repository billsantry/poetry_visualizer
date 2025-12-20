import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const ParticleField = ({ analysis, rnd, isLanding }) => {
    const count = isLanding ? 1000 : 3000;
    const pointsRef = useRef();

    // Memoize initial particle data
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (rnd() - 0.5) * 100;     // X
            positions[i * 3 + 1] = (rnd() - 0.5) * 100; // Y
            positions[i * 3 + 2] = (rnd() - 0.5) * 200 - 100; // Z (deeper field)
            speeds[i] = (0.5 + rnd() * 1.5) * (isLanding ? 0.35 : 1);
            sizes[i] = isLanding ? 0.12 : 0.22;
        }
        return { positions, speeds, sizes };
    }, [count, rnd, isLanding]);

    const color = useMemo(() => {
        // Monochromatic/White for landing, mood-based for visualization
        if (isLanding) return new THREE.Color('#ffffff');
        switch (analysis.mood) {
            case 'dark': return new THREE.Color('#9999aa');
            case 'romantic': return new THREE.Color('#ffddf0');
            case 'nature': return new THREE.Color('#ddffee');
            case 'energetic': return new THREE.Color('#ffffdd');
            case 'melancholy': return new THREE.Color('#eeeeff');
            default: return new THREE.Color('#ffffff');
        }
    }, [analysis.mood, isLanding]);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const attr = pointsRef.current.geometry.attributes.position;
        const tempo = isLanding ? 0.3 : (analysis.tempo || 1);

        for (let i = 0; i < count; i++) {
            // Move forward
            attr.array[i * 3 + 2] += particles.speeds[i] * tempo * 0.4;

            // Reset when passed camera
            if (attr.array[i * 3 + 2] > 35) {
                attr.array[i * 3 + 2] = -150;
                attr.array[i * 3] = (rnd() - 0.5) * 100;
                attr.array[i * 3 + 1] = (rnd() - 0.5) * 100;
            }
        }
        attr.needsUpdate = true;
    });

    const circleTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        return new THREE.CanvasTexture(canvas);
    }, []);

    const opacity = isLanding ? 0.2 : 0.45;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={isLanding ? 0.12 : 0.22}
                color={color}
                map={circleTexture}
                transparent
                opacity={opacity}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

const Scene = ({ analysis, rnd, isLanding = false }) => {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 30], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />

                <ParticleField analysis={analysis} rnd={rnd} isLanding={isLanding} />

                <Stars
                    radius={100}
                    depth={50}
                    count={isLanding ? 800 : 4000}
                    factor={4}
                    saturation={0}
                    fade
                    speed={isLanding ? 0.2 : 0.8}
                />

                {!isLanding && (
                    <OrbitControls
                        enableZoom={false}
                        autoRotate
                        autoRotateSpeed={analysis.tempo * 0.5}
                    />
                )}
            </Canvas>
        </div>
    );
};

export default Scene;
