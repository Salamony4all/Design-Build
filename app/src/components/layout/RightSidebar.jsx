/**
 * Design & Build - Right Sidebar (Premium UI)
 * Contains: Lighting Studio, Nano Banana Pro Materials, & Settings
 * Beautiful descriptive sliders with high/low indicators
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sun, Palette, Settings, ChevronRight,
    Monitor, Camera, Box,
    Sparkles, Maximize, Layers,
    CloudSun, View, Globe, Glasses, Moon, Sunrise,
    Thermometer, SunDim, Droplets, Factory
} from 'lucide-react';
import { useUIStore, useLightingStore, useRenderStore, useSurveyorStore } from '../../store';

// ============================================================================
// Tab Button Component
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
                    layoutId="activeTab"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--accent-primary)] rounded-full"
                />
            )}
        </button>
    );
}

// ============================================================================
// Premium Slider Component with Descriptive Labels
// ============================================================================

function PremiumSlider({
    label,
    value,
    min,
    max,
    step,
    onChange,
    unit = '',
    lowLabel = 'Low',
    highLabel = 'High',
    sliderClass = '',
    icon: Icon,
    disabled = false
}) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-3">
            {/* Header with value */}
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                    {Icon && <Icon size={14} className="text-[var(--accent-primary)]" />}
                    {label}
                </span>
                <span className="text-xs font-bold font-mono text-[var(--text-primary)] bg-[var(--bg-active)] px-2 py-0.5 rounded">
                    {typeof value === 'number' ? value.toFixed(1) : value}{unit}
                </span>
            </div>

            {/* Descriptive labels */}
            <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {lowLabel}
                </span>
                <div className="flex-1 mx-3 h-px bg-gradient-to-r from-[var(--border-main)] via-transparent to-[var(--border-main)]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                    {highLabel}
                </span>
            </div>

            {/* Slider with custom styling */}
            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    disabled={disabled}
                    className={`w-full ${sliderClass}`}
                    style={{
                        background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${percentage}%, var(--bg-active) ${percentage}%, var(--bg-active) 100%)`
                    }}
                />
            </div>
        </div>
    );
}

// ============================================================================
// Lighting Panel (Lighting Studio)
// ============================================================================

function LightingPanel() {
    const lighting = useLightingStore();

    const formatTime = (time) => {
        const hours = Math.floor(time);
        const minutes = Math.floor((time - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return (
        <div className="p-5 space-y-6">
            {/* Solar Path Simulation */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="panel-title">
                        <CloudSun size={14} />
                        Solar Path Simulation
                    </h4>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-1 rounded-full border border-[var(--accent-primary)]/20">
                        {formatTime(lighting.solarTime)}
                    </span>
                </div>

                {/* Time Slider with Dawn/Noon/Dusk labels */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-orange-400 flex items-center gap-1">
                            <Sunrise size={10} />
                            Dawn
                        </span>
                        <span className="text-amber-400 flex items-center gap-1">
                            <Sun size={10} />
                            Noon
                        </span>
                        <span className="text-purple-400 flex items-center gap-1">
                            <Moon size={10} />
                            Dusk
                        </span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="0.1"
                        value={lighting.solarTime}
                        onChange={(e) => lighting.setSolarTime(parseFloat(e.target.value))}
                        className="w-full slider-sun"
                        style={{
                            background: `linear-gradient(90deg, 
                                #F97316 0%, 
                                #FBBF24 25%, 
                                #FEF3C7 50%, 
                                #FBBF24 75%, 
                                #7C3AED 100%
                            )`
                        }}
                    />
                </div>
            </div>

            {/* Light Controls */}
            <div className="space-y-5 pt-5 border-t border-[var(--border-main)]">
                <h4 className="panel-title">
                    <Sun size={14} />
                    Light Controls
                </h4>

                <PremiumSlider
                    label="Sun Intensity"
                    icon={SunDim}
                    value={lighting.sunIntensity}
                    min={0}
                    max={5}
                    step={0.1}
                    onChange={(v) => lighting.setSunIntensity(v)}
                    unit="x"
                    lowLabel="Overcast"
                    highLabel="Blazing"
                    sliderClass="slider-sun"
                />

                <PremiumSlider
                    label="Ambient Fill"
                    icon={Droplets}
                    value={lighting.ambientIntensity}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) => lighting.setAmbientIntensity(v)}
                    unit="x"
                    lowLabel="Dark"
                    highLabel="Bright"
                    sliderClass="slider-ambient"
                />

                {/* Temperature Slider with Warm/Cool */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                            <Thermometer size={14} className="text-[var(--accent-primary)]" />
                            Color Temperature
                        </span>
                        <span className="text-xs font-bold font-mono text-[var(--text-primary)] bg-[var(--bg-active)] px-2 py-0.5 rounded">
                            {lighting.colorTemperature}K
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-blue-400">❄ Cool</span>
                        <span className="text-gray-400">Neutral</span>
                        <span className="text-orange-400">🔥 Warm</span>
                    </div>
                    <input
                        type="range"
                        min="2000"
                        max="9000"
                        step="100"
                        value={lighting.colorTemperature}
                        onChange={(e) => lighting.setColorTemperature(parseInt(e.target.value))}
                        className="w-full slider-temperature"
                        style={{
                            background: `linear-gradient(90deg, #60A5FA 0%, #FEFCE8 50%, #F59E0B 100%)`
                        }}
                    />
                </div>
            </div>

            {/* Shadows */}
            <div className="space-y-4 pt-5 border-t border-[var(--border-main)]">
                <div className="flex items-center justify-between">
                    <h4 className="panel-title mb-0">Shadows</h4>
                    <button
                        onClick={() => lighting.toggleShadows()}
                        className={`toggle-switch ${lighting.shadowsEnabled ? 'active' : ''}`}
                    />
                </div>

                <PremiumSlider
                    label="Shadow Softness"
                    value={lighting.shadowSoftness}
                    min={0}
                    max={10}
                    step={0.5}
                    onChange={(v) => lighting.setShadowSoftness(v)}
                    lowLabel="Sharp"
                    highLabel="Soft"
                    disabled={!lighting.shadowsEnabled}
                    sliderClass="slider-shadow"
                />
            </div>

            {/* Environment Presets */}
            <div className="space-y-4 pt-5 border-t border-[var(--border-main)]">
                <h4 className="panel-title">Environment Preset</h4>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: 'studio', label: 'Studio', icon: Camera, gradient: 'from-purple-500 to-pink-600' },
                        { id: 'sunset', label: 'Sunset', icon: Sun, gradient: 'from-orange-500 to-red-600' },
                        { id: 'dawn', label: 'Dawn', icon: Sunrise, gradient: 'from-amber-500 to-orange-600' },
                        { id: 'industrial', label: 'Industrial', icon: Factory, gradient: 'from-slate-500 to-zinc-700' }
                    ].map(preset => {
                        const Icon = preset.icon;
                        const isActive = lighting.environmentPreset === preset.id;
                        return (
                            <motion.button
                                key={preset.id}
                                onClick={() => lighting.setEnvironmentPreset(preset.id)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl border transition-all
                                    ${isActive
                                        ? `bg-gradient-to-br ${preset.gradient} border-transparent text-white shadow-lg`
                                        : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
                                    }
                                `}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon size={16} />
                                <span className="text-xs font-bold">{preset.label}</span>
                            </motion.button>
                        );
                    })}
                </div>

                <motion.button
                    onClick={() => lighting.toggleStudioMode()}
                    className={`
                        w-full py-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2
                        ${lighting.studioMode
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/30'
                            : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-secondary)] hover:border-purple-500/50 hover:bg-purple-500/5'
                        }
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <Sparkles size={16} />
                    {lighting.studioMode ? '✓ Studio Lighting Active' : 'Enable Studio Lighting'}
                </motion.button>
            </div>
        </div>
    );
}

// ============================================================================
// Materials Panel (Nano Banana Pro)
// ============================================================================

function MaterialsPanel() {
    const activeStyle = useRenderStore(s => s.activeStyle);
    const setActiveStyle = useRenderStore(s => s.setActiveStyle);

    const styles = [
        {
            id: 'industrial',
            name: 'Obsidian Industrial',
            desc: 'Raw micro-concrete, exposed carbon steel, matte basalt.',
            colors: ['#2A2A2E', '#4A4A50', '#18181B'],
            cost: 'Standard',
            icon: Factory
        },
        {
            id: 'minimalist',
            name: 'Gallery White',
            desc: 'Pure sculptural forms, seamless corian, filtered light.',
            colors: ['#FFFFFF', '#F8FAFC', '#E2E8F0'],
            cost: 'Standard',
            icon: Box
        },
        {
            id: 'luxury',
            name: 'LF2 Executive',
            desc: 'Hand-stitched leather, brushed gold, rare walnut veneer.',
            colors: ['#4E342E', '#D4AF37', '#1C1917'],
            cost: 'Premium',
            icon: Sparkles
        },
        {
            id: 'biophilic',
            name: 'Living Atelier',
            desc: 'Integrated hydroponics, reclaimed oak, self-purifying.',
            colors: ['#166534', '#86EFAC', '#DCFCE7'],
            cost: 'High-End',
            icon: Globe
        },
    ];

    return (
        <div className="p-5 space-y-6">
            {/* Nano Banana Pro Header */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-md">
                <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    Nano Banana Pro
                </h4>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-2">
                    Real-Time Texture Engine
                </p>
            </div>

            {/* Material Mood Board */}
            <div className="space-y-4">
                <h4 className="panel-title">Material Mood Board</h4>

                <div className="space-y-3">
                    {styles.map(style => {
                        const Icon = style.icon;
                        return (
                            <motion.button
                                key={style.id}
                                onClick={() => setActiveStyle(style.id)}
                                className={`
                                    w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden group
                                    ${activeStyle === style.id
                                        ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)] shadow-[0_0_25px_var(--accent-glow)]'
                                        : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-strong)]'
                                    }
                                `}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon size={14} className={activeStyle === style.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'} />
                                            <h5 className="text-sm font-bold text-[var(--text-primary)]">{style.name}</h5>
                                        </div>
                                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{style.desc}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {style.colors.map((c, i) => (
                                            <div
                                                key={i}
                                                className="w-4 h-4 rounded-full border border-white/10 shadow-sm"
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-main)]">
                                    <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wide">Investment Tier</span>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${style.cost === 'Premium' || style.cost === 'High-End'
                                        ? 'text-[var(--accent-secondary)]'
                                        : 'text-emerald-500'
                                        }`}>
                                        {style.cost}
                                    </span>
                                </div>

                                {activeStyle === style.id && (
                                    <motion.div
                                        layoutId="active-marker"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--accent-primary)] to-[var(--accent-tertiary)] rounded-r"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <button className="w-full btn-premium flex items-center justify-center gap-2 py-3">
                <Camera size={16} />
                Generate AI Render
            </button>
        </div>
    );
}

// ============================================================================
// Settings Panel
// ============================================================================

function SettingsPanel() {
    const cameraMode = useUIStore(s => s.cameraMode);
    const setCameraMode = useUIStore(s => s.setCameraMode);
    const showGrid = useUIStore(s => s.showGrid);
    const toggleGrid = useUIStore(s => s.toggleGrid);
    const showWireframe = useUIStore(s => s.showWireframe);
    const toggleWireframe = useUIStore(s => s.toggleWireframe);
    const openModal = useUIStore(s => s.openModal);

    const camModes = [
        { id: 'perspective', label: 'Perspective', icon: View },
        { id: 'isometric', label: 'Isometric', icon: Box },
        { id: 'top', label: 'Top View', icon: Maximize },
        { id: 'front', label: 'Front View', icon: Monitor },
    ];

    return (
        <div className="p-5 space-y-6">
            <div className="space-y-4">
                <h4 className="panel-title">Camera Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                    {camModes.map(mode => {
                        const Icon = mode.icon;
                        const isActive = cameraMode === mode.id;
                        return (
                            <motion.button
                                key={mode.id}
                                onClick={() => setCameraMode(mode.id)}
                                className={`
                                    flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
                                    ${isActive
                                        ? 'bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 border-transparent text-white shadow-lg shadow-[var(--accent-primary)]/30'
                                        : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
                                    }
                                `}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Icon size={20} />
                                <span className="text-[10px] font-bold">{mode.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 pt-5 border-t border-[var(--border-main)]">
                <h4 className="panel-title">Display Options</h4>

                <div className="space-y-3">
                    <motion.button
                        onClick={toggleGrid}
                        className={`
                            w-full flex items-center justify-between p-4 rounded-xl border transition-all
                            ${showGrid
                                ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/50 text-[var(--text-primary)]'
                                : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                            }
                        `}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${showGrid ? 'bg-emerald-500/20' : 'bg-[var(--bg-active)]'}`}>
                                <Globe size={16} className={showGrid ? 'text-emerald-400' : ''} />
                            </div>
                            <span className="text-xs font-bold">Show Grid</span>
                        </div>
                        <div className={`toggle-switch ${showGrid ? 'active' : ''}`} />
                    </motion.button>

                    <motion.button
                        onClick={toggleWireframe}
                        className={`
                            w-full flex items-center justify-between p-4 rounded-xl border transition-all
                            ${showWireframe
                                ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/50 text-[var(--text-primary)]'
                                : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                            }
                        `}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${showWireframe ? 'bg-purple-500/20' : 'bg-[var(--bg-active)]'}`}>
                                <Layers size={16} className={showWireframe ? 'text-purple-400' : ''} />
                            </div>
                            <span className="text-xs font-bold">Wireframe Mode</span>
                        </div>
                        <div className={`toggle-switch ${showWireframe ? 'active' : ''}`} />
                    </motion.button>
                </div>
            </div>

            {/* AR Section */}
            <div className="pt-5 border-t border-[var(--border-main)]">
                <motion.button
                    onClick={() => openModal('ar')}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all font-bold text-sm"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Glasses size={20} />
                    View in AR Space
                </motion.button>
            </div>
        </div>
    );
}

// ============================================================================
// Main Right Sidebar Component
// ============================================================================

export default function RightSidebar() {
    const rightActiveTab = useUIStore(s => s.rightActiveTab);
    const setRightActiveTab = useUIStore(s => s.setRightActiveTab);
    const toggleRightSidebar = useUIStore(s => s.toggleRightSidebar);

    return (
        <aside className="h-full w-80 bg-[var(--bg-sidebar)] backdrop-blur-xl border-l border-[var(--border-main)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-main)]">
                <button
                    onClick={toggleRightSidebar}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                >
                    <ChevronRight size={16} className="text-[var(--text-muted)]" />
                </button>
                <div className="flex items-center gap-3 text-right">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--text-primary)]">Studio</h2>
                        <p className="text-[10px] text-[var(--text-muted)]">Lighting & Materials</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles size={16} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-main)]">
                <TabButton id="lighting" icon={Sun} label="Lighting" isActive={rightActiveTab === 'lighting'} onClick={setRightActiveTab} />
                <TabButton id="materials" icon={Palette} label="Materials" isActive={rightActiveTab === 'materials'} onClick={setRightActiveTab} />
                <TabButton id="settings" icon={Settings} label="Settings" isActive={rightActiveTab === 'settings'} onClick={setRightActiveTab} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {rightActiveTab === 'lighting' && (
                        <motion.div
                            key="lighting"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-auto"
                        >
                            <LightingPanel />
                        </motion.div>
                    )}
                    {rightActiveTab === 'materials' && (
                        <motion.div
                            key="materials"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-auto"
                        >
                            <MaterialsPanel />
                        </motion.div>
                    )}
                    {rightActiveTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full overflow-auto"
                        >
                            <SettingsPanel />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
}
