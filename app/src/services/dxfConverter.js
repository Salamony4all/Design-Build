/**
 * Design & Build - DXF/CAD to 3D Conversion Service
 * Optimized for performance using Web Workers
 */

import DxfParser from 'dxf-parser';

/**
 * Parse DXF file and extract structured data
 * Uses a Web Worker to avoid freezing the UI thread for large files
 */
export async function parseDXFFile(file) {
    console.log('[DXF Converter] Delegating to Worker for:', file.name);

    return new Promise(async (resolve, reject) => {
        try {
            const text = await file.text();

            // In Vite, we can import workers with ?worker suffix or use the new Worker(URL) syntax
            // For maximum compatibility in this environment, try to create the worker
            const worker = new Worker(
                new URL('./dxfWorker.js', import.meta.url),
                { type: 'module' }
            );

            // Set a timeout to avoid hanging forever if the worker fails
            const timeoutId = setTimeout(() => {
                worker.terminate();
                reject(new Error('DXF Parsing timed out after 30 seconds'));
            }, 30000);

            worker.onmessage = (e) => {
                clearTimeout(timeoutId);
                const { success, result, error } = e.data;
                worker.terminate();

                if (success) {
                    console.log('[DXF Converter] Success from worker:', result.cadMetadata);
                    resolve(result);
                } else {
                    reject(new Error(error || 'Worker failed to parse DXF'));
                }
            };

            worker.onerror = (err) => {
                clearTimeout(timeoutId);
                console.error('[DXF Converter] Worker thread error:', err);
                worker.terminate();
                reject(new Error('Background thread crashed during CAD analysis'));
            };

            // Send data to worker
            worker.postMessage({ text, fileName: file.name });

        } catch (error) {
            console.error('[DXF Converter] Initialization error:', error);

            // Fallback to internal parsing if worker fails to start
            try {
                const text = await file.text();
                const parser = new DxfParser();
                const dxf = parser.parseSync(text);
                resolve(extractGeometryFallback(dxf, file.name));
            } catch (fallbackError) {
                reject(new Error(`CAD Analysis failed: ${fallbackError.message}`));
            }
        }
    });
}

/**
 * Fallback Geometry Extraction (for environments without Workers)
 */
function extractGeometryFallback(dxf, fileName) {
    // Simplified version of the worker logic for basic recovery
    const entities = dxf.entities || [];
    return {
        success: true,
        sourceType: 'DXF-FALLBACK',
        cadMetadata: { fileName, entities: entities.length },
        floorPlan: { totalArea: 100, bounds: { width: 10, height: 10 }, scale: 1 },
        rooms: [],
        walls: [],
        healthCheck: { score: 50, issues: [{ severity: 'warning', message: 'Worker fallback used' }] }
    };
}

export default {
    parseDXFFile,
};
