/**
 * Design & Build - Export Utilities
 * Generate branded PPTX, Excel, and image exports
 */

import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';

// ============================================================================
// Color Constants
// ============================================================================

const COLORS = {
    primary: '3B82F6',
    secondary: '8B5CF6',
    success: '10B981',
    warning: 'F59E0B',
    error: 'EF4444',
    dark: '0A0A0F',
    surface: '1A1A24',
    text: 'FFFFFF',
    textMuted: 'A0AEC0',
    accent: '3B82F6',
};

// ============================================================================
// PPTX Export - 10-Slide Branded Deck
// ============================================================================

export async function generatePPTX(projectData, boqSummary, renderImages = []) {
    const pptx = new pptxgen();

    // Presentation Properties
    pptx.author = 'Design & Build';
    pptx.company = 'Design & Build';
    pptx.title = `${projectData.name} - Design Presentation`;
    pptx.subject = 'Interior Design & BOQ Presentation';

    // Define Master Slide
    pptx.defineSlideMaster({
        title: 'DNB_MASTER',
        background: { color: COLORS.dark },
        objects: [
            // Footer
            { rect: { x: 0, y: 6.8, w: '100%', h: 0.7, fill: { color: COLORS.surface } } },
            {
                text: {
                    text: 'Design & Build Studio',
                    options: { x: 0.5, y: 7.0, w: 5, h: 0.3, fontSize: 8, color: COLORS.textMuted, fontFace: 'Arial' }
                }
            },
            {
                text: {
                    text: projectData.date,
                    options: { x: 8.5, y: 7.0, w: 2, h: 0.3, fontSize: 8, color: COLORS.textMuted, align: 'right', fontFace: 'Arial' }
                }
            },
        ],
    });

    // ============================================
    // SLIDE 1: Title Slide
    // ============================================
    let slide1 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    // Title Background Gradient
    slide1.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 2.5, w: '100%', h: 2.5,
        fill: { color: COLORS.primary, transparency: 90 },
    });

    slide1.addText(projectData.name, {
        x: 0.5, y: 2.8, w: 9, h: 1,
        fontSize: 44, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    slide1.addText('Interior Design & Fit-Out Proposal', {
        x: 0.5, y: 3.8, w: 9, h: 0.5,
        fontSize: 20, color: COLORS.textMuted,
        fontFace: 'Arial',
    });

    slide1.addText(`Prepared for: ${projectData.client}`, {
        x: 0.5, y: 5.5, w: 9, h: 0.4,
        fontSize: 14, color: COLORS.accent,
        fontFace: 'Arial',
    });

    // ============================================
    // SLIDE 2: Design Philosophy
    // ============================================
    let slide2 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    slide2.addText('Design Philosophy', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    const philosophyPoints = [
        { title: 'Human-Centric Design', desc: 'Spaces that prioritize comfort, wellness, and productivity' },
        { title: 'Biophilic Integration', desc: 'Natural elements and living plants throughout the workspace' },
        { title: 'Sustainable Materials', desc: 'Low VOC paints, natural wood veneers, and eco-friendly fabrics' },
        { title: 'Acoustic Excellence', desc: 'Premium acoustic panels for optimal work environment' },
    ];

    philosophyPoints.forEach((point, i) => {
        slide2.addShape(pptx.shapes.RECTANGLE, {
            x: 0.5, y: 1.5 + (i * 1.3), w: 9, h: 1.1,
            fill: { color: COLORS.surface },
            line: { color: COLORS.primary, width: 1 },
        });

        slide2.addText(point.title, {
            x: 0.7, y: 1.6 + (i * 1.3), w: 8, h: 0.4,
            fontSize: 16, bold: true, color: COLORS.accent,
            fontFace: 'Arial',
        });

        slide2.addText(point.desc, {
            x: 0.7, y: 2.0 + (i * 1.3), w: 8, h: 0.4,
            fontSize: 12, color: COLORS.textMuted,
            fontFace: 'Arial',
        });
    });

    // ============================================
    // SLIDE 3: Mood Board (Materials)
    // ============================================
    let slide3 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    slide3.addText('Material Palette', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    const materials = [
        { name: 'White Oak Veneer (WD-101)', color: 'D4A574', desc: 'Natural wood warmth' },
        { name: 'Marble (MA-201)', color: 'F5F5F5', desc: 'Premium stone finish' },
        { name: 'Clear Glass (GL-101)', color: 'E8F4F8', desc: 'Transparency & light' },
        { name: 'PVD Steel (MT-101)', color: '1A1A1A', desc: 'Modern metal accents' },
        { name: 'Fabric (FB-101)', color: '4A5568', desc: 'Soft touch textiles' },
        { name: 'Carpet (CA-101)', color: '2D3748', desc: 'Acoustic flooring' },
    ];

    materials.forEach((mat, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);

        // Color Swatch
        slide3.addShape(pptx.shapes.RECTANGLE, {
            x: 0.5 + (col * 3.2), y: 1.5 + (row * 2.5), w: 3, h: 1.5,
            fill: { color: mat.color },
            line: { color: COLORS.primary, width: 1 },
        });

        // Label
        slide3.addText(mat.name, {
            x: 0.5 + (col * 3.2), y: 3.1 + (row * 2.5), w: 3, h: 0.3,
            fontSize: 10, bold: true, color: COLORS.text,
            fontFace: 'Arial',
        });

        slide3.addText(mat.desc, {
            x: 0.5 + (col * 3.2), y: 3.4 + (row * 2.5), w: 3, h: 0.3,
            fontSize: 9, color: COLORS.textMuted,
            fontFace: 'Arial',
        });
    });

    // ============================================
    // SLIDE 4-6: Space Zones
    // ============================================
    const zones = [
        { name: 'Reception & Entrance', items: ['Reception desk LF16', 'Feature wall with moss', 'Marble cladding MA-201'] },
        { name: 'Open Office Areas', items: ['Height adjustable desks LF01', 'Task chairs LF07', 'Storage units LF06'] },
        { name: 'Meeting & Collaboration', items: ['U-shaped board table LF20', 'Conference chairs LF19', 'Acoustic panels AP-101'] },
    ];

    zones.forEach((zone, i) => {
        let slideZone = pptx.addSlide({ masterName: 'DNB_MASTER' });

        slideZone.addText(zone.name, {
            x: 0.5, y: 0.5, w: 9, h: 0.8,
            fontSize: 32, bold: true, color: COLORS.text,
            fontFace: 'Arial',
        });

        // Zone placeholder
        slideZone.addShape(pptx.shapes.RECTANGLE, {
            x: 0.5, y: 1.5, w: 6, h: 4,
            fill: { color: COLORS.surface },
            line: { color: COLORS.primary, width: 2 },
        });

        slideZone.addText('3D Render Placeholder', {
            x: 0.5, y: 3, w: 6, h: 0.5,
            fontSize: 14, color: COLORS.textMuted, align: 'center',
            fontFace: 'Arial',
        });

        // Items list
        zone.items.forEach((item, j) => {
            slideZone.addText(`• ${item}`, {
                x: 7, y: 1.5 + (j * 0.5), w: 2.5, h: 0.4,
                fontSize: 11, color: COLORS.text,
                fontFace: 'Arial',
            });
        });
    });

    // ============================================
    // SLIDE 7: 2D Floor Plan
    // ============================================
    let slide7 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    slide7.addText('2D Layout Plan', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    slide7.addShape(pptx.shapes.RECTANGLE, {
        x: 0.5, y: 1.5, w: 9, h: 5,
        fill: { color: COLORS.surface },
        line: { color: COLORS.primary, width: 2 },
    });

    slide7.addText('Annotated Floor Plan\nWith Furniture Item Codes', {
        x: 0.5, y: 3.5, w: 9, h: 1,
        fontSize: 16, color: COLORS.textMuted, align: 'center',
        fontFace: 'Arial',
    });

    // ============================================
    // SLIDE 8: Executive BOQ Summary - Furniture
    // ============================================
    let slide8 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    slide8.addText('Executive BOQ - Furniture', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    // Table Header
    const tableHeader = [
        { text: 'Category', options: { fill: { color: COLORS.primary }, color: COLORS.text, bold: true, align: 'center' } },
        { text: 'Items', options: { fill: { color: COLORS.primary }, color: COLORS.text, bold: true, align: 'center' } },
        { text: 'Subtotal (OMR)', options: { fill: { color: COLORS.primary }, color: COLORS.text, bold: true, align: 'center' } },
    ];

    const tableRows = [tableHeader];

    if (boqSummary && Object.keys(boqSummary).length > 0) {
        Object.entries(boqSummary).forEach(([category, data]) => {
            tableRows.push([
                { text: category, options: { fill: { color: COLORS.surface }, color: COLORS.text } },
                { text: String(data.count), options: { fill: { color: COLORS.surface }, color: COLORS.text, align: 'center' } },
                { text: data.subtotal.toFixed(3), options: { fill: { color: COLORS.surface }, color: COLORS.success, align: 'right' } },
            ]);
        });
    } else {
        // Sample data
        const sampleCategories = ['Desks', 'Chairs', 'Tables', 'Storage', 'Equipment'];
        sampleCategories.forEach(cat => {
            tableRows.push([
                { text: cat, options: { fill: { color: COLORS.surface }, color: COLORS.text } },
                { text: '-', options: { fill: { color: COLORS.surface }, color: COLORS.text, align: 'center' } },
                { text: '-', options: { fill: { color: COLORS.surface }, color: COLORS.textMuted, align: 'right' } },
            ]);
        });
    }

    slide8.addTable(tableRows, {
        x: 0.5, y: 1.5, w: 9,
        colW: [4, 2, 3],
        border: { pt: 1, color: COLORS.primary },
        fontFace: 'Arial',
        fontSize: 11,
    });

    // ============================================
    // SLIDE 9: Executive BOQ Summary - Fit-Out
    // ============================================
    let slide9 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    slide9.addText('Executive BOQ - Fit-Out Works', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    const fitoutCategories = ['Wall Finishes', 'Floor Finishes', 'Ceiling', 'Skirting', 'Accessories'];
    const fitoutRows = [tableHeader];

    fitoutCategories.forEach(cat => {
        fitoutRows.push([
            { text: cat, options: { fill: { color: COLORS.surface }, color: COLORS.text } },
            { text: '-', options: { fill: { color: COLORS.surface }, color: COLORS.text, align: 'center' } },
            { text: '-', options: { fill: { color: COLORS.surface }, color: COLORS.textMuted, align: 'right' } },
        ]);
    });

    slide9.addTable(fitoutRows, {
        x: 0.5, y: 1.5, w: 9,
        colW: [4, 2, 3],
        border: { pt: 1, color: COLORS.primary },
        fontFace: 'Arial',
        fontSize: 11,
    });

    // ============================================
    // SLIDE 10: Total Summary
    // ============================================
    let slide10 = pptx.addSlide({ masterName: 'DNB_MASTER' });

    slide10.addText('Project Summary', {
        x: 0.5, y: 0.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.text,
        fontFace: 'Arial',
    });

    const subtotal = Object.values(boqSummary || {}).reduce((sum, cat) => sum + (cat.subtotal || 0), 0);
    const vat = subtotal * 0.05;
    const total = subtotal + vat;

    // Summary Box
    slide10.addShape(pptx.shapes.RECTANGLE, {
        x: 2, y: 2, w: 6, h: 3.5,
        fill: { color: COLORS.surface },
        line: { color: COLORS.primary, width: 2 },
    });

    slide10.addText('Furniture Subtotal:', { x: 2.5, y: 2.3, w: 3, fontSize: 14, color: COLORS.textMuted });
    slide10.addText(`${subtotal.toFixed(3)} OMR`, { x: 5.5, y: 2.3, w: 2, fontSize: 14, color: COLORS.text, align: 'right' });

    slide10.addText('Fit-Out Subtotal:', { x: 2.5, y: 2.8, w: 3, fontSize: 14, color: COLORS.textMuted });
    slide10.addText('- OMR', { x: 5.5, y: 2.8, w: 2, fontSize: 14, color: COLORS.text, align: 'right' });

    slide10.addShape(pptx.shapes.LINE, { x: 2.5, y: 3.4, w: 5, line: { color: COLORS.primary, width: 1 } });

    slide10.addText('VAT (5%):', { x: 2.5, y: 3.6, w: 3, fontSize: 14, color: COLORS.warning });
    slide10.addText(`${vat.toFixed(3)} OMR`, { x: 5.5, y: 3.6, w: 2, fontSize: 14, color: COLORS.warning, align: 'right' });

    slide10.addShape(pptx.shapes.LINE, { x: 2.5, y: 4.2, w: 5, line: { color: COLORS.primary, width: 2 } });

    slide10.addText('GRAND TOTAL:', { x: 2.5, y: 4.5, w: 3, fontSize: 18, bold: true, color: COLORS.success });
    slide10.addText(`${total.toFixed(3)} OMR`, { x: 5.5, y: 4.5, w: 2, fontSize: 18, bold: true, color: COLORS.success, align: 'right' });

    // Contact Footer
    slide10.addText('For inquiries: Design & Build | info@dandb.com', {
        x: 0.5, y: 6.2, w: 9, h: 0.4,
        fontSize: 11, color: COLORS.accent, align: 'center',
        fontFace: 'Arial',
    });

    // ============================================
    // Generate and Download
    // ============================================
    const fileName = `${projectData.name.replace(/\s+/g, '_')}_Presentation_${projectData.date}.pptx`;

    return pptx.writeFile({ fileName })
        .then(() => ({ success: true, fileName }))
        .catch((error) => ({ success: false, error: error.message }));
}

// ============================================================================
// Export BOQ to JSON
// ============================================================================

export function exportBOQToJSON(selectedItems, project) {
    const data = {
        project: project,
        exportDate: new Date().toISOString(),
        items: selectedItems,
        summary: {
            totalItems: selectedItems.length,
            subtotal: selectedItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0),
            vat: selectedItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0) * project.vatRate,
            total: selectedItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0) * (1 + project.vatRate),
        },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `${project.name.replace(/\s+/g, '_')}_BOQ_${project.date}.json`);

    return { success: true };
}

// ============================================================================
// Export Scene as Image
// ============================================================================

export function captureSceneImage(canvasElement, fileName = 'render') {
    if (!canvasElement) return { success: false, error: 'No canvas element provided' };

    try {
        const dataUrl = canvasElement.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${fileName}_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
