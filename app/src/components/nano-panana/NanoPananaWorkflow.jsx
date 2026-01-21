/**
 * Nano Panana Workflow Component
 * 
 * Complete workflow for:
 * 1. Upload layout plan, sketch, drawing (PDF/Image)
 * 2. Generate hyper-realistic renders using default pro prompt
 * 3. Preview renders with real-time chat editing
 * 4. Export integration with full render gallery
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Image as ImageIcon, FileText, Wand2, Send, Download,
    Maximize2, RefreshCcw, Loader2, CheckCircle, AlertCircle,
    Sparkles, Camera, Palette, ChevronDown, X, Eye, Box,
    Settings2, Lightbulb, Layers, SlidersHorizontal, Save
} from 'lucide-react';
import { useProjectStore, useUIStore, useChatStore } from '../../store';
import {
    editLayoutImage,
    generateCompleteVisualization,
    isNanoPananaConfigured,
    DEFAULT_NANO_PANANA_PROMPT,
    STYLE_PRESETS
} from '../../services/nanoPananaService';

// Pro Tips for users
const PRO_TIPS = [
    { icon: '📐', tip: 'Scale Reference: Note ceiling height (e.g., "10ft ceilings") for accurate proportions' },
    { icon: '✏️', tip: 'Contrast: Use dark, clear lines in sketches - faint lines may be misinterpreted' },
    { icon: '🎨', tip: 'Style Keywords: Add aesthetic (Japandi, Brutalist, Mid-Century) after Materials' },
];

export default function NanoPananaWorkflow({ onRenderComplete, onExportReady }) {
    // State management
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [renders, setRenders] = useState([]); // Array of generated renders
    const [activeRender, setActiveRender] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState('');
    const [error, setError] = useState(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('luxury');
    const [showStyleDropdown, setShowStyleDropdown] = useState(false);
    const [showProTips, setShowProTips] = useState(true);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    // Refs
    const fileInputRef = useRef(null);
    const chatScrollRef = useRef(null);

    // Store hooks
    const { addNotification } = useUIStore();
    const { setNanoPananaRenders } = useProjectStore();
    const { addMessage } = useChatStore();

    // Auto-scroll chat
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // Handle file upload
    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid image (PNG, JPG, WebP) or PDF file');
            return;
        }

        setUploadedFile(file);
        setError(null);
        setShowProTips(false);

        // Create preview
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setUploadPreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setUploadPreview(null); // PDF preview not supported inline
        }

        // Add to chat
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            type: 'system',
            content: `📄 Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        }]);
    }, []);

    // Build the full prompt
    const buildFullPrompt = useCallback(() => {
        let prompt = DEFAULT_NANO_PANANA_PROMPT;

        // Add selected style
        if (selectedStyle && STYLE_PRESETS[selectedStyle]) {
            prompt += `\n\nDesign Style: ${STYLE_PRESETS[selectedStyle]}`;
        }

        // Add custom modifications
        if (customPrompt.trim()) {
            prompt += `\n\nCustom Requirements: ${customPrompt.trim()}`;
        }

        return prompt;
    }, [selectedStyle, customPrompt]);

    // Generate render
    const handleGenerateRender = useCallback(async () => {
        if (!uploadedFile || !isNanoPananaConfigured()) {
            setError('Please upload a file and ensure API is configured');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGenerationProgress('Preparing layout analysis...');

        // Add to chat
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: `🎨 Generate render with ${selectedStyle} style${customPrompt ? `: ${customPrompt}` : ''}`
        }]);

        try {
            // Convert file to base64
            setGenerationProgress('Reading layout file...');
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });

            const mimeType = uploadedFile.type || 'image/png';
            const fullPrompt = buildFullPrompt();

            setGenerationProgress('Generating 3D model & 8K render (20-40s)...');

            // Generate both 3D data and render
            const visualization = await generateCompleteVisualization(
                uploadedFile,
                fullPrompt,
                (progress) => {
                    setGenerationProgress(`${progress.stage}: ${progress.progress}%`);
                }
            );

            const renderResult = visualization.render;

            // Create render object
            const newRender = {
                id: `render-${Date.now()}`,
                image: renderResult,
                timestamp: new Date().toISOString(),
                style: selectedStyle,
                prompt: customPrompt || 'Default professional prompt',
                sourceFile: uploadedFile.name,
                sceneData: visualization.sceneData // Store 3D data with render
            };

            // Update state
            setRenders(prev => [newRender, ...prev]);
            setActiveRender(newRender);

            // Store for export and global 3D view
            if (setNanoPananaRenders) {
                setNanoPananaRenders(prev => [...(prev || []), newRender]);
            }

            // CRITICAL: Update global 3D scene data so Viewport3D shows it
            if (useProjectStore.getState().setProjectData && visualization.sceneData) {
                useProjectStore.getState().setProjectData({
                    sceneData3D: visualization.sceneData,
                    analysisResult: visualization.analysisResult,
                    rooms3D: visualization.rooms || []
                });
            }

            // Notify parent
            if (onRenderComplete) {
                onRenderComplete(visualization);
            }

            // Add to chat
            setChatMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                content: '✨ Render complete! Click to view full size or continue editing below.',
                image: renderResult
            }]);

            addNotification?.({
                type: 'success',
                title: 'Render Complete!',
                message: 'Your hyper-realistic visualization is ready'
            });

        } catch (err) {
            console.error('[NanoPananaWorkflow] Error:', err);
            setError(err.message || 'Failed to generate render');

            setChatMessages(prev => [...prev, {
                id: Date.now(),
                type: 'error',
                content: `❌ Generation failed: ${err.message}`
            }]);
        } finally {
            setIsGenerating(false);
            setGenerationProgress('');
        }
    }, [uploadedFile, selectedStyle, customPrompt, buildFullPrompt, addNotification, onRenderComplete, setNanoPananaRenders]);

    // Handle chat edits
    const handleChatSend = useCallback(async () => {
        if (!chatInput.trim() || !activeRender) return;

        const editPrompt = chatInput.trim();
        setChatInput('');

        // Add user message
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: `✏️ Edit: ${editPrompt}`
        }]);

        setIsGenerating(true);
        setGenerationProgress('Applying modifications...');

        try {
            // Get active render's base64
            const base64 = activeRender.image.split(',')[1];
            const mimeType = 'image/png';

            // Build edit prompt
            const editFullPrompt = `Modify this architectural render according to the following request while maintaining photorealistic quality:

${editPrompt}

Preserve the original perspective, lighting quality, and professional finish. Make only the requested changes.`;

            const editedRender = await editLayoutImage(base64, mimeType, editFullPrompt);

            // Create new render object
            const newRender = {
                id: `render-${Date.now()}`,
                image: editedRender,
                timestamp: new Date().toISOString(),
                style: activeRender.style,
                prompt: editPrompt,
                sourceFile: activeRender.sourceFile,
                parentId: activeRender.id
            };

            setRenders(prev => [newRender, ...prev]);
            setActiveRender(newRender);

            // Add to chat
            setChatMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                content: '✨ Edit applied! View the updated render.',
                image: editedRender
            }]);

        } catch (err) {
            setChatMessages(prev => [...prev, {
                id: Date.now(),
                type: 'error',
                content: `❌ Edit failed: ${err.message}`
            }]);
        } finally {
            setIsGenerating(false);
            setGenerationProgress('');
        }
    }, [chatInput, activeRender]);

    // Download render
    const handleDownload = useCallback((render) => {
        if (!render?.image) return;
        const link = document.createElement('a');
        link.href = render.image;
        link.download = `nano-panana-render-${render.style}-${Date.now()}.png`;
        link.click();
    }, []);

    // Mark ready for export
    const handleExportReady = useCallback(() => {
        if (onExportReady && renders.length > 0) {
            onExportReady(renders);
        }
    }, [onExportReady, renders]);

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg">Nano Panana Pro</h2>
                        <p className="text-slate-400 text-xs">8K Hyper-Realistic Architectural Visualization</p>
                    </div>
                </div>

                {renders.length > 0 && (
                    <button
                        onClick={handleExportReady}
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Add to Export ({renders.length})
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Upload & Settings */}
                <div className="w-80 border-r border-slate-700/50 flex flex-col bg-slate-900/50">
                    {/* Upload Zone */}
                    <div className="p-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {!uploadedFile ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
                            >
                                <Upload className="w-10 h-10 text-slate-500 group-hover:text-purple-400 transition-colors" />
                                <div className="text-center">
                                    <p className="text-sm text-slate-300 font-medium">Upload Layout Plan</p>
                                    <p className="text-xs text-slate-500">PDF, PNG, JPG, WebP</p>
                                </div>
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                                    {uploadPreview ? (
                                        <img src={uploadPreview} alt="Layout" className="w-full h-32 object-contain bg-slate-800" />
                                    ) : (
                                        <div className="w-full h-32 bg-slate-800 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-slate-500" />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setUploadedFile(null); setUploadPreview(null); }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 truncate">{uploadedFile.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Style Selection */}
                    <div className="px-4 pb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Design Style</label>
                        <div className="relative">
                            <button
                                onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-left text-white text-sm flex items-center justify-between hover:border-purple-500 transition-colors"
                            >
                                <span className="capitalize">{selectedStyle.replace('_', ' ')}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showStyleDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showStyleDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto"
                                    >
                                        {Object.keys(STYLE_PRESETS).map(style => (
                                            <button
                                                key={style}
                                                onClick={() => { setSelectedStyle(style); setShowStyleDropdown(false); }}
                                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors ${selectedStyle === style ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300'
                                                    }`}
                                            >
                                                <span className="capitalize font-medium">{style.replace('_', ' ')}</span>
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{STYLE_PRESETS[style]}</p>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Custom Prompt */}
                    <div className="px-4 pb-4 flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Custom Details (Optional)</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Add specific requirements... (e.g., '12ft ceilings', 'floor-to-ceiling windows', 'fireplace feature wall')"
                            className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    {/* Pro Tips */}
                    {showProTips && (
                        <div className="px-4 pb-4">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-400 uppercase">Pro Tips</span>
                                </div>
                                {PRO_TIPS.map((tip, i) => (
                                    <p key={i} className="text-xs text-amber-200/80 mb-1 last:mb-0">
                                        {tip.icon} {tip.tip}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <div className="p-4 border-t border-slate-700/50 bg-slate-900/80">
                        <button
                            onClick={handleGenerateRender}
                            disabled={!uploadedFile || isGenerating}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {generationProgress || 'Generating...'}
                                </>
                            ) : (
                                <>
                                    <Camera className="w-5 h-5" />
                                    Generate 8K Render
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel - Render Preview & Chat */}
                <div className="flex-1 flex flex-col">
                    {/* Render Preview Area */}
                    <div className="flex-1 p-4 overflow-auto">
                        {activeRender ? (
                            <div className="space-y-4">
                                {/* Active Render */}
                                <div className="relative rounded-2xl overflow-hidden border border-slate-700 group">
                                    <img
                                        src={activeRender.image}
                                        alt="AI Render"
                                        className="w-full h-auto cursor-pointer"
                                        onClick={() => window.open(activeRender.image, '_blank')}
                                    />
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => window.open(activeRender.image, '_blank')}
                                            className="p-2 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-black/80"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(activeRender)}
                                            className="p-2 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-black/80"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-sm font-medium capitalize">{activeRender.style} Style</p>
                                        <p className="text-slate-300 text-xs">{new Date(activeRender.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                {/* Render History Thumbnails */}
                                {renders.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {renders.map(render => (
                                            <button
                                                key={render.id}
                                                onClick={() => setActiveRender(render)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeRender?.id === render.id
                                                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                                    : 'border-slate-700 hover:border-slate-500'
                                                    }`}
                                            >
                                                <img src={render.image} alt="" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 text-sm">Upload a layout and generate your first render</p>
                                    <p className="text-slate-500 text-xs mt-2">Hyper-realistic 8K visualizations</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Area for Real-time Edits */}
                    {activeRender && (
                        <div className="border-t border-slate-700/50 bg-slate-900/50">
                            {/* Chat Messages */}
                            <div ref={chatScrollRef} className="h-40 overflow-y-auto p-4 space-y-3">
                                {chatMessages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${msg.type === 'user'
                                            ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                                            : msg.type === 'error'
                                                ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                                                : msg.type === 'system'
                                                    ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                                                    : 'bg-slate-800 text-white border border-slate-700'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-slate-700/50 flex gap-3">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                                    placeholder="Edit the render... (e.g., 'Add warmer lighting', 'Change flooring to dark wood')"
                                    disabled={isGenerating}
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                                />
                                <button
                                    onClick={handleChatSend}
                                    disabled={!chatInput.trim() || isGenerating}
                                    className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mx-4 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-red-300 text-sm font-medium">Generation Failed</p>
                                <p className="text-red-400/80 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
