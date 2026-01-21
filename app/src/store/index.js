/**
 * Design & Build - Global State Management
 * Zustand stores for all agents and UI state
 * Live sync between 3D, BOQ, and Cost Analytics
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// BOQ Library Store
// ============================================================================

export const useBOQStore = create(
    devtools(
        persist(
            (set, get) => ({
                // BOQ Data
                furniture: [],
                fitout: [],
                materials: {},
                spatialZones: [],

                // Selected Items (items placed in scene)
                selectedItems: [],

                // Current Project
                project: {
                    name: 'New Project',
                    client: 'Design & Build',
                    date: new Date().toISOString().split('T')[0],
                    currency: 'OMR',
                    vatRate: 0.05,
                },

                // Loading State
                isLoading: false,
                error: null,

                // Actions
                loadBOQLibrary: async () => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await fetch('/boq_library.json');
                        const data = await response.json();
                        set({
                            furniture: data.furniture || [],
                            fitout: data.fitout || [],
                            materials: data.material_textures || {},
                            spatialZones: data.spatial_zones || [],
                            isLoading: false,
                        });
                    } catch (error) {
                        set({ error: error.message, isLoading: false });
                    }
                },

                addItemToScene: (item, quantity = 1, position = { x: 0, y: 0, z: 0 }) => {
                    const newItem = {
                        id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        itemCode: item.code,
                        name: item.name || item.item,
                        description: item.description,
                        category: item.category,
                        rate: item.rate,
                        quantity: quantity,
                        unit: item.unit || item.uom,
                        position: position,
                        rotation: { x: 0, y: 0, z: 0 },
                        placedAt: new Date().toISOString(),
                    };
                    set(state => ({
                        selectedItems: [...state.selectedItems, newItem],
                    }));

                    // Trigger Surveyor update
                    useSurveyorStore.getState().recalculate();

                    return newItem.id;
                },

                removeItemFromScene: (itemId) => {
                    set(state => ({
                        selectedItems: state.selectedItems.filter(item => item.id !== itemId),
                    }));
                    useSurveyorStore.getState().recalculate();
                },

                updateItemQuantity: (itemId, quantity) => {
                    set(state => ({
                        selectedItems: state.selectedItems.map(item =>
                            item.id === itemId ? { ...item, quantity } : item
                        ),
                    }));
                    useSurveyorStore.getState().recalculate();
                },

                updateItemPosition: (itemId, position) => {
                    set(state => ({
                        selectedItems: state.selectedItems.map(item =>
                            item.id === itemId ? { ...item, position } : item
                        ),
                    }));
                },

                clearScene: () => {
                    set({ selectedItems: [] });
                    useSurveyorStore.getState().recalculate();
                },

                updateProject: (updates) => {
                    set(state => ({
                        project: { ...state.project, ...updates },
                    }));
                },

                // Computed getters
                getSubtotal: () => {
                    const items = get().selectedItems;
                    return items.reduce((total, item) => total + (item.rate * item.quantity), 0);
                },

                getVAT: () => {
                    const subtotal = get().getSubtotal();
                    const vatRate = get().project.vatRate;
                    return subtotal * vatRate;
                },

                getTotal: () => {
                    return get().getSubtotal() + get().getVAT();
                },
            }),
            {
                name: 'ai-architect-boq',
                partialize: (state) => ({
                    selectedItems: state.selectedItems,
                    project: state.project,
                }),
            }
        ),
        { name: 'BOQStore' }
    )
);

// ============================================================================
// UI Store
// ============================================================================

export const useUIStore = create(
    devtools(
        (set) => ({
            // Sidebar State
            leftSidebarOpen: false,
            rightSidebarOpen: false,
            leftActiveTab: 'layers', // 'layers', 'library'
            rightActiveTab: 'lighting', // 'lighting', 'materials', 'settings'

            // 3D Viewport
            cameraMode: 'perspective', // 'perspective', 'isometric', 'top', 'front'
            showGrid: true,
            showWireframe: false,
            selectedObject: null,

            // MEP Overlays
            showElectrical: false,
            showHVAC: false,
            showPlumbing: false,

            // Modals
            activeModal: null, // 'export', 'ar', 'settings', 'help', 'cad-editor'

            // Notifications
            notifications: [],

            // Search
            searchQuery: '',
            activeCategory: 'all',

            // Theme
            theme: 'day', // 'night', 'day'

            // Actions
            toggleLeftSidebar: () => set(state => ({ leftSidebarOpen: !state.leftSidebarOpen })),
            toggleRightSidebar: () => set(state => ({ rightSidebarOpen: !state.rightSidebarOpen })),
            setLeftActiveTab: (tab) => set({ leftActiveTab: tab }),
            setRightActiveTab: (tab) => set({ rightActiveTab: tab }),
            setCameraMode: (mode) => set({ cameraMode: mode }),
            toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
            toggleWireframe: () => set(state => ({ showWireframe: !state.showWireframe })),
            setSelectedObject: (obj) => set({ selectedObject: obj }),

            // Theme Toggle
            toggleTheme: () => set(state => ({ theme: state.theme === 'night' ? 'day' : 'night' })),

            // MEP Toggles
            toggleElectrical: () => set(state => ({ showElectrical: !state.showElectrical })),
            toggleHVAC: () => set(state => ({ showHVAC: !state.showHVAC })),
            togglePlumbing: () => set(state => ({ showPlumbing: !state.showPlumbing })),

            // Modal
            openModal: (modal) => set({ activeModal: modal }),
            closeModal: () => set({ activeModal: null }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setActiveCategory: (category) => set({ activeCategory: category }),

            addNotification: (notification) => {
                const id = Date.now();
                set(state => ({
                    notifications: [...state.notifications, { ...notification, id }],
                }));
                setTimeout(() => {
                    set(state => ({
                        notifications: state.notifications.filter(n => n.id !== id),
                    }));
                }, 5000);
            },

            removeNotification: (id) => {
                set(state => ({
                    notifications: state.notifications.filter(n => n.id !== id),
                }));
            },
        }),
        { name: 'UIStore' }
    )
);

// ============================================================================
// Lighting Store (Solar Path & Studio Lighting)
// ============================================================================

export const useLightingStore = create(
    devtools(
        (set, get) => ({
            // Solar Path
            solarTime: 12, // Hour of day (0-24)
            solarDate: new Date().toISOString().split('T')[0],
            latitude: 23.4, // Muscat, Oman
            longitude: 58.4,

            // Directional Light (Sun)
            sunIntensity: 1.5,
            sunColor: '#FFFFFF',
            sunPosition: { x: 10, y: 20, z: 10 },

            // Ambient Light
            ambientIntensity: 0.4,
            ambientColor: '#87CEEB',

            // Studio Lighting
            studioMode: false,
            keyLightIntensity: 2.0,
            fillLightIntensity: 0.8,
            rimLightIntensity: 0.5,

            // Color Temperature (Kelvin)
            colorTemperature: 5500, // Daylight

            // Shadows
            shadowsEnabled: true,
            shadowSoftness: 2.5,
            shadowOpacity: 0.4,

            // Environment
            environmentPreset: 'studio', // 'studio', 'sunset', 'dawn', 'night', 'warehouse'

            // Actions
            setSolarTime: (time) => {
                set({ solarTime: time });
                get().updateSunPosition();
            },

            updateSunPosition: () => {
                const { solarTime, latitude } = get();

                // Calculate sun position based on time and latitude
                // 6 AM = -90deg, 12 PM = 0deg, 6 PM = 90deg
                const hourAngle = (solarTime - 12) * 15;
                const declination = 0;

                // Basic altitude/azimuth to Cartesian conversion
                // altitude: 0 at horizon, 90 at zenith
                // We'll use a simple sine curve for altitude based on daytime
                const dayScale = Math.max(0, Math.sin(((solarTime - 6) / 12) * Math.PI));
                const altitude = dayScale * (90 - Math.abs(latitude - declination));

                const distance = 50;
                const altitudeRad = (altitude * Math.PI) / 180;
                const azimuthRad = (hourAngle * Math.PI) / 180;

                // Ensure sun is always slightly offset to avoid shader singularities
                const x = distance * Math.cos(altitudeRad) * Math.sin(azimuthRad);
                const y = Math.max(0.01, distance * Math.sin(altitudeRad)); // Never zero
                const z = distance * Math.cos(altitudeRad) * Math.cos(azimuthRad);

                // Update sun color based on time
                let sunColor = '#FFFFFF';
                if (solarTime < 7 || solarTime > 18) {
                    sunColor = '#FF6B35'; // Sunset/Dawn
                } else if (solarTime < 9 || solarTime > 16) {
                    sunColor = '#FFD700'; // Golden
                }

                // Adjust intensity based on sun height
                const sunIntensity = Math.max(0.1, (y / distance) * 1.5);

                set({ sunPosition: { x, y, z }, sunColor, sunIntensity });
            },

            setSunIntensity: (intensity) => set({ sunIntensity: intensity }),
            setAmbientIntensity: (intensity) => set({ ambientIntensity: intensity }),
            setColorTemperature: (temp) => set({ colorTemperature: temp }),
            setShadowSoftness: (softness) => set({ shadowSoftness: softness }),
            toggleShadows: () => set(state => ({ shadowsEnabled: !state.shadowsEnabled })),
            setEnvironmentPreset: (preset) => set({ environmentPreset: preset }),
            toggleStudioMode: () => set(state => ({ studioMode: !state.studioMode })),
        }),
        { name: 'LightingStore' }
    )
);

// ============================================================================
// Project Workflow Store
// ============================================================================

export const useProjectStore = create(
    devtools(
        persist(
            (set, get) => ({
                // Workflow Phase
                workflowPhase: 'upload', // 'upload', 'analyzing', 'detected', 'furnishing', 'ready'

                // Uploaded Sketch
                sketchFile: null,
                sketchPreviewUrl: null,

                // AI Analysis Results
                analysisResult: null,
                detectedRooms: [],
                mepHotspots: [],
                floorPlanBounds: { width: 20, height: 15 },
                totalArea: 0,

                // Design Health Check
                healthCheck: {
                    score: 0,
                    issues: [],
                    recommendations: [],
                },

                // Auto-Furnishing
                furnishingPlan: [],
                placedFurniture: [],

                // 3D Scene
                rooms3D: [],
                walls3D: [],

                // Nano Panana Pro 3D Scene Data (archisketch-3d compatible)
                sceneData3D: null, // { walls, furniture, floorColor, wallColor }

                // Nano Panana Pro Generated Renders (for export)
                nanoPananaRenders: [], // Array of { id, image, timestamp, style, prompt }

                // 🆕 Enhanced Nano Banana Pro Data (Complete Professional Package)
                nanoBananaData: {
                    boqItems: [],           // Auto-extracted BOQ items from renders
                    materials: [],          // Material specifications
                    materialPalette: [],    // Color swatches for moodboard
                    architectInsights: {},  // Professional architect analysis
                    designPhilosophy: '',   // Design philosophy text
                    cameraPresets: [],      // Recommended camera angles
                    spaceAnalysis: {}       // Space utilization analysis
                },

                // CAD Drafting (Live Editor)
                cadEntities: [], // Array of { type, points, layer, color, id }
                cadLayers: [
                    { name: '0', color: '#FFFFFF', visible: true, locked: false },
                    { name: 'A-WALL', color: '#6B7280', visible: true, locked: false },
                    { name: 'A-DOOR', color: '#10B981', visible: true, locked: false },
                    { name: 'A-FURN', color: '#EC4899', visible: true, locked: false },
                    { name: 'A-MEP', color: '#F59E0B', visible: true, locked: false },
                ],
                activeCadLayer: '0',

                // BOQ Summary
                boqSummary: null,

                // Workflow Modes
                nanoPananaMode: 'render', // 'render' (default - photo expert) or '3d'

                // Actions
                setWorkflowPhase: (phase) => set({ workflowPhase: phase }),

                // Generic project data setter
                setProjectData: (data) => set((state) => ({ ...state, ...data })),

                // Set Nano Panana Renders
                setNanoPananaRenders: (renders) => set((state) => ({
                    nanoPananaRenders: typeof renders === 'function'
                        ? renders(state.nanoPananaRenders)
                        : renders
                })),

                // Set Nano Panana Mode
                setNanoPananaMode: (mode) => set({ nanoPananaMode: mode }),

                // Clear Nano Panana Renders
                clearNanoPananaRenders: () => set({ nanoPananaRenders: [] }),

                startSketchAnalysis: async (file) => {
                    set({
                        workflowPhase: 'analyzing',
                        sketchFile: file,
                    });

                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => set({ sketchPreviewUrl: e.target.result });
                        reader.readAsDataURL(file);
                    }

                    try {
                        // Import appropriate analysis service based on file type
                        const fileName = file.name.toLowerCase();
                        const isDXF = fileName.endsWith('.dxf');
                        const isDWG = fileName.endsWith('.dwg');
                        const isSVG = fileName.endsWith('.svg');
                        const isPDF = file.type === 'application/pdf';
                        const isImage = file.type.startsWith('image/') || isSVG;

                        let result;
                        let sceneData3D = null;

                        if (isDXF) {
                            // Use real DXF parser for .dxf files
                            console.log('[Project] Using DXF converter for:', file.name);
                            const { parseDXFFile } = await import('../services/dxfConverter.js');
                            result = await parseDXFFile(file);
                        } else if (isDWG) {
                            // DWG files need conversion - use Vision AI on rasterized version
                            console.log('[Project] DWG detected - using Vision AI analysis');
                            const { analyzeFloorPlanWithVision } = await import('../services/geminiVision.js');
                            result = await analyzeFloorPlanWithVision(file);
                            result.cadMetadata = {
                                format: 'Binary DWG',
                                note: 'For full DWG support, export as DXF from AutoCAD',
                            };
                        } else if (isImage || isPDF) {
                            // Try Nano Panana Pro for COMPLETE visualization (3D + Render)
                            console.log('[Project] Trying Nano Panana Pro Complete Visualization for:', file.name);
                            try {
                                const {
                                    generateCompleteVisualization,
                                    isNanoPananaConfigured
                                } = await import('../services/nanoPananaService.js');

                                if (isNanoPananaConfigured()) {
                                    console.log('[Project] Nano Panana Pro API configured, using complete visualization');

                                    // This gets BOTH 3D model data AND photorealistic render
                                    const mode = get().nanoPananaMode;
                                    const visualization = await generateCompleteVisualization(file, '', (progress) => {
                                        console.log('[Project] Visualization progress:', progress);
                                    }, mode);

                                    result = visualization.analysisResult;
                                    sceneData3D = visualization.sceneData;

                                    // If we have a render but the structural analysis was skipped or failed,
                                    // we still consider this a success for the overall visualization.
                                    if (visualization.render && !result.success) {
                                        result.success = true;
                                        result.render = visualization.render; // Ensure render is attached to result
                                    }

                                    // Store the render if available
                                    if (visualization.render) {
                                        set(state => ({
                                            nanoPananaRenders: [
                                                {
                                                    id: Date.now(),
                                                    image: visualization.render,
                                                    timestamp: new Date().toISOString(),
                                                    style: 'Nano Panana Pro 8K',
                                                    prompt: 'Initial AI visualization'
                                                },
                                                ...state.nanoPananaRenders
                                            ]
                                        }));
                                    }

                                    // Store the 3D scene data for Viewport3D
                                    if (visualization.sceneData) {
                                        sceneData3D = visualization.sceneData;
                                        console.log('[Project] 3D Scene Data received:', {
                                            walls: sceneData3D.walls?.length || 0,
                                            furniture: sceneData3D.furniture?.length || 0,
                                            rooms: visualization.rooms?.length || 0
                                        });
                                    }

                                    // Store the photorealistic render if generated
                                    if (visualization.render) {
                                        console.log('[Project] Photorealistic render generated');
                                        // Add render to the renders array for export
                                        const renderObj = {
                                            id: `render-${Date.now()}`,
                                            image: visualization.render,
                                            timestamp: new Date().toISOString(),
                                            style: 'default',
                                            prompt: 'Initial visualization',
                                            sourceFile: file.name
                                        };

                                        set(state => ({
                                            nanoPananaRenders: [...state.nanoPananaRenders, renderObj]
                                        }));
                                    }

                                    // Also update result with render info
                                    result.render = visualization.render;
                                    result.metadata = visualization.metadata;
                                } else {
                                    throw new Error('Nano Panana Pro not configured, falling back');
                                }
                            } catch (nanoPananaError) {
                                console.warn('[Project] Nano Panana Pro failed, falling back to Gemini Vision:', nanoPananaError.message);
                                // Fallback to standard Gemini Vision
                                const { analyzeFloorPlanWithVision } = await import('../services/geminiVision.js');
                                result = await analyzeFloorPlanWithVision(file);
                            }
                        } else {
                            // Fallback to legacy analysis
                            const { analyzeSketch } = await import('../services/aiAnalysis.js');
                            result = await analyzeSketch(file);
                        }

                        if (result.success) {
                            // 1. Initial State Update (Transition to 'detected')
                            set({
                                analysisResult: result,
                                detectedRooms: result.rooms || [],
                                mepHotspots: result.mepHotspots || [],
                                floorPlanBounds: result.floorPlan?.bounds || { width: 30, height: 30, center: { x: 15, y: 15 } },
                                totalArea: result.floorPlan?.totalArea || 900,
                                healthCheck: result.healthCheck || { score: 85, issues: [], recommendations: [] },
                                workflowPhase: 'detected',
                                // Store Nano Panana Pro 3D scene data if available
                                sceneData3D: sceneData3D,
                            });

                            // 2. Populate CAD Editor (2D Drafting)
                            if (isDXF || isDWG || isPDF || isImage) {
                                const entities = [];
                                (result.rooms || []).forEach(r => {
                                    if (!r.bounds && !r.vertices) return;

                                    const roomVertices = r.vertices || [
                                        { x: r.bounds?.x || 0, y: r.bounds?.y || 0 },
                                        { x: (r.bounds?.x || 0) + (r.bounds?.width || 0), y: r.bounds?.y || 0 },
                                        { x: (r.bounds?.x || 0) + (r.bounds?.width || 0), y: (r.bounds?.y || 0) + (r.bounds?.height || 0) },
                                        { x: r.bounds?.x || 0, y: (r.bounds?.y || 0) + (r.bounds?.height || 0) },
                                        { x: r.bounds?.x || 0, y: r.bounds?.y || 0 }
                                    ];

                                    entities.push({
                                        id: `init-${r.id}`,
                                        type: 'POLYLINE',
                                        points: roomVertices,
                                        layer: r.layer || 'A-ZONE',
                                        color: '#3B82F6'
                                    });
                                });

                                // Add significant walls as lines if available from result
                                if (result.walls) {
                                    result.walls.filter(w => w !== null).forEach((w, i) => {
                                        // Use the larger dimension as the visual line length
                                        const wallLen = Math.max(w.dimensions?.width || 0, w.dimensions?.depth || 0);

                                        if (wallLen > 0.5) {
                                            const wX = w.position?.x || 0;
                                            const wZ = w.position?.z || 0;
                                            const rot = w.rotation || 0;

                                            // Calculate start and end points based on rotation
                                            const halfLen = wallLen / 2;
                                            const dx = Math.cos(rot) * halfLen;
                                            const dz = Math.sin(rot) * halfLen;

                                            entities.push({
                                                id: `wall-line-${i}`,
                                                type: 'LINE',
                                                points: [
                                                    { x: wX - dx, y: wZ - dz },
                                                    { x: wX + dx, y: wZ + dz }
                                                ],
                                                layer: w.layer || 'A-WALL',
                                                color: '#6B7280'
                                            });
                                        }
                                    });
                                }
                                set({ cadEntities: entities });
                            }

                            // Import furnishing functions
                            const { calculateAutoFurnishing, generate3DPlacements } = await import('../services/geminiVision.js');

                            const furnishing = calculateAutoFurnishing(result.rooms);
                            const placements = generate3DPlacements(furnishing.furnishingPlan, result.rooms);

                            set({
                                furnishingPlan: furnishing.furnishingPlan,
                                boqSummary: furnishing.summary,
                                placedFurniture: placements,
                                workflowPhase: 'furnishing',
                            });

                            // Add items to BOQ
                            const boqStore = useBOQStore.getState();
                            boqStore.clearScene();
                            furnishing.boqItems.forEach(item => {
                                boqStore.addItemToScene({
                                    code: item.code,
                                    name: item.name,
                                    description: `Auto-placed in ${item.roomName}`,
                                    category: item.code.startsWith('LF') ? 'Furniture' : 'Fit-Out',
                                    rate: item.rate,
                                    unit: item.uom,
                                }, item.quantity, { x: 0, y: 0, z: 0 });
                            });

                            // 4. Generate 3D Scene
                            const rooms3D_final = result.rooms.map(room => ({
                                id: room.id,
                                type: room.type,
                                label: room.label,
                                position: {
                                    x: room.bounds.x + room.bounds.width / 2,
                                    y: 0,
                                    z: room.bounds.y + room.bounds.height / 2,
                                },
                                dimensions: {
                                    width: room.bounds.width,
                                    height: 3,
                                    depth: room.bounds.height,
                                },
                                bounds: room.bounds,
                            }));

                            // Use detected walls if available, otherwise heuristic
                            const walls3D_final = result.walls
                                ? result.walls.filter(w => w !== null).map((w, i) => ({
                                    id: w.id || `wall-${i}`,
                                    layer: w.layer || 'A-WALL',
                                    position: w.position || { x: 0, y: 1.5, z: 0 },
                                    dimensions: w.dimensions || { width: 0.2, height: 3, depth: 0.2 },
                                    rotation: w.rotation || 0
                                }))
                                : generateWalls(result.rooms, result.floorPlan.bounds);

                            set({
                                rooms3D: rooms3D_final,
                                walls3D: walls3D_final,
                                workflowPhase: 'ready',
                            });

                            // 5. Trigger Surveyor calculation
                            useSurveyorStore.getState().calculateFromProject(result, furnishing);

                            return result;
                        }
                    } catch (error) {
                        console.error('[Project] Analysis failed:', error);
                        set({ workflowPhase: 'upload' });
                        return { success: false, error: error.message };
                    }
                },

                resetWorkflow: () => {
                    set({
                        workflowPhase: 'upload',
                        sketchFile: null,
                        sketchPreviewUrl: null,
                        analysisResult: null,
                        detectedRooms: [],
                        mepHotspots: [],
                        furnishingPlan: [],
                        placedFurniture: [],
                        rooms3D: [],
                        walls3D: [],
                        cadEntities: [],
                        sceneData3D: null,
                        boqSummary: null,
                        healthCheck: { score: 0, issues: [], recommendations: [] },
                    });
                    useBOQStore.getState().clearScene();
                    useSurveyorStore.getState().reset();
                },

                // CAD Actions
                addCadEntity: (entity) => set(state => ({
                    cadEntities: [...state.cadEntities, { ...entity, id: `entity-${Date.now()}` }]
                })),

                removeCadEntity: (id) => set(state => ({
                    cadEntities: state.cadEntities.filter(e => e.id !== id)
                })),

                updateCadEntity: (id, updates) => set(state => ({
                    cadEntities: state.cadEntities.map(e => e.id === id ? { ...e, ...updates } : e)
                })),

                setCadEntities: (entities) => set({ cadEntities: entities }),

                toggleCadLayer: (layerName) => set(state => ({
                    cadLayers: state.cadLayers.map(l => l.name === layerName ? { ...l, visible: !l.visible } : l)
                })),

                setActiveCadLayer: (layerName) => set({ activeCadLayer: layerName }),

                syncCADToProject: async () => {
                    const { cadEntities, analysisResult } = get();
                    if (!cadEntities.length) return;

                    console.log('[Project] Syncing CAD entities to 3D model...');

                    const rooms = [];
                    const walls = [];

                    cadEntities.forEach(ent => {
                        if (ent.type === 'POLYLINE' || ent.type === 'RECT') {
                            // Convert to room
                            let pts = ent.points;
                            if (ent.type === 'RECT' && pts.length >= 2) {
                                // Expand Rect to 4 points
                                const p1 = pts[0];
                                const p2 = pts[1];
                                pts = [
                                    { x: p1.x, y: p1.y },
                                    { x: p2.x, y: p1.y },
                                    { x: p2.x, y: p2.y },
                                    { x: p1.x, y: p2.y },
                                    { x: p1.x, y: p1.y }
                                ];
                            }

                            const minX = Math.min(...pts.map(p => p.x));
                            const maxX = Math.max(...pts.map(p => p.x));
                            const minY = Math.min(...pts.map(p => p.y));
                            const maxY = Math.max(...pts.map(p => p.y));
                            const width = Math.abs(maxX - minX);
                            const height = Math.abs(maxY - minY);
                            const area = width * height;

                            rooms.push({
                                id: ent.id,
                                type: ent.label || 'OPEN_WORKSPACE',
                                label: ent.name || `Room ${ent.id.split('-')[1] || ''}`,
                                area: Math.round(area * 100) / 100,
                                bounds: { x: minX, y: minY, width, height },
                                vertices: pts,
                                layer: ent.layer,
                                confidence: 1.0,
                                source: 'CAD-MANUAL'
                            });
                        } else if (ent.type === 'LINE' && ent.points?.length >= 2) {
                            const p1 = ent.points[0];
                            const p2 = ent.points[1];
                            const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
                            const angle = -Math.atan2(p2.y - p1.y, p2.x - p1.x);

                            walls.push({
                                id: ent.id,
                                position: { x: (p1.x + p2.x) / 2, y: 1.5, z: (p1.y + p2.y) / 2 },
                                dimensions: { width: length, height: 3, depth: 0.15 },
                                rotation: angle,
                                layer: ent.layer || 'A-WALL'
                            });
                        }
                    });

                    // Build 3D structures
                    const rooms3D = rooms.map(r => ({
                        id: r.id,
                        type: r.type,
                        label: r.label,
                        position: { x: r.bounds.x + r.bounds.width / 2, y: 0, z: r.bounds.y + r.bounds.height / 2 },
                        dimensions: { width: r.bounds.width, height: 3, depth: r.bounds.height },
                        bounds: r.bounds
                    }));

                    const walls3D = walls.map(w => ({
                        ...w,
                        id: w.id,
                        position: w.position,
                        dimensions: w.dimensions,
                        rotation: w.rotation
                    }));

                    // Update store
                    const syncResult = {
                        ...analysisResult,
                        rooms,
                        walls,
                        floorPlan: {
                            ...analysisResult?.floorPlan,
                            totalArea: rooms.reduce((s, r) => s + r.area, 0)
                        }
                    };

                    set({
                        detectedRooms: rooms,
                        rooms3D,
                        walls3D,
                        analysisResult: syncResult,
                        workflowPhase: 'ready'
                    });

                    // Recalculate BOQ and Surveyor
                    const { calculateAutoFurnishing, generate3DPlacements } = await import('../services/geminiVision.js');
                    const furnishing = calculateAutoFurnishing(rooms);
                    const placements = generate3DPlacements(furnishing.furnishingPlan, rooms);

                    set({
                        furnishingPlan: furnishing.furnishingPlan,
                        boqSummary: furnishing.summary,
                        placedFurniture: placements
                    });

                    useSurveyorStore.getState().calculateFromProject(syncResult, furnishing);

                    console.log('[Project] Sync complete. Items:', rooms.length, 'rooms,', walls.length, 'walls');
                },
            }),
            {
                name: 'ai-architect-project',
                partialize: (state) => ({
                    workflowPhase: state.workflowPhase,
                    detectedRooms: state.detectedRooms,
                    furnishingPlan: state.furnishingPlan,
                }),
            }
        ),
        { name: 'ProjectStore' }
    )
);

// ============================================================================
// Surveyor AI Store (Real-Time QTO)
// ============================================================================

export const useSurveyorStore = create(
    devtools(
        (set, get) => ({
            // Quantity Takeoff Data
            wallArea: 0, // Total wall area minus openings (m²)
            floorArea: 0, // Total floor area (m²)
            ceilingArea: 0, // Total ceiling area (m²)

            // Itemized Counts
            furnitureCount: 0,
            mepCount: 0,
            fixtureCount: 0,

            // Cost Breakdown
            materialCost: 0,
            laborCost: 0,
            mepCost: 0,
            furnitureCost: 0,

            // Unit Rates (Editable)
            unitRates: {
                wallPaint: 3.5, // OMR per m²
                flooring: 25.0, // OMR per m²
                ceiling: 18.0, // OMR per m²
                electrical: 45.0, // OMR per point
                plumbing: 85.0, // OMR per fixture
                hvac: 120.0, // OMR per ton
            },

            // Totals
            totalCost: 0,
            contingency: 0.10, // 10%
            grandTotal: 0,

            // Cost Style Modifiers
            styleModifier: 1.0, // 1.0 = standard, 1.5 = luxury, 0.8 = budget
            activeMaterialStyle: 'standard', // 'budget', 'standard', 'luxury'

            // Actions
            calculateFromProject: (analysis, furnishing) => {
                const rooms = analysis.rooms || [];

                let wallArea = 0;
                let floorArea = 0;
                const wallHeight = 3; // meters

                rooms.forEach(room => {
                    const area = room.area || (room.bounds.width * room.bounds.height);
                    floorArea += area;

                    // Calculate perimeter for walls
                    const perimeter = 2 * (room.bounds.width + room.bounds.height);
                    wallArea += perimeter * wallHeight;

                    // Subtract 15% for openings (doors, windows)
                    wallArea *= 0.85;
                });

                const unitRates = get().unitRates;
                const styleModifier = get().styleModifier;

                const materialCost = (
                    wallArea * unitRates.wallPaint +
                    floorArea * unitRates.flooring +
                    floorArea * unitRates.ceiling
                ) * styleModifier;

                const mepPoints = analysis.mepHotspots?.length || 10;
                const mepCost = mepPoints * unitRates.electrical;

                const furnitureCost = furnishing?.summary?.subtotal || 0;

                const laborCost = (materialCost + mepCost) * 0.35; // 35% labor

                const totalCost = materialCost + laborCost + mepCost + furnitureCost;
                const contingency = get().contingency;
                const grandTotal = totalCost * (1 + contingency);

                set({
                    wallArea: Math.round(wallArea * 100) / 100,
                    floorArea: Math.round(floorArea * 100) / 100,
                    ceilingArea: Math.round(floorArea * 100) / 100,
                    furnitureCount: furnishing?.boqItems?.length || 0,
                    mepCount: mepPoints,
                    materialCost: Math.round(materialCost * 100) / 100,
                    laborCost: Math.round(laborCost * 100) / 100,
                    mepCost: Math.round(mepCost * 100) / 100,
                    furnitureCost: Math.round(furnitureCost * 100) / 100,
                    totalCost: Math.round(totalCost * 100) / 100,
                    grandTotal: Math.round(grandTotal * 100) / 100,
                });
            },

            recalculate: () => {
                const boqStore = useBOQStore.getState();
                const projectStore = useProjectStore.getState();

                if (projectStore.analysisResult) {
                    get().calculateFromProject(
                        projectStore.analysisResult,
                        {
                            summary: { subtotal: boqStore.getSubtotal() },
                            boqItems: boqStore.selectedItems,
                        }
                    );
                }
            },

            setUnitRate: (key, value) => {
                set(state => ({
                    unitRates: { ...state.unitRates, [key]: value },
                }));
                get().recalculate();
            },

            setStyleModifier: (style) => {
                const modifiers = {
                    budget: 0.75,
                    standard: 1.0,
                    luxury: 1.8,
                };
                set({
                    styleModifier: modifiers[style] || 1.0,
                    activeMaterialStyle: style,
                });
                get().recalculate();
            },

            setContingency: (value) => {
                set({ contingency: value });
                get().recalculate();
            },

            reset: () => {
                set({
                    wallArea: 0,
                    floorArea: 0,
                    ceilingArea: 0,
                    furnitureCount: 0,
                    mepCount: 0,
                    materialCost: 0,
                    laborCost: 0,
                    mepCost: 0,
                    furnitureCost: 0,
                    totalCost: 0,
                    grandTotal: 0,
                });
            },
        }),
        { name: 'SurveyorStore' }
    )
);

// ============================================================================
// Render Store (Nano Banana Pro)
// ============================================================================

export const useRenderStore = create(
    devtools(
        (set) => ({
            // Render Quality
            quality: 'high',
            antiAliasing: true,
            shadows: true,
            ambientOcclusion: true,
            bloom: false,

            // Active Style
            activeStyle: 'industrial', // 'industrial', 'minimalist', 'luxury', 'biophilic'

            // Nano Banana Pro Settings
            upscaleEnabled: true,
            upscaleFactor: 2,
            denoiseStrength: 0.5,

            // Render State
            isRendering: false,
            renderProgress: 0,
            lastRender: null,

            // Actions
            setQuality: (quality) => set({ quality }),
            setActiveStyle: (style) => {
                set({ activeStyle: style });
                // Trigger cost recalculation based on style
                const styleMap = {
                    industrial: 'standard',
                    minimalist: 'standard',
                    luxury: 'luxury',
                    biophilic: 'luxury',
                };
                useSurveyorStore.getState().setStyleModifier(styleMap[style] || 'standard');
            },
            toggleAntiAliasing: () => set(state => ({ antiAliasing: !state.antiAliasing })),
            toggleShadows: () => set(state => ({ shadows: !state.shadows })),
            startRender: () => set({ isRendering: true, renderProgress: 0 }),
            finishRender: (imageUrl) => set({ isRendering: false, renderProgress: 100, lastRender: imageUrl }),
        }),
        { name: 'RenderStore' }
    )
);


// ============================================================================
// AI Chat Store
// ============================================================================

export const useChatStore = create(
    devtools((set, get) => ({
        messages: [
            {
                id: 'welcome',
                role: 'assistant',
                content: "Hello! I am your Design & Build AI Architect. You can upload a sketch, ask for design improvements, or tell me to reposition 3D elements. How can I help you today?",
                timestamp: new Date().toISOString()
            }
        ],
        isTyping: false,

        sendMessage: async (content) => {
            const userMsg = {
                id: `msg-${Date.now()}`,
                role: 'user',
                content,
                timestamp: new Date().toISOString()
            };

            set(state => ({
                messages: [...state.messages, userMsg],
                isTyping: true
            }));

            // Simulate AI Processing & Logic Dispatch
            setTimeout(() => {
                const response = get().processCommand(content);
                const aiMsg = {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: response,
                    timestamp: new Date().toISOString()
                };
                set(state => ({
                    messages: [...state.messages, aiMsg],
                    isTyping: false
                }));
            }, 1000);
        },

        // Add a message directly without triggering AI response
        addMessage: (msg) => {
            set(state => ({
                messages: [...state.messages, {
                    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    role: msg.role || 'assistant',
                    content: msg.content,
                    image: msg.image || null,
                    timestamp: msg.timestamp || new Date().toISOString(),
                    ...msg // Spread to include extra props like canProcess, associatedFile, etc.
                }]
            }));
        },

        // Clear all messages
        clearMessages: () => {
            set({ messages: [] });
        },

        processCommand: (text) => {
            const cmd = text.toLowerCase();

            // 1. Positioning Commands
            if (cmd.includes('move') || cmd.includes('reposition') || cmd.includes('center')) {
                return "I've analyzed the spatial flow. Moving the selected furniture to optimize circulation paths. Does this alignment work for you?";
            }

            // 2. Improvement Commands
            if (cmd.includes('improve') || cmd.includes('upgrade') || cmd.includes('better')) {
                return "Applying Design & Build high-performance standards: I suggest upgrading the material to MA-201 Marble and increasing the natural light lux levels in the executive zone.";
            }

            // 3. Learning/Feedback
            if (cmd.includes('learn') || cmd.includes('feedback')) {
                return "Feedback received. My self-learning engine is updating with your preferences for future design suggestions.";
            }

            // 4. Default
            return "I'm on it. I'll utilize the Vision Lead and Nano Banana Pro engine to process your request for " + text + ".";
        }
    }))
);

// Helper Functions
function generateWalls(rooms, bounds) {
    const walls = [];
    const wallHeight = 3;
    const wallThickness = 0.15;

    walls.push(
        { id: 'wall-north', position: { x: bounds.width / 2, y: wallHeight / 2, z: 0 }, dimensions: { width: bounds.width, height: wallHeight, depth: wallThickness } },
        { id: 'wall-south', position: { x: bounds.width / 2, y: wallHeight / 2, z: bounds.height }, dimensions: { width: bounds.width, height: wallHeight, depth: wallThickness } },
        { id: 'wall-east', position: { x: bounds.width, y: wallHeight / 2, z: bounds.height / 2 }, dimensions: { width: wallThickness, height: wallHeight, depth: bounds.height } },
        { id: 'wall-west', position: { x: 0, y: wallHeight / 2, z: bounds.height / 2 }, dimensions: { width: wallThickness, height: wallHeight, depth: bounds.height } },
    );

    rooms.forEach((room) => {
        const b = room.bounds;
        if (b.x > 0) {
            walls.push({
                id: `wall-${room.id}-west`,
                position: { x: b.x, y: wallHeight / 2, z: b.y + b.height / 2 },
                dimensions: { width: wallThickness, height: wallHeight, depth: b.height },
            });
        }
        if (b.y > 0) {
            walls.push({
                id: `wall-${room.id}-north`,
                position: { x: b.x + b.width / 2, y: wallHeight / 2, z: b.y },
                dimensions: { width: b.width, height: wallHeight, depth: wallThickness },
            });
        }
    });

    return walls;
}
