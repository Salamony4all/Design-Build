/**
 * Design & Build - DXF/CAD Web Worker
 * Offloads heavy CAD parsing and geometry extraction from the main thread
 * prevents UI freeze on large files.
 */

import DxfParser from 'dxf-parser';

// Internal constants (copied from config/api.js to keep worker self-contained)
const ROOM_TYPES = {
    EXECUTIVE_OFFICE: { keywords: ['executive', 'director', 'ceo', 'manager office', 'private office'] },
    MANAGER_OFFICE: { keywords: ['manager', 'supervisor', 'team lead'] },
    MEETING_ROOM: { keywords: ['meeting', 'conference', 'boardroom', 'discussion'] },
    OPEN_WORKSPACE: { keywords: ['open', 'workspace', 'workstation', 'cubicle', 'office area', 'work area'] },
    RECEPTION: { keywords: ['reception', 'lobby', 'entrance', 'waiting'] },
    CAFE_PANTRY: { keywords: ['pantry', 'kitchen', 'cafe', 'break room', 'tea point'] },
    SERVER_ROOM: { keywords: ['server', 'data', 'it room', 'comms'] },
    STORAGE: { keywords: ['storage', 'store', 'archive'] },
    RESTROOM: { keywords: ['toilet', 'restroom', 'wc', 'bathroom', 'washroom'] },
    CORRIDOR: { keywords: ['corridor', 'hallway', 'passage'] },
};

self.onmessage = async (e) => {
    const { text, fileName } = e.data;

    try {
        console.log('[DXF Worker] Processing:', fileName);
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        if (!dxf) {
            throw new Error('Failed to parse DXF file');
        }

        const result = extractGeometryOptimized(dxf, fileName);
        self.postMessage({ success: true, result });

    } catch (error) {
        console.error('[DXF Worker] Error:', error);
        self.postMessage({ success: false, error: error.message });
    }
};

/**
 * Optimized Geometry Extraction - SINGLE PASS
 */
function extractGeometryOptimized(dxf, fileName) {
    const entities = dxf.entities || [];
    const header = dxf.header || {};
    const blocks = dxf.blocks || {};

    // 1. Initial pass to find actual geometry bounds (robust normalization)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasGeometry = false;

    entities.forEach(entity => {
        if (entity.type === 'LINE') {
            const x1 = entity.vertices?.[0]?.x || entity.x || 0;
            const y1 = entity.vertices?.[0]?.y || entity.y || 0;
            const x2 = entity.vertices?.[1]?.x || entity.x2 || 0;
            const y2 = entity.vertices?.[1]?.y || entity.y2 || 0;
            minX = Math.min(minX, x1, x2); maxX = Math.max(maxX, x1, x2);
            minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2);
            hasGeometry = true;
        } else if (entity.vertices && entity.vertices.length > 0) {
            entity.vertices.forEach(v => {
                minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
                minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
            });
            hasGeometry = true;
        } else if (entity.x !== undefined && entity.y !== undefined) {
            minX = Math.min(minX, entity.x); maxX = Math.max(maxX, entity.x);
            minY = Math.min(minY, entity.y); maxY = Math.max(maxY, entity.y);
            hasGeometry = true;
        }
    });

    // Fallback to header if no geometry found or bounds are invalid
    if (!hasGeometry || minX === Infinity) {
        const headerMin = header.$EXTMIN || { x: 0, y: 0 };
        const headerMax = header.$EXTMAX || { x: 50, y: 40 };
        minX = headerMin.x; minY = headerMin.y;
        maxX = headerMax.x; maxY = headerMax.y;
    }

    // Unit detection - Enhanced heuristic
    const insUnits = header.$INSUNITS;
    let scale = 1;
    let units = 'Unknown';

    // Geometric extent analysis
    const rawWidth = Math.abs(maxX - minX);
    const rawHeight = Math.abs(maxY - minY);
    const maxDim = Math.max(rawWidth, rawHeight);

    switch (insUnits) {
        case 1: units = 'Inches'; scale = 0.0254; break;
        case 2: units = 'Feet'; scale = 0.3048; break;
        case 4: units = 'Millimeters'; scale = 0.001; break;
        case 5: units = 'Centimeters'; scale = 0.01; break;
        case 6: units = 'Meters'; scale = 1; break;
        default:
            // Heuristic for architectural interiors
            // If dim > 2000, it's very likely MM or CM. MM is most common for detailed fitouts.
            if (maxDim > 5000) { scale = 0.001; units = 'Millimeters (auto)'; }
            else if (maxDim > 500) { scale = 0.01; units = 'Centimeters (auto-guess)'; }
            else { scale = 1; units = 'Meters (auto)'; }
    }

    // Offset logic - Determine project origin by looking at the geometry cluster
    let anchorX = minX;
    let anchorY = minY;

    const polylineEntities = entities.filter(e => e.type === 'LWPOLYLINE' || e.type === 'POLYLINE');
    if (polylineEntities.length > 5) {
        // Use 10th percentile to avoid stray entities at (0,0) or (1e6, 1e6)
        const xs = polylineEntities.map(p => p.vertices?.[0]?.x || p.x || 0).sort((a, b) => a - b);
        const ys = polylineEntities.map(p => p.vertices?.[0]?.y || p.y || 0).sort((a, b) => a - b);
        anchorX = xs[Math.floor(xs.length * 0.1)];
        anchorY = ys[Math.floor(ys.length * 0.1)];
    }

    const offsetX = anchorX;
    const offsetY = anchorY;

    const bounds = {
        width: rawWidth * scale,
        height: rawHeight * scale,
        contentMin: { x: (minX - offsetX) * scale, y: (minY - offsetY) * scale },
        contentMax: { x: (maxX - offsetX) * scale, y: (maxY - offsetY) * scale },
        center: {
            x: ((minX + maxX) / 2 - offsetX) * scale,
            y: ((minY + maxY) / 2 - offsetY) * scale
        }
    };

    const walls = [];
    const rooms = [];
    const blockInserts = [];
    const mepHotspots = [];

    const mepPatterns = {
        ELECTRICAL: ['elec', 'power', 'light', 'socket', 'e-', 'switch', 'panel'],
        HVAC: ['hvac', 'ac', 'duct', 'diffuser', 'fcu', 'ahu', 'm-', 'supply', 'return'],
        PLUMBING: ['plumb', 'water', 'drain', 'pipe', 'sanitary', 'p-', 'toilet', 'sink', 'basin'],
        FIRE_SAFETY: ['fire', 'sprinkler', 'smoke', 'alarm', 'extinguisher'],
    };

    const wallLayerPatterns = ['wall', 'partition', 'a-wall', 'arch-wall', 'boundaries', 'border', 'ext-wall', 'int-wall'];

    // Simplified recursion for block exploration
    const processEntities = (entityList, blockOffset = { x: 0, y: 0 }, blockScale = 1, blockRotation = 0) => {
        entityList.forEach((entity, index) => {
            const layer = (entity.layer || '').toLowerCase();
            const idPrefix = `${blockOffset.x}-${blockOffset.y}-${index}`;

            // 1. Recursive Blocks
            if (entity.type === 'INSERT') {
                const blockName = entity.name;
                const block = blocks[blockName];
                if (block && block.entities) {
                    const insertX = (entity.position?.x ?? 0);
                    const insertY = (entity.position?.y ?? 0);
                    const scaleFactor = entity.scale?.x ?? 1;
                    const rotation = entity.rotation ?? 0;

                    // Add to hotspots for furniture mapping
                    const x = (insertX - offsetX) * scale;
                    const y = (insertY - offsetY) * scale;
                    blockInserts.push({
                        id: `block-${idPrefix}`,
                        blockName: blockName || '',
                        code: identifyFurnitureFromBlock(blockName || ''),
                        position: { x, y: 0, z: y },
                        rotation: rotation,
                        layer: entity.layer,
                    });

                    // Recurse into block geometry
                    processEntities(block.entities, { x: insertX, y: insertY }, scaleFactor, rotation);
                }
                return;
            }

            // Apply offsets and local scale/rotation if inside a block
            // (Simplified: just handling basic position for now)
            const getPos = (v) => {
                const rawX = v.x ?? 0;
                const rawY = v.y ?? 0;
                // Basic translation (rotation/scale inside blocks not fully implemented for performance)
                return {
                    x: (rawX + blockOffset.x - offsetX) * scale,
                    y: (rawY + blockOffset.y - offsetY) * scale
                };
            };

            // 2. MEP Detection
            for (const [type, patterns] of Object.entries(mepPatterns)) {
                if (patterns.some(p => layer.includes(p))) {
                    const p = getPos(entity.position || entity || (entity.vertices?.[0]));
                    mepHotspots.push({
                        id: `mep-${idPrefix}`,
                        type,
                        location: { x: p.x, y: 0, z: p.y },
                        layer: entity.layer
                    });
                    break;
                }
            }

            // 3. Walls and Rooms
            if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
                if (!entity.vertices || entity.vertices.length < 2) return;

                const vertices = entity.vertices.map(v => getPos(v));
                const isClosed = entity.shape ||
                    (Math.abs(vertices[0].x - vertices[vertices.length - 1].x) < 0.1 &&
                        Math.abs(vertices[0].y - vertices[vertices.length - 1].y) < 0.1);

                const area = calculatePolygonArea(vertices);

                if (isClosed && area > 4 && area < 2000) {
                    const xs = vertices.map(v => v.x);
                    const ys = vertices.map(v => v.y);
                    const minX = Math.min(...xs), maxX = Math.max(...xs);
                    const minY = Math.min(...ys), maxY = Math.max(...ys);

                    rooms.push({
                        id: `room-${idPrefix}`,
                        type: determineRoomType(area, layer),
                        area: Math.round(area * 100) / 100,
                        bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
                        vertices: vertices,
                        layer: entity.layer,
                        confidence: 0.9,
                        source: 'DXF-POLYLINE',
                    });
                } else if (wallLayerPatterns.some(p => layer.includes(p)) || layer === '0') {
                    for (let i = 0; i < vertices.length - 1; i++) {
                        walls.push(createWallObject(vertices[i].x, vertices[i].y, vertices[i + 1].x, vertices[i + 1].y, `${idPrefix}-${i}`, entity.layer));
                    }
                }
            } else if (entity.type === 'LINE') {
                if (wallLayerPatterns.some(p => layer.includes(p)) || layer === '0') {
                    const p1 = getPos(entity.vertices?.[0] ?? { x: entity.x, y: entity.y });
                    const p2 = getPos(entity.vertices?.[1] ?? { x: entity.x2, y: entity.y2 });
                    walls.push(createWallObject(p1.x, p1.y, p2.x, p2.y, `${idPrefix}-L`, entity.layer));
                }
            }
        });
    };

    processEntities(entities);

    // Filter out null walls
    const cleanWalls = walls.filter(w => w !== null);

    // Post-processing
    rooms.sort((a, b) => b.area - a.area);
    const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);

    return {
        success: true,
        sourceType: 'DXF',
        cadMetadata: { fileName, units, scale, entities: entities.length, walls: cleanWalls.length },
        floorPlan: { totalArea: totalArea || bounds.width * bounds.height, bounds, scale: 1 },
        rooms: rooms.slice(0, 500),
        walls: cleanWalls.slice(0, 5000),
        blockInserts,
        mepHotspots,
        healthCheck: {
            score: calculateHealthScore(rooms, cleanWalls, blockInserts),
            issues: generateIssues(rooms, cleanWalls),
            recommendations: ['Recursive Block Analysis Enabled', `Found ${cleanWalls.length} wall segments`],
        },
        metadata: {
            analysisVersion: 'DXF-ENGINE-V5-BLOCK-SUPPORT',
            confidence: 0.98,
            agentId: 'dxf-worker-expert',
        },
    };
}

function createWallObject(startX, startY, endX, endY, id, layer) {
    const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    if (length < 0.05) return null;

    // Rotation angle in radians
    const angle = -Math.atan2(endY - startY, endX - startX); // Negative Y for 2D->3D coord flip if needed, but Three.js coordinate system standard is Z up or Y up.
    // In our app, Y is UP in 3D, X/Z is the plane.

    return {
        id: `wall-${id}`,
        position: { x: (startX + endX) / 2, y: 1.5, z: (startY + endY) / 2 },
        dimensions: {
            width: length,
            height: 3,
            depth: 0.15,
        },
        rotation: angle,
        layer,
    };
}

function calculatePolygonArea(vertices) {
    let area = 0, n = vertices.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area / 2);
}

function determineRoomType(area, layer) {
    const layerLower = (layer || '').toLowerCase();
    for (const [type, config] of Object.entries(ROOM_TYPES)) {
        if (config.keywords.some(kw => layerLower.includes(kw.toLowerCase()))) return type;
    }
    if (area > 100) return 'OPEN_WORKSPACE';
    if (area > 40) return 'MEETING_ROOM';
    if (area > 20) return 'EXECUTIVE_OFFICE';
    return 'CORRIDOR';
}

function identifyFurnitureFromBlock(blockName) {
    const name = blockName.toLowerCase();
    if (name.includes('desk') && name.includes('exec')) return 'LF02';
    if (name.includes('desk')) return 'LF01';
    if (name.includes('chair')) return 'LF07';
    if (name.includes('table')) return 'LF20';
    if (name.includes('sofa')) return 'LF09';
    return null;
}

function calculateHealthScore(rooms, walls, blocks) {
    let score = 70;
    if (rooms.length > 0) score += 10;
    if (walls.length > 0) score += 10;
    if (blocks.length > 0) score += 10;
    return Math.min(100, score);
}

function generateIssues(rooms, walls) {
    const issues = [];
    if (rooms.length === 0) issues.push({ severity: 'warning', message: 'No closed spaces found' });
    if (walls.length === 0) issues.push({ severity: 'info', message: 'No wall entities found' });
    return issues;
}
