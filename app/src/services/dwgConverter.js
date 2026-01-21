/**
 * Design & Build - DWG to DXF Conversion Service
 * Converts binary DWG files to DXF format for full geometry extraction
 * 
 * Options:
 * 1. Cloud conversion via free APIs (CloudConvert, Zamzar)
 * 2. Local conversion guide for ODA File Converter
 */

// CloudConvert API configuration
const CLOUDCONVERT_API_KEY = import.meta.env.VITE_CLOUDCONVERT_API_KEY || '';
const CLOUDCONVERT_SANDBOX = import.meta.env.VITE_CLOUDCONVERT_SANDBOX === 'true';

// Debug: Log API key status on module load
console.log('[DWG Converter] CloudConvert API Key configured:', !!CLOUDCONVERT_API_KEY, 'Sandbox:', CLOUDCONVERT_SANDBOX);

/**
 * Convert DWG file to DXF using available methods
 */
export async function convertDWGtoDXF(dwgFile, onProgress = () => { }) {
    console.log('[DWG Converter] Starting conversion for:', dwgFile.name);
    console.log('[DWG Converter] API Key available:', !!CLOUDCONVERT_API_KEY);
    onProgress({ status: 'starting', message: 'Initializing conversion...' });

    // Try CloudConvert API first if configured
    if (CLOUDCONVERT_API_KEY) {
        console.log('[DWG Converter] Using CloudConvert API...');
        try {
            return await convertWithCloudConvert(dwgFile, onProgress);
        } catch (error) {
            console.error('[DWG Converter] CloudConvert failed:', error);
            onProgress({ status: 'fallback', message: 'Cloud conversion failed: ' + error.message });
        }
    } else {
        console.warn('[DWG Converter] No CloudConvert API key found!');
    }

    // Try free conversion API
    try {
        return await convertWithFreeAPI(dwgFile, onProgress);
    } catch (error) {
        console.error('[DWG Converter] Free API failed:', error);
    }

    // Return instructions for manual conversion
    return {
        success: false,
        requiresManualConversion: true,
        instructions: getManualConversionInstructions(),
    };
}

/**
 * Convert using CloudConvert API (requires API key)
 */
async function convertWithCloudConvert(dwgFile, onProgress) {
    onProgress({ status: 'uploading', message: 'Uploading to CloudConvert...' });

    const baseUrl = CLOUDCONVERT_SANDBOX
        ? 'https://api.sandbox.cloudconvert.com/v2'
        : 'https://api.cloudconvert.com/v2';

    // Step 1: Create job
    const jobResponse = await fetch(`${baseUrl}/jobs`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tasks: {
                'import-file': {
                    operation: 'import/upload',
                },
                'convert-file': {
                    operation: 'convert',
                    input: 'import-file',
                    output_format: 'dxf',
                },
                'export-file': {
                    operation: 'export/url',
                    input: 'convert-file',
                },
            },
        }),
    });

    if (!jobResponse.ok) {
        if (jobResponse.status === 402) {
            throw new Error('CloudConvert API Quota Exceeded (402 Payment Required). Your account needs credits to continue auto-conversion.');
        }
        if (jobResponse.status === 401) {
            throw new Error('Invalid CloudConvert API Key (401 Unauthorized). Please verify your .env configuration.');
        }
        const errData = await jobResponse.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create conversion job');
    }

    const job = await jobResponse.json();
    const uploadTask = job.data.tasks.find(t => t.name === 'import-file');

    // Step 2: Upload file
    onProgress({ status: 'uploading', message: 'Uploading file...' });

    const formData = new FormData();
    Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
        formData.append(key, value);
    });
    formData.append('file', dwgFile);

    await fetch(uploadTask.result.form.url, {
        method: 'POST',
        body: formData,
    });

    // Step 3: Wait for conversion
    onProgress({ status: 'converting', message: 'Converting DWG to DXF...' });

    let exportTask = null;
    for (let i = 0; i < 60; i++) { // Max 60 seconds
        await new Promise(r => setTimeout(r, 1000));

        const statusResponse = await fetch(`${baseUrl}/jobs/${job.data.id}`, {
            headers: { 'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}` },
        });
        const statusData = await statusResponse.json();

        if (statusData.data.status === 'finished') {
            exportTask = statusData.data.tasks.find(t => t.name === 'export-file');
            break;
        } else if (statusData.data.status === 'error') {
            throw new Error('Conversion failed');
        }

        onProgress({ status: 'converting', message: `Converting... ${i + 1}s` });
    }

    if (!exportTask || !exportTask.result?.files?.[0]?.url) {
        throw new Error('Conversion timeout or no output');
    }

    // Step 4: Download DXF
    onProgress({ status: 'downloading', message: 'Downloading DXF file...' });

    const dxfResponse = await fetch(exportTask.result.files[0].url);
    const dxfBlob = await dxfResponse.blob();
    const dxfFile = new File([dxfBlob], dwgFile.name.replace(/\.dwg$/i, '.dxf'), {
        type: 'application/dxf',
    });

    onProgress({ status: 'complete', message: 'Conversion complete!' });

    return {
        success: true,
        file: dxfFile,
        method: 'CloudConvert',
    };
}

/**
 * Convert using free CAD conversion API
 * Uses multiple free services as fallback
 */
async function convertWithFreeAPI(dwgFile, onProgress) {
    onProgress({ status: 'converting', message: 'Attempting free conversion...' });

    // Try using a CORS-enabled free converter
    // Note: Free APIs may have limitations

    // Option 1: Use a proxy service or direct API
    const formData = new FormData();
    formData.append('file', dwgFile);
    formData.append('targetformat', 'dxf');

    // This is a placeholder - we'll provide manual instructions instead
    // since most free APIs require server-side handling

    throw new Error('Free API not available - use manual conversion');
}

/**
 * Get manual conversion instructions
 */
export function getManualConversionInstructions() {
    return {
        title: 'Convert DWG to DXF',
        description: 'DWG is a proprietary binary format. Please convert to DXF using one of these methods:',
        methods: [
            {
                name: 'AutoCAD (Recommended)',
                steps: [
                    'Open your DWG file in AutoCAD',
                    'Type SAVEAS command or press Ctrl+Shift+S',
                    'In the "Files of type" dropdown, select "AutoCAD 2018 DXF (*.dxf)"',
                    'Click Save',
                    'Upload the resulting .dxf file to Design & Build',
                ],
                icon: 'autocad',
            },
            {
                name: 'ODA File Converter (Free)',
                steps: [
                    'Download ODA File Converter from: https://www.opendesign.com/guestfiles/oda_file_converter',
                    'Install and run the application',
                    'Set Input folder to your DWG location',
                    'Set Output folder for DXF files',
                    'Select output version: "2018 DXF ASCII"',
                    'Click "Start" to convert',
                    'Upload the .dxf file to Design & Build',
                ],
                downloadUrl: 'https://www.opendesign.com/guestfiles/oda_file_converter',
                icon: 'oda',
            },
            {
                name: 'Online Converter',
                steps: [
                    'Go to https://cloudconvert.com/dwg-to-dxf',
                    'Upload your DWG file',
                    'Click "Convert" and wait for processing',
                    'Download the DXF file',
                    'Upload to Design & Build',
                ],
                url: 'https://cloudconvert.com/dwg-to-dxf',
                icon: 'cloud',
            },
            {
                name: 'LibreCAD (Free & Open Source)',
                steps: [
                    'Download LibreCAD from: https://librecad.org/',
                    'Open your DWG file (via File > Open)',
                    'File > Save As > Select DXF format',
                    'OR use CLI (Power Users): librecad dxf2pdf yourfile.dxf',
                ],
                downloadUrl: 'https://librecad.org/',
                icon: 'librecad',
            },
            {
                name: 'Aspose.CAD (Java/REST/Online)',
                steps: [
                    'Go to https://products.aspose.app/cad/conversion/dwg-to-dxf',
                    'Upload your DWG file for instant online conversion',
                    'Or integrate via Java: Use Aspose.CAD for Java to automate',
                    'Support for latest AutoCAD versions and high fidelity',
                ],
                url: 'https://products.aspose.app/cad/conversion/dwg-to-dxf',
                icon: 'aspose',
            },
        ],
        note: 'For best results, use AutoCAD SAVEAS or ODA File Converter. These preserve all geometry and layers accurately.',
    };
}

/**
 * Check if a file is DWG format
 */
export function isDWGFile(file) {
    return file.name.toLowerCase().endsWith('.dwg');
}

/**
 * Check if conversion service is available
 */
export function isConversionServiceAvailable() {
    const available = !!CLOUDCONVERT_API_KEY;
    console.log('[DWG Converter] isConversionServiceAvailable:', available);
    return available;
}

/**
 * Download a file to user's computer
 */
export function downloadFile(file, filename) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default {
    convertDWGtoDXF,
    isDWGFile,
    isConversionServiceAvailable,
    downloadFile,
    getManualConversionInstructions,
};
