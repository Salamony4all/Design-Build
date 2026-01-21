import React, { useState, useCallback, useRef, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, CloudUpload, FileImage, FileScan, FileType,
    Brain, Sparkles, TrendingUp, Zap, Loader2, CheckCircle,
    Bot, Send, MessageCircle, Paperclip, Image as ImageIcon,
    Eye, Box, Palette, Camera, Download, Play, Settings, Layout,
    ChevronDown, ChevronUp, Wand2, Layers3, SunMedium,
    RotateCcw, Maximize2, ArrowRight, FileText, X, Menu, HelpCircle, Plus
} from 'lucide-react';
import { useUIStore, useProjectStore, useChatStore, useBOQStore, useSurveyorStore } from '../../store';
import { generateCompleteVisualization, editLayoutImage, fileToBase64, getMimeType } from '../../services/nanoPananaService';
import { generatePPTX } from '../../utils/exportUtils';

const Viewport3D = lazy(() => import('../3d/Viewport3D'));

// ============================================================================
// Helper Components
// ============================================================================

function WorkflowSteps({ currentStep }) {
    const steps = [
        { id: 1, label: 'Upload' },
        { id: 2, label: 'Analysis' },
        { id: 3, label: '3D Preview' }
    ];

    return (
        <div className="flex items-center gap-4 mb-12">
            {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                    <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${currentStep >= s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border border-gray-200 text-gray-400'}`}>
                            {currentStep > s.id ? <CheckCircle size={18} /> : s.id}
                        </div>
                        <span className={`text-[15px] font-semibold ${currentStep >= s.id ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
                    </div>
                    {idx < steps.length - 1 && <div className={`w-12 h-[2px] rounded-full ${currentStep > s.id ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
            ))}
        </div>
    );
}

// ============================================================================
// Render Settings Panel - Dropdowns for customizing AI prompt
// ============================================================================

// Default prompt template - editable by user
const DEFAULT_RENDER_PROMPT = `Generate 3d`;

const RENDER_PRESETS = {
    cameraViews: [
        { value: 'eye-level', label: 'Eye-level View', desc: 'Human perspective at standing height' },
        { value: 'birds-eye', label: "Bird's Eye View", desc: 'Aerial overview of the space' },
        { value: 'isometric', label: 'Isometric', desc: 'Technical 45° angle view' },
        { value: 'corner', label: 'Corner Perspective', desc: 'Two-point perspective from corner' },
        { value: 'wide-angle', label: 'Wide Angle', desc: 'Expansive ultra-wide capture' },
    ],
    lighting: [
        { value: 'golden-hour', label: 'Golden Hour', desc: 'Warm sunset light streaming through windows' },
        { value: 'daylight', label: 'Bright Daylight', desc: 'Natural midday sunlight' },
        { value: 'evening', label: 'Evening Ambiance', desc: 'Soft warm artificial lighting' },
        { value: 'overcast', label: 'Overcast Soft', desc: 'Diffused natural light, no harsh shadows' },
        { value: 'night', label: 'Night Mode', desc: 'Dramatic artificial lighting' },
    ],
    materials: [
        { value: 'polished-concrete', label: 'Polished Concrete' },
        { value: 'oak-wood-slats', label: 'Oak Wood Slats' },
        { value: 'carrara-marble', label: 'Carrara Marble' },
        { value: 'brushed-steel', label: 'Brushed Steel' },
        { value: 'floor-to-ceiling-glass', label: 'Floor-to-Ceiling Glass' },
        { value: 'walnut-veneer', label: 'Walnut Veneer' },
        { value: 'travertine-stone', label: 'Travertine Stone' },
        { value: 'brass-accents', label: 'Brass Accents' },
        { value: 'white-plaster', label: 'White Plaster' },
        { value: 'exposed-brick', label: 'Exposed Brick' },
    ]
};

function RenderSettingsPanel({ settings, onSettingsChange, hasFirstRender }) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateSetting = (key, value) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    // Hide settings after first render (user can use chat for fine-tuning)
    if (hasFirstRender) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[900px] mx-auto mb-8"
        >
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <Settings size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Render Settings</h3>
                        <p className="text-sm text-gray-500">Customize your 3D visualization</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Camera View */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Camera size={16} className="text-blue-500" />
                            Camera View
                        </label>
                        <select
                            value={settings.cameraView}
                            onChange={(e) => updateSetting('cameraView', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {RENDER_PRESETS.cameraViews.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lighting */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <SunMedium size={16} className="text-amber-500" />
                            Lighting
                        </label>
                        <select
                            value={settings.lighting}
                            onChange={(e) => updateSetting('lighting', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {RENDER_PRESETS.lighting.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Material 1 */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Palette size={16} className="text-purple-500" />
                            Primary Material
                        </label>
                        <select
                            value={settings.material1}
                            onChange={(e) => updateSetting('material1', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {RENDER_PRESETS.materials.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Material 2 */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Layers3 size={16} className="text-green-500" />
                            Secondary Material
                        </label>
                        <select
                            value={settings.material2}
                            onChange={(e) => updateSetting('material2', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {RENDER_PRESETS.materials.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Preview of generated prompt */}
                <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-mono text-gray-500 leading-relaxed">
                        <span className="text-blue-600 font-semibold">Preview:</span> {settings.cameraView.replace('-', ' ')} perspective • {settings.lighting.replace('-', ' ')} lighting • {settings.material1.replace(/-/g, ' ')} + {settings.material2.replace(/-/g, ' ')}
                    </p>
                </div>

                {/* Advanced Settings - Editable Default Prompt */}
                <div className="mt-6">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        Advanced Settings
                    </button>

                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-4 space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                        <FileText size={16} className="text-gray-500" />
                                        Default Prompt Template
                                    </label>
                                    <p className="text-xs text-gray-400">
                                        Use placeholders: <code className="bg-gray-100 px-1 rounded">{'{{CAMERA}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{MATERIAL1}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{MATERIAL2}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{LIGHTING}}'}</code>
                                    </p>
                                    <textarea
                                        value={settings.customPrompt || DEFAULT_RENDER_PROMPT}
                                        onChange={(e) => updateSetting('customPrompt', e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                                        placeholder="Enter your custom prompt template..."
                                    />
                                    <button
                                        onClick={() => updateSetting('customPrompt', DEFAULT_RENDER_PROMPT)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

// Helper to build the full prompt from settings
function buildRenderPrompt(settings) {
    const cameraLabel = RENDER_PRESETS.cameraViews.find(c => c.value === settings.cameraView)?.label || 'Eye-level View';
    const lightingOption = RENDER_PRESETS.lighting.find(l => l.value === settings.lighting);
    const lightingDesc = lightingOption?.desc || 'Natural golden hour light streaming through windows';
    const mat1 = settings.material1.replace(/-/g, ' ');
    const mat2 = settings.material2.replace(/-/g, ' ');

    // Use custom prompt if set, otherwise use default
    const template = settings.customPrompt || DEFAULT_RENDER_PROMPT;

    // Replace placeholders with actual values
    return template
        .replace(/\{\{CAMERA\}\}/g, cameraLabel)
        .replace(/\{\{MATERIAL1\}\}/g, mat1)
        .replace(/\{\{MATERIAL2\}\}/g, mat2)
        .replace(/\{\{LIGHTING\}\}/g, lightingDesc);
}

function RenderEngineSimulation({ processingStatus, progress }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center justify-center py-20">
            <div className="relative w-80 h-80 flex items-center justify-center mb-12">
                {/* Modern Throbber */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
                    <motion.circle
                        cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="12" fill="transparent"
                        className="text-blue-600"
                        strokeDasharray="880"
                        animate={{ strokeDashoffset: 880 - (8.8 * progress) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-gray-900">{progress}%</span>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">{processingStatus.title || 'Rendering'}</span>
                </div>

                {/* Floating Particles Simulation */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-x-[-40px] inset-y-[-40px] border-[1px] border-dashed border-blue-200 rounded-full opacity-40"
                />
            </div>

            {/* Slow Graphic Color Shifting Section */}
            <div className="w-full max-w-[900px] h-[400px] rounded-[48px] overflow-hidden relative shadow-2xl border border-white/50 bg-gray-900 group">
                <motion.div
                    animate={{
                        background: [
                            'linear-gradient(45deg, #1a1a2e, #16213e)',
                            'linear-gradient(135deg, #16213e, #0f3460)',
                            'linear-gradient(225deg, #0f3460, #533483)',
                            'linear-gradient(315deg, #533483, #1a1a2e)'
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                />

                {/* Wireframe Grid Animation */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-20">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center mb-6 border border-white/20">
                        <Loader2 className="animate-spin text-white" size={40} />
                    </div>
                    <h4 className="text-3xl font-bold !text-white mb-4 opacity-100">{processingStatus.message || 'Initializing Render Engine...'}</h4>
                    <div className="flex gap-2">
                        {['LIGHTING', 'GEOMETRY', 'MATERIALS', 'RAYTRACING'].map((tag, i) => (
                            <span key={tag} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-blue-400 tracking-tighter">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ImageModal({ src, onClose }) {
    if (!src) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-black/40 backdrop-blur-xl cursor-zoom-out"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full relative rounded-[32px] overflow-hidden shadow-[0_48px_180px_rgba(0,0,0,0.5)] bg-white/5"
            >
                <img src={src} alt="Preview" className="max-w-[92vw] max-h-[92vh] object-contain" />
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-4 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all shadow-2xl"
                >
                    <X size={28} />
                </button>
            </motion.div>
        </motion.div>
    );
}

function NanoPananaChat({
    uploadedFiles,
    handleSend,
    handleFullProcess,
    inputValue,
    setInputValue,
    generatedRender,
    setGeneratedRender,
    renderError,
    isProcessing,
    processingStatus,
    setProcessingStatus,
    onSuccess,
    inputOnly,
    viewOnly,
    workflowStep,
    onFileUpload,
    isGeneratingRender,
    setIsGeneratingRender,
    onRemoveFile,
    onImageClick,
    customPrompt,
    onFirstRenderComplete,
    hasFirstRender
}) {
    const renderMode = useProjectStore(s => s.nanoPananaMode || 'render');
    const { messages, isTyping, sendMessage, addMessage } = useChatStore();
    const openModal = useUIStore(s => s.openModal);
    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isGeneratingRender, isProcessing]);

    const handlePlusClick = () => fileInputRef.current?.click();
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) onFileUpload?.(files);
    };

    if (viewOnly) {
        return (
            <div className="w-full space-y-12">
                {(isProcessing || isGeneratingRender) && (
                    <RenderEngineSimulation processingStatus={processingStatus} progress={processingStatus.progress || 10} />
                )}
                <div ref={scrollRef} className="space-y-12">
                    {messages.map((msg, idx) => {
                        // Find if this is the latest processable assistant message
                        const allProcessableIndices = messages.reduce((acc, m, i) => m.canProcess ? [...acc, i] : acc, []);
                        const isLatestProcessable = msg.canProcess && idx === allProcessableIndices[allProcessableIndices.length - 1];

                        return (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                                <div className={`max-w-[95%] md:max-w-[85%] rounded-[24px] md:rounded-[48px] px-6 py-4 md:px-16 md:py-10 text-[16px] md:text-[20px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-200/50' : 'bg-white text-gray-800 border border-gray-100'}`}>
                                    {msg.content}
                                    {msg.image && (
                                        <div className="mt-6 md:mt-10 flex flex-col gap-4 md:gap-6">
                                            <div className="rounded-[20px] md:rounded-[38px] overflow-hidden shadow-2xl cursor-zoom-in group relative" onClick={() => onImageClick?.(msg.image)}>
                                                <img src={msg.image} alt="Generated" className="w-full transition-transform duration-700 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                                                </div>
                                            </div>

                                            {isLatestProcessable && (
                                                <button
                                                    disabled={isGeneratingRender}
                                                    onClick={() => handleFullProcess(msg.associatedFile, msg.associatedPrompt, msg.associatedRender)}
                                                    className={`self-center flex items-center gap-3 px-6 py-3 md:px-12 md:py-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-base md:text-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group ${isGeneratingRender ? 'opacity-50 cursor-not-allowed shadow-none scale-100' : 'shadow-xl'
                                                        }`}
                                                >
                                                    {isGeneratingRender ? (
                                                        <Loader2 size={24} className="animate-spin" />
                                                    ) : (
                                                        <Zap className="group-hover:animate-pulse" size={24} fill="currentColor" />
                                                    )}
                                                    <span>{isGeneratingRender ? 'Processing...' : 'Process Design'}</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {msg.canExport && (
                                        <div className="mt-8 flex justify-center">
                                            <button
                                                onClick={() => openModal('export')}
                                                className="flex items-center gap-3 md:gap-4 px-8 py-4 md:px-12 md:py-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-base md:text-xl font-bold hover:shadow-2xl hover:scale-105 transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                                            >
                                                <Download size={28} className="group-hover:animate-bounce" />
                                                <span>Export Package</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={bottomRef} className="h-10" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 pb-8 md:pb-12 flex flex-col items-center">
            {/* File Previews - Large High-Detail Floating Thumbs */}
            {/* Tray shows either the Latest Render (Primary) or Uploaded Files */}
            {generatedRender ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative flex flex-col items-center bg-white border border-purple-500/50 rounded-[32px] p-4 shadow-2xl shadow-purple-500/10 transition-all border-b-4 border-b-purple-500"
                >
                    <div className="w-32 h-32 rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center text-purple-600 relative shrink-0">
                        <img src={generatedRender} alt="Latest Design" className="w-full h-full object-cover cursor-zoom-in" onClick={() => onImageClick?.(generatedRender)} />
                        <button
                            onClick={(e) => { e.stopPropagation(); setGeneratedRender(null); }}
                            title="Clear design and go back to upload"
                            className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                        <div className="absolute bottom-2 right-2 bg-purple-600 text-[10px] text-white font-bold px-3 py-1 rounded-full shadow-lg">ACTIVE</div>
                    </div>
                    <div className="mt-4 flex flex-col items-center">
                        <span className="text-[13px] font-bold text-gray-800 max-w-[120px] truncate leading-tight">AI Render Context</span>
                        <span className="text-[10px] text-purple-400 font-mono uppercase tracking-widest mt-1">LATEST ITERATION</span>
                    </div>
                </motion.div>
            ) : (
                uploadedFiles.map((file, idx) => {
                    const isImage = file.type?.startsWith('image/');
                    const previewUrl = isImage ? URL.createObjectURL(file) : null;

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={idx}
                            className="group relative flex flex-col items-center bg-white border border-gray-100 rounded-[32px] p-4 shadow-2xl shadow-black/[0.05] hover:shadow-blue-500/10 transition-all border-b-4 border-b-blue-500/20"
                        >
                            <div className="w-32 h-32 rounded-[24px] overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center text-blue-600 relative shrink-0">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover cursor-zoom-in" onClick={() => onImageClick?.(previewUrl)} />
                                ) : (
                                    <FileText size={48} strokeWidth={1.5} />
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFile?.(idx); }}
                                    className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="mt-4 flex flex-col items-center">
                                <span className="text-[13px] font-bold text-gray-800 max-w-[120px] truncate leading-tight">{file.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-1">{(file.size / 1024).toFixed(0)} KB</span>
                            </div>
                        </motion.div>
                    )
                })
            )}

            <div className="bg-white rounded-[32px] md:rounded-[64px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-700 focus-within:shadow-[0_48px_160px_rgba(0,0,0,0.12)] relative w-full max-w-[1100px]">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,.pdf,.dwg,.dxf" />
                <div className="flex flex-col w-full px-6 md:px-24 lg:px-36 py-8 md:py-24">
                    {/* Input Area - Hidden before first render if files uploaded (use settings panel instead) */}
                    {(hasFirstRender || uploadedFiles.length === 0) && (
                        <div className="w-full flex justify-center">
                            <div className="w-full max-w-[900px] px-4">
                                <textarea
                                    rows={1}
                                    value={inputValue}
                                    style={{ minHeight: '80px', maxHeight: '400px' }}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 400) + 'px';
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    placeholder={hasFirstRender ? "Refine your design..." : "Ask Design & Build"}
                                    className="w-full bg-transparent border-none p-0 text-[18px] md:text-[24px] text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50 resize-none font-semibold leading-relaxed custom-scrollbar shadow-none text-center"
                                />
                            </div>
                        </div>
                    )}

                    {/* Aligned Tools Row - Vertically Stacked Center Control */}
                    <div className="flex flex-col items-center gap-6 pt-12 pb-2">
                        <button
                            onClick={handlePlusClick}
                            className="p-5 rounded-[24px] hover:bg-black/[0.05] text-gray-500 transition-all active:scale-95 bg-white shadow-sm border border-gray-100 flex items-center justify-center group overflow-hidden relative"
                        >
                            <Plus size={28} className="relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {(inputValue.trim() || uploadedFiles.length > 0) && (
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                onClick={handleSend}
                                className={`flex items-center gap-3 px-8 py-4 rounded-full transition-all active:scale-95 group shadow-lg ${uploadedFiles.length > 0 && !hasFirstRender
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-200'
                                    : 'bg-[#F0F4F9] text-gray-900 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {uploadedFiles.length > 0 && !hasFirstRender ? (
                                    <>
                                        <Box size={22} />
                                        <span className="font-bold text-lg">Generate 3D</span>
                                    </>
                                ) : (
                                    <Send size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                )}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Preview3DSection({ onShowViewport }) {
    const openModal = useUIStore(s => s.openModal);

    const handleExport = () => {
        openModal('export');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8 md:space-y-12 text-center mt-8 md:mt-12 mb-20 md:mb-32 relative z-20">
            <div className="p-8 md:p-16 lg:p-24 rounded-[32px] md:rounded-[64px] bg-white border border-gray-100 shadow-xl overflow-hidden relative group max-w-[1100px] mx-auto transition-all hover:shadow-[0_48px_160px_rgba(0,0,0,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm"><CheckCircle size={32} /></div>
                    <div>
                        <h3 className="text-2xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4 tracking-tight">Design Architecture Ready</h3>
                        <p className="text-sm md:text-xl text-gray-400 font-medium font-mono uppercase tracking-widest text-[12px] md:text-[14px]">Immersive 3D Experience & BOQ Generated</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mt-4 md:mt-6">
                        <button onClick={onShowViewport} className="flex items-center gap-3 md:gap-4 px-8 py-4 md:px-12 md:py-6 rounded-[16px] md:rounded-[24px] bg-blue-600 text-white text-lg md:text-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95">
                            <Box size={24} />
                            <span>Enter Viewport</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-3 md:gap-4 px-8 py-4 md:px-12 md:py-6 rounded-[16px] md:rounded-[24px] bg-white text-gray-900 border border-gray-200 text-lg md:text-xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                            <Download size={24} />
                            <span>Export Package</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ViewportMode({ onClose }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between px-10 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_-2px_4px_rgba(0,0,0,0.1)] border border-white/20">
                        <img
                            src="/logo.jpg"
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Virtual Preview</h2>
                        <p className="text-sm text-gray-400 font-mono uppercase tracking-[0.2em]">Photorealistic Engine</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-4 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"><X size={32} /></button>
            </div>
            <div className="flex-1 bg-gray-50 relative overflow-hidden">
                <Suspense fallback={<div className="h-full flex flex-col items-center justify-center gap-6 bg-white"><Loader2 className="animate-spin text-blue-600" size={64} /><p className="text-xl font-bold text-gray-400">Booting Render Core...</p></div>}>
                    <Viewport3D />
                </Suspense>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN WORKSPACE COMPONENT
// ============================================================================

export default function MainWorkspace() {
    const [workflowStep, setWorkflowStep] = useState(1);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isGeneratingRender, setIsGeneratingRender] = useState(false);
    const [processingStatus, setProcessingStatus] = useState({ title: '', message: '', progress: 0 });
    const [showViewport, setShowViewport] = useState(false);
    const [hasFirstRender, setHasFirstRender] = useState(false);

    // Render settings for customizable prompt
    const [renderSettings, setRenderSettings] = useState({
        cameraView: 'eye-level',
        lighting: 'golden-hour',
        material1: 'polished-concrete',
        material2: 'oak-wood-slats'
    });

    const toggleLeftSidebar = useUIStore(s => s.toggleLeftSidebar);
    const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);

    const [modalImage, setModalImage] = useState(null);

    const [inputValue, setInputValue] = useState('');
    const [generatedRender, setGeneratedRender] = useState(null);
    const [renderError, setRenderError] = useState(null);
    const renderMode = useProjectStore(s => s.nanoPananaMode || 'render');

    const { messages, sendMessage, addMessage } = useChatStore();
    const addNotification = useUIStore(s => s.addNotification);

    const handleFileUpload = (files) => {
        setUploadedFiles(prev => [...prev, ...files]);
        setWorkflowStep(2);
    };

    const handleRemoveFile = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Build the customized prompt from settings
    const getCustomPrompt = () => buildRenderPrompt(renderSettings);

    const handleSend = async () => {
        const canIterate = uploadedFiles.length > 0 || generatedRender;
        if (!inputValue.trim() && !canIterate) return;

        // Use custom prompt from settings for first render, or user input for subsequent ones
        const promptToUse = hasFirstRender ? inputValue : (getCustomPrompt() || inputValue || 'Generate 3d');

        if (canIterate) {
            // Add user message manually - only once
            if (inputValue.trim()) {
                addMessage?.({ role: 'user', content: inputValue });
                setInputValue('');
            }

            setIsGeneratingRender(true);
            setRenderError(null);

            setProcessingStatus({ title: 'Fast Visualization', message: 'Generating architectural preview...', progress: 10 });

            try {
                // STAGE 1: FAST PREVIEW (Image Only)
                addMessage?.({ role: 'assistant', content: '🎨 Generating fast photorealistic preview...' });

                // Use latest render if available for iterative editing
                const base64Data = generatedRender
                    ? generatedRender.split(',')[1]
                    : await fileToBase64(uploadedFiles[0]);
                const mimeType = generatedRender ? 'image/png' : getMimeType(uploadedFiles[0]);

                const renderUrl = await editLayoutImage(base64Data, mimeType, promptToUse);

                if (renderUrl) {
                    setGeneratedRender(renderUrl);

                    addMessage?.({
                        role: 'assistant',
                        content: '✨ Preview ready! Click "Process" below to start full 3D extraction and analysis for this latest design version.',
                        image: renderUrl,
                        canProcess: true,
                        associatedFile: uploadedFiles[0],
                        associatedRender: renderUrl,
                        associatedPrompt: promptToUse
                    });

                    if (!hasFirstRender) {
                        setHasFirstRender(true);
                        // Clear original uploaded files once AI Render takes over as source
                        if (uploadedFiles.length > 0) {
                            setUploadedFiles([]);
                        }
                    }
                }
            } catch (error) {
                setRenderError(error.message);
                addMessage?.({ role: 'assistant', content: `❌ Render failed: ${error.message}` });
            } finally {
                setIsGeneratingRender(false);
            }
        } else {
            // For generic chat (no file/render), use standard sendMessage which handles its own user message adding
            sendMessage?.(inputValue);
            setInputValue('');
        }
    };

    const handleFullProcess = async (file, prompt, renderUrl) => {
        if (!file && !renderUrl) return;

        setIsGeneratingRender(true);
        setRenderError(null);

        // Clear previous project data
        const projectStore = useProjectStore.getState();
        if (projectStore.clearNanoPananaRenders) projectStore.clearNanoPananaRenders();

        setProcessingStatus({ title: 'Full Analysis', message: 'Starting detailed architectural extraction...', progress: 5 });

        try {
            addMessage?.({ role: 'assistant', content: '🚀 Starting full 3D workflow (BOQ, Analysis, 3D Geometry)...' });

            let processingFile = file;
            if (renderUrl) {
                const res = await fetch(renderUrl);
                const blob = await res.blob();
                processingFile = new File([blob], "design_version.png", { type: "image/png" });
            }

            const visualization = await generateCompleteVisualization(processingFile, prompt, (progData) => {
                const { progress, stage, message } = progData;
                setProcessingStatus({
                    title: stage || 'Analyzing Space',
                    message: message || 'Extracting geometry...',
                    progress
                });
            }, renderMode);

            if (visualization.render) setGeneratedRender(visualization.render);

            if (useProjectStore.getState().setProjectData) {
                const standardWalls = visualization.sceneData?.walls?.map((w, i) => ({
                    id: w.id || `np-wall-${i}`,
                    layer: 'A-WALL',
                    position: { x: (w.start.x + w.end.x) / 2, y: w.height / 2, z: (w.start.y + w.end.y) / 2 },
                    dimensions: {
                        width: Math.sqrt(Math.pow(w.end.x - w.start.x, 2) + Math.pow(w.end.y - w.start.y, 2)),
                        height: w.height,
                        depth: w.thickness
                    },
                    rotation: Math.atan2(w.end.y - w.start.y, w.end.x - w.start.x)
                })) || [];

                const standardFurniture = visualization.sceneData?.furniture?.map((f, i) => ({
                    id: f.id || `np-furn-${i}`,
                    type: f.type,
                    position: { x: f.position.x, y: 0, z: f.position.y },
                    rotation: { x: 0, y: f.rotation, z: 0 },
                    scale: f.scale
                })) || [];

                useProjectStore.setState({
                    sceneData3D: visualization.sceneData,
                    analysisResult: visualization.analysisResult,
                    walls3D: standardWalls,
                    placedFurniture: standardFurniture,
                    rooms3D: visualization.rooms || [],
                    workflowPhase: 'ready',
                    nanoPananaRenders: visualization.render ? [{ image: visualization.render, title: 'Main Visualization' }] : [],
                    sketchPreviewUrl: file ? (typeof file === 'string' ? file : URL.createObjectURL(file)) : null,
                    nanoBananaData: {
                        boqItems: visualization.boqItems || [],
                        materials: visualization.materials || [],
                        materialPalette: visualization.materialPalette || [],
                        architectInsights: visualization.architectInsights || {},
                        designPhilosophy: visualization.designPhilosophy || ''
                    }
                });
            }

            if (visualization.boqItems?.length > 0) {
                const bStore = (await import('../../store')).useBOQStore.getState();
                bStore.clearScene();
                visualization.boqItems.forEach((item, index) => {
                    bStore.addItemToScene({
                        code: item.itemCode || `AUTO-${index + 1}`,
                        name: item.name,
                        description: item.description,
                        category: item.category || 'General',
                        rate: item.estimatedRate || 0,
                        unit: item.unit || 'nos'
                    }, item.quantity || 1, { x: 0, y: 0, z: 0 });
                });
            }

            addMessage?.({ role: 'assistant', content: '✅ Full analysis complete! All 3D assets and BOQ are now ready.', canExport: true });
            addNotification?.({ type: 'success', title: 'Analysis Complete', message: 'Project assets and exports are ready.' });
            setWorkflowStep(3);

        } catch (error) {
            setRenderError(error.message);
            addMessage?.({ role: 'assistant', content: `❌ Analysis failed: ${error.message}` });
        } finally {
            setIsGeneratingRender(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F0F4F9] overflow-hidden relative">
            {/* Ambient Background Sketch */}
            <div className="absolute inset-0 opacity-30 pointer-events-none select-none z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/graphy.png')", backgroundSize: '200px' }} />

            {/* Premium Header */}
            <header className="flex-shrink-0 flex items-center justify-between px-10 py-8 relative z-20">
                <div className="flex items-center gap-6">
                    <button onClick={toggleLeftSidebar} className="p-4 rounded-full hover:bg-black/5 transition-colors text-gray-600"><Menu size={28} /></button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[14px] overflow-hidden border border-white/20 shadow-[0_12px_24px_rgba(26,115,232,0.15),inset_0_-2px_4px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 cursor-pointer">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Design & Build</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-4 hover:bg-black/5 rounded-full transition-colors text-gray-500"><HelpCircle size={28} /></button>
                    <button onClick={toggleRightSidebar} className="p-4 hover:bg-black/5 rounded-full transition-colors text-gray-500"><Settings size={28} /></button>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold border-4 border-white shadow-xl ml-4">M</div>
                </div>
            </header>

            {/* Main Content Area - Perfectly Centered */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth flex flex-col items-center px-4 md:px-8">
                <div className="w-full max-w-[1200px] mx-auto min-h-full flex flex-col items-center pb-32 pt-16 text-center">

                    {/* Welcome Screen */}
                    {messages.length <= 1 && (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center mb-32 shrink-0">
                            <div className="mb-12">
                                <h1 className="text-[56px] lg:text-[72px] font-bold tracking-tight leading-tight mb-4">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a73e8] via-[#a142f4] to-[#ea4335]">
                                        Hello, Architect
                                    </span>
                                </h1>
                                <p className="text-[32px] lg:text-[48px] font-semibold leading-tight text-gray-300">
                                    How can I help you design today?
                                </p>
                            </div>

                            {/* Suggestion Cards - High Padding & Centered Presentation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 w-full max-w-[1400px] px-10">
                                {[
                                    { title: "Improve aesthetics", desc: "Refine textures and lighting for premium results and world-class finishes", icon: Wand2, color: "text-[#1a73e8]", bg: "bg-blue-50/50" },
                                    { title: "Generate 3D plans", desc: "Convert 2D layouts into production-ready immersive 3D architectures", icon: Box, color: "text-[#a142f4]", bg: "bg-purple-50/50" },
                                    { title: "Source materials", desc: "Identify and source the best professional materials for your project", icon: Palette, color: "text-[#fbbc04]", bg: "bg-amber-50/50" },
                                    { title: "Estimate costs", desc: "Get real-time financial insights and BOQ data for your global design", icon: TrendingUp, color: "text-[#34a853]", bg: "bg-green-50/50" }
                                ].map((card, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ y: -16, scale: 1.02, backgroundColor: 'white', border: '1px solid #E2E8F0', boxShadow: '0 64px 180px rgba(0,0,0,0.12)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`group p-16 rounded-[64px] ${card.bg} border border-transparent transition-all text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[440px]`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform group-hover:scale-110 ${card.color} bg-white shadow-sm border border-gray-50 mx-auto`}>
                                            <card.icon size={28} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight leading-snug">{card.title}</h3>
                                        <p className="text-[16px] text-gray-500 leading-relaxed font-medium opacity-60 group-hover:opacity-100 transition-opacity max-w-[240px] mx-auto">{card.desc}</p>
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/30 to-transparent rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Active Session Content */}
                    <div className={`w-full ${messages.length <= 1 && !isProcessing && !isGeneratingRender ? 'hidden' : 'flex-1 flex flex-col items-center'}`}>
                        <WorkflowSteps currentStep={workflowStep} />
                        <div className="w-full space-y-16 mb-40">
                            <NanoPananaChat
                                viewOnly={true}
                                uploadedFiles={uploadedFiles}
                                handleSend={handleSend}
                                handleFullProcess={handleFullProcess}
                                inputValue={inputValue}
                                setInputValue={setInputValue}
                                generatedRender={generatedRender}
                                setGeneratedRender={setGeneratedRender}
                                renderError={renderError}
                                isProcessing={isProcessing}
                                processingStatus={processingStatus}
                                setProcessingStatus={setProcessingStatus}
                                workflowStep={workflowStep}
                                isGeneratingRender={isGeneratingRender}
                                setIsGeneratingRender={setIsGeneratingRender}
                                onImageClick={setModalImage}
                                customPrompt={getCustomPrompt()}
                                onFirstRenderComplete={() => setHasFirstRender(true)}
                                hasFirstRender={hasFirstRender}
                            />
                            {workflowStep === 3 && <Preview3DSection onShowViewport={() => setShowViewport(true)} />}
                        </div>
                    </div>

                    {/* Chatbox Pillar - Anchored Bottom & Precisely Centered */}
                    <AnimatePresence>
                        {!(isProcessing || isGeneratingRender) && (
                            <motion.div
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                className="w-full mt-auto sticky bottom-0 pt-20 pb-12 bg-gradient-to-t from-[#F0F4F9] via-[#F0F4F9] to-transparent flex flex-col items-center px-10 z-[30]"
                            >
                                {/* Render Settings Panel - Shows only before first render when files are uploaded */}
                                {uploadedFiles.length > 0 && !hasFirstRender && (
                                    <RenderSettingsPanel
                                        settings={renderSettings}
                                        onSettingsChange={setRenderSettings}
                                        hasFirstRender={hasFirstRender}
                                    />
                                )}

                                <div className="w-full max-w-[1200px]">
                                    <NanoPananaChat
                                        inputOnly={true}
                                        uploadedFiles={uploadedFiles}
                                        handleSend={handleSend}
                                        handleFullProcess={handleFullProcess}
                                        inputValue={inputValue}
                                        setInputValue={setInputValue}
                                        generatedRender={generatedRender}
                                        setGeneratedRender={setGeneratedRender}
                                        renderError={renderError}
                                        onFileUpload={handleFileUpload}
                                        isProcessing={isProcessing}
                                        processingStatus={processingStatus}
                                        setProcessingStatus={setProcessingStatus}
                                        workflowStep={workflowStep}
                                        onSuccess={() => setWorkflowStep(3)}
                                        isGeneratingRender={isGeneratingRender}
                                        setIsGeneratingRender={setIsGeneratingRender}
                                        onRemoveFile={handleRemoveFile}
                                        onImageClick={setModalImage}
                                        customPrompt={getCustomPrompt()}
                                        onFirstRenderComplete={() => setHasFirstRender(true)}
                                        hasFirstRender={hasFirstRender}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <AnimatePresence>{showViewport && <ViewportMode onClose={() => setShowViewport(false)} />}</AnimatePresence>
            <AnimatePresence>{modalImage && <ImageModal src={modalImage} onClose={() => setModalImage(null)} />}</AnimatePresence>
        </div>
    );
}
