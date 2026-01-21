/**
 * Design & Build - Cost-to-Build Ticker (Premium UI)
 * Live cost analytics that fluctuates with material/style changes
 * Theme-aware styling for Gallery White ↔ Obsidian Dark
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Hammer, Zap, Sofa, Calculator,
    ChevronUp, ChevronDown, TrendingUp, BarChart3
} from 'lucide-react';
import { useSurveyorStore, useBOQStore, useProjectStore } from '../../store';

// ============================================================================
// Animated Number Component
// ============================================================================

function AnimatedNumber({ value, decimals = 3, duration = 0.5 }) {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        const start = displayValue;
        const end = value;
        const diff = end - start;
        const startTime = Date.now();
        const endTime = startTime + duration * 1000;

        const animate = () => {
            const now = Date.now();
            if (now >= endTime) {
                setDisplayValue(end);
                return;
            }

            const progress = (now - startTime) / (duration * 1000);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(start + diff * eased);
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return displayValue.toFixed(decimals);
}

// ============================================================================
// Cost Category Component
// ============================================================================

function CostCategory({ icon: Icon, label, value, gradient }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-strong)] transition-colors">
            <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center shadow-lg`}>
                <Icon size={18} className="text-white" />
            </div>
            <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                        <AnimatedNumber value={value} />
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">OMR</span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Stat Pill Component
// ============================================================================

function StatPill({ label, value, unit = '' }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
            <span className="text-xs font-bold text-[var(--text-primary)] font-mono">{value}{unit}</span>
        </div>
    );
}

// ============================================================================
// Main Cost Ticker Component
// ============================================================================

export default function CostTicker() {
    const [expanded, setExpanded] = useState(false);

    // Surveyor data
    const grandTotal = useSurveyorStore(s => s.grandTotal);
    const totalCost = useSurveyorStore(s => s.totalCost);
    const materialCost = useSurveyorStore(s => s.materialCost);
    const laborCost = useSurveyorStore(s => s.laborCost);
    const mepCost = useSurveyorStore(s => s.mepCost);
    const furnitureCost = useSurveyorStore(s => s.furnitureCost);
    const wallArea = useSurveyorStore(s => s.wallArea);
    const floorArea = useSurveyorStore(s => s.floorArea);
    const contingency = useSurveyorStore(s => s.contingency);

    // BOQ data
    const getSubtotal = useBOQStore(s => s.getSubtotal);
    const selectedItems = useBOQStore(s => s.selectedItems);

    // Project data
    const detectedRooms = useProjectStore(s => s.detectedRooms);

    // Calculate display values
    const hasData = grandTotal > 0 || selectedItems.length > 0;
    const displayTotal = hasData ? grandTotal || totalCost : 0;

    return (
        <motion.div
            className="relative bg-[var(--bg-secondary)] border-t-2 border-[var(--accent-primary)] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
            initial={false}
            animate={{ height: expanded ? 'auto' : '56px' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
            {/* Main Ticker Bar */}
            <div
                className="h-14 flex items-center justify-between px-6 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Left: Logo & Status */}
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_-2px_4px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 cursor-pointer">
                                <img
                                    src="/logo.jpg"
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
                                Design & Build
                                <BarChart3 size={12} className="text-[var(--accent-primary)]" />
                            </h3>
                            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Real-Time Analytics</p>
                        </div>
                    </div>

                    {/* Status Pills */}
                    <div className="hidden md:flex items-center gap-2">
                        <StatPill label="Items" value={selectedItems.length} />
                        <StatPill label="Rooms" value={detectedRooms.length || 0} />
                    </div>
                </div>

                {/* Center: Cost Breakdown (when collapsed) */}
                {!expanded && (
                    <div className="hidden lg:flex items-center gap-8">
                        <div className="text-center">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Materials</span>
                            <p className="text-xs font-bold text-[var(--text-primary)] font-mono">{(hasData ? materialCost : 0).toFixed(3)}</p>
                        </div>
                        <div className="text-center">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Labor</span>
                            <p className="text-xs font-bold text-[var(--text-primary)] font-mono">{(hasData ? laborCost : 0).toFixed(3)}</p>
                        </div>
                        <div className="text-center">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Furniture</span>
                            <p className="text-xs font-bold text-[var(--text-primary)] font-mono">{(hasData ? furnitureCost : getSubtotal()).toFixed(3)}</p>
                        </div>
                    </div>
                )}

                {/* Right: Grand Total */}
                <div className="flex items-center gap-5">
                    <div className="text-right">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Total Project Estimate</span>
                        <motion.div
                            className="flex items-center justify-end gap-1"
                            key={displayTotal}
                        >
                            <span className="text-xl font-black text-[var(--accent-secondary)] font-mono" style={{ textShadow: '0 0 20px var(--accent-gold-glow)' }}>
                                <AnimatedNumber value={displayTotal} />
                            </span>
                            <span className="text-xs font-bold text-[var(--text-muted)]">OMR</span>
                            {displayTotal > 0 && (
                                <TrendingUp size={14} className="text-emerald-500 ml-1" />
                            )}
                        </motion.div>
                    </div>

                    {/* Expand Button */}
                    <motion.button
                        className="p-2 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {expanded ? (
                            <ChevronDown size={16} className="text-[var(--text-muted)]" />
                        ) : (
                            <ChevronUp size={16} className="text-[var(--text-muted)]" />
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[var(--border-main)] px-6 py-5"
                    >
                        {/* Cost Categories Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            <CostCategory
                                icon={Layers}
                                label="Materials"
                                value={hasData ? materialCost : 0}
                                gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                            />
                            <CostCategory
                                icon={Hammer}
                                label="Labor (35%)"
                                value={hasData ? laborCost : 0}
                                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                            <CostCategory
                                icon={Zap}
                                label="MEP Systems"
                                value={hasData ? mepCost : 0}
                                gradient="bg-gradient-to-br from-yellow-500 to-amber-600"
                            />
                            <CostCategory
                                icon={Sofa}
                                label="Furniture"
                                value={hasData ? furnitureCost : getSubtotal()}
                                gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                            />
                        </div>

                        {/* Area & Totals Summary */}
                        <div className="mt-5 pt-5 border-t border-[var(--border-main)] flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Wall Area</span>
                                    <p className="text-sm font-bold text-[var(--text-primary)] font-mono">{wallArea.toFixed(1)} m²</p>
                                </div>
                                <div className="w-px h-8 bg-[var(--border-main)]" />
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Floor Area</span>
                                    <p className="text-sm font-bold text-[var(--text-primary)] font-mono">{floorArea.toFixed(1)} m²</p>
                                </div>
                                <div className="w-px h-8 bg-[var(--border-main)]" />
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Subtotal</span>
                                    <p className="text-sm font-bold text-[var(--text-primary)] font-mono">{(hasData ? totalCost : getSubtotal()).toFixed(3)} OMR</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Contingency</span>
                                    <p className="text-sm font-bold text-amber-500 font-mono">{(contingency * 100).toFixed(0)}%</p>
                                </div>
                                <div className="w-px h-8 bg-[var(--border-main)]" />
                                <div className="text-right">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Grand Total</span>
                                    <p className="text-lg font-black text-emerald-500 font-mono">{displayTotal.toFixed(3)} OMR</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
