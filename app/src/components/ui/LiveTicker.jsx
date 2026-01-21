/**
 * Design & Build - Live Ticker / Real-Time Project Estimator
 * Displays live OMR totals with 5% VAT calculation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Calculator,
    Percent,
    Receipt,
    TrendingUp,
    Package,
    Layers,
    Building2
} from 'lucide-react';
import { useBOQStore } from '../../store';

// ============================================================================
// Ticker Item Component
// ============================================================================

function TickerItem({ icon: Icon, label, value, unit = '', color = 'text-blue-400', pulse = false }) {
    return (
        <motion.div
            className="ticker-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className={`w-8 h-8 rounded-lg bg-studio-hover flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
                <Icon size={16} className={color} />
            </div>
            <div className="flex flex-col">
                <span className="ticker-label">{label}</span>
                <div className="flex items-baseline gap-1">
                    <motion.span
                        className={`ticker-value ${color}`}
                        key={value}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        {value}
                    </motion.span>
                    {unit && <span className="text-xs text-gray-500">{unit}</span>}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Mini Chart Component
// ============================================================================

function MiniChart({ data }) {
    const max = Math.max(...data, 1);

    return (
        <div className="flex items-end gap-0.5 h-6">
            {data.map((value, index) => (
                <motion.div
                    key={index}
                    className="w-1 bg-blue-500 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${(value / max) * 100}%` }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                />
            ))}
        </div>
    );
}

// ============================================================================
// Main Live Ticker Component
// ============================================================================

export default function LiveTicker() {
    const selectedItems = useBOQStore(state => state.selectedItems);
    const project = useBOQStore(state => state.project);
    const getSubtotal = useBOQStore(state => state.getSubtotal);
    const getVAT = useBOQStore(state => state.getVAT);
    const getTotal = useBOQStore(state => state.getTotal);
    const getBOQSummary = useBOQStore(state => state.getBOQSummary);

    const subtotal = getSubtotal();
    const vat = getVAT();
    const total = getTotal();
    const summary = getBOQSummary();

    // Format number with locale
    const formatNumber = (num) => {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });
    };

    // Generate mini chart data from categories
    const chartData = Object.values(summary).map(cat => cat.subtotal);

    return (
        <motion.div
            className="live-ticker"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            {/* Left Section - Item Count */}
            <div className="flex items-center gap-6">
                <TickerItem
                    icon={Package}
                    label="Items"
                    value={selectedItems.length}
                    color="text-purple-400"
                />

                <TickerItem
                    icon={Layers}
                    label="Categories"
                    value={Object.keys(summary).length}
                    color="text-indigo-400"
                />

                {/* Mini Chart */}
                {chartData.length > 0 && (
                    <div className="ticker-item hidden lg:flex">
                        <MiniChart data={chartData} />
                        <div className="flex flex-col ml-2">
                            <span className="ticker-label">Distribution</span>
                            <span className="text-xs text-gray-400">{chartData.length} categories</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Center Section - Logo/Brand */}
            <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_-1px_2px_rgba(0,0,0,0.1)]">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Design & Build</span>
                    <span className="text-[10px] text-gray-500">Real-Time Estimator</span>
                </div>
            </div>

            {/* Right Section - Financial Summary */}
            <div className="flex items-center gap-6">
                {/* Subtotal */}
                <TickerItem
                    icon={Calculator}
                    label="Subtotal"
                    value={formatNumber(subtotal)}
                    unit="OMR"
                    color="text-gray-300"
                />

                {/* VAT */}
                <TickerItem
                    icon={Percent}
                    label={`VAT (${(project.vatRate * 100).toFixed(0)}%)`}
                    value={formatNumber(vat)}
                    unit="OMR"
                    color="text-yellow-400"
                />

                {/* Divider */}
                <div className="w-px h-10 bg-studio-border" />

                {/* Grand Total */}
                <motion.div
                    className="ticker-item"
                    animate={total > 0 ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.3 }}
                >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Receipt size={18} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="ticker-label">Grand Total</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white font-mono">
                                {formatNumber(total)}
                            </span>
                            <span className="text-sm text-gray-400">OMR</span>
                        </div>
                    </div>
                </motion.div>

                {/* Trend Indicator */}
                {selectedItems.length > 0 && (
                    <motion.div
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <TrendingUp size={14} className="text-green-400" />
                        <span className="text-xs font-medium text-green-400">Live</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// ============================================================================
// Compact Ticker (for mobile/smaller screens)
// ============================================================================

export function CompactTicker() {
    const getTotal = useBOQStore(state => state.getTotal);
    const selectedItems = useBOQStore(state => state.selectedItems);

    const total = getTotal();

    const formatNumber = (num) => {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <motion.div
            className="fixed bottom-0 left-0 right-0 h-14 bg-studio-card/95 backdrop-blur-lg border-t border-studio-border flex items-center justify-between px-4 z-100 md:hidden"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
        >
            <div className="flex items-center gap-2">
                <Package size={16} className="text-blue-400" />
                <span className="text-sm text-gray-400">{selectedItems.length} items</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Total:</span>
                <span className="text-lg font-bold font-mono text-white">{formatNumber(total)}</span>
                <span className="text-sm text-gray-500">OMR</span>
            </div>
        </motion.div>
    );
}
