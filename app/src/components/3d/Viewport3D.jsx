/**
 * Design & Build - 3D Viewport
 * Three.js viewport with Solar Path simulation, Isometric view, and MEP overlays
 */

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    OrbitControls,
    Environment,
    Grid,
    Html,
    ContactShadows,
    Sky,
    PerspectiveCamera,
    TransformControls,
    PivotControls
} from '@react-three/drei';
import { useBOQStore, useUIStore, useProjectStore, useLightingStore, useRenderStore } from '../../store';

// ============================================================================
// Room Type Colors
// ============================================================================

const ROOM_COLORS = {
    EXECUTIVE_OFFICE: '#4F46E5',
    MANAGER_OFFICE: '#7C3AED',
    MEETING_ROOM: '#2563EB',
    OPEN_WORKSPACE: '#10B981',
    RECEPTION: '#F59E0B',
    CAFE_PANTRY: '#EF4444',
    SERVER_ROOM: '#6B7280',
    STORAGE: '#78716C',
    CORRIDOR: '#A1A1AA',
    RESTROOM: '#06B6D4',
};

// ============================================================================
// Floor Component
// ============================================================================

function Floor({ bounds }) {
    const width = Math.max(bounds?.width || 20, 1000);
    const depth = Math.max(bounds?.height || 15, 1000);
    const theme = useUIStore(s => s.theme);

    const floorColor = theme === 'night' ? '#0A0A0B' : '#F8FAFC';

    return (
        <group>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[width / 2, -0.05, depth / 2]}
                receiveShadow
            >
                <planeGeometry args={[width * 10, depth * 10]} />
                <meshStandardMaterial
                    color={floorColor}
                    roughness={1}
                    metalness={0.0}
                />
            </mesh>
            {/* Massive Grid for orientation */}
            <Grid
                position={[width / 2, -0.04, depth / 2]}
                args={[width * 10, depth * 10]}
                cellSize={10}
                sectionSize={100}
                fadeDistance={5000}
                infiniteGrid
            />
        </group>
    );
}

// ============================================================================
// Wall Component
// ============================================================================

function Wall({ wall }) {
    const { position, dimensions } = wall;
    const showWireframe = useUIStore(s => s.showWireframe);

    const setSelectedObject = useUIStore(s => s.setSelectedObject);
    const selectedObject = useUIStore(s => s.selectedObject);
    const isSelected = selectedObject?.id === wall.id;

    return (
        <mesh
            name={wall.id}
            position={[position.x, position.y, position.z]}
            rotation={[0, wall.rotation || 0, 0]}
            castShadow
            receiveShadow
            onClick={(e) => {
                e.stopPropagation();
                setSelectedObject(wall);
            }}
        >
            <boxGeometry args={[dimensions.width, dimensions.height, Math.max(0.3, dimensions.depth)]} />
            <meshStandardMaterial
                color="#475569" // Darker slate for high contrast
                roughness={0.3}
                metalness={0.2}
                wireframe={showWireframe}
            />
        </mesh>
    );
}

// ============================================================================
// Nano Panana Pro Wall Component (archisketch-3d style)
// ============================================================================

function NanoPananaWall({ wall, wallColor }) {
    const setSelectedObject = useUIStore(s => s.setSelectedObject);
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.y - wall.start.y;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);
    const midX = (wall.start.x + wall.end.x) / 2;
    const midZ = (wall.start.y + wall.end.y) / 2;

    // Visual distinction for windows/doors
    let meshColor = wallColor || '#ffffff';
    let opacity = 1;
    if (wall.type === 'window') {
        meshColor = '#88ccff';
        opacity = 0.5;
    } else if (wall.type === 'door') {
        meshColor = '#8b4513';
    }

    return (
        <mesh
            name={wall.id || `np-wall-${wall.start.x}-${wall.start.y}`}
            position={[midX, wall.height / 2, midZ]}
            rotation={[0, -angle, 0]}
            castShadow
            receiveShadow
            onClick={(e) => {
                e.stopPropagation();
                setSelectedObject(wall);
            }}
        >
            <boxGeometry args={[length, wall.height, wall.thickness]} />
            <meshStandardMaterial
                color={meshColor}
                transparent={opacity < 1}
                opacity={opacity}
                roughness={0.4}
                metalness={0.1}
            />
        </mesh>
    );
}

// ============================================================================
// Nano Panana Pro Furniture Component (archisketch-3d style)
// ============================================================================

function NanoPananaFurniture({ item }) {
    const setSelectedObject = useUIStore(s => s.setSelectedObject);
    const activeStyle = useRenderStore(s => s.activeStyle);

    // Furniture dimensions based on type
    const getDimensions = () => {
        const type = item.type?.toLowerCase() || '';
        if (type.includes('chair') || type.includes('seat')) return [0.5, 0.9, 0.5];
        if (type.includes('desk') || type.includes('workstation')) return [1.5, 0.75, 0.75];
        if (type.includes('table') && type.includes('conference')) return [3.5, 0.75, 1.5];
        if (type.includes('table')) return [1.1, 0.75, 0.75];
        if (type.includes('sofa') || type.includes('couch')) return [2.1, 0.8, 0.85];
        if (type.includes('bed')) return [1.9, 0.45, 1.6];
        if (type.includes('cabinet') || type.includes('storage')) return [1.1, 1.6, 0.45];
        if (type.includes('plant')) return [0.4, 1.2, 0.4];
        if (type.includes('reception')) return [2.2, 1.1, 0.8];
        return [0.7, 0.7, 0.7];
    };

    const getColor = () => {
        const type = item.type?.toLowerCase() || '';
        const styleColors = {
            industrial: { wood: '#5D4037', metal: '#455A64', fabric: '#37474F' },
            minimalist: { wood: '#D7CCC8', metal: '#ECEFF1', fabric: '#F5F5F5' },
            luxury: { wood: '#3E2723', metal: '#263238', fabric: '#1A237E' },
            biophilic: { wood: '#4E342E', metal: '#455A64', fabric: '#2E7D32' },
        };
        const palette = styleColors[activeStyle] || styleColors.industrial;

        if (type.includes('chair') || type.includes('sofa')) return palette.fabric;
        if (type.includes('desk') || type.includes('table')) return palette.wood;
        if (type.includes('plant')) return '#388E3C';
        return palette.wood;
    };

    const [w, h, d] = getDimensions();
    const type = item.type?.toLowerCase() || '';
    const color = getColor();

    return (
        <group
            name={item.id || `np-furn-${item.position.x}-${item.position.y}`}
            position={[item.position.x, 0, item.position.y]}
            rotation={[0, item.rotation || 0, 0]}
            scale={item.scale || [1, 1, 1]}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedObject(item);
            }}
        >
            {/* Detailed Furniture Logic */}
            {type.includes('chair') ? (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0.45, 0]} castShadow> {/* Seat */}
                        <boxGeometry args={[w, 0.05, d]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                    <mesh position={[0, 0.7, -d / 2 + 0.025]} castShadow> {/* Back */}
                        <boxGeometry args={[w, 0.5, 0.05]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                    {/* Legs */}
                    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
                        <mesh key={i} position={[x * (w / 2 - 0.05), 0.225, z * (d / 2 - 0.05)]} castShadow>
                            <boxGeometry args={[0.04, 0.45, 0.04]} />
                            <meshStandardMaterial color="#333" />
                        </mesh>
                    ))}
                </group>
            ) : type.includes('desk') || type.includes('table') ? (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, h, 0]} castShadow receiveShadow> {/* Top */}
                        <boxGeometry args={[w, 0.04, d]} />
                        <meshStandardMaterial color={color} metalness={0.2} roughness={0.3} />
                    </mesh>
                    {/* Legs */}
                    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
                        <mesh key={i} position={[x * (w / 2 - 0.05), h / 2, z * (d / 2 - 0.05)]} castShadow>
                            <boxGeometry args={[0.05, h, 0.05]} />
                            <meshStandardMaterial color="#444" />
                        </mesh>
                    ))}
                </group>
            ) : type.includes('sofa') ? (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0.2, 0]} castShadow> {/* Base */}
                        <boxGeometry args={[w, 0.4, d]} />
                        <meshStandardMaterial color={color} roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.5, -d / 2 + 0.1]} castShadow> {/* Backrest */}
                        <boxGeometry args={[w, 0.6, 0.2]} />
                        <meshStandardMaterial color={color} roughness={0.8} />
                    </mesh>
                    <mesh position={[-w / 2 + 0.1, 0.4, 0]} castShadow> {/* Left Arm */}
                        <boxGeometry args={[0.2, 0.4, d]} />
                        <meshStandardMaterial color={color} roughness={0.8} />
                    </mesh>
                    <mesh position={[w / 2 - 0.1, 0.4, 0]} castShadow> {/* Right Arm */}
                        <boxGeometry args={[0.2, 0.4, d]} />
                        <meshStandardMaterial color={color} roughness={0.8} />
                    </mesh>
                </group>
            ) : type.includes('plant') ? (
                <group position={[0, 0, 0]}>
                    <mesh position={[0, 0.15, 0]} castShadow> {/* Pot */}
                        <cylinderGeometry args={[0.2, 0.15, 0.3, 12]} />
                        <meshStandardMaterial color="#5D4037" />
                    </mesh>
                    <mesh position={[0, 0.7, 0]} castShadow> {/* Foliage */}
                        <sphereGeometry args={[0.3, 8, 8]} />
                        <meshStandardMaterial color="#2E7D32" />
                    </mesh>
                </group>
            ) : (
                <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
                    <boxGeometry args={[w, h, d]} />
                    <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
                </mesh>
            )}
        </group>
    );
}

// ============================================================================
// Nano Panana Pro Floor Component
// ============================================================================

function NanoPananaFloor({ floorColor, bounds }) {
    // Use scene bounds for proper positioning
    const centerX = bounds?.centerX || bounds?.width / 2 || 15;
    const centerY = bounds?.centerY || bounds?.height / 2 || 15;
    const width = bounds?.width || 40;
    const height = bounds?.height || 40;

    return (
        <group>
            {/* Main floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.02, centerY]} receiveShadow>
                <planeGeometry args={[width + 10, height + 10]} />
                <meshStandardMaterial color={floorColor || '#e8e8e8'} roughness={0.7} metalness={0.05} />
            </mesh>
            {/* Grid overlay */}
            <Grid
                position={[centerX, -0.01, centerY]}
                args={[width + 10, height + 10]}
                cellSize={1}
                cellThickness={0.3}
                cellColor={'#cccccc'}
                sectionSize={5}
                sectionThickness={0.6}
                sectionColor={'#aaaaaa'}
                fadeDistance={100}
                fadeStrength={1}
            />
        </group>
    );
}

// ============================================================================
// Room Floor Overlay
// ============================================================================

function RoomFloor({ room, showLabel = true }) {
    const color = ROOM_COLORS[room.type] || '#6B7280';

    return (
        <group>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[room.position.x, 0.05, room.position.z]}
            >
                <planeGeometry args={[Math.max(0.1, room.dimensions.width - 0.2), Math.max(0.1, room.dimensions.depth - 0.2)]} />
                <meshStandardMaterial
                    color={color}
                    opacity={0.6}
                    transparent
                    roughness={0.7}
                    metalness={0.2}
                />
            </mesh>
            {/* Room Border for visibility */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[room.position.x, 0.051, room.position.z]}
            >
                <planeGeometry args={[Math.max(0.11, room.dimensions.width), Math.max(0.11, room.dimensions.depth)]} />
                <meshStandardMaterial color={color} wireframe />
            </mesh>

            {showLabel && (
                <Html
                    position={[room.position.x, 0.5, room.position.z]}
                    center
                    distanceFactor={15}
                    occlude
                >
                    <div className="px-3 py-1.5 bg-slate-900/90 rounded-lg text-white text-[10px] font-medium whitespace-nowrap backdrop-blur-sm border border-slate-700 shadow-xl pointer-events-none select-none">
                        <span className="text-cyan-400">{room.label}</span>
                        <span className="text-gray-500 ml-2">{Math.round(room.dimensions.width * room.dimensions.depth)} m²</span>
                    </div>
                </Html>
            )}
        </group>
    );
}

// ============================================================================
// Furniture Item Component
// ============================================================================

function FurnitureItem({ item, onClick, isSelected }) {
    const meshRef = useRef();
    const activeStyle = useRenderStore(s => s.activeStyle);

    useFrame((state) => {
        if (meshRef.current && isSelected) {
            meshRef.current.position.y = (meshRef.current.userData.originalY || 0.5) + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        }
    });

    const getDimensions = useMemo(() => {
        const code = item.itemCode?.toLowerCase() || '';
        if (code.includes('lf01') || code.includes('lf02')) return [1.6, 0.75, 0.8];
        if (code.includes('lf07') || code.includes('lf08') || code.includes('lf19')) return [0.6, 0.9, 0.6];
        if (code.includes('lf20')) return [3.6, 0.75, 1.4];
        if (code.includes('lf17') || code.includes('lf18')) return [1.2, 1.4, 0.45];
        return [1, 1, 1];
    }, [item.itemCode]);

    const getColor = useMemo(() => {
        const styleColors = {
            industrial: { desk: '#4A5568', chair: '#2D3748', table: '#1A202C' },
            minimalist: { desk: '#F7FAFC', chair: '#EDF2F7', table: '#E2E8F0' },
            luxury: { desk: '#744210', chair: '#5D4037', table: '#1A202C' },
            biophilic: { desk: '#276749', chair: '#48BB78', table: '#9AE6B4' },
        };

        const code = item.itemCode?.toLowerCase() || '';
        const colors = styleColors[activeStyle] || styleColors.industrial;

        if (code.includes('lf01') || code.includes('lf02')) return colors.desk;
        if (code.includes('lf07') || code.includes('lf08')) return colors.chair;
        if (code.includes('lf20')) return colors.table;
        if (code.includes('eq')) return '#F59E0B';
        return '#6B7280';
    }, [activeStyle, item.itemCode]);

    const [width, height, depth] = getDimensions;

    return (
        <group
            ref={meshRef}
            position={[item.position.x, height / 2, item.position.z]}
            userData={{ originalY: height / 2 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(item);
            }}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial
                    color={getColor}
                    roughness={0.3}
                    metalness={0.1}
                    emissive={isSelected ? getColor : '#000000'}
                    emissiveIntensity={isSelected ? 0.3 : 0}
                />
            </mesh>

            {isSelected && (
                <mesh scale={[1.1, 1.1, 1.1]}>
                    <boxGeometry args={[width, height, depth]} />
                    <meshBasicMaterial color="#06B6D4" wireframe transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}

// ============================================================================
// MEP Overlay Components
// ============================================================================

function MEPOverlay() {
    const showElectrical = useUIStore(s => s.showElectrical);
    const showHVAC = useUIStore(s => s.showHVAC);
    const showPlumbing = useUIStore(s => s.showPlumbing);
    const mepHotspots = useProjectStore(s => s.mepHotspots);

    if (!showElectrical && !showHVAC && !showPlumbing) return null;

    return (
        <group>
            {mepHotspots.map((hotspot, i) => {
                const isVisible = (hotspot.type === 'ELECTRICAL' || hotspot.type === 'TV_UNIT') ? showElectrical :
                    (hotspot.type === 'HVAC') ? showHVAC :
                        (hotspot.type === 'PLUMBING') ? showPlumbing : false;

                if (!isVisible) return null;

                const color = hotspot.type === 'ELECTRICAL' ? '#FBBF24' :
                    hotspot.type === 'HVAC' ? '#22D3EE' :
                        hotspot.type === 'PLUMBING' ? '#3B82F6' : '#FFFFFF';

                return (
                    <group key={`mep-${i}`} position={[hotspot.location.x, 2.5, hotspot.location.z]}>
                        <mesh>
                            <sphereGeometry args={[0.2, 16, 16]} />
                            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
                        </mesh>
                        <pointLight distance={3} intensity={0.5} color={color} />
                    </group>
                );
            })}
        </group>
    );
}

// ============================================================================
// Lighting System
// ============================================================================

function LightingSystem() {
    const sunPosition = useLightingStore(s => s.sunPosition);
    const sunIntensity = useLightingStore(s => s.sunIntensity);
    const sunColor = useLightingStore(s => s.sunColor);
    const ambientIntensity = useLightingStore(s => s.ambientIntensity);
    const shadowsEnabled = useLightingStore(s => s.shadowsEnabled);
    const shadowSoftness = useLightingStore(s => s.shadowSoftness);

    // Safe sun position to avoid division by zero in shaders
    // Using larger minimum values to prevent WebGL shader precision issues
    const safeSunPos = useMemo(() => {
        const minVal = 0.5; // Minimum position to avoid shader warnings
        const x = Math.abs(sunPosition.x) < minVal ? (sunPosition.x >= 0 ? minVal : -minVal) : sunPosition.x;
        const y = Math.max(sunPosition.y, minVal); // Sun should always be above horizon
        const z = Math.abs(sunPosition.z) < minVal ? (sunPosition.z >= 0 ? minVal : -minVal) : sunPosition.z;
        return [x, y, z];
    }, [sunPosition]);

    return (
        <>
            <ambientLight intensity={ambientIntensity} color="#FFFFFF" />

            <directionalLight
                position={safeSunPos}
                intensity={sunIntensity}
                color={sunColor}
                castShadow={shadowsEnabled}
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                shadow-radius={shadowSoftness}
            />

            <Sky
                distance={450000}
                sunPosition={safeSunPos}
                turbidity={0.1}
                rayleigh={0.5}
            />
        </>
    );
}

// ============================================================================
// Scene Content
// ============================================================================

function SceneContent() {
    const selectedItems = useBOQStore(s => s.selectedItems);
    const selectedObject = useUIStore(s => s.selectedObject);
    const setSelectedObject = useUIStore(s => s.setSelectedObject);

    const workflowPhase = useProjectStore(s => s.workflowPhase);
    const rooms3D = useProjectStore(s => s.rooms3D);
    const walls3D = useProjectStore(s => s.walls3D);
    const placedFurniture = useProjectStore(s => s.placedFurniture);
    const floorPlanBounds = useProjectStore(s => s.floorPlanBounds);
    const sceneData3D = useProjectStore(s => s.sceneData3D);

    const isAnalyzed = workflowPhase !== 'upload' && workflowPhase !== 'analyzing';

    // Performance Optimization: Limit rendered entities for very large CAD files
    const visibleWalls = useMemo(() => {
        // Only render walls that are large enough to be significant
        return walls3D
            .filter(w => Math.max(w.dimensions.width, w.dimensions.depth) > 0.2)
            .slice(0, 500);
    }, [walls3D]);

    const visibleRooms = useMemo(() => {
        // Sort by area if not already sorted, then slice for rendering performance
        return rooms3D.slice(0, 300);
    }, [rooms3D]);

    useEffect(() => {
        if (isAnalyzed) {
            console.log(`[Viewport3D] Rendering ${visibleRooms.length} rooms and ${visibleWalls.length} walls. Phase: ${workflowPhase}`);
        }
    }, [isAnalyzed, visibleRooms.length, visibleWalls.length, workflowPhase]);

    return (
        <group position={[0, 0, 0]}>
            {/* Use Nano Panana Pro scene data if available */}
            {sceneData3D ? (
                <>
                    {/* Nano Panana Pro Floor - use calculated scene bounds */}
                    <NanoPananaFloor
                        floorColor={sceneData3D.floorColor}
                        bounds={sceneData3D.bounds}
                    />

                    {/* Nano Panana Pro Walls */}
                    {sceneData3D.walls?.map((wall, i) => (
                        <NanoPananaWall
                            key={wall.id || `np-wall-${i}`}
                            wall={wall}
                            wallColor={sceneData3D.wallColor}
                        />
                    ))}

                    {/* Nano Panana Pro Furniture */}
                    {sceneData3D.furniture?.map((item, i) => (
                        <NanoPananaFurniture key={item.id || `np-furn-${i}`} item={item} />
                    ))}

                    {/* Contact Shadows centered on scene */}
                    <ContactShadows
                        position={[
                            sceneData3D.bounds?.centerX || 15,
                            -0.01,
                            sceneData3D.bounds?.centerY || 15
                        ]}
                        opacity={0.5}
                        scale={Math.max(sceneData3D.bounds?.width || 30, sceneData3D.bounds?.height || 30) * 1.5}
                        blur={2}
                        far={25}
                    />
                </>
            ) : (
                <>
                    {/* Standard D&B Floor */}
                    <Floor bounds={floorPlanBounds} />

                    {isAnalyzed && (
                        <>
                            {visibleWalls.map(wall => (
                                <Wall key={wall.id} wall={wall} />
                            ))}

                            {visibleRooms.map((room, index) => (
                                <RoomFloor
                                    key={room.id}
                                    room={room}
                                    showLabel={index < 50}
                                />
                            ))}

                            {placedFurniture.slice(0, 200).map((item, index) => (
                                <FurnitureItem
                                    key={item.id || index}
                                    item={item}
                                    onClick={setSelectedObject}
                                    isSelected={selectedObject?.id === item.id}
                                />
                            ))}
                        </>
                    )}

                    {!isAnalyzed && selectedItems.map((item, index) => (
                        <FurnitureItem
                            key={item.id}
                            item={{
                                ...item,
                                position: {
                                    x: (index % 5) * 2 - 4,
                                    y: 0,
                                    z: Math.floor(index / 5) * 2 - 3,
                                },
                            }}
                            onClick={setSelectedObject}
                            isSelected={selectedObject?.id === item.id}
                        />
                    ))}

                    <MEPOverlay />

                    {/* Interactive Transform Controls */}
                    {selectedObject && (
                        <TransformControls
                            object={scene.getObjectByName(selectedObject.id)}
                            mode="translate"
                            onMouseUp={() => {
                                // Update store on release
                                if (selectedObject.type === 'furniture') {
                                    // Update furniture position
                                }
                            }}
                        />
                    )}

                    {isAnalyzed && (
                        <ContactShadows
                            position={[floorPlanBounds.width / 2, -0.01, floorPlanBounds.height / 2]}
                            opacity={0.4}
                            scale={Math.max(floorPlanBounds.width, floorPlanBounds.height) * 1.5}
                            blur={2.5}
                            far={20}
                        />
                    )}
                </>
            )}
        </group>
    );
}

// ============================================================================
// Camera Controller
// ============================================================================

function CameraController() {
    const cameraMode = useUIStore(s => s.cameraMode);
    const floorPlanBounds = useProjectStore(s => s.floorPlanBounds);
    const { camera, controls } = useThree();

    // Use content center if available, fallback to half-bounds
    const centerX = floorPlanBounds.center?.x ?? (floorPlanBounds.width / 2);
    const centerZ = floorPlanBounds.center?.y ?? (floorPlanBounds.height / 2);

    useEffect(() => {
        if (!camera) return;

        const maxDim = Math.max(floorPlanBounds.width, floorPlanBounds.height);
        const distanceMultiplier = Math.max(1, maxDim / 20);

        const positions = {
            perspective: [centerX + 15 * distanceMultiplier, 12 * distanceMultiplier, centerZ + 15 * distanceMultiplier],
            isometric: [centerX + 20 * distanceMultiplier, 15 * distanceMultiplier, centerZ + 20 * distanceMultiplier],
            top: [centerX, 25 * distanceMultiplier, centerZ],
            front: [centerX, 5 * distanceMultiplier, centerZ + 20 * distanceMultiplier],
        };

        const pos = positions[cameraMode] || positions.perspective;

        camera.position.set(...pos);
        camera.near = 0.1;
        camera.far = 200000; // Extreme support for massive projects
        camera.lookAt(centerX, 0, centerZ);

        if (controls) {
            controls.target.set(centerX, 0, centerZ);
            controls.maxDistance = maxDim * 10;
        }

        camera.updateProjectionMatrix();

    }, [cameraMode, camera, centerX, centerZ, floorPlanBounds.width, floorPlanBounds.height, controls]);

    return null;
}

// ============================================================================
// Main Viewport Component
// ============================================================================

export default function Viewport3D() {
    const showGrid = useUIStore(s => s.showGrid);
    const cameraMode = useUIStore(s => s.cameraMode);
    const floorPlanBounds = useProjectStore(s => s.floorPlanBounds);
    const environmentPreset = useLightingStore(s => s.environmentPreset);

    // Safe preset mapping for drei Environment
    const safePreset = useMemo(() => {
        const validPresets = ['studio', 'sunset', 'dawn', 'night', 'warehouse', 'city', 'park', 'lobby', 'forest', 'apartment'];
        return validPresets.includes(environmentPreset) ? environmentPreset : 'studio';
    }, [environmentPreset]);

    const theme = useUIStore(s => s.theme);
    const bgColor = theme === 'night' ? '#0A0A0B' : '#F5F5F7';
    const cellColor = theme === 'night' ? '#1E293B' : '#E2E8F0';
    const sectionColor = theme === 'night' ? '#334155' : '#CBD5E1';

    const centerX = floorPlanBounds.width / 2;
    const centerZ = floorPlanBounds.height / 2;

    return (
        <div className="w-full h-full" style={{ backgroundColor: bgColor }}>
            <Canvas
                shadows
                dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
                gl={{
                    antialias: true,
                    alpha: false,
                    stencil: false,
                    depth: true,
                    powerPreference: "high-performance"
                }}
                onCreated={({ gl }) => {
                    // Initial setup if needed
                }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera
                        makeDefault
                        far={50000}
                        near={0.1}
                    />
                    <color attach="background" args={[bgColor]} />
                    <LightingSystem />
                    <Environment preset={safePreset} />

                    {showGrid && (
                        <Grid
                            position={[centerX, -0.01, centerZ]}
                            args={[Math.max(100, floorPlanBounds.width * 2), Math.max(100, floorPlanBounds.height * 2)]}
                            cellSize={1}
                            cellThickness={0.5}
                            cellColor={cellColor}
                            sectionSize={10}
                            sectionThickness={1}
                            sectionColor={sectionColor}
                            fadeDistance={Math.max(100, floorPlanBounds.width * 2)}
                            fadeStrength={1}
                            infiniteGrid
                        />
                    )}

                    <SceneContent />

                    <OrbitControls
                        makeDefault
                        target={[centerX, 0, centerZ]}
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2.1}
                        maxDistance={Math.max(500, floorPlanBounds.width * 5)}
                        minDistance={2}
                    />

                    <CameraController />
                </Suspense>
            </Canvas>
        </div>
    );
}
