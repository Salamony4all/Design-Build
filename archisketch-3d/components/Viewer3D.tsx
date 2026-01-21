
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Box, Sphere, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { SceneData, SceneConfig } from '../types';

interface Viewer3DProps {
  sceneData: SceneData | null;
  config: SceneConfig;
}

const WallMesh: React.FC<{ start: [number, number]; end: [number, number]; height: number; thickness: number; color: string; type: string }> = ({
  start, end, height, thickness, color, type
}) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[1] + end[1]) / 2;

  // Visual distinction for windows/doors
  let meshColor = color;
  let opacity = 1;
  if (type === 'window') {
    meshColor = '#88ccff';
    opacity = 0.5;
  } else if (type === 'door') {
    meshColor = '#8b4513';
  }

  return (
    <Box 
      position={[midX, height / 2, midZ]} 
      rotation={[0, -angle, 0]} 
      args={[length, height, thickness]}
    >
      <meshStandardMaterial 
        color={meshColor} 
        transparent={opacity < 1} 
        opacity={opacity} 
      />
    </Box>
  );
};

const FurnitureMesh: React.FC<{ type: string; position: [number, number]; rotation: number; scale: [number, number, number] }> = ({
  type, position, rotation, scale
}) => {
  // Simple primitives to represent furniture
  const renderItem = () => {
    switch(type.toLowerCase()) {
      case 'chair':
        return <Box args={[0.5, 0.8, 0.5]} />;
      case 'table':
        return <Box args={[1.5, 0.7, 1]} />;
      case 'sofa':
        return <Box args={[2, 0.8, 0.8]} />;
      case 'bed':
        return <Box args={[2, 0.5, 1.8]} />;
      default:
        return <Sphere args={[0.3, 16, 16]} />;
    }
  };

  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]} scale={scale}>
      {renderItem()}
      <meshStandardMaterial color="#cccccc" />
    </group>
  );
};

const Viewer3D: React.FC<Viewer3DProps> = ({ sceneData, config }) => {
  if (!sceneData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-white italic">
        Upload a layout to view it in 3D
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full bg-slate-800 relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={config.cameraPosition} fov={50} />
        <OrbitControls makeDefault />
        
        <ambientLight intensity={config.ambientIntensity} />
        <pointLight 
          position={config.pointLightPosition} 
          intensity={config.pointLightIntensity} 
          castShadow 
        />
        
        <Environment preset="city" />

        {config.showGrid && <Grid infiniteGrid cellColor="#444444" sectionColor="#666666" fadeDistance={30} />}

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color={sceneData.floorColor || '#ffffff'} />
        </mesh>

        {/* Walls */}
        {sceneData.walls.map((wall) => (
          <WallMesh
            key={wall.id}
            start={[wall.start.x, wall.start.y]}
            end={[wall.end.x, wall.end.y]}
            height={wall.height}
            thickness={wall.thickness}
            color={sceneData.wallColor}
            type={wall.type}
          />
        ))}

        {/* Furniture */}
        {sceneData.furniture.map((item) => (
          <FurnitureMesh
            key={item.id}
            type={item.type}
            position={[item.position.x, item.position.y]}
            rotation={item.rotation}
            scale={item.scale}
          />
        ))}
      </Canvas>
      
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded text-xs">
        {sceneData.walls.length} Walls • {sceneData.furniture.length} Objects
      </div>
    </div>
  );
};

export default Viewer3D;
