/**
 * Design & Build - Sketch Upload Panel
 * PHASE 1: Intelligent Analysis - Upload 2D sketches or PDF plans
 * Triggers AI analysis and room detection
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileImage,
    FileScan,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Loader2,
    Brain,
    Eye,
    Zap,
    X,
    ArrowRight,
    FileType,
    Layers,
} from 'lucide-react';
import { useProjectStore, useUIStore } from '../../store';

// Workflow states
const STATES = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    ANALYZING: 'analyzing',
    DETECTED: 'detected',
    FURNISHING: 'furnishing',
    PRE_CAD: 'pre_cad',
    COMPLETE: 'complete',
    ERROR: 'error',
};

export default function SketchUploadPanel() {
    const [state, setState] = useState(STATES.IDLE);
    const [progress, setProgress] = useState(0);
    const [analysis, setAnalysis] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const fileInputRef = useRef(null);

    const startSketchAnalysis = useProjectStore(s => s.startSketchAnalysis);
    const addNotification = useUIStore(s => s.addNotification);

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);

        const files = e.dataTransfer?.files || e.target?.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    }, []);

    // Process uploaded file
    const processFile = async (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/x-dwg', 'image/vnd.dwg', 'application/dxf'];
        const isCAD = file.name.endsWith('.dwg') || file.name.endsWith('.dxf');
        const isSVG = file.name.endsWith('.svg');

        if (!validTypes.includes(file.type) && !isCAD && !isSVG) {
            setError('Please upload a JPG, PNG, SVG, PDF, or CAD (DWG/DXF) file');
            setState(STATES.ERROR);
            return;
        }

        // Create preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }

        // Start upload
        setState(STATES.UPLOADING);
        setProgress(0);

        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(r => setTimeout(r, 50));
            setProgress(i);
        }

        // If it's CAD, offer editing before analysis
        if (isCAD) {
            setState(STATES.PRE_CAD);
            return;
        }

        // Start AI analysis
        performAnalysis(file);
    };

    const performAnalysis = async (file) => {
        setState(STATES.ANALYZING);
        setProgress(0);

        try {
            // Call the AI analysis
            const result = await startSketchAnalysis(file);

            if (result.success) {
                setAnalysis(result);
                setState(STATES.DETECTED);

                addNotification({
                    type: 'success',
                    title: 'Analysis Complete',
                    message: `Detected ${result.rooms.length} rooms`,
                });

                // Auto-proceed to furnishing after delay
                setTimeout(() => {
                    setState(STATES.FURNISHING);

                    setTimeout(() => {
                        setState(STATES.COMPLETE);
                    }, 2000);
                }, 1500);

            } else {
                throw new Error(result.error);
            }

        } catch (err) {
            setError(err.message);
            setState(STATES.ERROR);
            addNotification({
                type: 'error',
                title: 'Analysis Failed',
                message: err.message,
            });
        }
    };

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    // Reset to initial state
    const handleReset = () => {
        setState(STATES.IDLE);
        setProgress(0);
        setAnalysis(null);
        setPreviewUrl(null);
        setError(null);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-studio-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Brain size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white text-sm">Design & Build Intelligence</h2>
                        <p className="text-xs text-gray-500">2D Sketch, PDF or CAD (DWG/DXF)</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 overflow-auto">
                <AnimatePresence mode="wait">
                    {/* IDLE STATE - Upload Zone */}
                    {state === STATES.IDLE && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full flex flex-col"
                        >
                            {/* Drop Zone */}
                            <div
                                className={`
                  flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center
                  transition-all duration-300 cursor-pointer
                  ${dragActive
                                        ? 'border-blue-400 bg-blue-500/10'
                                        : 'border-studio-border hover:border-gray-600 hover:bg-studio-hover'
                                    }
                `}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".dwg,.dxf,.pdf,.svg,image/*"
                                    onChange={(e) => handleDrop(e)}
                                    className="hidden"
                                />

                                <div className="text-center p-6">
                                    <motion.div
                                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
                                        animate={{
                                            scale: dragActive ? 1.1 : 1,
                                            rotate: dragActive ? [0, -5, 5, 0] : 0,
                                        }}
                                    >
                                        <Upload size={28} className={dragActive ? 'text-blue-400' : 'text-gray-400'} />
                                    </motion.div>

                                    <h3 className="font-medium text-white mb-2">
                                        {dragActive ? 'Drop your sketch here' : 'Upload Floor Plan'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Drag & drop sketch, PDF or .DWG
                                    </p>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mb-4">
                                            <span className="flex items-center gap-1">
                                                <FileImage size={12} /> JPG/PNG
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileType size={12} /> SVG / PDF
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Layers size={12} /> .DWG / .DXF
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                useUIStore.getState().openModal('cad-editor');
                                            }}
                                            className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all active:scale-95"
                                        >
                                            <Layers size={14} />
                                            Open AutoCAD Editor
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* AI Features Preview */}
                            <div className="mt-4 space-y-2">
                                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    AI Will Detect
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { icon: Eye, label: 'Room Boundaries' },
                                        { icon: Layers, label: 'CAD Layer Mapping' },
                                        { icon: Zap, label: 'Block Extraction' },
                                        { icon: Brain, label: 'Auto-Furnishing' },
                                    ].map(({ icon: Icon, label }) => (
                                        <div
                                            key={label}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-studio-surface border border-studio-border"
                                        >
                                            <Icon size={14} className="text-purple-400" />
                                            <span className="text-xs text-gray-400">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* UPLOADING STATE */}
                    {state === STATES.UPLOADING && (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center"
                        >
                            <Loader2 size={32} className="text-blue-400 animate-spin mb-4" />
                            <h3 className="font-medium text-white mb-2">Uploading...</h3>
                            <div className="w-48 h-2 bg-studio-surface rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 mt-2">{progress}%</span>
                        </motion.div>
                    )}

                    {/* ANALYZING STATE */}
                    {state === STATES.ANALYZING && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center"
                        >
                            {/* Animated Brain */}
                            <motion.div
                                className="relative w-20 h-20 mb-6"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 animate-pulse" />
                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 animate-pulse delay-100" />
                                <div className="absolute inset-4 rounded-full bg-studio-bg flex items-center justify-center">
                                    <Brain size={24} className="text-purple-400" />
                                </div>
                            </motion.div>

                            <h3 className="font-medium text-white mb-2">Analyzing Drawing...</h3>
                            <p className="text-sm text-gray-500 text-center mb-4">
                                Extracting geometry and intelligence
                            </p>

                            {/* Analysis Steps */}
                            <div className="space-y-2 text-sm">
                                {[
                                    'Parsing drawing structure',
                                    'Mapping layers & attributes',
                                    'Detecting spatial boundaries',
                                    'Extracting block quantities',
                                ].map((step, i) => (
                                    <motion.div
                                        key={step}
                                        className="flex items-center gap-2 text-gray-400"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.5 }}
                                    >
                                        <Loader2 size={14} className="text-purple-400 animate-spin" />
                                        <span>{step}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* PRE_CAD STATE */}
                    {state === STATES.PRE_CAD && (
                        <motion.div
                            key="pre-cad"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center px-4"
                        >
                            <div className="w-20 h-20 mb-6 relative">
                                <div className="absolute inset-0 bg-red-500/20 rounded-2xl animate-pulse" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Layers size={40} className="text-red-500" />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">CAD Drawing Detected</h3>
                            <p className="text-sm text-gray-400 mb-8">
                                Professional DWG/DXF data identified. Would you like to edit plans or clean layers before AI processing?
                            </p>
                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={() => useUIStore.getState().openModal('cad-editor')}
                                    className="btn-pro py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500"
                                >
                                    <ExternalLink size={16} />
                                    Edit in AutoCAD Pro
                                </button>
                                <button
                                    onClick={() => {
                                        const file = useProjectStore.getState().sketchFile;
                                        performAnalysis(file);
                                    }}
                                    className="text-sm text-gray-500 hover:text-white transition-colors py-2"
                                >
                                    Skip & Auto-Analyze
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* DETECTED STATE */}
                    {state === STATES.DETECTED && analysis && (
                        <motion.div
                            key="detected"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col"
                        >
                            <div className="text-center mb-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center"
                                >
                                    <CheckCircle size={24} className="text-green-400" />
                                </motion.div>
                                <h3 className="font-medium text-white">
                                    {analysis.rooms?.length || 0} Rooms Detected
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Total Area: {analysis.floorPlan?.totalArea || 0} m²
                                </p>
                            </div>

                            {/* Detected Rooms List */}
                            <div className="flex-1 overflow-auto space-y-2">
                                {analysis.rooms?.map((room, i) => (
                                    <motion.div
                                        key={room.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-3 rounded-lg bg-studio-surface border border-studio-border"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-medium text-white text-sm">{room.label}</span>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {room.area} m² • {room.type.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                                {Math.round(room.confidence * 100)}%
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* FURNISHING STATE */}
                    {state === STATES.FURNISHING && (
                        <motion.div
                            key="furnishing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center"
                        >
                            <motion.div
                                className="relative w-20 h-20 mb-6"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            >
                                <Sparkles size={32} className="text-yellow-400 absolute inset-0 m-auto" />
                            </motion.div>

                            <h3 className="font-medium text-white mb-2">Auto-Furnishing...</h3>
                            <p className="text-sm text-gray-500 text-center">
                                Placing furniture based on Design & Build Library
                            </p>
                        </motion.div>
                    )}

                    {/* COMPLETE STATE */}
                    {state === STATES.COMPLETE && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
                            >
                                <CheckCircle size={32} className="text-green-400" />
                            </motion.div>

                            <h3 className="font-medium text-white mb-2">3D Model Ready!</h3>
                            <p className="text-sm text-gray-500 text-center mb-4">
                                Your floor plan has been converted to 3D with auto-furnishing
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="btn-secondary text-sm py-2 px-4"
                                >
                                    Upload Another
                                </button>
                                <button className="btn-pro text-sm py-2 px-4 flex items-center gap-2">
                                    View 3D Model
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ERROR STATE */}
                    {state === STATES.ERROR && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center"
                        >
                            <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                <AlertCircle size={32} className="text-red-400" />
                            </div>

                            <h3 className="font-medium text-white mb-2">Analysis Failed</h3>
                            <p className="text-sm text-red-400 text-center mb-4">
                                {error || 'An error occurred'}
                            </p>

                            <button
                                onClick={handleReset}
                                className="btn-secondary text-sm py-2 px-4"
                            >
                                Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Preview Thumbnail */}
            {previewUrl && state !== STATES.IDLE && (
                <div className="p-4 border-t border-studio-border">
                    <div className="flex items-center gap-3">
                        <img
                            src={previewUrl}
                            alt="Uploaded sketch"
                            className="w-16 h-16 rounded-lg object-cover border border-studio-border"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">Uploaded Sketch</p>
                            <p className="text-xs text-gray-500">Ready for 3D conversion</p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="p-2 rounded-lg hover:bg-studio-hover"
                        >
                            <X size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
