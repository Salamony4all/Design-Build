/**
 * Design & Build - API Configuration
 * Centralized configuration for all external API services
 */

// Gemini API Configuration
export const GEMINI_CONFIG = {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
    visionModel: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: 8192,
};

// Check if API key is configured
export function isGeminiConfigured() {
    return !!GEMINI_CONFIG.apiKey && GEMINI_CONFIG.apiKey !== 'your_gemini_api_key_here';
}

// Get API endpoint
export function getGeminiEndpoint(model = GEMINI_CONFIG.visionModel) {
    return `${GEMINI_CONFIG.baseUrl}/models/${model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;
}

// Room type definitions for AI analysis
export const ROOM_TYPES = {
    EXECUTIVE_OFFICE: {
        keywords: ['executive', 'director', 'ceo', 'manager office', 'private office'],
        minArea: 15,
        maxArea: 50,
        defaultFurniture: ['LF02', 'LF08', 'LF10'],
    },
    MANAGER_OFFICE: {
        keywords: ['manager', 'supervisor', 'team lead'],
        minArea: 12,
        maxArea: 25,
        defaultFurniture: ['LF02', 'LF07', 'LF10'],
    },
    MEETING_ROOM: {
        keywords: ['meeting', 'conference', 'boardroom', 'discussion'],
        minArea: 15,
        maxArea: 100,
        defaultFurniture: ['LF20', 'LF19'],
    },
    OPEN_WORKSPACE: {
        keywords: ['open', 'workspace', 'workstation', 'cubicle', 'office area', 'work area'],
        minArea: 50,
        maxArea: 500,
        defaultFurniture: ['LF01', 'LF07'],
        workstationsPerSqm: 0.12,
    },
    RECEPTION: {
        keywords: ['reception', 'lobby', 'entrance', 'waiting'],
        minArea: 20,
        maxArea: 80,
        defaultFurniture: ['LF03', 'LF09'],
    },
    CAFE_PANTRY: {
        keywords: ['pantry', 'kitchen', 'cafe', 'break room', 'tea point'],
        minArea: 10,
        maxArea: 40,
        defaultFurniture: ['EQ01', 'EQ02'],
    },
    SERVER_ROOM: {
        keywords: ['server', 'data', 'it room', 'comms'],
        minArea: 8,
        maxArea: 30,
        defaultFurniture: ['EQ03'],
    },
    STORAGE: {
        keywords: ['storage', 'store', 'archive'],
        minArea: 5,
        maxArea: 30,
        defaultFurniture: ['LF17', 'LF18'],
    },
    RESTROOM: {
        keywords: ['toilet', 'restroom', 'wc', 'bathroom', 'washroom'],
        minArea: 5,
        maxArea: 30,
        defaultFurniture: [],
    },
    CORRIDOR: {
        keywords: ['corridor', 'hallway', 'passage'],
        minArea: 5,
        maxArea: 100,
        defaultFurniture: [],
    },
};

// Furniture library with rates (OMR)
export const FURNITURE_LIBRARY = {
    LF01: { name: 'Task Desk 1200x600', rate: 45.000, category: 'Desks' },
    LF02: { name: 'L-Shaped Executive Desk', rate: 190.000, category: 'Desks' },
    LF03: { name: 'Reception Counter', rate: 350.000, category: 'Reception' },
    LF07: { name: 'Task Chair Mesh', rate: 85.000, category: 'Seating' },
    LF08: { name: 'Executive Chair Leather', rate: 250.000, category: 'Seating' },
    LF09: { name: 'Visitor Sofa 3-Seater', rate: 450.000, category: 'Seating' },
    LF10: { name: 'Guest Chair', rate: 65.000, category: 'Seating' },
    LF17: { name: 'Storage Cabinet Low', rate: 120.000, category: 'Storage' },
    LF18: { name: 'Storage Cabinet High', rate: 180.000, category: 'Storage' },
    LF19: { name: 'Conference Chair', rate: 95.000, category: 'Seating' },
    LF20: { name: 'Conference Table 12-Seater', rate: 2800.000, category: 'Tables' },
    EQ01: { name: 'Coffee Machine', rate: 450.000, category: 'Equipment' },
    EQ02: { name: 'Refrigerator', rate: 280.000, category: 'Equipment' },
    EQ03: { name: 'Server Rack', rate: 650.000, category: 'Equipment' },
};

// Material library with rates (OMR per m²)
export const MATERIAL_LIBRARY = {
    'CA-101': { name: 'Carpet Tiles Premium', rate: 28.000, uom: 'm²' },
    'CA-102': { name: 'Carpet Tiles Standard', rate: 18.000, uom: 'm²' },
    'MA-201': { name: 'Marble Flooring', rate: 26.000, uom: 'm²' },
    'WD-101': { name: 'Wood Veneer Paneling', rate: 65.000, uom: 'm²' },
    'WD-102': { name: 'Laminate Flooring', rate: 22.000, uom: 'm²' },
    'PT-101': { name: 'Premium Paint', rate: 8.500, uom: 'm²' },
    'GL-101': { name: 'Glass Partition', rate: 120.000, uom: 'm²' },
    'AP-101': { name: 'Acoustic Panels', rate: 45.000, uom: 'm²' },
    'GY-101': { name: 'Gypsum Ceiling', rate: 35.000, uom: 'm²' },
};

export default {
    GEMINI_CONFIG,
    isGeminiConfigured,
    getGeminiEndpoint,
    ROOM_TYPES,
    FURNITURE_LIBRARY,
    MATERIAL_LIBRARY,
};
