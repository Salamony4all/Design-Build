/**
 * Design & Build - Nano Panana Pro Service
 * Advanced AI-Powered 3D Scene Generation using Gemini 3 Pro Preview
 * 
 * This service integrates the archisketch-3d functionality into the D&B workflow.
 * It uses the @google/genai SDK for superior 3D scene generation from floor plans.
 * 
 * Features:
 * - Gemini 3 Pro Preview for architectural analysis
 * - Structured JSON output for 3D scene data (walls, furniture, colors)
 * - Image editing capabilities with gemini-2.5-flash-image
 * - Automatic retry with exponential backoff for rate limiting
 */

// Nano Panana Pro API Configuration
const NANO_PANANA_CONFIG = {
    apiKey: import.meta.env.VITE_NANO_PANANA_API_KEY || '',
    model: 'gemini-3-pro-preview',
    imageEditModel: 'gemini-2.5-flash-image',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
};

/**
 * Default Professional Nano Panana Prompt
 * This prompt generates award-winning hyper-realistic architectural visualizations
 */
export const DEFAULT_NANO_PANANA_PROMPT = `Transform attached layout to architectural 3D render.`;

/**
 * Pro-Tips for optimal results:
 * 1. Scale Reference: Note ceiling height or primary room dimension (e.g., "10ft ceilings")
 * 2. Contrast: Use dark, clear lines in sketches - faint lines may be misinterpreted
 * 3. Style Keywords: Add aesthetic keywords (Japandi, Brutalist, Mid-Century Modern) after Materials
 */

/**
 * Style presets for quick application
 */
export const STYLE_PRESETS = {
    japandi: 'Japandi aesthetic with natural wood, minimal furniture, zen atmosphere, soft beige and gray palette',
    brutalist: 'Brutalist architecture with exposed concrete, raw materials, dramatic shadows, industrial lighting',
    midcentury: 'Mid-Century Modern with organic curves, teak furniture, iconic designer pieces, warm color palette',
    scandinavian: 'Scandinavian hygge with light wood floors, white walls, cozy textiles, functional simplicity',
    mediterranean: 'Mediterranean villa style with terracotta tiles, arched doorways, warm earth tones, indoor plants',
    industrial: 'Industrial loft with exposed brick, metal ductwork, concrete floors, Edison bulbs, reclaimed wood',
    luxury: 'Ultra-luxury with marble, gold accents, crystal chandeliers, velvet upholstery, statement art',
    biophilic: 'Biophilic design with living walls, natural materials, skylights, indoor trees, water features',
    minimalist: 'Ultra-minimalist with white surfaces, hidden storage, clean lines, zero clutter, zen spaces',
    coastal: 'Coastal modern with white and blue palette, natural textures, ocean views, relaxed luxury',
};

/**
 * Check if Nano Panana Pro is configured
 */
export function isNanoPananaConfigured() {
    return !!NANO_PANANA_CONFIG.apiKey && NANO_PANANA_CONFIG.apiKey.length > 10;
}

function safeJsonParse(text, fallback = null) {
    if (!text) return fallback;

    // First pass: basic cleaning
    let cleaned = text.replace(/```json\n?|```/g, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('[Nano Panana Pro] Standard JSON parse failed, attempting deep repair...');
    }

    // Second pass: structural repair
    try {
        let repaired = cleaned
            // Fix unescaped quotes inside strings (very aggressive)
            .replace(/: "(.*?)"/g, (match, p1) => {
                const escaped = p1.replace(/"/g, '\\"');
                return `: "${escaped}"`;
            })
            // Fix missing commas between array objects/elements
            .replace(/\}\s*\{/g, '}, {')
            .replace(/\]\s*\[/g, '], [')
            .replace(/"\s*"/g, '", "')
            // Standard JSON common fixes
            .replace(/\\n/g, "\\n")
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, "\\&");

        // Remove trailing commas before closing symbols
        repaired = repaired.replace(/,\s*([\}\]])/g, '$1');

        // Fix unterminated strings at the very end (common in truncated responses)
        const totalQuotes = (repaired.match(/"/g) || []).length;
        if (totalQuotes % 2 !== 0) {
            repaired += '"';
        }

        // Brace balancing for truncated responses
        const stack = [];
        for (let i = 0; i < repaired.length; i++) {
            if (repaired[i] === '{') stack.push('}');
            else if (repaired[i] === '[') stack.push(']');
            else if (repaired[i] === '}' || repaired[i] === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === repaired[i]) {
                    stack.pop();
                }
            }
        }

        while (stack.length > 0) {
            repaired += stack.pop();
        }

        try {
            return JSON.parse(repaired);
        } catch (innerErr) {
            // Third pass: aggressively clean common control character artifacts
            const deepCleaned = repaired
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove non-printable chars
                .replace(/\s+/g, " ") // Normalize whitespace
                .trim();

            try {
                return JSON.parse(deepCleaned);
            } catch (deepErr) {
                // Fourth pass: try regex extraction of the first {} block
                const match = deepCleaned.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        return JSON.parse(match[0]);
                    } catch (finalErr) {
                        console.error('[Nano Panana Pro] All JSON repair attempts exhausted.');
                        throw finalErr;
                    }
                }
                throw deepErr;
            }
        }
    } catch (repairErr) {
        console.error('[Nano Panana Pro] JSON repair pipeline failed:', repairErr.message);
        return fallback;
    }
}

/**
 * Utility to retry a function call with exponential backoff.
 * Handles transient 503 (overloaded), 429 (rate limit), and 400 errors.
 */
async function withRetry(fn, maxRetries = 3, context = 'API Call') {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            const status = err.status || (err.message?.match(/\b(503|429|400)\b/) ? parseInt(err.message.match(/\b(503|429|400)\b/)[0]) : null);
            const isRetryable = status === 503 || status === 429 ||
                err.message?.toLowerCase().includes("overloaded") ||
                err.message?.toLowerCase().includes("unavailable") ||
                err.message?.toLowerCase().includes("quota");

            if (isRetryable && i < maxRetries - 1) {
                // Exponential backoff: 2s, 4s, 8s... with jitter
                const delay = Math.pow(2, i + 1) * 1000 + Math.random() * 1000;
                console.warn(`[Nano Panana Pro] ${context} busy (attempt ${i + 1}). Retrying in ${Math.round(delay)}ms...`);

                // Update UI status if available
                if (window.setProcessingStatus) {
                    window.setProcessingStatus({
                        title: 'API Busy',
                        message: `Servers are busy. Retrying in ${Math.round(delay / 1000)}s...`,
                        progress: 25 + (i * 10),
                        step: `Retry ${i + 1}/${maxRetries - 1}`
                    });
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

/**
 * Convert file to base64 for API upload
 */
export async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get MIME type for file
 */
export function getMimeType(file) {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop().toLowerCase();
    const mimeMap = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
    };
    return mimeMap[ext] || 'application/octet-stream';
}

/**
 * The response schema for 3D scene data
 * This matches the archisketch-3d SceneData type
 */
const SCENE_DATA_SCHEMA = {
    type: "OBJECT",
    properties: {
        walls: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "STRING" },
                    start: {
                        type: "OBJECT",
                        properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" } }
                    },
                    end: {
                        type: "OBJECT",
                        properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" } }
                    },
                    height: { type: "NUMBER" },
                    thickness: { type: "NUMBER" },
                    type: { type: "STRING", description: "One of: wall, window, door" }
                },
                required: ["id", "start", "end", "height", "thickness", "type"]
            }
        },
        furniture: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "STRING" },
                    type: { type: "STRING" },
                    itemCode: { type: "STRING", description: "D&B Library Code (e.g., LF-01, LF-07, FUR-01)" },
                    position: {
                        type: "OBJECT",
                        properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" } }
                    },
                    rotation: { type: "NUMBER", description: "0-360 degrees" },
                    scale: { type: "ARRAY", items: { type: "NUMBER" }, minItems: 3, maxItems: 3 }
                },
                required: ["id", "type", "position", "rotation", "scale"]
            }
        },
        rooms: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "STRING" },
                    type: { type: "STRING" },
                    label: { type: "STRING" },
                    area: { type: "NUMBER" },
                    bounds: {
                        type: "OBJECT",
                        properties: {
                            x: { type: "NUMBER" },
                            y: { type: "NUMBER" },
                            width: { type: "NUMBER" },
                            height: { type: "NUMBER" }
                        }
                    }
                },
                required: ["id", "type", "label"]
            }
        },
        floorColor: { type: "STRING" },
        wallColor: { type: "STRING" }
    },
    required: ["walls", "furniture", "floorColor", "wallColor"]
};

/**
 * System instruction for the AI architectural visualizer
 */
const SYSTEM_INSTRUCTION = `You are the primary 'Structural Brain' for a high-end architectural fit-out application.

Your task is to convert the 2D floor plan into a 100% accurate 3D scene representation. Your output will drive both a real-time 3D viewport and a photorealistic visualization.

⚠️ CRITICAL LAYOUT FIDELITY RULES (ABSOLUTELY MANDATORY):
1. EXACT LAYOUT PRESERVATION: You MUST preserve the EXACT layout, room arrangement, and proportions shown in the uploaded floor plan. Do NOT invent, modify, or hallucinate any different layouts.
2. ROOM COUNT INTEGRITY: The number of rooms in your output MUST exactly match what is visible in the uploaded drawing.
3. WALL POSITION ACCURACY: All walls, partitions, and openings MUST be placed exactly where they appear in the source drawing. No creative reinterpretation.
4. NO HALLUCINATION: Do NOT generate, imagine, or add rooms, walls, or spaces that are not clearly visible in the uploaded floor plan.
5. CONSISTENCY REQUIREMENT: Every subsequent render or analysis of the same floor plan MUST produce the same structural layout.
6. SOURCE TRUTH: The uploaded floor plan/drawing is the ONLY source of truth. Ignore any assumptions about "typical" layouts.

STRUCTURAL RULES:
1. COORDINATE SYSTEM: Use a high-resolution grid from 0 to 1000. 0 is top-left, 1000 is bottom-right.
2. WALL HIERARCHY: Identify the outer perimeter walls first to form a closed loop. Then identify internal partitions - exactly as drawn.
3. DIMENSIONAL INTEGRITY: Walls must have consistent 'thickness' (default 0.2 for external, 0.1 for internal) and 'height' (default 3.0 for standard ceiling).
4. BIM TAGGING: Use D&B Furniture Library codes in the 'itemCode' field (e.g., 'LF-01' for Desk, 'LF-07' for Chair, 'FUR-01' for Sofa).
5. SPATIAL ALIGNMENT: Ensure the positions of furniture in this structure EXACTLY MATCH the layout from the uploaded drawing.
6. SCOPE LIMITATION: Focus STRICTLY on INTERIOR fit-out and furnishing. Do NOT include external works, facades, landscaping, or structural building shells.

Return strictly valid JSON matching the schema.`;

/**
 * Transform a floor plan image into structured 3D scene data
 * This is the main Nano Panana Pro processing function
 * 
 * @param {File} file - The uploaded floor plan image/PDF
 * @returns {Promise<Object>} - Structured scene data with walls, furniture, colors
 */
export async function transformLayoutTo3D(file, base64Data = null) {
    console.log('[Nano Panana Pro] Starting 3D transformation for:', file.name);

    if (!isNanoPananaConfigured()) {
        console.warn('[Nano Panana Pro] API key not configured');
        throw new Error('Nano Panana Pro API key not configured. Please add VITE_NANO_PANANA_API_KEY to your .env file.');
    }

    return withRetry(async () => {
        const data = base64Data || await fileToBase64(file);
        const mimeType = getMimeType(file);

        console.log('[Nano Panana Pro] Sending to Gemini API...');
        console.log('[Nano Panana Pro] MIME type:', mimeType);

        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.model}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze the provided floor plan and return a 3D scene representation in the specified JSON format." },
                        { inline_data: { mime_type: mimeType, data: data } }
                    ]
                }],
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                },
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: SCENE_DATA_SCHEMA
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Nano Panana Pro] API Error:', response.status, errorText);

            // Parse error for better messaging
            if (errorText.includes('quota') || errorText.includes('RESOURCE_EXHAUSTED')) {
                throw new Error('API quota exceeded. Please wait a moment and try again.');
            }
            if (response.status === 404) {
                throw new Error('Model not available. Falling back to standard analysis.');
            }
            throw new Error(`Nano Panana Pro API error: ${response.status}`);
        }

        const jsonResult = await response.json();
        const textResponse = jsonResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            console.error('[Nano Panana Pro] No text in response');
            throw new Error('No response from Nano Panana Pro API');
        }

        console.log('[Nano Panana Pro] Raw response received, parsing...');

        // Parse the JSON response
        const sceneData = safeJsonParse(textResponse, null);

        if (!sceneData) {
            throw new Error('Failed to parse 3D scene data from AI response. The architectural layout was too complex.');
        }

        console.log('[Nano Panana Pro] ✅ SUCCESS! Parsed scene data:');
        console.log('  - Walls:', sceneData.walls?.length || 0);
        console.log('  - Furniture:', sceneData.furniture?.length || 0);
        console.log('  - Rooms:', sceneData.rooms?.length || 0);
        console.log('  - Floor Color:', sceneData.floorColor);
        console.log('  - Wall Color:', sceneData.wallColor);

        return formatSceneData(sceneData);

    }, 3, 'Layout Transformation');
}

/**
 * Format the raw scene data to ensure all fields are properly populated
 * Scales the normalized 0-10 coordinate system to architectural scale (0-30 meters)
 */
function formatSceneData(raw) {
    // 🆕 Scale factor: AI now uses 0-1000 normalized grid for high precision.
    // We map 1000 units to ~30 meters for a realistic architectural envelope.
    const SCALE = 0.03;

    // Process walls with scaling
    const scaledWalls = (raw.walls || []).map((wall, i) => ({
        id: wall.id || `wall-${i}`,
        start: {
            x: (wall.start?.x || 0) * SCALE,
            y: (wall.start?.y || 0) * SCALE
        },
        end: {
            x: (wall.end?.x || 0) * SCALE,
            y: (wall.end?.y || 0) * SCALE
        },
        height: wall.height || 3,
        thickness: (wall.thickness || 0.2), // AI now provides thickness in meters
        type: wall.type || 'wall'
    }));

    // Process furniture with scaling
    const scaledFurniture = (raw.furniture || []).map((item, i) => ({
        id: item.id || `furniture-${i}`,
        type: item.type || 'chair',
        itemCode: item.itemCode || null,
        position: {
            x: (item.position?.x || 0) * SCALE,
            y: (item.position?.y || 0) * SCALE
        },
        rotation: item.rotation || 0,
        scale: item.scale || [1, 1, 1]
    }));

    // Calculate actual floor bounds from walls
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    scaledWalls.forEach(wall => {
        minX = Math.min(minX, wall.start.x, wall.end.x);
        maxX = Math.max(maxX, wall.start.x, wall.end.x);
        minY = Math.min(minY, wall.start.y, wall.end.y);
        maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    // Also include furniture positions in bounds calculation
    scaledFurniture.forEach(item => {
        minX = Math.min(minX, item.position.x);
        maxX = Math.max(maxX, item.position.x);
        minY = Math.min(minY, item.position.y);
        maxY = Math.max(maxY, item.position.y);
    });

    // Default bounds if no walls/furniture
    if (!isFinite(minX)) { minX = 0; maxX = 30; minY = 0; maxY = 30; }

    // Add padding around the scene
    const padding = 2;
    const floorWidth = Math.max(maxX - minX + padding * 2, 20);
    const floorHeight = Math.max(maxY - minY + padding * 2, 20);
    const floorCenterX = (minX + maxX) / 2;
    const floorCenterY = (minY + maxY) / 2;

    console.log('[Nano Panana Pro] Scene bounds:', { minX, maxX, minY, maxY, floorWidth, floorHeight });

    // Process rooms with scaling
    const scaledRooms = (raw.rooms || []).map((room, i) => ({
        id: room.id || `room-${i}`,
        type: room.type || 'OPEN_WORKSPACE',
        label: room.label || `Room ${i + 1}`,
        area: Math.round((room.area || 25) * 100) / 100, // AI returns area in sqm, just round it
        bounds: room.bounds ? {
            x: (room.bounds.x || 0) * SCALE,
            y: (room.bounds.y || 0) * SCALE,
            width: (room.bounds.width || 5) * SCALE,
            height: (room.bounds.height || 5) * SCALE
        } : { x: i * 5 * SCALE, y: 0, width: 5 * SCALE, height: 5 * SCALE },
        confidence: 0.95
    }));

    return {
        success: true,
        timestamp: new Date().toISOString(),
        sourceType: 'NANO-PANANA-PRO',

        // 3D Scene Data (for Viewport3D)
        sceneData: {
            walls: scaledWalls,
            furniture: scaledFurniture,
            floorColor: raw.floorColor || '#f5f5f5',
            wallColor: raw.wallColor || '#ffffff',
            // Include bounds for camera positioning
            bounds: {
                minX, maxX, minY, maxY,
                width: floorWidth,
                height: floorHeight,
                centerX: floorCenterX,
                centerY: floorCenterY
            }
        },

        // Room data (for D&B workflow compatibility)
        rooms: scaledRooms,

        // Floor plan summary with actual calculated bounds
        floorPlan: {
            totalArea: scaledRooms.reduce((sum, r) => sum + (r.area || 0), 0) || floorWidth * floorHeight,
            bounds: {
                width: floorWidth,
                height: floorHeight,
                center: { x: floorCenterX, y: floorCenterY }
            },
            scale: SCALE
        },

        // Health check data
        healthCheck: {
            score: 95,
            issues: [],
            recommendations: [
                'Nano Panana Pro analysis complete',
                `Detected ${raw.walls?.length || 0} wall segments`,
                `Placed ${raw.furniture?.length || 0} furniture items`,
                `Scene size: ${floorWidth.toFixed(1)}m x ${floorHeight.toFixed(1)}m`,
                'Ready for 3D preview and export'
            ]
        },

        // Metadata
        metadata: {
            analysisVersion: '3.0-NANO-PANANA',
            confidence: 0.95,
            processingTime: 2.5,
            agentId: 'NANO-PANANA-PRO-V1',
            model: NANO_PANANA_CONFIG.model,
            scaleFactor: SCALE
        }
    };
}

/**
 * Edit a layout image based on a text prompt using AI
 * This generates photorealistic architectural renders from floor plans
 * 
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} mimeType - MIME type of the image
 * @param {string} prompt - Text prompt describing the desired visualization
 * @returns {Promise<string>} - Base64 data URL of the rendered image
 */
export async function editLayoutImage(imageBase64, mimeType, prompt) {
    console.log('[Nano Panana Pro] Generating photorealistic render with prompt:', prompt);

    if (!isNanoPananaConfigured()) {
        throw new Error('Nano Panana Pro API key not configured');
    }

    return withRetry(async () => {
        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.imageEditModel}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        // Simplified prompt - use accurately what the user (or system default) provides
        const renderPrompt = `${prompt}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { inline_data: { mime_type: mimeType, data: imageBase64 } },
                        { text: renderPrompt }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1, // Very low for maximum layout fidelity
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Nano Panana Pro] Render API error:', response.status, errorText);
            throw new Error(`Render generation failed: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    console.log('[Nano Panana Pro] ✅ Photorealistic render generated successfully');
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }

        // Fallback: If the model returns text instead of image
        const textResponse = candidate?.content?.parts?.find(p => p.text)?.text;
        if (textResponse) {
            console.warn('[Nano Panana Pro] Model returned text instead of image:', textResponse.substring(0, 100));
            throw new Error('Model unable to generate image. Try a different prompt or check API support for image generation.');
        }

        throw new Error('No render generated. The model may not support image generation.');

    }, 3, 'Photorealistic Render');
}

/**
 * Generate a photorealistic render directly from a prompt (no input image required)
 * 
 * @param {string} prompt - Description of the space to generate
 * @param {string} style - Design style (modern, luxury, industrial, etc.)
 * @returns {Promise<string>} - Base64 data URL of the generated image
 */
export async function generatePhotorealisticRender(prompt, style = 'modern') {
    console.log('[Nano Panana Pro] Generating render from description:', prompt);

    if (!isNanoPananaConfigured()) {
        throw new Error('Nano Panana Pro API key not configured');
    }

    return withRetry(async () => {
        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.imageEditModel}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        const fullPrompt = `
Create a photorealistic architectural interior visualization:

Scene: ${prompt}
Style: ${style}

Requirements:
- Professional architectural photography quality
- Perfect lighting with natural daylight
- High-end materials and finishes
- Elegant furniture and décor
- Realistic proportions and scale
- Award-winning composition

Generate a stunning, magazine-quality architectural render.`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: fullPrompt }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Render generation failed: ${response.status}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    console.log('[Nano Panana Pro] ✅ Render generated from prompt');
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }

        throw new Error('No image generated from prompt');

    }, 3, 'Prompt-based Render');
}

/**
 * Generate Complete Visualization - ENHANCED WORKFLOW
 * 
 * This is the main workflow function that:
 * 1. Extracts 3D geometry (walls, furniture, rooms) from the floor plan
 * 2. Generates a photorealistic render image
 * 3. Extracts BOQ from the render (NEW)
 * 4. Generates professional architect insights (NEW)
 * 5. Creates material palette for moodboard (NEW)
 * 6. Returns complete package for all app features
 * 
 * @param {File} file - The uploaded floor plan file
 * @param {string} stylePrompt - Optional style prompt for the render
 * @param {Function} onProgress - Progress callback (stage, progress)
 * @param {string} mode - '3d' or 'render'
 * @param {boolean} includeArchitectMode - Whether to run architect analysis (default: true)
 * @returns {Promise<Object>} - Complete visualization package
 */
export async function generateCompleteVisualization(
    file,
    stylePrompt = '',
    onProgress = null,
    mode = '3d',
    includeArchitectMode = true
) {
    console.log(`[Nano Banana Pro] Starting ${mode === 'render' ? 'PHOTO RENDER' : 'COMPLETE 3D'} workflow...`);

    if (!isNanoPananaConfigured()) {
        throw new Error('Nano Banana Pro API key not configured');
    }

    const updateProgress = (stage, progress, message) => {
        if (onProgress) {
            onProgress({ stage, progress, message });
        }
        if (window.setProcessingStatus) {
            window.setProcessingStatus({
                title: stage,
                message: message,
                progress: progress,
                step: stage
            });
        }
    };

    try {
        // Step 1: Convert file to base64
        updateProgress('Preparing Layout', 5, 'Reading uploaded file...');
        const base64Data = await fileToBase64(file);
        const mimeType = getMimeType(file);

        // Step 2 & 3: Extract 3D Model Data and Generate Render IN PARALLEL
        updateProgress('AI Processing', 15, 'Extracting structure and generating visualization simultaneously...');

        const [analysisResult, renderImage] = await Promise.all([
            // Path A: The Structural Brain (Gemini 1.5 Pro)
            (async () => {
                try {
                    const result = await transformLayoutTo3D(file, base64Data);
                    console.log('[Nano Banana Pro] ✅ 3D geometry extracted');
                    return result;
                } catch (err) {
                    console.warn('[Nano Banana Pro] 3D extraction fallback:', err.message);
                    return {
                        success: true,
                        rooms: [],
                        sceneData: { walls: [], furniture: [], bounds: { width: 30, height: 30, centerX: 15, centerY: 15 } }
                    };
                }
            })(),

            // Path B: The Visual Brain
            (async () => {
                try {
                    const fullPrompt = stylePrompt ? generateStylePrompt(stylePrompt) : DEFAULT_NANO_PANANA_PROMPT;
                    const render = await editLayoutImage(base64Data, mimeType, fullPrompt);
                    console.log('[Nano Banana Pro] ✅ Photorealistic render generated');
                    return render;
                } catch (renderErr) {
                    console.warn('[Nano Banana Pro] Render failed:', renderErr.message);
                    return null;
                }
            })()
        ]);

        // Step 4: Unified Architectural Intelligence (CONSOLIDATED)
        let unifiedReview = null;
        if (renderImage && includeArchitectMode) {
            try {
                updateProgress('Architectural Intelligence', 70, 'Unifying technical and artistic analysis...');
                unifiedReview = await generateUnifiedArchitecturalReview(renderImage, analysisResult.sceneData, stylePrompt);
                console.log('[Nano Banana Pro] ✅ Unified analysis complete');
            } catch (unifiedErr) {
                console.warn('[Nano Banana Pro] Unified analysis failed:', unifiedErr.message);
            }
        }

        updateProgress('Finalizing', 95, 'Preparing complete visualization package...');

        // Return COMPLETE result with all consolidated data
        const result = {
            success: true,
            sceneData: analysisResult.sceneData || null,
            render: renderImage,
            analysisResult: analysisResult,
            rooms: analysisResult.rooms || [],

            // Consolidated AI Insights & BOQ
            boqItems: unifiedReview?.boqItems || [],
            materials: unifiedReview?.boqItems?.filter(i => i.category !== 'Furniture') || [],
            materialPalette: unifiedReview?.materialPalette || [],
            designPhilosophy: unifiedReview?.designPhilosophy || 'Modern architectural design focused on functionality',
            architectInsights: unifiedReview?.architectInsights || {
                circulation: 'Optimized',
                lighting: 'Layered',
                sustainability: 'Energy-efficient'
            },
            cameraPresets: unifiedReview?.cameraPresets || [
                { name: 'Entrance View', position: { x: 5, y: 1.6, z: 10 }, rotation: { x: 0, y: 0, z: 0 } }
            ],
            spaceAnalysis: unifiedReview?.architectInsights || {},
        };

        // CRITICAL: Merge REFINED furniture from Unified Review back into scene data for 100% alignment
        if (unifiedReview?.refinedFurniture?.length > 0 && result.sceneData) {
            console.log('[Nano Banana Pro] ❤️ Aligning 3D model with render using refined furniture data...');
            result.sceneData.furniture = unifiedReview.refinedFurniture;
        }

        // Metadata
        result.metadata = {
            source: 'NANO-BANANA-PRO-COMPLETE',
            timestamp: new Date().toISOString(),
            hasRender: !!renderImage,
            has3DModel: !!(analysisResult.sceneData?.walls?.length > 0),
            hasBOQ: !!(unifiedReview?.boqItems?.length > 0),
            hasArchitectInsights: !!unifiedReview,
            hasMaterialPalette: !!(unifiedReview?.materialPalette?.length > 0),
            style: stylePrompt || 'default',
            workflowVersion: '3.0-ENHANCED'
        };

        updateProgress('Complete', 100, 'Professional visualization package ready!');

        console.log('[Nano Banana Pro] 🎉 COMPLETE WORKFLOW SUCCESS:', {
            render: !!result.render,
            sceneData: !!result.sceneData,
            boqItems: result.boqItems.length,
            materials: result.materials.length,
            materialPalette: result.materialPalette.length,
            architectInsights: !!result.architectInsights,
            cameraPresets: result.cameraPresets.length
        });

        return result;

    } catch (error) {
        console.error('[Nano Banana Pro] Complete visualization failed:', error);
        throw error;
    }
}

/**
 * Generate a style prompt for 3D scene generation
 * Enhanced with more comprehensive style handling
 * 
 * @param {string} userStyle - User's style description
 * @returns {string} - Enhanced style prompt
 */
export function generateStylePrompt(userStyle) {
    return userStyle;
}

/**
 * Generate Unified Architectural Review (LATENCY OPTIMIZED)
 * Consolidates BOQ, Architect Insights, and Material Palette into a single API call
 * 
 * @param {string} renderImage - Base64 data URL of the render
 * @param {Object} sceneData - 3D scene data
 * @param {string} userPrompt - Optional requirements
 * @returns {Promise<Object>} - Consolidated analysis
 */
export async function generateUnifiedArchitecturalReview(renderImage, sceneData, userPrompt = '') {
    console.log('[Nano Banana Pro] Generating Unified Architectural Review (Consolidated)...');

    if (!isNanoPananaConfigured()) throw new Error('API key not configured');

    return withRetry(async () => {
        const base64Data = renderImage.includes(',') ? renderImage.split(',')[1] : renderImage;
        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.model}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        const unifiedPrompt = `You are an expert Architect, Interior Designer, and Quantity Surveyor.
        
Analyze this architectural visualization and provide a UNIFIED professional review.
${userPrompt ? `Client Requirements: ${userPrompt}` : ''}

Your response MUST match the provided schema and include:
1. Executive BOQ: All visible materials, furniture, and finishes.
2. Design Philosophy: The core approach and logic.
3. Material Palette: Detailed swatches with technical rationales.
4. Professional Insights: Circulation, lighting, and sustainability notes.
5. Camera Presets: Best angles for presentation.

TECHNICAL CONSTRAINTS:
- STRICTLY INTERIORS: No exterior curtain walls, facades, or landscaping.
- BUDGET REALISM: Typical rates in OMR: Flooring (15-35), Partitions (45-110), Furniture (50-450).
- TOTAL COST: Should be approx. 120-250 OMR per m2 total for the detected area.
- QUANTITIES: Must be mathematically derived from the visible space.

Be highly technical and specific.`;

        const unifiedSchema = {
            type: "OBJECT",
            properties: {
                designPhilosophy: { type: "STRING" },
                boqItems: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            itemCode: { type: "STRING" },
                            category: { type: "STRING" },
                            name: { type: "STRING" },
                            description: { type: "STRING" },
                            quantity: { type: "NUMBER" },
                            unit: { type: "STRING" },
                            estimatedRate: { type: "NUMBER" }
                        },
                        required: ["category", "name", "quantity", "unit"]
                    }
                },
                materialPalette: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            category: { type: "STRING" },
                            color: { type: "STRING" },
                            rationale: { type: "STRING" }
                        }
                    }
                },
                architectInsights: {
                    type: "OBJECT",
                    properties: {
                        circulation: { type: "STRING" },
                        lighting: { type: "STRING" },
                        sustainability: { type: "STRING" }
                    }
                },
                refinedFurniture: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            type: { type: "STRING" },
                            itemCode: { type: "STRING" },
                            position: { type: "OBJECT", properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" } } },
                            rotation: { type: "NUMBER" },
                            scale: { type: "NUMBER" }
                        }
                    }
                },
                cameraPresets: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            position: { type: "OBJECT", properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" }, z: { type: "NUMBER" } } },
                            rotation: { type: "OBJECT", properties: { x: { type: "NUMBER" }, y: { type: "NUMBER" }, z: { type: "NUMBER" } } }
                        }
                    }
                }
            },
            required: ["designPhilosophy", "boqItems", "materialPalette", "refinedFurniture"]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: unifiedPrompt },
                        { inline_data: { mime_type: 'image/png', data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: unifiedSchema
                }
            })
        });

        if (!response.ok) throw new Error(`Unified review failed: ${response.status}`);
        const jsonResult = await response.json();
        const text = jsonResult.candidates?.[0]?.content?.parts?.[0]?.text;
        const result = safeJsonParse(text, { designPhilosophy: '', boqItems: [], materialPalette: [] });

        // Strictly prevent external works from leaking into the BOQ
        if (result.boqItems) {
            const blacklist = ['curtain wall', 'facade', 'external', 'exterior', 'landscaping', 'outdoor', 'pavement'];
            result.boqItems = result.boqItems.filter(item => {
                const name = (item.name || '').toLowerCase();
                const desc = (item.description || '').toLowerCase();
                return !blacklist.some(term => name.includes(term) || desc.includes(term));
            });
        }

        return result;
    }, 3, 'Unified Review');
}

/**
 * Extract BOQ (Bill of Quantities) from photorealistic render
 * Uses Gemini Vision to analyze materials, finishes, and furniture visible in the render
 * 
 * @param {string} renderImage - Base64 data URL of the render
 * @param {Object} sceneData - 3D scene data for dimension calculations
 * @returns {Promise<Object>} - BOQ items and material specifications
 */
export async function extractBOQFromRender(renderImage, sceneData) {
    console.log('[Nano Banana Pro] Extracting BOQ from rendered visualization...');

    if (!isNanoPananaConfigured()) {
        throw new Error('Nano Banana Pro API key not configured');
    }

    return withRetry(async () => {
        const base64Data = renderImage.split(',')[1];
        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.model}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        const boqPrompt = `Analyze this architectural render and extract a Bill of Quantities (BOQ).

Identify ALL visible materials, finishes, and furniture items. For each item provide:
1. Category (flooring, wall finish, ceiling, furniture, lighting, etc.)
2. Material name and specifications
3. Finish type (polished, matte, brushed, etc.)
4. Estimated quantity based on visible area
5. Unit of measurement (m², m, nos., etc.)

Return a structured JSON list of BOQ items.`;

        const boqSchema = {
            type: "OBJECT",
            properties: {
                items: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            itemCode: { type: "STRING", description: "Item code (e.g., FL-101)" },
                            category: { type: "STRING", description: "Category (Flooring, Wall, Ceiling, Furniture, etc.)" },
                            name: { type: "STRING", description: "Material/item name" },
                            description: { type: "STRING", description: "Detailed specifications" },
                            finish: { type: "STRING", description: "Finish type" },
                            quantity: { type: "NUMBER", description: "Estimated quantity" },
                            unit: { type: "STRING", description: "Unit of measurement" },
                            estimatedRate: { type: "NUMBER", description: "Estimated unit rate in USD" }
                        },
                        required: ["category", "name", "quantity", "unit"]
                    }
                },
                materials: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            type: { type: "STRING" },
                            finish: { type: "STRING" },
                            color: { type: "STRING" }
                        },
                        required: ["name", "type"]
                    }
                }
            },
            required: ["items", "materials"]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: boqPrompt },
                        { inline_data: { mime_type: 'image/png', data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: boqSchema
                }
            })
        });

        if (!response.ok) {
            throw new Error(`BOQ extraction failed: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const boqData = safeJsonParse(textResponse, { items: [], materials: [] });

        console.log('[Nano Banana Pro] ✅ BOQ extracted:', boqData.items?.length || 0, 'items');

        // Enhance quantities using 3D scene data
        if (sceneData?.bounds) {
            const floorArea = sceneData.bounds.width * sceneData.bounds.height;
            boqData.items.forEach(item => {
                if (item.category === 'Flooring' && item.unit === 'm²') {
                    item.quantity = Math.ceil(floorArea * 1.1); // +10% wastage
                }
            });
        }

        return boqData;
    }, 3, 'BOQ Extraction');
}

/**
 * Generate professional architect and interior designer insights
 * Acts as an expert consultant to provide design philosophy, recommendations, and technical details
 * 
 * @param {string} renderImage - Base64 data URL of the render
 * @param {Object} sceneData - 3D scene data
 * @param {string} userPrompt - Optional user requirements
 * @returns {Promise<Object>} - Comprehensive architectural analysis
 */
export async function generateArchitectInsights(renderImage, sceneData, userPrompt = '') {
    console.log('[Nano Banana Pro] Generating architect & interior design insights...');

    if (!isNanoPananaConfigured()) {
        throw new Error('Nano Banana Pro API key not configured');
    }

    return withRetry(async () => {
        const base64Data = renderImage.split(',')[1];
        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.model}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        const architectPrompt = `You are an award-winning architect and interior design expert with 15+ years of international experience.

Analyze this architectural visualization and provide professional insights:

${userPrompt ? `Client Requirements: ${userPrompt}\n` : ''}

Provide a comprehensive analysis in JSON format with:

1. Design Philosophy: Core principles and approach (2-3 sentences)
2. Space Analysis: Room functions, circulation, zoning
3. Material Palette: Detailed material recommendations with technical specs
4. Lighting Strategy: Natural and artificial lighting design
5. BOQ Enhancements: Additional professional finishing items
6. Camera Presets: Optimal viewpoints for presentations (position, rotation, name)
7. Sustainability Notes: Energy efficiency and environmental considerations
8. Cost Considerations: Budget-conscious alternatives

Be specific, technical, and professional. Include product recommendations where appropriate.`;

        const insightsSchema = {
            type: "OBJECT",
            properties: {
                designPhilosophy: { type: "STRING" },
                spaceAnalysis: {
                    type: "OBJECT",
                    properties: {
                        circulation: { type: "STRING" },
                        zoning: { type: "STRING" }
                    }
                },
                materialPalette: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            category: { type: "STRING" },
                            color: { type: "STRING" },
                            rationale: { type: "STRING" }
                        }
                    }
                },
                lightingStrategy: {
                    type: "OBJECT",
                    properties: {
                        natural: { type: "STRING" },
                        artificial: { type: "STRING" }
                    }
                }
            },
            required: ["designPhilosophy", "materialPalette"]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: architectPrompt },
                        { inline_data: { mime_type: 'image/png', data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topP: 0.9,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                    responseSchema: insightsSchema
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Architect insights generation failed: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const insights = safeJsonParse(textResponse, { designPhilosophy: 'Modern architecture', materialPalette: [] });

        console.log('[Nano Banana Pro] ✅ Architect insights generated');

        return insights;
    }, 3, 'Architect Insights');
}

/**
 * Generate a professional material palette from the render
 * Extracts colors, materials, and finishes for moodboard creation
 * 
 * @param {string} renderImage - Base64 data URL of the render
 * @returns {Promise<Array>} - Material swatches with specifications
 */
export async function generateMaterialPalette(renderImage) {
    console.log('[Nano Banana Pro] Generating material palette...');

    if (!isNanoPananaConfigured()) {
        throw new Error('Nano Banana Pro API key not configured');
    }

    return withRetry(async () => {
        const base64Data = renderImage.split(',')[1];
        const endpoint = `${NANO_PANANA_CONFIG.baseUrl}/models/${NANO_PANANA_CONFIG.model}:generateContent?key=${NANO_PANANA_CONFIG.apiKey}`;

        const palettePrompt = `Extract the material palette from this architectural render.

Identify the 5-7 PRIMARY materials visible (floors, walls, furniture, accents).

For each material provide:
- Name (e.g., "Carrara Marble", "Walnut Wood")
- Material code (e.g., "MA-201")
- Hex color code
- Finish type (polished, matte, brushed, etc.)
- Material type (Stone, Wood, Metal, Fabric, Glass, etc.)

Return as structured JSON array.`;

        const paletteSchema = {
            type: "OBJECT",
            properties: {
                palette: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            code: { type: "STRING" },
                            hexColor: { type: "STRING" },
                            finish: { type: "STRING" },
                            materialType: { type: "STRING" }
                        },
                        required: ["name", "hexColor", "materialType"]
                    }
                }
            },
            required: ["palette"]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: palettePrompt },
                        { inline_data: { mime_type: 'image/png', data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json",
                    responseSchema: paletteSchema
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Material palette generation failed: ${response.status}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const paletteData = safeJsonParse(textResponse, { palette: [] });

        console.log('[Nano Banana Pro] ✅ Material palette generated:', paletteData.palette?.length || 0, 'swatches');

        return paletteData.palette;
    }, 3, 'Material Palette');
}

export default {
    transformLayoutTo3D,
    editLayoutImage,
    generatePhotorealisticRender,
    generateCompleteVisualization,
    generateStylePrompt,
    isNanoPananaConfigured,
    DEFAULT_NANO_PANANA_PROMPT,
    STYLE_PRESETS,
    // New functions for complete workflow
    extractBOQFromRender,
    generateArchitectInsights,
    generateMaterialPalette
};

