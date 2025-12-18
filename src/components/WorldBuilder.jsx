import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Cloud, Sky } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Tree Component
const Tree = ({ position, type, scale }) => {
    if (type === 'pine') {
        return (
            <group position={position} scale={[scale, scale, scale]}>
                <mesh position={[0, 1, 0]}>
                    <cylinderGeometry args={[0.1, 0.2, 2]} />
                    <meshStandardMaterial color="#4a3728" />
                </mesh>
                <mesh position={[0, 2.5, 0]}>
                    <coneGeometry args={[1, 3, 8]} />
                    <meshStandardMaterial color="#0f5f30" />
                </mesh>
                <mesh position={[0, 3.5, 0]}>
                    <coneGeometry args={[0.8, 2.5, 8]} />
                    <meshStandardMaterial color="#0f5f30" />
                </mesh>
            </group>
        );
    }

    // Deciduous (default)
    return (
        <group position={position} scale={[scale, scale, scale]}>
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.2, 0.3, 2]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0, 3, 0]}>
                <dodecahedronGeometry args={[1.5]} />
                <meshStandardMaterial color="#2d5a27" />
            </mesh>
        </group>
    );
};

// Procedural Terrain Component
const Terrain = ({ type, rnd }) => {
    // Generate static terrain data once using SEEDED random
    const terrainData = useMemo(() => {
        const data = [];
        for (let i = 0; i < 4225; i++) { // 65 * 65 vertices
            data.push(rnd());
        }
        return data;
    }, [rnd]);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(100, 100, 64, 64);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);

            let z = 0;
            if (type === 'mountain') {
                z = Math.sin(x / 5) * Math.cos(y / 5) * 2 + terrainData[i] * 0.5;
            } else if (type === 'desert') {
                z = Math.sin(x / 10 + y / 10) * 1.5; // Dunes
            } else if (type === 'ocean') {
                z = Math.sin(x / 2) * Math.cos(y / 2) * 0.5; // Waves base
            }

            pos.setZ(i, z);
        }
        geo.computeVertexNormals();
        return geo;
    }, [type, terrainData]);

    const material = useMemo(() => {
        if (type === 'desert') return new THREE.MeshStandardMaterial({ color: '#e6c288', roughness: 1 });
        if (type === 'ocean') return new THREE.MeshStandardMaterial({ color: '#006994', roughness: 0.1, metalness: 0.8 });
        if (type === 'snow') return new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
        return new THREE.MeshStandardMaterial({ color: '#3b5e2b', roughness: 0.8 }); // Grass
    }, [type]);

    return (
        <mesh geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
    );
};

// Weather System (Rain/Snow)
const Weather = ({ type, rnd }) => {
    const count = 2000;
    const mesh = useRef();

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            temp.push({
                x: rnd() * 40 - 20,
                y: rnd() * 20,
                z: rnd() * 40 - 20,
                speed: 0.1 + rnd() * 0.2
            });
        }
        return temp;
    }, [rnd]);

    useFrame(() => {
        if (!mesh.current) return;
        particles.forEach((p, i) => {
            p.y -= p.speed;
            if (p.y < 0) p.y = 20;

            const dummy = new THREE.Object3D();
            dummy.position.set(p.x, p.y, p.z);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    if (type === 'clear') return null;

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[0.05, type === 'rain' ? 0.5 : 0.1, 0.05]} />
            <meshBasicMaterial color={type === 'rain' ? '#88ccff' : '#ffffff'} transparent opacity={0.6} />
        </instancedMesh>
    );
};

const WorldBuilder = ({ analysis, rnd }) => {
    const { scenery, weather, mood } = analysis;

    // Generate vegetation positions once using SEEDED random
    const vegetation = useMemo(() => {
        if (scenery === 'ocean' || scenery === 'space' || scenery === 'desert') return [];

        const items = [];
        for (let i = 0; i < 50; i++) {
            const isPine = scenery === 'snow' || rnd() > 0.5;
            items.push({
                x: rnd() * 80 - 40,
                z: rnd() * 80 - 40,
                scale: 0.5 + rnd() * 0.5,
                type: isPine ? 'pine' : 'deciduous'
            });
        }
        return items;
    }, [scenery, rnd]);

    const isNight = mood === 'dark' || mood === 'melancholy' || scenery === 'space';

    return (
        <group>
            {/* Lighting */}
            <ambientLight intensity={isNight ? 0.2 : 0.6} />
            <directionalLight
                position={[10, 20, 10]}
                intensity={isNight ? 0.2 : 1.2}
                castShadow
                color={isNight ? '#4444ff' : '#ffffff'}
            />

            {/* Sky */}
            {scenery === 'space' ? (
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            ) : (
                <>
                    <Sky sunPosition={isNight ? [0, -10, 0] : [100, 20, 100]} turbidity={10} rayleigh={isNight ? 0.1 : 2} />
                    {weather !== 'clear' && <Cloud opacity={0.5} speed={0.4} width={10} depth={1.5} segments={20} position={[0, 10, -10]} />}
                </>
            )}

            {/* Terrain */}
            {scenery !== 'space' && <Terrain type={scenery === 'forest' ? 'mountain' : scenery} rnd={rnd} />}

            {/* Vegetation */}
            {vegetation.map((item, i) => (
                <Tree key={i} position={[item.x, 0, item.z]} type={item.type} scale={item.scale} />
            ))}

            {/* Weather */}
            <Weather type={weather} rnd={rnd} />
        </group>
    );
};

export default WorldBuilder;
