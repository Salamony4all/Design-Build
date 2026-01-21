/**
 * Design & Build - BOQ Library Panel
 * Displays furniture and fitout items for placement
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Package,
    Armchair,
    Table,
    Sofa,
    Archive,
    Tv,
    Sparkles,
    Plus,
    ChevronDown,
    ChevronRight,
    Layers
} from 'lucide-react';
import { useBOQStore, useUIStore } from '../../store';

// Category Icons
const categoryIcons = {
    Desks: Table,
    Chairs: Armchair,
    Tables: Table,
    Sofas: Sofa,
    Storage: Archive,
    Equipment: Tv,
    Decor: Sparkles,
    Special: Package,
    default: Package,
};

// ============================================================================
// BOQ Item Card
// ============================================================================

function BOQItemCard({ item, onAdd }) {
    const [isHovered, setIsHovered] = useState(false);

    const Icon = categoryIcons[item.category] || categoryIcons.default;

    return (
        <motion.div
            className="boq-item group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-studio-hover flex items-center justify-center">
                <Icon size={18} className="text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="boq-item-code">{item.code}</span>
                    <span className="text-xs text-gray-500">{item.unit}</span>
                </div>
                <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                <p className="text-xs text-gray-500 truncate">{item.description}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
                <span className="boq-item-rate">{item.rate.toFixed(3)} OMR</span>
                <motion.button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd(item);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Plus size={14} />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Category Section
// ============================================================================

function CategorySection({ category, items, onAddItem }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const Icon = categoryIcons[category] || categoryIcons.default;

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-studio-hover transition-colors"
            >
                <Icon size={16} className="text-blue-400" />
                <span className="flex-1 text-left text-sm font-medium text-white">{category}</span>
                <span className="text-xs text-gray-500 bg-studio-hover px-2 py-0.5 rounded">{items.length}</span>
                {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-500" />
                ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                )}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-2 pt-2">
                            {items.map((item) => (
                                <BOQItemCard key={item.code} item={item} onAdd={onAddItem} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Main Library Panel
// ============================================================================

export default function LibraryPanel() {
    const { furniture, fitout, loadBOQLibrary, addItemToScene, isLoading } = useBOQStore();
    const { searchQuery, setSearchQuery, activeCategory, setActiveCategory } = useUIStore();
    const addNotification = useUIStore(state => state.addNotification);

    const [activeTab, setActiveTab] = useState('furniture');

    // Load BOQ data on mount
    useEffect(() => {
        loadBOQLibrary();
    }, [loadBOQLibrary]);

    // Filter items based on search
    const filteredItems = useMemo(() => {
        const items = activeTab === 'furniture' ? furniture : fitout;

        if (!searchQuery) return items;

        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name?.toLowerCase().includes(query) ||
            item.code?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query)
        );
    }, [furniture, fitout, activeTab, searchQuery]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups = {};
        filteredItems.forEach(item => {
            const category = item.category || 'Other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });
        return groups;
    }, [filteredItems]);

    // Handle adding item to scene
    const handleAddItem = (item) => {
        // Random position within room bounds
        const position = {
            x: (Math.random() - 0.5) * 15,
            y: 0,
            z: (Math.random() - 0.5) * 10,
        };

        addItemToScene(item, 1, position);

        addNotification({
            type: 'success',
            title: 'Item Added',
            message: `${item.name} added to scene`,
        });
    };

    return (
        <div className="h-full flex flex-col bg-studio-surface">
            {/* Header */}
            <div className="p-4 border-b border-studio-border">
                <div className="flex items-center gap-2 mb-3">
                    <Layers size={20} className="text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">BOQ Library</h2>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-pro pl-9"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-studio-border">
                <button
                    onClick={() => setActiveTab('furniture')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'furniture'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Furniture ({furniture.length})
                </button>
                <button
                    onClick={() => setActiveTab('fitout')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'fitout'
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                >
                    Fit-Out ({fitout.length})
                </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-gray-500">Loading BOQ Library...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Package size={48} className="text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500">No items found</p>
                    </div>
                ) : (
                    Object.entries(groupedItems).map(([category, items]) => (
                        <CategorySection
                            key={category}
                            category={category}
                            items={items}
                            onAddItem={handleAddItem}
                        />
                    ))
                )}
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-studio-border bg-studio-card">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{filteredItems.length} items</span>
                    <span className="font-mono">
                        Total: {filteredItems.reduce((sum, item) => sum + (item.rate * (item.quantity || 1)), 0).toFixed(3)} OMR
                    </span>
                </div>
            </div>
        </div>
    );
}
