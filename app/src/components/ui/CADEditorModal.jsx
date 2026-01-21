/**
 * Design & Build - CAD Editor Modal (Premium Glassmorphism)
 * Integrated Professional CAD Editing Environment
 * 85% opacity with 12px background blur
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Save, RotateCcw, RotateCw, ZoomIn, ZoomOut,
    MousePointer2, Square, Circle, Minus, Type,
    Layers, Settings, Grid, Command,
    Trash2, Copy, Move, Scissors,
    Activity, ChevronDown, Box, Crosshair,
    Eye, EyeOff, Lock, Unlock,
    Minimize2, Maximize2
} from 'lucide-react';
import { useUIStore, useProjectStore } from '../../store';
import CADCanvas from './CADCanvas';

// ============================================================================
// Tool Button Component
// ============================================================================

function ToolButton({ icon: Icon, label, active, onClick, danger }) {
    return (
        <button
            onClick={onClick}
            className={`
                p-2.5 rounded-lg transition-all relative group
                ${active
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/30'
                    : danger
                        ? 'text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }
            `}
            title={label}
        >
            <Icon size={18} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-primary)] text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                {label}
            </span>
        </button>
    );
}

// ============================================================================
// Property Row Component
// ============================================================================

function PropertyRow({ label, value }) {
    return (
        <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)]">
            <span className="text-[var(--text-muted)]">{label}</span>
            <span className="text-[var(--text-primary)] font-mono font-semibold">{value}</span>
        </div>
    );
}

// ============================================================================
// Block Item Component
// ============================================================================

function BlockItem({ name, count }) {
    return (
        <div className="flex items-center justify-between text-[11px] p-2.5 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)] border-l-2 border-l-[var(--accent-primary)]">
            <span className="text-[var(--text-primary)] font-medium">{name}</span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold text-[10px]">
                {count}
            </span>
        </div>
    );
}

// ============================================================================
// Main CAD Editor Modal Component
// ============================================================================

export default function CADEditorModal() {
    const activeModal = useUIStore(state => state.activeModal);
    const closeModal = useUIStore(state => state.closeModal);
    const sketchFile = useProjectStore(state => state.sketchFile);
    const addNotification = useUIStore(state => state.addNotification);

    // CAD Store
    const cadEntities = useProjectStore(s => s.cadEntities);
    const cadLayers = useProjectStore(s => s.cadLayers);
    const activeCadLayer = useProjectStore(s => s.activeCadLayer);
    const setActiveCadLayer = useProjectStore(s => s.setActiveCadLayer);
    const toggleCadLayer = useProjectStore(s => s.toggleCadLayer);

    const [activeTool, setActiveTool] = useState('select');
    const [history, setHistory] = useState(['▸ D&B CAD Kernel Initialized.', '▸ Type L for line, R for rect, C for circle.']);
    const [commandValue, setCommandValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [windowMode, setWindowMode] = useState('maximized'); // 'normal', 'maximized'
    const [isMinimized, setIsMinimized] = useState(false);

    if (activeModal !== 'cad-editor') return null;

    const executeCommand = (cmd) => {
        const input = cmd.toUpperCase().trim();
        setHistory(prev => [...prev, `› ${input}`]);

        if (['L', 'LINE'].includes(input)) {
            setActiveTool('line');
            setHistory(prev => [...prev, '  TOOL: LINE - Specify first point']);
        } else if (['R', 'RECT'].includes(input)) {
            setActiveTool('rect');
            setHistory(prev => [...prev, '  TOOL: RECTANGLE - Specify first corner']);
        } else if (['C', 'CIRCLE'].includes(input)) {
            setActiveTool('circle');
            setHistory(prev => [...prev, '  TOOL: CIRCLE - Specify center point']);
        } else if (['V', 'SELECT'].includes(input)) {
            setActiveTool('select');
            setHistory(prev => [...prev, '  TOOL: SELECTION MODE']);
        } else if (input === 'CLEAR') {
            setHistory(['▸ Console cleared.']);
        } else {
            setHistory(prev => [...prev, `  Unknown command: ${input}`]);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setHistory(prev => [...prev, '▸ Parsing geometry nodes...']);
        setTimeout(() => {
            setIsSaving(false);
            setHistory(prev => [...prev, '✓ Sync complete. Data sent to AI Architect.']);
            addNotification({
                type: 'success',
                title: 'CAD Synced',
                message: 'Geometry synchronized with AI analysis engine'
            });
            closeModal();
        }, 1200);
    };

    const handleCommand = (e) => {
        if (e.key === 'Enter' && commandValue) {
            executeCommand(commandValue);
            setCommandValue('');
        }
    };

    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select (V)' },
        { id: 'line', icon: Minus, label: 'Line (L)' },
        { id: 'rect', icon: Square, label: 'Rectangle (R)' },
        { id: 'circle', icon: Circle, label: 'Circle (C)' },
        { id: 'text', icon: Type, label: 'Text (T)' },
    ];

    const editTools = [
        { id: 'trim', icon: Scissors, label: 'Trim' },
        { id: 'copy', icon: Copy, label: 'Copy' },
        { id: 'move', icon: Move, label: 'Move' },
    ];

    const layers = [
        { id: '0', name: '0', color: '#FFFFFF' },
        { id: 'walls', name: 'A-WALLS', color: '#6B7280' },
        { id: 'doors', name: 'A-DOOR', color: '#10B981' },
        { id: 'furn', name: 'A-FURN', color: '#EC4899' },
        { id: 'mep', name: 'A-MEP', color: '#F59E0B' },
    ];

    const properties = [
        { label: 'Type', value: 'Polyline' },
        { label: 'Layer', value: 'A-WALL' },
        { label: 'Color', value: 'ByLayer' },
        { label: 'Linetype', value: 'Continuous' },
        { label: 'Width', value: '0.00' },
    ];

    const blocks = [
        { name: 'DESK_STD', count: 18 },
        { name: 'CHAIR_EXEC', count: 2 },
    ];

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0"
                    onClick={closeModal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />

                {/* Modal Content - Window-Style CAD Editor */}
                <motion.div
                    className={`
                        relative glass-modal flex flex-col overflow-hidden transition-all duration-300
                        ${windowMode === 'maximized' ? 'w-full h-full rounded-none' : 'w-[95%] h-[90vh] rounded-xl'}
                        ${isMinimized ? 'h-14 overflow-hidden self-end mb-4 mr-4 w-72' : ''}
                    `}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{
                        scale: isMinimized ? 0.8 : 1,
                        opacity: 1,
                        y: isMinimized ? 300 : 0
                    }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* CAD Header - Dark with gradient */}
                    <div className="h-14 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] border-b border-[var(--border-main)] flex items-center justify-between px-4 cursor-default select-none">
                        <div className="flex items-center gap-4">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
                                    <span className="text-[10px] font-black text-white">CAD</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide">
                                        D&B CAD Editor Pro
                                    </span>
                                    <div className="text-[9px] text-[var(--text-muted)]">Professional Edition</div>
                                </div>
                            </div>

                            <div className="h-6 w-px bg-[var(--border-main)]" />

                            {/* File Name */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)]">
                                <Box size={12} className="text-[var(--accent-primary)]" />
                                <span className="text-xs text-[var(--text-secondary)] font-medium">
                                    {sketchFile?.name || 'Untitled_Project.dwg'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.button
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await useProjectStore.getState().syncCADToProject();
                                        // Optional: show a toast or success message
                                        closeModal();
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-blue-600 text-white text-xs font-bold transition-all shadow-lg shadow-[var(--accent-primary)]/30 hover:shadow-xl disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isSaving ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                                Sync to AI Analyze
                            </motion.button>
                            <div className="flex items-center gap-1 ml-4">
                                {/* Window Controls */}
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-all"
                                    title="Minimize"
                                >
                                    <Minus size={16} />
                                </button>
                                <button
                                    onClick={() => setWindowMode(windowMode === 'maximized' ? 'normal' : 'maximized')}
                                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-all"
                                    title={windowMode === 'maximized' ? 'Restore' : 'Maximize'}
                                >
                                    {windowMode === 'maximized' ? <Copy size={14} /> : <Square size={14} />}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-all border border-transparent hover:border-red-500/30"
                                    title="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sub-Header / Tool Options */}
                    <div className="h-11 bg-[var(--bg-secondary)] border-b border-[var(--border-main)] flex items-center px-4 gap-6">
                        {/* Undo/Redo */}
                        <div className="flex items-center gap-1">
                            <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" title="Undo (Ctrl+Z)">
                                <RotateCcw size={14} />
                            </button>
                            <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" title="Redo (Ctrl+Y)">
                                <RotateCw size={14} />
                            </button>
                        </div>

                        <div className="h-5 w-px bg-[var(--border-main)]" />

                        {/* Layer Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Layer:</span>
                            <div className="flex items-center gap-2 bg-[var(--bg-active)] border border-[var(--border-main)] rounded-lg px-3 py-1.5">
                                <Layers size={12} className="text-[var(--accent-primary)]" />
                                <select
                                    value={activeCadLayer}
                                    onChange={(e) => setActiveCadLayer(e.target.value)}
                                    className="bg-transparent text-xs text-[var(--text-primary)] outline-none border-none font-medium min-w-[80px]"
                                >
                                    {cadLayers.map(l => (
                                        <option key={l.name} value={l.name} className="bg-[var(--bg-card)]">{l.name}</option>
                                    ))}
                                </select>
                                <div
                                    className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                                    style={{ backgroundColor: cadLayers.find(l => l.name === activeCadLayer)?.color }}
                                />
                            </div>
                        </div>

                        <div className="h-5 w-px bg-[var(--border-main)]" />

                        {/* Zoom Controls */}
                        <div className="flex items-center gap-1">
                            <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" title="Zoom In">
                                <ZoomIn size={14} />
                            </button>
                            <button className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors" title="Zoom Out">
                                <ZoomOut size={14} />
                            </button>
                            <button className="p-2 text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 rounded-lg" title="Show Grid">
                                <Grid size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Toolbar */}
                        <div className="w-14 bg-[var(--bg-secondary)] border-r border-[var(--border-main)] flex flex-col items-center py-4 gap-1">
                            {/* Drawing Tools */}
                            {tools.map(tool => (
                                <ToolButton
                                    key={tool.id}
                                    icon={tool.icon}
                                    label={tool.label}
                                    active={activeTool === tool.id}
                                    onClick={() => setActiveTool(tool.id)}
                                />
                            ))}

                            <div className="h-px w-8 bg-[var(--border-main)] my-2" />

                            {/* Edit Tools */}
                            {editTools.map(tool => (
                                <ToolButton
                                    key={tool.id}
                                    icon={tool.icon}
                                    label={tool.label}
                                    onClick={() => { }}
                                />
                            ))}

                            <div className="flex-1" />

                            {/* Delete */}
                            <ToolButton icon={Trash2} label="Delete (Del)" danger />
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 relative overflow-hidden bg-[#0F1115]">
                            <CADCanvas
                                activeTool={activeTool}
                                activeLayer={activeCadLayer}
                                onCommandComplete={() => {
                                    setHistory(prev => [...prev, '✓ Command point accepted']);
                                }}
                            />
                        </div>

                        {/* Right Properties Panel */}
                        <div className="w-64 bg-[var(--bg-secondary)] border-l border-[var(--border-main)] flex flex-col">
                            <div className="p-3 border-b border-[var(--border-main)] flex items-center gap-2">
                                <Settings size={14} className="text-[var(--accent-primary)]" />
                                <span className="text-xs font-bold text-[var(--text-primary)]">Properties</span>
                            </div>

                            <div className="flex-1 overflow-auto p-4 space-y-5">
                                {/* Layers List */}
                                <div className="space-y-2">
                                    <span className="panel-title">Layers</span>
                                    <div className="space-y-1">
                                        {cadLayers.map(l => (
                                            <div key={l.name} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)] hover:bg-[var(--bg-hover)] transition-all group">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-white/20"
                                                    style={{ backgroundColor: l.color }}
                                                />
                                                <span className="flex-1 text-[11px] text-[var(--text-primary)] font-medium truncate">{l.name}</span>
                                                <button onClick={() => toggleCadLayer(l.name)} className="text-[var(--text-muted)] hover:text-white">
                                                    {l.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-red-400" />}
                                                </button>
                                                <button className="text-[var(--text-muted)] hover:text-white">
                                                    <Lock size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Selection Stats */}
                                <div className="space-y-2">
                                    <span className="panel-title">Selection Info</span>
                                    <div className="space-y-1.5">
                                        <PropertyRow label="Entities" value={cadEntities.length} />
                                        <PropertyRow label="Selected" value="0" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Command Bar */}
                    <div className="h-28 bg-[var(--bg-secondary)] border-t border-[var(--border-main)] flex flex-col">
                        {/* History */}
                        <div className="flex-1 overflow-auto p-3 font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)]/50">
                            {history.map((line, i) => (
                                <div key={i} className={`py-0.5 ${line.startsWith('✓') ? 'text-emerald-400' : ''}`}>
                                    {line}
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="h-10 bg-[var(--bg-active)] border-t border-[var(--border-main)] flex items-center px-4 gap-3">
                            <Command size={14} className="text-[var(--accent-primary)]" />
                            <span className="text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase">Command:</span>
                            <input
                                type="text"
                                value={commandValue}
                                onChange={(e) => setCommandValue(e.target.value)}
                                onKeyDown={handleCommand}
                                className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--text-primary)] font-mono placeholder:text-[var(--text-disabled)]"
                                placeholder="LINE, RECT, CIRCLE, MOVE, COPY, TRIM, PURGE..."
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
