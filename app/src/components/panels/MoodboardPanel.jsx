/**
 * Design & Build - Moodboard Generator
 * PHASE 3: Presentation & Moodboard
 * Generates visual moodboards with material swatches, color palettes, and design philosophy
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Palette,
    Layers,
    Square,
    Download,
    Sparkles,
    RefreshCw,
    Check,
    Eye,
    Brush,
} from 'lucide-react';
import { useBOQStore, useUIStore, useProjectStore } from '../../store';

// ============================================================================
// Material Palettes from Design & Build Library
// ============================================================================

const MATERIAL_PALETTES = {
    executive: {
        name: 'Executive Suite',
        philosophy: 'Human-Centric Luxury',
        description: 'Premium workspace with warm woods and refined finishes',
        colors: [
            { name: 'Walnut Wood', hex: '#5D4037', code: 'WD-101' },
            { name: 'Marble White', hex: '#F5F5F5', code: 'MA-201' },
            { name: 'Brushed Gold', hex: '#D4AF37', code: 'MT-301' },
            { name: 'Charcoal', hex: '#36454F', code: 'TXT-101' },
        ],
        materials: [
            { name: 'Wood Veneer Panel', code: 'WD-101', rate: 65.00, uom: 'm²' },
            { name: 'Carrara Marble', code: 'MA-201', rate: 26.00, uom: 'm²' },
            { name: 'Premium Carpet', code: 'CA-101', rate: 8.90, uom: 'm²' },
        ],
    },
    modern: {
        name: 'Modern Workspace',
        philosophy: 'Collaborative Innovation',
        description: 'Open and energetic with vibrant accents',
        colors: [
            { name: 'Electric Blue', hex: '#2196F3', code: 'PNT-201' },
            { name: 'Clean White', hex: '#FFFFFF', code: 'PNT-101' },
            { name: 'Light Oak', hex: '#C4A35A', code: 'WD-201' },
            { name: 'Industrial Gray', hex: '#607D8B', code: 'MT-201' },
        ],
        materials: [
            { name: 'Acoustic Panels', code: 'AP-101', rate: 35.00, uom: 'm²' },
            { name: 'Carpet Tiles', code: 'CA-101', rate: 8.90, uom: 'm²' },
            { name: 'Glass Partition', code: 'GL-101', rate: 120.00, uom: 'm²' },
        ],
    },
    biophilic: {
        name: 'Biophilic Design',
        philosophy: 'Nature-Inspired Wellness',
        description: 'Organic textures and living elements',
        colors: [
            { name: 'Forest Green', hex: '#2E7D32', code: 'PNT-301' },
            { name: 'Natural Wood', hex: '#8D6E63', code: 'WD-301' },
            { name: 'Sand Stone', hex: '#D7CCC8', code: 'ST-101' },
            { name: 'Sky Blue', hex: '#81D4FA', code: 'PNT-401' },
        ],
        materials: [
            { name: 'Cork Flooring', code: 'CK-101', rate: 45.00, uom: 'm²' },
            { name: 'Living Wall System', code: 'LW-101', rate: 250.00, uom: 'm²' },
            { name: 'Bamboo Panels', code: 'WD-401', rate: 55.00, uom: 'm²' },
        ],
    },
    minimal: {
        name: 'Minimal Aesthetic',
        philosophy: 'Less is More',
        description: 'Clean lines and monochromatic elegance',
        colors: [
            { name: 'Pure White', hex: '#FAFAFA', code: 'PNT-101' },
            { name: 'Soft Gray', hex: '#9E9E9E', code: 'PNT-501' },
            { name: 'Matte Black', hex: '#212121', code: 'PNT-601' },
            { name: 'Warm Beige', hex: '#F5E6D3', code: 'PNT-701' },
        ],
        materials: [
            { name: 'Polished Concrete', code: 'CN-101', rate: 35.00, uom: 'm²' },
            { name: 'Vinyl Flooring', code: 'VY-101', rate: 22.00, uom: 'm²' },
            { name: 'Metal Feature Wall', code: 'MT-401', rate: 85.00, uom: 'm²' },
        ],
    },
};

// ============================================================================
// Color Swatch Component
// ============================================================================

function ColorSwatch({ color, size = 'md', showLabel = true }) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className={`${sizes[size]} rounded-lg shadow-md border border-white/20`}
                style={{ backgroundColor: color.hex }}
            />
            {showLabel && (
                <div className="text-center">
                    <p className="text-xs text-white font-medium truncate max-w-[60px]">{color.name}</p>
                    <p className="text-[10px] text-gray-500">{color.code}</p>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Material Card Component
// ============================================================================

function MaterialCard({ material }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-studio-hover border border-studio-border">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                <Layers size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{material.name}</p>
                <p className="text-xs text-gray-500">{material.code}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-green-400 font-mono">{material.rate.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500">OMR/{material.uom}</p>
            </div>
        </div>
    );
}

// ============================================================================
// Moodboard Preview Card
// ============================================================================

function MoodboardPreview({ palette, isSelected, onSelect }) {
    return (
        <motion.div
            className={`
        relative p-4 rounded-xl cursor-pointer transition-all
        ${isSelected
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500'
                    : 'bg-studio-surface border border-studio-border hover:border-gray-600'
                }
      `}
            onClick={() => onSelect(palette)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                </div>
            )}

            {/* Color swatches */}
            <div className="flex gap-1 mb-3">
                {palette.colors.map((color, i) => (
                    <div
                        key={i}
                        className="flex-1 h-8 rounded-md first:rounded-l-lg last:rounded-r-lg"
                        style={{ backgroundColor: color.hex }}
                    />
                ))}
            </div>

            {/* Info */}
            <h4 className="font-medium text-white text-sm mb-1">{palette.name}</h4>
            <p className="text-xs text-gray-500">{palette.philosophy}</p>
        </motion.div>
    );
}

// ============================================================================
// Main Moodboard Panel
// ============================================================================

export default function MoodboardPanel() {
    const [selectedPalette, setSelectedPalette] = useState('executive');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const detectedRooms = useProjectStore(s => s.detectedRooms);
    const workflowPhase = useProjectStore(s => s.workflowPhase);
    const nanoPananaRenders = useProjectStore(s => s.nanoPananaRenders);
    const sceneData3D = useProjectStore(s => s.sceneData3D);
    const addNotification = useUIStore(s => s.addNotification);

    const currentPalette = MATERIAL_PALETTES[selectedPalette];

    const handleGenerate = async () => {
        setIsGenerating(true);

        // Simulate moodboard generation
        await new Promise(r => setTimeout(r, 2000));

        setGenerated(true);
        setIsGenerating(false);

        addNotification({
            type: 'success',
            title: 'Moodboard Generated',
            message: `Applied "${currentPalette.name}" palette`,
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-studio-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                        <Palette size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-white text-sm">Moodboard</h2>
                        <p className="text-xs text-gray-500">Materials & Finishes</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Palette Selection */}
                <div>
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                        Design Palette
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(MATERIAL_PALETTES).map(([key, palette]) => (
                            <MoodboardPreview
                                key={key}
                                palette={palette}
                                isSelected={selectedPalette === key}
                                onSelect={() => setSelectedPalette(key)}
                            />
                        ))}
                    </div>
                </div>

                {/* Selected Palette Details */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedPalette}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Philosophy */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-purple-400" />
                                <h4 className="text-sm font-medium text-white">Design Philosophy</h4>
                            </div>
                            <p className="text-sm text-gray-300">{currentPalette.description}</p>
                            <p className="text-xs text-purple-400 mt-2 font-medium">
                                "{currentPalette.philosophy}"
                            </p>
                        </div>

                        {/* Color Palette */}
                        <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                                Color Palette
                            </h4>
                            <div className="flex justify-between">
                                {currentPalette.colors.map((color, i) => (
                                    <ColorSwatch key={i} color={color} />
                                ))}
                            </div>
                        </div>

                        {/* Materials */}
                        <div>
                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                                Nano Banana Pro Materials
                            </h4>
                            <div className="space-y-2">
                                {currentPalette.materials.map((material, i) => (
                                    <MaterialCard key={i} material={material} />
                                ))}
                            </div>
                        </div>

                        {/* AI Renders Section */}
                        {nanoPananaRenders.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Sparkles size={12} /> AI Visualization Results
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {nanoPananaRenders.slice(0, 2).map((render, i) => (
                                        <motion.div
                                            key={i}
                                            className="relative aspect-video rounded-xl overflow-hidden border border-purple-500/30 group"
                                            whileHover={{ scale: 1.02 }}
                                        >
                                            <img
                                                src={render.image}
                                                alt={`AI Render ${i + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <p className="text-[10px] text-white font-medium">Render #{i + 1} - {render.prompt}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-studio-border space-y-2">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full btn-pro flex items-center justify-center gap-2 py-3"
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (generated || sceneData3D) ? (
                        <>
                            <Check size={16} />
                            <span>Design Applied</span>
                        </>
                    ) : (
                        <>
                            <Brush size={16} />
                            <span>Apply to 3D Model</span>
                        </>
                    )}
                </button>

                {generated && (
                    <button className="w-full btn-secondary flex items-center justify-center gap-2 py-2">
                        <Eye size={14} />
                        <span>Preview Render</span>
                    </button>
                )}
            </div>
        </div>
    );
}
