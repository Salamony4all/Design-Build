/**
 * Design & Build - Header Component (Premium UI)
 * Navigation bar with branding, toolbar, and export actions
 * Instant theme switching between Gallery White ↔ Obsidian Dark
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save, Undo2, Redo2, Settings,
    Menu, X, ChevronDown,
    Sparkles, Brain, Calculator, FileDown,
    Glasses, Sun, Moon, Layout, Layers,
    PanelLeftClose, PanelRightClose,
} from 'lucide-react';
import { useUIStore, useBOQStore, useProjectStore } from '../../store';

// ============================================================================
// Logo Component
// ============================================================================

function Logo() {
    return (
        <div className="flex items-center gap-3">
            <motion.div
                className="relative w-10 h-10"
                whileHover={{ scale: 1.05 }}
            >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600" />
                <div className="absolute inset-[2px] rounded-[10px] bg-[var(--bg-primary)] flex items-center justify-center">
                    <span className="text-sm font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        D&B
                    </span>
                </div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 opacity-20 blur-md -z-10" />
            </motion.div>

            <div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                    Design & Build
                </h1>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-[var(--text-muted)]">Pro</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                        BETA
                    </span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Toolbar Button Component
// ============================================================================

function ToolbarButton({ icon: Icon, label, onClick, active, disabled }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`
                relative p-2.5 rounded-lg transition-all group
                ${active
                    ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                    : disabled
                        ? 'text-[var(--text-disabled)] cursor-not-allowed'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }
            `}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
            <Icon size={18} />

            {/* Tooltip */}
            <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-[var(--bg-card)] text-[10px] text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[var(--border-main)] z-50 shadow-lg">
                {label}
            </span>
        </motion.button>
    );
}

// ============================================================================
// Theme Toggle Button - Premium Design
// ============================================================================

function ThemeToggle() {
    const theme = useUIStore(s => s.theme);
    const toggleTheme = useUIStore(s => s.toggleTheme);

    return (
        <motion.button
            onClick={toggleTheme}
            className={`
                relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all group overflow-hidden
                ${theme === 'night'
                    ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'
                    : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={theme === 'night' ? 'Switch to Gallery White' : 'Switch to Obsidian Dark'}
        >
            {/* Animated background glow */}
            <motion.div
                className={`absolute inset-0 opacity-20 ${theme === 'night' ? 'bg-blue-500' : 'bg-amber-400'}`}
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Icon container */}
            <div className={`
                relative w-7 h-7 rounded-lg flex items-center justify-center
                ${theme === 'night'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-amber-500/20 text-amber-600'
                }
            `}>
                <AnimatePresence mode="wait">
                    {theme === 'night' ? (
                        <motion.div
                            key="moon"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Moon size={16} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Sun size={16} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Label */}
            <div className="text-left hidden lg:block">
                <div className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'night' ? 'text-slate-500' : 'text-amber-600/60'}`}>
                    Theme
                </div>
                <div className={`text-[10px] font-bold ${theme === 'night' ? 'text-slate-300' : 'text-amber-800'}`}>
                    {theme === 'night' ? 'Obsidian Dark' : 'Gallery White'}
                </div>
            </div>
        </motion.button>
    );
}

// ============================================================================
// Agent Status Indicator
// ============================================================================

function AgentStatus() {
    const workflowPhase = useProjectStore(s => s.workflowPhase);

    const agents = [
        { id: 'vision', name: 'Vision Lead', icon: Brain, active: workflowPhase === 'analyzing' },
        { id: 'geometry', name: 'Geometry Expert', icon: Layout, active: workflowPhase === 'furnishing' },
        { id: 'surveyor', name: 'Surveyor AI', icon: Calculator, active: workflowPhase === 'ready' },
        { id: 'creative', name: 'Nano Panana Pro', icon: Sparkles, active: false },
    ];

    return (
        <div className="flex items-center gap-1">
            {agents.map(agent => {
                const Icon = agent.icon;
                return (
                    <motion.div
                        key={agent.id}
                        className={`
                            p-1.5 rounded-lg transition-all
                            ${agent.active
                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                : 'text-[var(--text-disabled)]'
                            }
                        `}
                        animate={agent.active ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: agent.active ? Infinity : 0 }}
                        title={agent.name}
                    >
                        <Icon size={14} />
                    </motion.div>
                );
            })}
        </div>
    );
}

// ============================================================================
// Main Header Component
// ============================================================================

export default function Header() {
    const [projectMenuOpen, setProjectMenuOpen] = useState(false);

    const openModal = useUIStore(s => s.openModal);
    const toggleLeftSidebar = useUIStore(s => s.toggleLeftSidebar);
    const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);
    const leftSidebarOpen = useUIStore(s => s.leftSidebarOpen);
    const rightSidebarOpen = useUIStore(s => s.rightSidebarOpen);

    const project = useBOQStore(s => s.project);
    const workflowPhase = useProjectStore(s => s.workflowPhase);
    const addNotification = useUIStore(s => s.addNotification);

    const handleSave = () => {
        addNotification({
            type: 'success',
            title: 'Project Saved',
            message: 'All changes saved to local storage',
        });
    };

    return (
        <header className="h-14 bg-[var(--bg-header)] backdrop-blur-xl border-b border-[var(--border-main)] flex items-center justify-between px-4 relative z-40">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <Logo />

                <div className="w-px h-8 bg-[var(--border-main)]" />

                {/* Project Name */}
                <div className="relative">
                    <button
                        onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Project:</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{project.name}</span>
                        <ChevronDown size={14} className="text-[var(--text-muted)]" />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                        {projectMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 mt-2 w-56 glass-modal border border-[var(--border-main)] rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                            >
                                {[
                                    'New Architecture Project',
                                    'Open Studio File',
                                    'Save Archive As...',
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                                    >
                                        {item}
                                    </button>
                                ))}
                                <div className="my-1 border-t border-[var(--border-main)]" />
                                <button className="w-full px-4 py-2.5 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors">
                                    BIM Settings
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Agent Status */}
                <div className="hidden md:flex items-center gap-2 ml-2">
                    <span className="text-[10px] font-bold text-[var(--text-disabled)] uppercase tracking-tight">Neural Stack</span>
                    <AgentStatus />
                </div>
            </div>

            {/* Center Section - Main Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-[var(--bg-active)]/50 border border-[var(--border-main)] backdrop-blur-md">
                <ToolbarButton icon={Save} label="Save (Ctrl+S)" onClick={handleSave} />
                <ToolbarButton icon={Undo2} label="Undo" onClick={() => { }} />
                <ToolbarButton icon={Redo2} label="Redo" onClick={() => { }} />

                <div className="w-px h-5 bg-[var(--border-main)] mx-1" />

                <ToolbarButton
                    icon={leftSidebarOpen ? PanelLeftClose : Menu}
                    label={leftSidebarOpen ? "Hide Explorer" : "Show Explorer"}
                    onClick={toggleLeftSidebar}
                    active={leftSidebarOpen}
                />
                <ToolbarButton
                    icon={rightSidebarOpen ? PanelRightClose : Settings}
                    label={rightSidebarOpen ? "Hide Studio" : "Show Studio"}
                    onClick={toggleRightSidebar}
                    active={rightSidebarOpen}
                />

                <div className="w-px h-5 bg-[var(--border-main)] mx-1" />

                <ToolbarButton
                    icon={Layers}
                    label="CAD Editor"
                    onClick={() => openModal('cad-editor')}
                />
                <ToolbarButton
                    icon={Glasses}
                    label="AR View"
                    onClick={() => openModal('ar')}
                />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Workflow Status */}
                <div className={`
                    hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${workflowPhase === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-[var(--bg-active)] text-[var(--text-muted)] border border-[var(--border-main)]'
                    }
                `}>
                    <span className={`
                        w-2 h-2 rounded-full 
                        ${workflowPhase === 'ready' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[var(--text-disabled)]'}
                    `} />
                    {workflowPhase === 'ready' ? 'Asset Ready' : 'Awaiting Data'}
                </div>

                {/* Export Button */}
                <motion.button
                    onClick={() => openModal('export')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-premium text-white text-xs font-bold uppercase tracking-wide"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <FileDown size={16} />
                    <span>Export Suite</span>
                </motion.button>

                {/* Theme Toggle - Premium */}
                <ThemeToggle />

                {/* Settings */}
                <button className="p-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                    <Settings size={18} />
                </button>
            </div>

            {/* Click away handler */}
            {projectMenuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProjectMenuOpen(false)}
                />
            )}
        </header>
    );
}
