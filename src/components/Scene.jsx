import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import WorldBuilder from './WorldBuilder';

const ParticleField = ({ analysis, rnd, isSpiritual }) => {
    const count = 3000;
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
            speeds[i] = 0.5 + rnd() * 1.5; // Variation in speed
            sizes[i] = 0.05 + rnd() * 0.15;
        }
        return { positions, speeds, sizes };
    }, [count, rnd]);

    const color = useMemo(() => {
        switch (analysis.mood) {
            case 'dark': return new THREE.Color('#666688');
            case 'romantic': return new THREE.Color('#ffccf0');
            case 'nature': return new THREE.Color('#ccffdd');
            case 'energetic': return new THREE.Color('#ffffcc');
            case 'melancholy': return new THREE.Color('#ddeeff');
            default: return new THREE.Color('#ffffff');
        }
    }, [analysis.mood]);

    useFrame((state) => {
        if (!pointsRef.current) return;

        const attr = pointsRef.current.geometry.attributes.position;
        const tempo = analysis.tempo || 1;

        for (let i = 0; i < count; i++) {
            // Move forward (towards camera at Z=30)
            attr.array[i * 3 + 2] += particles.speeds[i] * tempo * 0.425;

            // Reset when passed camera
            if (attr.array[i * 3 + 2] > 35) {
                attr.array[i * 3 + 2] = -150; // Reset far back
                attr.array[i * 3] = (rnd() - 0.5) * 100;
                attr.array[i * 3 + 1] = (rnd() - 0.5) * 100;
            }
        }
        attr.needsUpdate = true;

        // Subtle camera jitter based on tempo
        state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 * tempo;
        state.camera.position.y = Math.cos(state.clock.elapsedTime * 0.3) * 0.2 * tempo;
    });

    // Create a circular texture for round particles
    const circleTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }, []);

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
                size={0.25}
                color={color}
                map={circleTexture}
                transparent
                opacity={isSpiritual ? 0.75 : 0.45}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

const Scene = ({ analysis, rnd, isSpiritual }) => {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 30], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />

                {/* Always show particles, but adjust opacity via material */}
                <ParticleField analysis={analysis} rnd={rnd} isSpiritual={isSpiritual} />

                {/* Only show WorldBuilder (terrain/trees) in default mode */}
                {!isSpiritual && <WorldBuilder analysis={analysis} rnd={rnd} />}

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={analysis.tempo} />
            </Canvas>
        </div>
    );
};

export default Scene;
