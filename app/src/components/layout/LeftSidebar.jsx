/**
 * Design & Build - Left Sidebar (Premium Modern UI)
 * Contains: Layers, Upload, & BOQ Library
 * Modernized buttons, upload area, and chat interface
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Layers, Library, ChevronLeft, Search,
    Eye, EyeOff, Lock, Unlock, Folder, FolderOpen,
    Zap, Droplets, Wind, FileImage, FileScan,
    Brain, Sparkles, CheckCircle, Loader2, X,
    GripVertical, TrendingUp, Send, Bot,
    CloudUpload, FileType, Plus, MessageCircle
} from 'lucide-react';
import { useUIStore, useBOQStore, useProjectStore, useChatStore } from '../../store';
import DWGConverterModal from '../ui/DWGConverterModal';

// ============================================================================
// Premium Tab Button Component
// ============================================================================

function TabButton({ id, icon: Icon, label, isActive, onClick }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`
                flex-1 flex flex-col items-center gap-1.5 py-3 px-2 text-xs font-bold transition-all relative
                ${isActive
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
            `}
        >
            <Icon size={18} />
            <span className="tracking-wide">{label}</span>
            {isActive && (
                <motion.div
                    layoutId="leftActiveTab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent-primary)] rounded-full"
                />
            )}
        </button>
    );
}

// ============================================================================
// Modern Layer Item Component
// ============================================================================

function LayerItem({ layer, onToggle, onLock }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-[var(--border-main)] rounded-xl overflow-hidden bg-[var(--bg-card)] hover:border-[var(--border-strong)] transition-all">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-active)]/50 hover:bg-[var(--bg-hover)] transition-colors">
                <GripVertical size={12} className="text-[var(--text-disabled)] cursor-grab" />

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                >
                    {expanded ? <FolderOpen size={14} className="text-[var(--accent-primary)]" /> : <Folder size={14} className="text-[var(--text-muted)]" />}
                </button>

                <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{layer.name}</span>

                <button onClick={() => onToggle(layer.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                    {layer.visible ? <Eye size={14} className="text-[var(--text-muted)]" /> : <EyeOff size={14} className="text-[var(--text-disabled)]" />}
                </button>

                <button onClick={() => onLock(layer.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                    {layer.locked ? <Lock size={14} className="text-amber-400" /> : <Unlock size={14} className="text-[var(--text-muted)]" />}
                </button>
            </div>

            <AnimatePresence>
                {expanded && layer.items && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pl-10 py-2 space-y-1 bg-[var(--bg-secondary)]"
                    >
                        {layer.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
                                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]/50"></span>
                                {item.name}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Premium MEP Overlay Controls
// ============================================================================

function MEPControls() {
    const showElectrical = useUIStore(s => s.showElectrical);
    const showHVAC = useUIStore(s => s.showHVAC);
    const showPlumbing = useUIStore(s => s.showPlumbing);
    const toggleElectrical = useUIStore(s => s.toggleElectrical);
    const toggleHVAC = useUIStore(s => s.toggleHVAC);
    const togglePlumbing = useUIStore(s => s.togglePlumbing);

    const mepLayers = [
        { id: 'electrical', label: 'Electrical', icon: Zap, gradient: 'from-yellow-500 to-amber-600', active: showElectrical, toggle: toggleElectrical },
        { id: 'hvac', label: 'HVAC', icon: Wind, gradient: 'from-cyan-500 to-blue-600', active: showHVAC, toggle: toggleHVAC },
        { id: 'plumbing', label: 'Plumbing', icon: Droplets, gradient: 'from-blue-500 to-indigo-600', active: showPlumbing, toggle: togglePlumbing },
    ];

    return (
        <div className="space-y-3">
            <h4 className="panel-title">MEP Overlay</h4>
            <div className="grid grid-cols-3 gap-2">
                {mepLayers.map(layer => {
                    const Icon = layer.icon;
                    return (
                        <motion.button
                            key={layer.id}
                            onClick={layer.toggle}
                            className={`
                                flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                                ${layer.active
                                    ? `bg-gradient-to-br ${layer.gradient} border-transparent text-white shadow-lg`
                                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                                }
                            `}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Icon size={18} />
                            <span className="text-[10px] font-bold">{layer.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// Modern AI Chat Section (Bigger & Premium)
// ============================================================================

function ChatSection() {
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef(null);
    const { messages, isTyping, sendMessage } = useChatStore();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        sendMessage(inputValue);
        setInputValue('');
    };

    return (
        <div className="flex flex-col h-[320px] border border-[var(--border-main)] rounded-2xl bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)] overflow-hidden shadow-lg">
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--border-main)] bg-gradient-to-r from-[var(--accent-primary)]/10 to-purple-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/30">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Assistant</h3>
                            <p className="text-[10px] text-[var(--text-muted)]">Architectural Design Helper</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
            >
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <MessageCircle size={32} className="mx-auto text-[var(--text-disabled)] mb-3" />
                        <p className="text-sm text-[var(--text-muted)]">Ask me anything about your design!</p>
                        <p className="text-xs text-[var(--text-disabled)] mt-1">I can help with layouts, materials, and costs</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                            ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 text-white rounded-tr-sm shadow-lg shadow-[var(--accent-primary)]/20'
                                : 'bg-[var(--bg-active)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-main)]'
                            }
                        `}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-[var(--bg-active)] px-4 py-3 rounded-2xl rounded-tl-sm border border-[var(--border-main)] flex gap-1.5">
                            <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:0.15s]" />
                            <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[var(--bg-active)] border-t border-[var(--border-main)]">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                    />
                    <motion.button
                        onClick={handleSend}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 text-white flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Send size={18} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Modern Upload Panel with Fixed Upload Area
// ============================================================================

function UploadPanel() {
    const [dragActive, setDragActive] = useState(false);
    const [state, setState] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [dwgFile, setDwgFile] = useState(null);
    const [showDwgModal, setShowDwgModal] = useState(false);
    const fileInputRef = useRef(null);

    const startSketchAnalysis = useProjectStore(s => s.startSketchAnalysis);
    const workflowPhase = useProjectStore(s => s.workflowPhase);
    const detectedRooms = useProjectStore(s => s.detectedRooms);
    const healthCheck = useProjectStore(s => s.healthCheck);
    const resetWorkflow = useProjectStore(s => s.resetWorkflow);
    const addNotification = useUIStore(s => s.addNotification);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setDragActive(false);

        const files = e.dataTransfer?.files || e.target?.files;
        if (files && files.length > 0) {
            const file = files[0];
            const fileName = file.name.toLowerCase();
            console.log('[Upload] File detected:', fileName);

            // Check if it's a DWG file - show converter modal
            if (fileName.endsWith('.dwg')) {
                console.log('[Upload] DWG file detected, opening converter modal');
                setDwgFile(file);
                setShowDwgModal(true);
                console.log('[Upload] Modal should now be visible');
                return;
            }

            setState('uploading');

            for (let i = 0; i <= 100; i += 20) {
                await new Promise(r => setTimeout(r, 100));
                setProgress(i);
            }

            setState('analyzing');

            const result = await startSketchAnalysis(file);

            if (result?.success) {
                setState('complete');
                addNotification({
                    type: 'success',
                    title: 'Analysis Complete',
                    message: `Detected ${result.rooms?.length || 0} rooms`,
                });
            } else {
                setState('idle');
                addNotification({
                    type: 'error',
                    title: 'Analysis Failed',
                    message: result?.error || 'Unknown error',
                });
            }
        }
    }, [startSketchAnalysis, addNotification]);

    // Handle conversion complete - analyze the converted DXF file
    const handleConversionComplete = useCallback(async (dxfFile) => {
        setShowDwgModal(false);
        setDwgFile(null);
        setState('uploading');

        for (let i = 0; i <= 100; i += 20) {
            await new Promise(r => setTimeout(r, 100));
            setProgress(i);
        }

        setState('analyzing');

        const result = await startSketchAnalysis(dxfFile);

        if (result?.success) {
            setState('complete');
            addNotification({
                type: 'success',
                title: 'DXF Analysis Complete',
                message: `Detected ${result.rooms?.length || 0} rooms from converted file`,
            });
        } else {
            setState('idle');
            addNotification({
                type: 'error',
                title: 'Analysis Failed',
                message: result?.error || 'Unknown error',
            });
        }
    }, [startSketchAnalysis, addNotification]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    // Show results if workflow is ready
    if (workflowPhase === 'ready' && detectedRooms.length > 0) {
        return (
            <div className="p-4 space-y-5">
                {/* Health Check Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                                <CheckCircle size={20} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-primary)]">Design Health</h4>
                                <p className="text-[10px] text-[var(--text-muted)]">Analysis Complete</p>
                            </div>
                        </div>
                        <span className="text-2xl font-black text-emerald-400">{healthCheck.score || 85}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[var(--bg-active)] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${healthCheck.score || 85}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Detected Rooms */}
                <div className="space-y-3">
                    <h4 className="panel-title">Detected Rooms ({detectedRooms.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-auto custom-scroll">
                        {detectedRooms.slice(0, 200).map((room) => (
                            <motion.div
                                key={room.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer"
                                whileHover={{ x: 4 }}
                            >
                                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-cyan-400"></span>
                                <span className="flex-1 text-sm font-medium text-[var(--text-primary)] truncate">{room.label}</span>
                                <span className="text-xs font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-md">{room.area} m²</span>
                            </motion.div>
                        ))}
                        {detectedRooms.length > 200 && (
                            <div className="p-3 text-center text-xs text-[var(--text-muted)] italic">
                                + {detectedRooms.length - 200} more rooms hidden for performance
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Chat */}
                <ChatSection />

                {/* MEP Controls */}
                <MEPControls />

                {/* Reset Button */}
                <motion.button
                    onClick={resetWorkflow}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all font-medium"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <X size={16} />
                    Start New Project
                </motion.button>
            </div>
        );
    }

    // Upload state - Modern Upload Area
    return (
        <div className="p-4 space-y-5">
            {/* Premium Drop Zone */}
            <motion.div
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer overflow-hidden
                    ${dragActive
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                        : 'border-[var(--border-strong)] hover:border-[var(--accent-primary)]/50 bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-secondary)]'
                    }
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.dwg,.dxf,application/x-dwg,application/dxf,image/vnd.dwg,image/vnd.dxf"
                    onChange={handleDrop}
                    className="hidden"
                />

                {state === 'idle' && (
                    <div className="relative z-10">
                        <motion.div
                            className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-purple-500/20 flex items-center justify-center border border-[var(--accent-primary)]/30"
                            animate={{ scale: dragActive ? 1.1 : 1, rotate: dragActive ? 5 : 0 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <CloudUpload size={36} className={dragActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'} />
                        </motion.div>
                        <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Drop your blueprint here</h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">or click to browse files</p>
                        <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--text-disabled)]">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)]">
                                <FileImage size={14} /> Images
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)]">
                                <FileScan size={14} /> PDF
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-active)] border border-[var(--border-main)]">
                                <FileType size={14} /> DWG/DXF
                            </span>
                        </div>
                    </div>
                )}

                {state === 'uploading' && (
                    <div className="relative z-10 py-4">
                        <Loader2 size={40} className="mx-auto text-[var(--accent-primary)] animate-spin mb-4" />
                        <p className="text-[var(--text-primary)] font-bold mb-3">Uploading file...</p>
                        <div className="w-48 h-2 mx-auto bg-[var(--bg-active)] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-cyan-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">{progress}%</p>
                    </div>
                )}

                {state === 'analyzing' && (
                    <div className="relative z-10 py-4">
                        <motion.div
                            className="relative w-20 h-20 mx-auto mb-5"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 animate-pulse" />
                            <div className="absolute inset-3 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                                <Brain size={28} className="text-purple-400" />
                            </div>
                        </motion.div>
                        <p className="text-[var(--text-primary)] font-bold">Vision Lead Analyzing...</p>
                        <p className="text-xs text-[var(--text-muted)] mt-2">Detecting rooms & MEP hotspots</p>
                    </div>
                )}
            </motion.div>

            {/* AI Agents Grid */}
            <div className="space-y-3">
                <h4 className="panel-title">AI Agents</h4>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Brain, label: 'Vision Lead', desc: 'PDF Analysis', gradient: 'from-purple-500 to-pink-600' },
                        { icon: Sparkles, label: 'Geometry Expert', desc: '3D Generation', gradient: 'from-cyan-500 to-blue-600' },
                        { icon: TrendingUp, label: 'Surveyor AI', desc: 'QTO Takeoff', gradient: 'from-emerald-500 to-teal-600' },
                        { icon: Zap, label: 'MEP Detector', desc: 'Hotspot ID', gradient: 'from-amber-500 to-orange-600' },
                    ].map(agent => (
                        <motion.div
                            key={agent.label}
                            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--border-strong)] transition-all cursor-pointer group"
                            whileHover={{ y: -2 }}
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                                <agent.icon size={18} className="text-white" />
                            </div>
                            <h5 className="text-sm font-bold text-[var(--text-primary)]">{agent.label}</h5>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{agent.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Chat at bottom */}
            <ChatSection />

            {/* DWG Converter Modal */}
            <DWGConverterModal
                isOpen={showDwgModal}
                onClose={() => {
                    setShowDwgModal(false);
                    setDwgFile(null);
                }}
                dwgFile={dwgFile}
                onConversionComplete={handleConversionComplete}
            />
        </div>
    );
}

// ============================================================================
// Modern Layers Panel
// ============================================================================

function LayersPanel() {
    const [layers] = useState([
        { id: 'walls', name: 'Walls & Partitions', visible: true, locked: false, items: [{ name: 'North Wall' }, { name: 'East Wall' }] },
        { id: 'floors', name: 'Floor Plans', visible: true, locked: false },
        { id: 'furniture', name: 'Furniture', visible: true, locked: false, items: [{ name: 'Desks' }, { name: 'Chairs' }] },
        { id: 'mep', name: 'MEP Systems', visible: true, locked: false },
        { id: 'annotations', name: 'Annotations', visible: true, locked: false },
    ]);

    return (
        <div className="p-4 space-y-5">
            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search layers..."
                    className="w-full pl-11 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                />
            </div>

            {/* Layers List */}
            <div className="space-y-2">
                {layers.map(layer => (
                    <LayerItem
                        key={layer.id}
                        layer={layer}
                        onToggle={() => { }}
                        onLock={() => { }}
                    />
                ))}
            </div>

            <MEPControls />
        </div>
    );
}

// ============================================================================
// Modern Library Panel
// ============================================================================

function LibraryPanel() {
    const [activeTab, setActiveTab] = useState('furniture');
    const [searchQuery, setSearchQuery] = useState('');

    const furniture = useBOQStore(s => s.furniture);
    const fitout = useBOQStore(s => s.fitout);
    const addItemToScene = useBOQStore(s => s.addItemToScene);
    const addNotification = useUIStore(s => s.addNotification);

    const items = activeTab === 'furniture' ? furniture : fitout;
    const filteredItems = items.filter(item =>
        (item.item || item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddItem = (item) => {
        addItemToScene({
            code: item.code,
            name: item.item || item.name,
            description: item.description,
            category: activeTab,
            rate: item.rate,
            unit: item.uom,
        });
        addNotification({
            type: 'success',
            title: 'Item Added',
            message: `${item.item || item.name} added to scene`,
        });
    };

    return (
        <div className="h-full flex flex-col">
            {/* Tab Header */}
            <div className="flex border-b border-[var(--border-main)]">
                {['furniture', 'fitout'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all relative
                            ${activeTab === tab
                                ? 'text-[var(--accent-primary)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }
                        `}
                    >
                        {tab} ({tab === 'furniture' ? furniture.length : fitout.length})
                        {activeTab === tab && (
                            <motion.div
                                layoutId="libraryTab"
                                className="absolute bottom-0 left-4 right-4 h-0.5 bg-[var(--accent-primary)] rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items..."
                        className="w-full pl-11 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-auto px-4 pb-4 space-y-2">
                {filteredItems.slice(0, 50).map((item, i) => (
                    <motion.div
                        key={item.code || i}
                        className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] hover:border-[var(--accent-primary)]/50 transition-all cursor-pointer group"
                        onClick={() => handleAddItem(item)}
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <span className="inline-block text-[9px] text-[var(--accent-primary)] font-bold uppercase tracking-wider bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-md mb-1">
                                    {item.code}
                                </span>
                                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.item || item.name}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-base font-black text-[var(--accent-secondary)]">
                                    {item.rate?.toFixed?.(3) || item.rate}
                                </span>
                                <span className="text-[9px] text-[var(--text-muted)] block">OMR</span>
                            </div>
                        </div>
                        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--accent-primary)] font-medium">
                                <Plus size={12} /> Click to add
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Main Left Sidebar Component
// ============================================================================

export default function LeftSidebar() {
    const leftActiveTab = useUIStore(s => s.leftActiveTab);
    const setLeftActiveTab = useUIStore(s => s.setLeftActiveTab);
    const toggleLeftSidebar = useUIStore(s => s.toggleLeftSidebar);

    return (
        <aside className="h-full w-80 bg-[var(--bg-sidebar)] backdrop-blur-xl border-r border-[var(--border-main)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-main)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Layers size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Project</h2>
                        <p className="text-[10px] text-[var(--text-muted)]">Vision Lead Active</p>
                    </div>
                </div>
                <button
                    onClick={toggleLeftSidebar}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                >
                    <ChevronLeft size={18} className="text-[var(--text-muted)]" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-main)]">
                <TabButton id="layers" icon={Layers} label="Layers" isActive={leftActiveTab === 'layers' || leftActiveTab === 'upload'} onClick={setLeftActiveTab} />
                <TabButton id="library" icon={Library} label="Library" isActive={leftActiveTab === 'library'} onClick={setLeftActiveTab} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {(leftActiveTab === 'layers' || leftActiveTab === 'upload') && (
                        <motion.div
                            key="layers"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-auto"
                        >
                            <LayersPanel />
                        </motion.div>
                    )}
                    {leftActiveTab === 'library' && (
                        <motion.div
                            key="library"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <LibraryPanel />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
}
