/**
 * Design & Build - Export Service
 * Archivist Agent: Golden Suite Package Generation
 * PPTX, Excel BOQ, Mood Board, Technical PDF, Render Gallery
 */

import PptxGenJS from 'pptxgenjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useBOQStore, useProjectStore, useSurveyorStore, useUIStore } from '../store';

// ============================================================================
// Brand Colors & Styling
// ============================================================================

const BRAND_COLORS = {
    primary: '06B6D4',      // Cyan
    secondary: '3B82F6',    // Blue
    accent: '8B5CF6',       // Purple
    success: '10B981',      // Emerald
    warning: 'F59E0B',      // Amber
    dark: '0F172A',         // Slate 900
    darker: '020617',       // Slate 950
    light: 'F8FAFC',        // Slate 50
    text: 'E2E8F0',         // Slate 200
    muted: '64748B',        // Slate 500
};

const FONTS = {
    primary: 'Inter',
    mono: 'JetBrains Mono',
};

// ============================================================================
// Sanitization Helper
// ============================================================================

/**
 * Aggressive Sanitization for PPTX/XML compatibility
 * Removes ALL illegal XML characters and control characters
 * Also handles null/undefined
 */
const sanitize = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // 1. Remove control characters (0-31) except whitespace (9, 10, 13)
    // 2. Remove other common XML-unfriendly characters if needed
    // 3. Keep standard printable ASCII + common Latin-1
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g, '')
        .replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;') // Fix raw ampersands
        .trim();
};

// ============================================================================
// Generate Complete 10-Slide PPTX
// ============================================================================

export async function generateCompletePPTX() {
    const project = useBOQStore.getState().project;
    const nanoBananaData = useProjectStore.getState().nanoBananaData || {
        designPhilosophy: '',
        materialPalette: [],
        architectInsights: {},
        boqItems: [],
        cameraPresets: []
    };
    const selectedItems = useBOQStore.getState().selectedItems.length > 0
        ? useBOQStore.getState().selectedItems
        : (nanoBananaData.boqItems || []);
    const detectedRooms = useProjectStore.getState().rooms3D.length > 0
        ? useProjectStore.getState().rooms3D
        : (useProjectStore.getState().detectedRooms || []);
    const healthCheck = useProjectStore.getState().healthCheck;
    const activeStyle = 'minimalist'; // Default style
    const surveyor = useSurveyorStore.getState();
    const nanoPananaRenders = useProjectStore.getState().nanoPananaRenders || [];
    const sketchPreviewUrl = useProjectStore.getState().sketchPreviewUrl;

    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = 'Design & Build';
    pptx.company = sanitize(project.client || 'Design & Build');
    pptx.title = sanitize(project.name || 'Design Proposal');
    pptx.subject = 'Architectural Design Presentation';

    // Helper: Add static branding to a slide (Replaces Master Slides for better compatibility)
    const applyBranding = (slide) => {
        slide.background = { color: BRAND_COLORS.dark };

        // Footer bar
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 6.8, w: '100%', h: 0.7, fill: { color: BRAND_COLORS.darker } });

        // Footer text
        slide.addText(`${sanitize(project.client)} | Design & Build`, {
            x: 0.5, y: 6.95, w: 5, h: 0.3, fontSize: 8, color: BRAND_COLORS.muted, fontFace: FONTS.primary
        });

        // Static info
        slide.addText('Architectural Design Proposal 2026', {
            x: 7.5, y: 6.95, w: 2, h: 0.3, fontSize: 8, color: BRAND_COLORS.muted, fontFace: FONTS.mono, align: 'right'
        });
    };

    // SLIDE 1: Title Slide
    // ============================================================================
    const slide1 = pptx.addSlide();
    applyBranding(slide1);

    // Background gradient overlay
    slide1.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { type: 'solid', color: BRAND_COLORS.dark },
    });

    // Decorative accent line
    slide1.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 2.5, w: 1.5, h: 0.08,
        fill: { color: BRAND_COLORS.primary },
    });

    // Main title
    slide1.addText(sanitize(project.name || 'Design Proposal'), {
        x: 0.5, y: 2.7, w: 9, h: 1.2,
        fontSize: 44, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // Subtitle
    slide1.addText('Architectural Design & Interior Fit-Out', {
        x: 0.5, y: 3.9, w: 9, h: 0.5,
        fontSize: 20, fontFace: FONTS.primary,
        color: BRAND_COLORS.muted,
    });

    // Prepared by info
    slide1.addText('Prepared by: Design & Build', {
        x: 0.5, y: 5.0, w: 5, h: 0.4,
        fontSize: 14, fontFace: FONTS.primary,
        color: BRAND_COLORS.primary,
    });

    // Date
    slide1.addText(new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }), {
        x: 0.5, y: 5.4, w: 5, h: 0.4,
        fontSize: 12, fontFace: FONTS.primary,
        color: BRAND_COLORS.muted,
    });

    // Design & Build badge
    slide1.addText('DESIGN & BUILD', {
        x: 7.5, y: 0.3, w: 2, h: 0.25,
        fontSize: 8, fontFace: FONTS.mono, bold: true,
        color: BRAND_COLORS.primary, align: 'right',
    });

    // Add Cover Render if available
    if (nanoPananaRenders.length > 0 && isValidBase64Image(nanoPananaRenders[0].image)) {
        slide1.addImage({
            data: nanoPananaRenders[0].image,
            x: 5.5, y: 1.5, w: 4, h: 4
        });
    }

    // SLIDE 2: Design Philosophy (Enhanced with Nano Banana Data)
    // ============================================================================
    const slide2 = pptx.addSlide();
    applyBranding(slide2);

    slide2.addText('Design Philosophy', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // 🆕 Use AI-generated design philosophy if available
    const designPhilosophy = nanoBananaData.designPhilosophy ||
        (activeStyle && {
            industrial: 'Raw Industrial Aesthetics - Exposed materials, honest construction, urban sophistication',
            minimalist: 'Clean Minimalism - Refined simplicity, white spaces, intentional design',
            luxury: 'Premium Luxury - Rich materials, gold accents, elevated experiences',
            biophilic: 'Biophilic Design - Nature integration, organic forms, sustainable living',
        }[activeStyle]) ||
        'Human-Centric Contemporary Design - Thoughtfully designed spaces that balance form, function, and aesthetics.';

    slide2.addText(sanitize(designPhilosophy), {
        x: 0.5, y: 1.3, w: 9, h: 1.2,
        fontSize: 16, fontFace: FONTS.primary, italic: true,
        color: BRAND_COLORS.text,
        valign: 'top',
    });

    // 🆕 Use AI-generated design principles if available
    const architectInsights = nanoBananaData.architectInsights || {};
    const spaceAnalysis = nanoBananaData.spaceAnalysis || {};

    const principles = [
        architectInsights.lightingStrategy?.natural ?
            `Natural Light: ${architectInsights.lightingStrategy.natural}` :
            'Natural Light: Maximized daylight integration',

        spaceAnalysis.circulation ?
            `Space Planning: ${spaceAnalysis.circulation}` :
            'Functional Zoning: Spaces designed for purpose and flow',

        architectInsights.sustainabilityNotes ||
        'Sustainability: Energy-efficient solutions throughout',

        architectInsights.lightingStrategy?.artificial ?
            `Artificial Lighting: ${architectInsights.lightingStrategy.artificial}` :
            'Technology Integration: Smart building ready infrastructure',

        'Material Harmony: Cohesive palette across all zones',
    ];

    principles.forEach((principle, i) => {
        const pStr = sanitize(principle);
        // Extract key part if too long
        const displayText = pStr.length > 80 ?
            pStr.substring(0, 77) + '...' :
            pStr;

        slide2.addText(`◆ ${displayText}`, {
            x: 0.5, y: 2.8 + (i * 0.6), w: 9, h: 0.5,
            fontSize: 14, fontFace: FONTS.primary,
            color: BRAND_COLORS.text,
        });
    });

    // Health check score
    slide2.addShape(pptx.ShapeType.rect, {
        x: 7, y: 5.5, w: 2.5, h: 1,
        fill: { color: '1E293B' },
        line: { color: BRAND_COLORS.success, width: 1 },
    });

    slide2.addText('Design Score', {
        x: 7, y: 5.55, w: 2.5, h: 0.3,
        fontSize: 10, fontFace: FONTS.primary,
        color: BRAND_COLORS.muted, align: 'center',
    });

    slide2.addText(`${healthCheck?.score || 85}%`, {
        x: 7, y: 5.85, w: 2.5, h: 0.6,
        fontSize: 28, fontFace: FONTS.mono, bold: true,
        color: BRAND_COLORS.success, align: 'center',
    });

    // SLIDE 3: Space Analysis
    // ============================================================================    // SLIDE 3: Space Analysis
    const slide3 = pptx.addSlide();
    applyBranding(slide3);

    slide3.addText('Space Analysis', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    slide3.addText(`${detectedRooms.length} Zones Identified | ${surveyor.floorArea.toFixed(1)} m² Total`, {
        x: 0.5, y: 1.1, w: 9, h: 0.4,
        fontSize: 14, fontFace: FONTS.primary,
        color: BRAND_COLORS.muted,
    });

    // Room breakdown table
    const roomTableData = detectedRooms.map((room, i) => [
        { text: sanitize(i + 1), options: { align: 'center' } },
        { text: sanitize(room.label) },
        { text: sanitize(room.type?.replace(/_/g, ' ') || 'General') },
        { text: sanitize(`${room.area || 30} m²`), options: { align: 'right' } },
    ]);

    if (roomTableData.length > 0) {
        slide3.addTable([
            [
                { text: '#', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary } },
                { text: 'Room Name', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary } },
                { text: 'Function', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary } },
                { text: 'Area', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary, align: 'right' } },
            ],
            ...roomTableData.slice(0, 8),
        ], {
            x: 0.5, y: 1.8, w: 9, h: 4,
            fontSize: 11,
            fontFace: FONTS.primary,
            color: BRAND_COLORS.text,
            border: { type: 'solid', pt: 0.5, color: '334155' },
            rowH: 0.4,
            colW: [0.5, 3, 3, 1.5],
        });
    }

    // SLIDE 4: Material Palette (Solid Color Swatches - Clean Professional Style)
    // ============================================================================
    const slide4 = pptx.addSlide();
    applyBranding(slide4);

    slide4.addText('Material Palette', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // Helper to validate if a string is a valid hex color
    const isValidHexColor = (color) => {
        if (!color || typeof color !== 'string') return false;
        const cleaned = color.replace('#', '');
        return /^[0-9A-Fa-f]{6}$/.test(cleaned);
    };

    // Helper to get a realistic hex color for material type
    const getMaterialColor = (mat) => {
        const name = (mat.name || '').toLowerCase();
        const colorField = (mat.color || '').toLowerCase();

        // If AI provided a valid hex color, use it
        if (isValidHexColor(mat.color)) {
            return mat.color.replace('#', '');
        }

        // Parse RAL codes to approximate colors
        if (colorField.includes('ral 9003') || colorField.includes('signal white')) return 'F4F4F4';
        if (colorField.includes('ral 9005') || colorField.includes('jet black')) return '0A0A0A';
        if (colorField.includes('ral 7035') || colorField.includes('light grey')) return 'D7D7D7';
        if (colorField.includes('ral 7016') || colorField.includes('anthracite')) return '293133';

        // Parse color names from the color field
        if (colorField.includes('white')) return 'F5F5F5';
        if (colorField.includes('black')) return '2D2D2D';
        if (colorField.includes('grey') || colorField.includes('gray')) return '808080';
        if (colorField.includes('blue')) return '4A90A4';
        if (colorField.includes('green')) return '5C7C5C';
        if (colorField.includes('beige') || colorField.includes('cream')) return 'E8DCC8';
        if (colorField.includes('brown')) return '8B5A2B';
        if (colorField.includes('clear') || colorField.includes('transparent')) return 'E0F0FF';

        // Fallback: Parse from material name
        if (name.includes('marble') || name.includes('white') || name.includes('corian')) return 'F5F5F5';
        if (name.includes('oak') || name.includes('bleached')) return 'D4C4A8';
        if (name.includes('wood') || name.includes('veneer') || name.includes('walnut')) return '8B5A2B';
        if (name.includes('concrete') || name.includes('industrial')) return '808080';
        if (name.includes('carpet') || name.includes('fabric') || name.includes('textile') || name.includes('wool')) return '4A5568';
        if (name.includes('glass')) return 'B8D4E8';
        if (name.includes('steel') || name.includes('metal') || name.includes('aluminum')) return '71797E';
        if (name.includes('blue')) return '4A90A4';
        if (name.includes('green') || name.includes('moss')) return '5C7C5C';
        if (name.includes('beige') || name.includes('cream')) return 'E8DCC8';
        if (name.includes('black') || name.includes('charcoal')) return '2D2D2D';
        if (name.includes('gold') || name.includes('brass')) return 'D4AF37';
        if (name.includes('grey') || name.includes('gray') || name.includes('cool')) return '9CA3AF';

        return 'E8E8E8'; // Default neutral gray
    };

    const materials = (nanoBananaData.materialPalette?.length > 0)
        ? nanoBananaData.materialPalette.slice(0, 5)
        : [
            { name: 'Carrara Marble', category: 'Stone', color: 'F8F8F8' },
            { name: 'Natural Oak Veneer', category: 'Wood', color: '8B5A2B' },
            { name: 'Brushed Steel', category: 'Metal', color: '71797E' },
            { name: 'Charcoal Wool Carpet', category: 'Textile', color: '4A5568' },
            { name: 'Frosted Glass', category: 'Glass', color: 'B8D4E8' },
        ];

    materials.forEach((mat, i) => {
        const swatchColor = getMaterialColor(mat);

        // Solid Color Swatch (Clean, Professional)
        slide4.addShape(pptx.ShapeType.rect, {
            x: 0.5 + (i * 1.8), y: 1.4, w: 1.6, h: 1.6,
            fill: { color: swatchColor },
            line: { color: BRAND_COLORS.primary, width: 2 }
        });

        // Material name
        slide4.addText(mat.name || 'Material', {
            x: 0.5 + (i * 1.8), y: 3.1, w: 1.6, h: 0.35,
            fontSize: 9, fontFace: FONTS.primary, bold: true,
            color: BRAND_COLORS.text, align: 'center',
        });

        // Material category
        slide4.addText(mat.category || '', {
            x: 0.5 + (i * 1.8), y: 3.4, w: 1.6, h: 0.25,
            fontSize: 8, fontFace: FONTS.mono,
            color: BRAND_COLORS.muted, align: 'center',
        });
    });

    // Material philosophy
    slide4.addText('Nano Banana Pro Material Selection', {
        x: 0.5, y: 4.2, w: 9, h: 0.4,
        fontSize: 14, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.primary,
    });

    const matRationale = nanoBananaData.materialPalette?.[0]?.rationale
        || 'Materials selected for durability, aesthetics, and sustainability. All finishes are low-VOC certified and sourced from approved suppliers.';

    slide4.addText(sanitize(matRationale), {
        x: 0.5, y: 4.6, w: 9, h: 0.8,
        fontSize: 12, fontFace: FONTS.primary,
        color: BRAND_COLORS.text,
    });

    // Helper to validate base64 image data
    const isValidBase64Image = (data) => {
        if (!data || typeof data !== 'string') return false;
        return data.startsWith('data:image/');
    };

    // SLIDE 5: Floor Plan Layout
    // ============================================================================
    const slide5 = pptx.addSlide();
    applyBranding(slide5);

    slide5.addText('Floor Plan Layout', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // Placeholder or Real Floor Plan (with validation)
    if (sketchPreviewUrl && isValidBase64Image(sketchPreviewUrl)) {
        slide5.addImage({
            data: sketchPreviewUrl,
            x: 0.5, y: 1.3, w: 9, h: 5,
            sizing: { type: 'contain', w: 9, h: 5 }
        });
    } else {
        slide5.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: 1.3, w: 9, h: 5,
            fill: { color: '1E293B' },
            line: { color: BRAND_COLORS.primary, width: 1, dashType: 'dash' },
        });
        slide5.addText('Floor Plan Preview', {
            x: 0.5, y: 3.5, w: 9, h: 0.5,
            fontSize: 16, fontFace: FONTS.primary,
            color: BRAND_COLORS.muted, align: 'center',
        });
    }

    slide5.addText('(Generated from AI Analysis)', {
        x: 0.5, y: 5.8, w: 9, h: 0.4,
        fontSize: 11, fontFace: FONTS.primary, italic: true,
        color: BRAND_COLORS.muted, align: 'center',
    });

    // SLIDE 6: 3D Visualization
    // ============================================================================
    const slide6 = pptx.addSlide();
    applyBranding(slide6);

    slide6.addText('3D Visualization', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // Real AI Render or Placeholder (with validation)
    const renderImage = nanoPananaRenders.length > 0 ? nanoPananaRenders[0].image : null;
    if (renderImage && isValidBase64Image(renderImage)) {
        slide6.addImage({
            data: renderImage,
            x: 0.5, y: 1.3, w: 9, h: 5,
            sizing: { type: 'cover', w: 9, h: 5 }
        });
    } else {
        slide6.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: 1.3, w: 9, h: 5,
            fill: { color: '1E293B' },
            line: { color: BRAND_COLORS.accent, width: 1, dashType: 'dash' },
        });
    }

    slide6.addText('Photorealistic 3D Render', {
        x: 0.5, y: 3.5, w: 9, h: 0.5,
        fontSize: 16, fontFace: FONTS.primary,
        color: BRAND_COLORS.muted, align: 'center',
    });

    slide6.addText('(Enhanced by Nano Banana Pro)', {
        x: 0.5, y: 4.0, w: 9, h: 0.4,
        fontSize: 11, fontFace: FONTS.primary, italic: true,
        color: BRAND_COLORS.muted, align: 'center',
    });

    const keyRooms = detectedRooms.slice(0, 2);

    keyRooms.forEach((room, idx) => {
        const slide = pptx.addSlide();
        applyBranding(slide);

        slide.addText(`Room Detail: ${sanitize(room.label)}`, {
            x: 0.5, y: 0.5, w: 9, h: 0.6,
            fontSize: 28, fontFace: FONTS.primary, bold: true,
            color: BRAND_COLORS.light,
        });

        slide.addText(`Type: ${room.type?.replace(/_/g, ' ')} | Area: ${Math.round((room.area || 30) * 10) / 10} m²`, {
            x: 0.5, y: 1.1, w: 9, h: 0.4,
            fontSize: 14, fontFace: FONTS.primary,
            color: BRAND_COLORS.muted,
        });

        // Room render placeholder or Real Render (with validation)
        const roomRender = nanoPananaRenders[idx + 1] || nanoPananaRenders[0];
        const roomRenderImage = roomRender?.image;
        if (roomRenderImage && isValidBase64Image(roomRenderImage)) {
            slide.addImage({
                data: roomRenderImage,
                x: 0.5, y: 1.7, w: 5.5, h: 4,
                sizing: { type: 'cover', w: 5.5, h: 4 }
            });
        } else {
            slide.addShape(pptx.ShapeType.rect, {
                x: 0.5, y: 1.7, w: 5.5, h: 4,
                fill: { color: '1E293B' },
                line: { color: BRAND_COLORS.primary, width: 1 },
            });
        }

        slide.addText('Room Visualization', {
            x: 0.5, y: 3.5, w: 5.5, h: 0.5,
            fontSize: 14, fontFace: FONTS.primary,
            color: BRAND_COLORS.muted, align: 'center',
        });

        // Room specs
        const specs = [
            ['Function', room.type?.replace(/_/g, ' ') || 'Office'],
            ['Area', `${Math.round((room.area || 30) * 10) / 10} m²`],
            ['Flooring', 'Marble/Carpet Tile'],
            ['Walls', 'Veneer/Paint'],
            ['Lighting', 'Linear LED'],
        ];

        specs.forEach((spec, i) => {
            slide.addText(spec[0], {
                x: 6.2, y: 1.7 + (i * 0.6), w: 1.5, h: 0.4,
                fontSize: 10, fontFace: FONTS.primary,
                color: BRAND_COLORS.muted,
            });

            slide.addText(sanitize(spec[1]), {
                x: 7.7, y: 1.7 + (i * 0.6), w: 2, h: 0.4,
                fontSize: 10, fontFace: FONTS.primary, bold: true,
                color: BRAND_COLORS.text, align: 'right',
            });
        });
    });

    // SLIDE 9: BOQ Summary
    // ============================================================================    // SLIDE 9: BOQ Summary
    const slide9 = pptx.addSlide();
    applyBranding(slide9);

    slide9.addText('Bill of Quantities', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // BOQ Table header
    const boqHeader = [
        { text: 'Code', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary } },
        { text: 'Description', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary } },
        { text: 'UOM', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary } },
        { text: 'Qty', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary, align: 'center' } },
        { text: 'Rate', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary, align: 'right' } },
        { text: 'Amount', options: { bold: true, fill: { color: '1E293B' }, color: BRAND_COLORS.primary, align: 'right' } },
    ];

    const boqRows = selectedItems.slice(0, 8).map(item => [
        { text: sanitize(item.itemCode || 'LF-XX') },
        { text: sanitize(item.name || item.description || 'Item') },
        { text: sanitize(item.unit || 'Nos.') },
        { text: sanitize(String(item.quantity || 1)), options: { align: 'center' } },
        { text: sanitize((item.rate || 0).toFixed(2)), options: { align: 'right' } },
        { text: sanitize(((item.rate || 0) * (item.quantity || 1)).toFixed(2)), options: { align: 'right' } },
    ]);

    slide9.addTable([boqHeader, ...boqRows], {
        x: 0.5, y: 1.3, w: 9, h: 4,
        fontSize: 10,
        fontFace: FONTS.primary,
        color: BRAND_COLORS.text,
        border: { type: 'solid', pt: 0.5, color: '334155' },
        rowH: 0.4,
        colW: [1, 3.5, 0.7, 0.6, 1.1, 1.3],
    });

    // SLIDE 10: Financial Summary
    // ============================================================================    // SLIDE 10: Financial Summary
    const slide10 = pptx.addSlide();
    applyBranding(slide10);

    slide10.addText('Financial Summary', {
        x: 0.5, y: 0.5, w: 9, h: 0.6,
        fontSize: 28, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.light,
    });

    // Cost breakdown
    const costItems = [
        { label: 'Material Costs', value: surveyor.materialCost },
        { label: 'Labor Costs (35%)', value: surveyor.laborCost },
        { label: 'MEP Systems', value: surveyor.mepCost },
        { label: 'Furniture & Equipment', value: surveyor.furnitureCost },
    ];

    costItems.forEach((item, i) => {
        slide10.addText(sanitize(item.label), {
            x: 2, y: 1.5 + (i * 0.6), w: 4, h: 0.4,
            fontSize: 14, fontFace: FONTS.primary,
            color: BRAND_COLORS.text,
        });

        slide10.addText(`${sanitize((item.value || 0).toFixed(3))} OMR`, {
            x: 6, y: 1.5 + (i * 0.6), w: 2, h: 0.4,
            fontSize: 14, fontFace: FONTS.mono,
            color: BRAND_COLORS.text, align: 'right',
        });
    });

    // Divider
    slide10.addShape(pptx.ShapeType.rect, {
        x: 2, y: 4.0, w: 6, h: 0.02,
        fill: { color: '334155' },
    });

    // Subtotal
    slide10.addText('Subtotal', {
        x: 2, y: 4.2, w: 4, h: 0.4,
        fontSize: 14, fontFace: FONTS.primary,
        color: BRAND_COLORS.text,
    });

    slide10.addText(`${(surveyor.totalCost || 0).toFixed(3)} OMR`, {
        x: 6, y: 4.2, w: 2, h: 0.4,
        fontSize: 14, fontFace: FONTS.mono,
        color: BRAND_COLORS.text, align: 'right',
    });

    // VAT
    slide10.addText('VAT (5%)', {
        x: 2, y: 4.7, w: 4, h: 0.4,
        fontSize: 14, fontFace: FONTS.primary,
        color: BRAND_COLORS.warning,
    });

    slide10.addText(`${((surveyor.totalCost || 0) * 0.05).toFixed(3)} OMR`, {
        x: 6, y: 4.7, w: 2, h: 0.4,
        fontSize: 14, fontFace: FONTS.mono,
        color: BRAND_COLORS.warning, align: 'right',
    });

    // Grand Total Box
    slide10.addShape(pptx.ShapeType.rect, {
        x: 2, y: 5.3, w: 6, h: 0.8,
        fill: { color: '1E293B' },
        line: { color: BRAND_COLORS.success, width: 2 },
    });

    slide10.addText('GRAND TOTAL', {
        x: 2.2, y: 5.4, w: 3, h: 0.6,
        fontSize: 14, fontFace: FONTS.primary, bold: true,
        color: BRAND_COLORS.success, valign: 'middle',
    });

    slide10.addText(`${(surveyor.grandTotal || 0).toFixed(3)} OMR`, {
        x: 5, y: 5.4, w: 2.8, h: 0.6,
        fontSize: 22, fontFace: FONTS.mono, bold: true,
        color: BRAND_COLORS.success, align: 'right', valign: 'middle',
    });

    // Save file
    const fileName = `${project.name?.replace(/\s+/g, '_') || 'Design_Proposal'}_${new Date().toISOString().split('T')[0]}.pptx`;
    await pptx.writeFile({ fileName });

    return { success: true, fileName };
}

// ============================================================================
// Export BOQ to Excel (Professional Styled)
// ============================================================================

export async function exportBOQToExcel() {
    const project = useBOQStore.getState().project;
    const nanoBananaData = useProjectStore.getState().nanoBananaData || {};
    const selectedItems = useBOQStore.getState().selectedItems.length > 0
        ? useBOQStore.getState().selectedItems
        : (nanoBananaData.boqItems || []);
    const detectedRooms = useProjectStore.getState().rooms3D.length > 0
        ? useProjectStore.getState().rooms3D
        : (useProjectStore.getState().detectedRooms || []);
    const surveyor = useSurveyorStore.getState();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Design & Build Surveyor AI';
    workbook.lastModifiedBy = 'Design & Build';
    workbook.created = new Date();

    // ========================================================================
    // Styles & Helpers
    // ========================================================================
    const primaryColor = 'FF' + BRAND_COLORS.primary;
    const darkColor = 'FF' + BRAND_COLORS.dark;
    const lightColor = 'FFF8FAFC';
    const borderColor = 'FFCBD5E1';

    // ========================================================================
    // 📊 Summary Worksheet
    // ========================================================================
    const summarySheet = workbook.addWorksheet('Summary', {
        views: [{ showGridLines: false }]
    });

    // Column Widths
    summarySheet.columns = [
        { width: 30 }, // A
        { width: 45 }, // B
    ];

    // Main Title
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'DESIGN & BUILD - PROJECT SUMMARY';
    titleCell.font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.mergeCells('A1:B2');

    // Section Headers Helper
    const addSectionHeader = (row, label) => {
        const cell = summarySheet.getCell(`A${row}`);
        cell.value = label.toUpperCase();
        cell.font = { size: 12, bold: true, color: { argb: primaryColor } };
        summarySheet.getRow(row).height = 25;
        summarySheet.getCell(`A${row}`).alignment = { vertical: 'middle' };
    };

    // Data Rows Helper
    const addDataRow = (row, label, value, isCurrency = false) => {
        summarySheet.getCell(`A${row}`).value = label;
        summarySheet.getCell(`A${row}`).font = { bold: true, color: { argb: 'FF475569' } };

        const valCell = summarySheet.getCell(`B${row}`);
        valCell.value = value;
        if (isCurrency) {
            valCell.numFmt = '#,##0.000 "OMR"';
            valCell.font = { bold: true };
        }
    };

    let currentRow = 4;
    addSectionHeader(currentRow++, "Project Information");
    addDataRow(currentRow++, "Project Name", project.name || "New Project");
    addDataRow(currentRow++, "Client", project.client || "New Client");
    addDataRow(currentRow++, "Date", project.date || new Date().toISOString().split('T')[0]);
    addDataRow(currentRow++, "Generated By", "Design & Build - Surveyor AI");

    currentRow++;
    addSectionHeader(currentRow++, "Project Metrics");
    addDataRow(currentRow++, "Total Rooms", detectedRooms.length);
    addDataRow(currentRow++, "Total BOQ Items", selectedItems.length);
    addDataRow(currentRow++, "Floor Area", (surveyor.floorArea || 0), true);
    summarySheet.getCell(`B${currentRow - 1}`).numFmt = '#,##0.00 "m²"';
    addDataRow(currentRow++, "Wall Area", (surveyor.wallArea || 0), true);
    summarySheet.getCell(`B${currentRow - 1}`).numFmt = '#,##0.00 "m²"';

    currentRow++;
    addSectionHeader(currentRow++, "Financial Breakdown");
    addDataRow(currentRow++, "Material Cost", (surveyor.materialCost || 0), true);
    addDataRow(currentRow++, "Labor Cost (35%)", (surveyor.laborCost || 0), true);
    addDataRow(currentRow++, "MEP Systems", (surveyor.mepCost || 0), true);
    addDataRow(currentRow++, "Furniture & Equipment", (surveyor.furnitureCost || 0), true);

    currentRow++;
    const totalRow = summarySheet.getRow(currentRow);
    totalRow.height = 30;
    summarySheet.getCell(`A${currentRow}`).value = "GRAND TOTAL";
    summarySheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell(`A${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    summarySheet.getCell(`A${currentRow}`).alignment = { vertical: 'middle', horizontal: 'center' };

    const totalValCell = summarySheet.getCell(`B${currentRow}`);
    totalValCell.value = (surveyor.grandTotal || 0);
    totalValCell.numFmt = '#,##0.000 "OMR"';
    totalValCell.font = { size: 16, bold: true, color: { argb: 'FF10B981' } };
    totalValCell.alignment = { vertical: 'middle', horizontal: 'right' };

    // ========================================================================
    // 📋 BOQ Line Items Worksheet
    // ========================================================================
    const boqSheet = workbook.addWorksheet('BOQ Line Items');

    // Headers
    boqSheet.columns = [
        { header: 'Line No', key: 'id', width: 10 },
        { header: 'Item Code', key: 'code', width: 18 },
        { header: 'Name', key: 'name', width: 35 },
        { header: 'Description', key: 'desc', width: 55 },
        { header: 'Category', key: 'cat', width: 20 },
        { header: 'Unit', key: 'unit', width: 12 },
        { header: 'Qty', key: 'qty', width: 10 },
        { header: 'Rate (OMR)', key: 'rate', width: 18 },
        { header: 'Total (OMR)', key: 'total', width: 22 },
    ];

    // Style Headers
    boqSheet.getRow(1).height = 35;
    boqSheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } } };
    });

    // Add Data
    selectedItems.forEach((item, i) => {
        const rowData = [
            i + 1,
            item.itemCode || `ITEM-${String(i + 1).padStart(3, '0')}`,
            item.name || "Item",
            item.description || "-",
            item.category || "General",
            item.unit || "Nos.",
            item.quantity || 1,
            parseFloat(item.rate || 0),
            parseFloat((item.rate || 0) * (item.quantity || 1))
        ];

        const row = boqSheet.addRow(rowData);

        // Dynamic row height based on description length
        const descLength = (item.description || "").length;
        if (descLength > 60) {
            row.height = Math.min(100, 15 * Math.ceil(descLength / 50));
        } else {
            row.height = 25;
        }

        // Apply alignment and number formats
        row.getCell(4).alignment = { wrapText: true, vertical: 'top' }; // Description wrap
        row.getCell(8).numFmt = '#,##0.000';
        row.getCell(9).numFmt = '#,##0.000';
        row.getCell(9).font = { bold: true };

        // Zebra stripes
        if (i % 2 === 1) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            });
        }
    });

    // Add Totals Footer
    const totalQty = selectedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const subtotal = selectedItems.reduce((sum, item) => sum + ((item.rate || 0) * (item.quantity || 1)), 0);

    boqSheet.addRow([]); // Spacer

    const subtotalRow = boqSheet.addRow(['', '', '', '', '', '', 'SUBTOTAL', '', subtotal]);
    subtotalRow.font = { bold: true };
    subtotalRow.getCell(9).numFmt = '#,##0.000';
    subtotalRow.getCell(7).value = totalQty;

    const vatRow = boqSheet.addRow(['', '', '', '', '', '', 'VAT (5%)', '', subtotal * 0.05]);
    vatRow.font = { bold: true, color: { argb: 'FFF59E0B' } };
    vatRow.getCell(9).numFmt = '#,##0.000';

    const grandTotalRow = boqSheet.addRow(['', '', '', '', '', '', 'GRAND TOTAL', '', subtotal * 1.05]);
    grandTotalRow.height = 25;
    grandTotalRow.font = { bold: true, size: 12, color: { argb: 'FF10B981' } };
    grandTotalRow.getCell(9).numFmt = '#,##0.000';
    grandTotalRow.getCell(9).border = { top: { style: 'thin' }, bottom: { style: 'double' } };

    // ========================================================================
    // Export
    // ========================================================================
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `BOQ_${project.name?.replace(/\s+/g, '_') || 'Export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(new Blob([buffer]), fileName);

    return { success: true, fileName };
}

export async function exportRendersGallery() {
    const renders = useProjectStore.getState().nanoPananaRenders;
    const project = useBOQStore.getState().project;

    if (renders.length === 0) {
        throw new Error('No renders available to export. Run Nano Panana Pro first.');
    }

    console.log('[Export] Exporting render gallery:', renders.length, 'images');

    // Download each render individually with small delay to avoid browser blocking
    for (let i = 0; i < renders.length; i++) {
        const render = renders[i];
        const fileName = `Render_${project.name?.replace(/\s+/g, '_') || 'Gallery'}_${i + 1}.png`;

        // Convert base64 to Blob
        const response = await fetch(render.image);
        const blob = await response.blob();
        saveAs(blob, fileName);

        // Small delay
        if (i < renders.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    return { success: true, count: renders.length };
}

export async function exportMoodboardPDF() {
    const project = useBOQStore.getState().project;
    const renders = useProjectStore.getState().nanoPananaRenders || [];
    const nanoBananaData = useProjectStore.getState().nanoBananaData || {};

    const pptx = new PptxGenJS();
    pptx.title = `Moodboard - ${project.name}`;

    // Slide 1: Main Concept
    const slide1 = pptx.addSlide();
    slide1.background = { color: BRAND_COLORS.dark };

    slide1.addText('Architectural Mood Board', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, color: BRAND_COLORS.primary, bold: true, fontFace: FONTS.primary
    });

    // Helper to validate base64 image data
    const isValidBase64Image = (data) => {
        if (!data || typeof data !== 'string') return false;
        return data.startsWith('data:image/');
    };

    const mainRenderImage = renders.length > 0 ? renders[0].image : null;
    if (mainRenderImage && isValidBase64Image(mainRenderImage)) {
        slide1.addImage({
            data: mainRenderImage,
            x: 0.5, y: 1.5, w: 6, h: 4.5,
            rounding: true
        });
    } else {
        slide1.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: 1.5, w: 6, h: 4.5,
            fill: { color: '1E293B' },
            line: { color: BRAND_COLORS.primary, width: 1 },
        });
    }

    slide1.addText(project.name || 'Project Moodboard', {
        x: 6.8, y: 1.5, w: 2.7, h: 0.5,
        fontSize: 14, color: BRAND_COLORS.light, bold: true, fontFace: FONTS.primary
    });

    slide1.addText('Design Style:', { x: 6.8, y: 2.1, w: 2.7, fontSize: 10, color: BRAND_COLORS.primary, bold: true });
    slide1.addText(nanoBananaData.designPhilosophy?.substring(0, 150) || 'Superior Architectural Design', { x: 6.8, y: 2.35, w: 2.7, fontSize: 10, color: BRAND_COLORS.text });

    slide1.addText('Primary Materials:', { x: 6.8, y: 3.5, w: 2.7, fontSize: 10, color: BRAND_COLORS.primary, bold: true });

    // Helper to safely get hex color from material
    const getSafeColor = (mat) => {
        const color = mat.color || '';
        const name = (mat.name || '').toLowerCase();

        // Valid hex check
        if (/^#?[0-9A-Fa-f]{6}$/.test(color.replace('#', ''))) {
            return color.replace('#', '');
        }

        // Parse from color description
        const colorLower = color.toLowerCase();
        if (colorLower.includes('white')) return 'F5F5F5';
        if (colorLower.includes('black')) return '2D2D2D';
        if (colorLower.includes('grey') || colorLower.includes('gray')) return '808080';
        if (colorLower.includes('blue')) return '4A90A4';
        if (colorLower.includes('green')) return '5C7C5C';
        if (colorLower.includes('beige') || colorLower.includes('cream')) return 'E8DCC8';
        if (colorLower.includes('clear')) return 'E0F0FF';

        // Parse from name
        if (name.includes('oak') || name.includes('wood')) return 'D4C4A8';
        if (name.includes('marble') || name.includes('white')) return 'F5F5F5';
        if (name.includes('steel') || name.includes('metal')) return '71797E';
        if (name.includes('carpet') || name.includes('fabric')) return '4A5568';
        if (name.includes('glass')) return 'B8D4E8';

        return 'CCCCCC';
    };

    const materials = nanoBananaData.materialPalette?.slice(0, 4) || [];
    materials.forEach((mat, i) => {
        slide1.addShape(pptx.ShapeType.rect, {
            x: 6.8 + (i * 0.6), y: 3.8, w: 0.5, h: 0.5,
            fill: { color: getSafeColor(mat) }
        });
        slide1.addText(mat.name || 'Material', { x: 6.8, y: 4.4 + (i * 0.25), w: 2.7, fontSize: 8, color: BRAND_COLORS.muted });
    });

    const fileName = `Moodboard_${project.name?.replace(/\s+/g, '_') || 'Export'}.pptx`;
    await pptx.writeFile({ fileName });

    return { success: true, fileName };
}

export default {
    generateCompletePPTX,
    exportBOQToExcel,
    exportRendersGallery,
    exportMoodboardPDF
};
