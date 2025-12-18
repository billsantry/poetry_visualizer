import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const ParticleField = ({ analysis, rnd }) => {
    const count = 2000;
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = rnd() * 100;
            const factor = 20 + rnd() * 100;
            const speed = 0.01 + rnd() / 200;
            const x = rnd() * 100 - 50;
            const y = rnd() * 100 - 50;
            const z = rnd() * 100 - 50;
            temp.push({ t, factor, speed, x, y, z, mx: 0, my: 0 });
        }
        return temp;
    }, [count, rnd]);

    // Determine colors based on mood
    const color = useMemo(() => {
        switch (analysis.mood) {
            case 'dark': return new THREE.Color('#1a1a1a');
            case 'romantic': return new THREE.Color('#ff0066');
            case 'nature': return new THREE.Color('#00ff44');
            case 'energetic': return new THREE.Color('#ffaa00');
            case 'melancholy': return new THREE.Color('#0066ff');
            default: return new THREE.Color('#ffffff');
        }
    }, [analysis.mood]);

    useFrame((state) => {
        if (!mesh.current) return;

        particles.forEach((particle, i) => {
            let { factor, speed, x, y, z } = particle;

            // Update time based on tempo
            particle.t += speed / 2 * (analysis.tempo * 2);
            const { t } = particle;

            // Movement logic
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);

            particle.mx += (state.mouse.x * 100 - particle.mx) * 0.01;
            particle.my += (state.mouse.y * 100 - 1 - particle.my) * 0.01;

            dummy.position.set(
                (particle.mx / 10) * a + x + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + y + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + z + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );

            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();

            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshPhongMaterial color={color} />
        </instancedMesh>
    );
};

const Scene = ({ analysis, rnd }) => {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 30], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <ParticleField analysis={analysis} rnd={rnd} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={analysis.tempo} />
            </Canvas>
        </div>
    );
};

export default Scene;
