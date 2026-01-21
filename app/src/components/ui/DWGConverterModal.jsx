/**
 * Design & Build - DWG Converter Modal
 * Shows conversion options when a DWG file is uploaded
 * Enhanced for visibility and premium aesthetics.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileType, Download, ExternalLink, Loader2,
    CheckCircle, AlertCircle, ArrowRight, Cloud,
    Monitor, Globe, Wrench, Sparkles, Wand2,
    DraftingCompass, Edit3, Code
} from 'lucide-react';
import { useUIStore, useProjectStore } from '../../store';
import { convertDWGtoDXF, isConversionServiceAvailable, getManualConversionInstructions } from '../../services/dwgConverter.js';

const iconMap = {
    autocad: Monitor,
    oda: Wrench,
    cloud: Cloud,
    librecad: FileType,
    aspose: Code,
};

export default function DWGConverterModal({ isOpen, onClose, dwgFile, onConversionComplete }) {
    const [status, setStatus] = useState('idle'); // idle, converting, success, error, manual
    const [progress, setProgress] = useState({ status: '', message: '' });
    const [convertedFile, setConvertedFile] = useState(null);
    const [error, setError] = useState(null);

    const instructions = getManualConversionInstructions();
    const hasCloudService = isConversionServiceAvailable();

    console.log('[DWGModal] Render state:', { isOpen, hasCloudService, status, dwgFile: dwgFile?.name });

    const handleAutoConvert = async () => {
        console.log('[DWGModal] Auto-Convert clicked!');
        setStatus('converting');
        setError(null);

        try {
            const result = await convertDWGtoDXF(dwgFile, (prog) => {
                setProgress(prog);
            });

            if (result.success) {
                setConvertedFile(result.file);
                setStatus('success');

                // AUTO-SAVE to Local Bridge (conversions/nano_panana)
                try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Content = reader.result.split(',')[1];
                        console.log('[DWGModal] Auto-saving to local bridge...');
                        await fetch('http://localhost:5001/api/save-dxf', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                filename: result.file.name,
                                content: base64Content
                            })
                        });
                        console.log('[DWGModal] File saved automatically to local conversions folder');
                    };
                    reader.readAsDataURL(result.file);
                } catch (saveErr) {
                    console.warn('[DWGModal] Auto-save to bridge failed (Bridge might not be running):', saveErr);
                }

                // Auto-trigger analysis with converted file
                if (onConversionComplete) {
                    onConversionComplete(result.file);
                }
            } else if (result.requiresManualConversion) {
                setStatus('manual');
            }
        } catch (err) {
            setError(err.message);
            setStatus('manual');
        }
    };

    const handleDownloadConverted = () => {
        if (convertedFile) {
            const url = URL.createObjectURL(convertedFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = convertedFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const openModal = useUIStore(s => s.openModal);

    if (!isOpen) return null;

    const modalContent = (
        <AnimatePresence>
            <div className="modal-overlay">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 opacity-100"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Modal Container */}
                <motion.div
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden glass-modal z-10"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="relative flex items-center justify-between p-8 border-b border-[var(--border-main)] bg-[var(--bg-header)]">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <FileType size={32} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                                    DWG Format Detected
                                </h2>
                                <p className="text-sm font-medium text-[var(--accent-primary)]">
                                    {dwgFile?.name || 'Architectural Drawing'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all border border-[var(--border-main)]"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto max-h-[60vh] custom-scroll">
                        {/* Status Message */}
                        {status === 'idle' && (
                            <div className="p-5 rounded-2xl bg-[var(--bg-active)] border border-[var(--border-main)] mb-8 flex gap-4 shadow-sm">
                                <Sparkles size={24} className="text-[var(--accent-primary)] shrink-0" />
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)] mb-1">Convert for Full Features</h4>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                        Binary DWG files must be converted to DXF to enable automatic room detection and precision 3D modeling.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 mb-8 flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <AlertCircle size={24} className="text-red-400 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-red-400 mb-1">Conversion Error</h4>
                                        <p className="text-sm text-red-300 leading-relaxed">{error}</p>
                                    </div>
                                </div>
                                {error.includes('Quota') && (
                                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 leading-normal">
                                        <strong className="text-amber-400 block mb-1">Developer Tip:</strong>
                                        Your CloudConvert account has run out of credits. You can fix this by:<br />
                                        1. Visiting <a href="https://cloudconvert.com/dashboard/credits" target="_blank" className="underline font-bold">CloudConvert Dashboard</a> to add credits.<br />
                                        2. Setting <code className="bg-black/30 px-1">VITE_CLOUDCONVERT_SANDBOX=true</code> in your <code className="bg-black/30 px-1">.env</code> for free testing credits.<br />
                                        3. Using the <strong>Manual Conversion</strong> tools below.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Converting State */}
                        {status === 'converting' && (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="relative w-24 h-24 mb-6">
                                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                                    <Loader2 size={96} className="text-blue-500 animate-spin absolute inset-0" strokeWidth={1} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Wand2 size={32} className="text-white animate-pulse" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {progress.status === 'uploading' ? 'Uploading Blueprint...' : 'Processing Geometry...'}
                                </h3>
                                <p className="text-sm text-white/50">{progress.message}</p>

                                <div className="w-full max-w-md mt-10 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 15, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Success State */}
                        {status === 'success' && convertedFile && (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                    <CheckCircle size={56} className="text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Conversion Ready
                                </h3>
                                <p className="text-sm text-white/60 mb-10">
                                    Successfully processed <span className="text-emerald-400 font-bold">{convertedFile.name}</span>
                                </p>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={handleDownloadConverted}
                                        className="flex items-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold"
                                    >
                                        <Download size={20} />
                                        Save DXF
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onConversionComplete) onConversionComplete(convertedFile);
                                            onClose();
                                        }}
                                        className="flex items-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-all"
                                    >
                                        Start Analysis
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Idle/Manual State - Show Options */}
                        {(status === 'idle' || status === 'manual') && (
                            <div className="space-y-8">
                                {/* Primary Options: Auto Convert vs LibreCAD 3 Drafting */}
                                <div className="grid grid-cols-1 gap-4">
                                    {hasCloudService && status === 'idle' && (
                                        <motion.button
                                            onClick={handleAutoConvert}
                                            className="relative w-full p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/30 text-left hover:border-blue-400 transition-all group overflow-hidden"
                                            whileHover={{ y: -2, shadow: "0 10px 30px rgba(59,130,246,0.1)" }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                    <Cloud size={32} className="text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Auto-Convert</h4>
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20">Recommended</span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)]">Instantly convert via Nano Panana Pro services</p>
                                                </div>
                                                <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <div className="mt-4 px-4 py-2 bg-blue-500/5 rounded-lg border border-blue-500/10 italic text-[10px] text-blue-400">
                                                Power Tip: Use <code className="bg-blue-500/10 px-1 rounded">librecad dxf2pdf file.dxf</code> for instant high-fidelity conversion.
                                            </div>
                                        </motion.button>
                                    )}

                                    <motion.button
                                        onClick={() => {
                                            // Trigger analysis via Vision AI FIRST so the editor has data
                                            if (onConversionComplete) onConversionComplete(dwgFile);
                                            openModal('cad-editor');
                                            onClose();
                                        }}
                                        className="relative w-full p-6 rounded-2xl bg-[var(--bg-active)] border border-[var(--border-main)] text-left hover:border-[var(--accent-primary)] transition-all group overflow-hidden"
                                        whileHover={{ y: -2, shadow: "0 10px 30px rgba(0,0,0,0.05)" }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-xl bg-[var(--bg-header)] border border-[var(--border-main)] flex items-center justify-center group-hover:border-[var(--accent-primary)] transition-colors">
                                                <Edit3 size={32} className="text-[var(--accent-primary)]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xl font-black text-[var(--text-primary)]">AI-Assisted Manual Drafting</h4>
                                                <p className="text-sm text-[var(--text-secondary)]">AI "sees" the plan while you trace/edit in LibreCAD Web</p>
                                            </div>
                                            <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </motion.button>

                                    <motion.button
                                        onClick={() => {
                                            if (onConversionComplete) onConversionComplete(dwgFile);
                                            onClose();
                                        }}
                                        className="relative w-full p-6 rounded-2xl bg-[var(--bg-active)] border border-[var(--border-main)] text-left hover:border-amber-500 transition-all group overflow-hidden"
                                        whileHover={{ y: -2, shadow: "0 10px 30px rgba(0,0,0,0.05)" }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-xl bg-[var(--bg-header)] border border-[var(--border-main)] flex items-center justify-center group-hover:border-amber-500 transition-colors">
                                                <Sparkles size={32} className="text-amber-500" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xl font-black text-[var(--text-primary)]">Full Vision AI Analysis</h4>
                                                <p className="text-sm text-[var(--text-secondary)]">Direct AI interpretation for instant 3D model generation</p>
                                            </div>
                                            <ArrowRight size={20} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </motion.button>
                                </div>

                                {/* Manual Methods Section */}
                                <div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-px flex-1 bg-[var(--border-main)]" />
                                        <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                                            Alternative Conversion Tools
                                        </h3>
                                        <div className="h-px flex-1 bg-[var(--border-main)]" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {instructions.methods.map((method, index) => {
                                            const Icon = iconMap[method.icon] || FileType;
                                            return (
                                                <motion.div
                                                    key={index}
                                                    className="p-5 rounded-2xl bg-[var(--bg-active)] border border-[var(--border-main)] hover:border-[var(--accent-primary)] transition-all cursor-pointer group flex flex-col items-start gap-4"
                                                    onClick={() => {
                                                        if (method.url) window.open(method.url, '_blank');
                                                        else if (method.downloadUrl) window.open(method.downloadUrl, '_blank');
                                                    }}
                                                    whileHover={{ y: -2 }}
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-header)] flex items-center justify-center group-hover:bg-blue-500/10 transition-all border border-[var(--border-main)]">
                                                        <Icon size={24} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                                {method.name}
                                                            </h4>
                                                            {method.url && <ExternalLink size={14} className="text-[var(--text-muted)]" />}
                                                        </div>
                                                        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-4">
                                                            {method.steps[0]} & {method.steps.length - 1} more steps...
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="relative flex justify-between items-center p-8 bg-[var(--bg-header)] border-t border-[var(--border-main)]">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                        >
                            Cancel
                        </button>
                        <div className="flex items-center gap-3 text-[var(--text-muted)]">
                            <Monitor size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                CAD Studio v5.0 Pro
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
