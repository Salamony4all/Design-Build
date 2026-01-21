/**
 * Nano Panana Studio Component
 * 
 * Advanced AI-powered architectural visualization and image editing.
 * This component provides:
 * 1. Upload floor plans/sketches
 * 2. AI-powered photorealistic render generation
 * 3. Interactive prompt-based editing (add skylights, change materials, etc.)
 * 4. Real-time 3D geometry preview
 * 
 * Based on archisketch-3d workflow but integrated with D&B ecosystem.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    transformLayoutTo3D,
    editLayoutImage,
    generateStylePrompt,
    isNanoPananaConfigured
} from '../../services/nanoPananaService';
import { useProjectStore, useUIStore } from '../../store';
import {
    Sparkles,
    Image as ImageIcon,
    Send,
    RefreshCcw,
    Download,
    Maximize2,
    AlertCircle,
    Box,
    Palette,
    Loader2,
    ChevronDown,
    Wand2,
    Camera,
    Layers
} from 'lucide-react';

// Style presets for quick prompts
const STYLE_PRESETS = [
    { id: 'modern', label: 'Modern Minimal', prompt: 'modern minimalist interior with clean lines, white walls, natural light, designer furniture' },
    { id: 'luxury', label: 'Luxury Executive', prompt: 'luxury executive office with marble floors, warm lighting, premium materials, oak wood paneling' },
    { id: 'industrial', label: 'Industrial Loft', prompt: 'industrial loft style with exposed brick, concrete floors, metal accents, pendant lights' },
    { id: 'biophilic', label: 'Biophilic Nature', prompt: 'biophilic design with indoor plants, natural materials, skylights, green walls, wood accents' },
    { id: 'nordic', label: 'Nordic Cozy', prompt: 'scandinavian nordic interior with light wood, hygge atmosphere, soft textures, muted colors' },
    { id: 'skylit', label: 'Skylit Atrium', prompt: 'dramatic atrium with glass skylight ceiling, steel structure, natural sunlight streaming in, double height space' },
];

// Quick edit suggestions
const QUICK_EDITS = [
    'Add skylights to the ceiling',
    'Make it more luxurious with marble floors',
    'Add a curved reception desk',
    'Change to evening mood lighting',
    'Add glass partition walls',
    'Include indoor plants and greenery',
    'Make it open plan with modern furniture',
    'Add a fireplace feature wall',
];

export default function NanoPananaStudio() {
    const [sourceImage, setSourceImage] = useState(null);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [error, setError] = useState(null);
    const [showPresets, setShowPresets] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeMode, setActiveMode] = useState('edit'); // 'edit' or '3d'
    const [sceneData, setSceneData] = useState(null);

    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    const sketchPreviewUrl = useProjectStore(s => s.sketchPreviewUrl);
    const addNotification = useUIStore(s => s.addNotification);

    // Use project sketch if available
    useEffect(() => {
        if (sketchPreviewUrl && !sourceImage) {
            setSourceImage(sketchPreviewUrl);
        }
    }, [sketchPreviewUrl]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setSourceImage(dataUrl);
            setGeneratedImage(null);
            setError(null);

            // Add to history
            setHistory(prev => [...prev, {
                type: 'upload',
                content: 'New floor plan uploaded',
                image: dataUrl,
                timestamp: new Date()
            }]);
        };
        reader.readAsDataURL(file);
    };

    // Process with AI - either edit existing image or generate from prompt
    const handleGenerate = async () => {
        if (!editPrompt.trim()) return;
        if (!isNanoPananaConfigured()) {
            setError('Nano Panana Pro API not configured. Check VITE_NANO_PANANA_API_KEY in .env');
            return;
        }

        setIsProcessing(true);
        setError(null);

        // Add user message to history
        setHistory(prev => [...prev, {
            type: 'user',
            content: editPrompt,
            timestamp: new Date()
        }]);

        try {
            const currentImage = generatedImage || sourceImage;

            if (!currentImage) {
                throw new Error('Please upload a floor plan first');
            }

            // Stage 1: Edit the image with AI
            setProcessingStage('Generating photorealistic render...');

            const mimeType = currentImage.split(';')[0].split(':')[1] || 'image/png';
            const base64Data = currentImage.split(',')[1];

            // Full prompt with style enhancement
            const fullPrompt = generateStylePrompt(editPrompt);

            const editedImage = await editLayoutImage(base64Data, mimeType, fullPrompt);
            setGeneratedImage(editedImage);

            // Add AI response to history
            setHistory(prev => [...prev, {
                type: 'ai',
                content: `Generated render based on: "${editPrompt}"`,
                image: editedImage,
                timestamp: new Date()
            }]);

            // Stage 2: Extract 3D data from the new image
            setProcessingStage('Extracting 3D geometry...');
            const resultBase64 = editedImage.split(',')[1];
            const result = await transformLayoutTo3D({
                type: 'image/png',
                name: 'generated.png'
            }, resultBase64);

            if (result.sceneData) {
                setSceneData(result.sceneData);
            }

            // Success notification
            addNotification({
                type: 'success',
                message: 'Render complete! View in 3D or continue editing.',
                duration: 3000
            });

        } catch (err) {
            console.error('[Nano Panana Studio] Error:', err);
            setError(err.message || 'Failed to generate render');

            // Add error to history
            setHistory(prev => [...prev, {
                type: 'error',
                content: err.message || 'Failed to process request',
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
            setProcessingStage('');
            setEditPrompt('');
        }
    };

    // Apply preset style
    const applyPreset = (preset) => {
        setEditPrompt(preset.prompt);
        setShowPresets(false);
    };

    // Download the generated image
    const handleDownload = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `nano-panana-render-${Date.now()}.png`;
        link.click();
    };

    // Quick edit suggestion click
    const handleQuickEdit = (suggestion) => {
        setEditPrompt(suggestion);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm">Nano Panana Pro</h2>
                        <p className="text-slate-400 text-xs">AI Photorealistic Rendering</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-slate-800 rounded-lg p-0.5">
                    <button
                        onClick={() => setActiveMode('edit')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeMode === 'edit'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Render
                    </button>
                    <button
                        onClick={() => setActiveMode('3d')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeMode === '3d'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Box className="w-3.5 h-3.5" />
                        3D View
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Image Display / Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Source Image */}
                    {sourceImage && !generatedImage && (
                        <div className="space-y-2">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Source Floor Plan</span>
                            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50">
                                <img
                                    src={sourceImage}
                                    alt="Source"
                                    className="w-full h-48 object-contain"
                                />
                            </div>
                        </div>
                    )}

                    {/* Chat History */}
                    {history.map((item, index) => (
                        <div
                            key={index}
                            className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] rounded-2xl p-3 ${item.type === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : item.type === 'error'
                                        ? 'bg-red-950/50 border border-red-500/30 text-red-200 rounded-bl-sm'
                                        : item.type === 'upload'
                                            ? 'bg-slate-800 border border-slate-700 text-slate-300 rounded-bl-sm'
                                            : 'bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 text-white rounded-bl-sm'
                                }`}>
                                <p className="text-sm">{item.content}</p>
                                {item.image && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-600">
                                        <img
                                            src={item.image}
                                            alt="Generated"
                                            className="w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(item.image, '_blank')}
                                        />
                                    </div>
                                )}
                                <span className="text-[10px] opacity-50 mt-1 block">
                                    {item.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Generated Image Display */}
                    {generatedImage && history.length === 0 && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-700 group">
                            <img
                                src={generatedImage}
                                alt="Generated Render"
                                className="w-full h-auto"
                            />
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => window.open(generatedImage, '_blank')}
                                    className="p-2 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-black/70 transition-colors"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="p-2 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-black/70 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Processing State */}
                    {isProcessing && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                                <p className="text-white font-medium">{processingStage || 'Processing...'}</p>
                                <p className="text-slate-400 text-xs mt-1">This may take 10-30 seconds</p>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-200 text-sm font-medium">Generation Failed</p>
                                <p className="text-red-300/70 text-xs mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!sourceImage && history.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-white font-medium mb-2">Upload a Floor Plan</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                Start by uploading a floor plan, sketch, or layout image to generate photorealistic renders.
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Choose File
                            </button>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Quick Edit Suggestions */}
                {sourceImage && !isProcessing && (
                    <div className="px-4 py-2 border-t border-slate-700/50 overflow-x-auto">
                        <div className="flex gap-2">
                            {QUICK_EDITS.slice(0, 4).map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickEdit(suggestion)}
                                    className="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-full transition-colors border border-slate-700"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
                    {/* Style Presets Dropdown */}
                    <div className="relative mb-3">
                        <button
                            onClick={() => setShowPresets(!showPresets)}
                            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            <Palette className="w-4 h-4" />
                            <span>Style Presets</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                        </button>

                        {showPresets && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10">
                                {STYLE_PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                                    >
                                        <span className="text-white text-sm font-medium">{preset.label}</span>
                                        <span className="text-slate-400 text-xs block mt-0.5 line-clamp-1">{preset.prompt}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Input */}
                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors border border-slate-700"
                            title="Upload Image"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleGenerate()}
                                placeholder="Describe your vision... (e.g., 'Modern lobby with skylights')"
                                disabled={isProcessing}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                            />
                            <Wand2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isProcessing || !editPrompt.trim()}
                            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-xl transition-all font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
                        >
                            {isProcessing ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Generate
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                        Powered by Gemini 2.5 Flash Image | AI-generated renders for visualization
                    </p>
                </div>
            </div>
        </div>
    );
}
