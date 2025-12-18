import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const CinematicCamera = ({ analysis }) => {
    const cameraRef = useRef();
    const time = useRef(0);

    useFrame((state, delta) => {
        if (!cameraRef.current) return;

        // Advance time based on tempo
        time.current += delta * analysis.tempo * 0.5;

        // Calculate position along a path
        const t = time.current;

        // Smooth fly-through path
        const x = Math.sin(t * 0.5) * 10;
        const z = t * 5; // Move forward
        const y = 5 + Math.cos(t * 0.3) * 2; // Gentle bobbing

        // Look ahead
        const lookAtX = Math.sin((t + 1) * 0.5) * 10;
        const lookAtZ = (t + 1) * 5;
        const lookAtY = 5 + Math.cos((t + 1) * 0.3) * 2;

        cameraRef.current.position.set(x, y, z);
        cameraRef.current.lookAt(lookAtX, lookAtY, lookAtZ);
    });

    return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 5, 0]} fov={60} />;
};

export default CinematicCamera;
