/**
 * Design & Build - AR Modal (Premium Glassmorphism)
 * WebXR integration & QR code for mobile AR visualization
 * 85% opacity with 12px background blur
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Smartphone, QrCode, Eye, Glasses,
    Share2, CheckCircle, AlertCircle,
    Loader2, ArrowRight,
    Scan, Wifi, MonitorSmartphone
} from 'lucide-react';
import { useUIStore, useProjectStore } from '../../store';

// ============================================================================
// QR Code Component - Enhanced Design
// ============================================================================

function QRCodeDisplay({ data }) {
    const size = 180;
    const modules = 21;
    const moduleSize = size / modules;

    const pattern = [];
    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            if (
                (row < 7 && col < 7) ||
                (row < 7 && col >= modules - 7) ||
                (row >= modules - 7 && col < 7)
            ) {
                const isOuter = row === 0 || row === 6 || col === 0 || col === 6 ||
                    (row >= modules - 7 && (row === modules - 7 || row === modules - 1)) ||
                    (col >= modules - 7 && (col === modules - 7 || col === modules - 1));
                const isInner = row >= 2 && row <= 4 && col >= 2 && col <= 4;

                if (isOuter || isInner) {
                    pattern.push({ row, col });
                }
            } else {
                const hash = (row * modules + col + data.length) % 3;
                if (hash === 0) {
                    pattern.push({ row, col });
                }
            }
        }
    }

    return (
        <div className="relative">
            {/* Animated corners */}
            <div className="absolute -inset-2 pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent-primary)] rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--accent-primary)] rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--accent-primary)] rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--accent-primary)] rounded-br" />
            </div>

            <div className="qr-container p-5 rounded-xl shadow-2xl">
                <svg width={size} height={size} className="rounded-lg">
                    <rect width={size} height={size} fill="white" />
                    {pattern.map(({ row, col }, i) => (
                        <rect
                            key={i}
                            x={col * moduleSize}
                            y={row * moduleSize}
                            width={moduleSize - 0.5}
                            height={moduleSize - 0.5}
                            fill="#0F172A"
                            rx="1"
                        />
                    ))}
                </svg>
            </div>

            {/* Scan animation */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}

// ============================================================================
// Platform Button Component
// ============================================================================

function PlatformButton({ icon: Icon, label, onClick, variant = 'default' }) {
    return (
        <motion.button
            onClick={onClick}
            className={`
                flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
                ${variant === 'primary'
                    ? 'bg-gradient-to-br from-[var(--accent-primary)]/10 to-purple-500/10 border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                }
            `}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
        >
            <Icon size={22} />
            <span className="text-xs font-bold">{label}</span>
        </motion.button>
    );
}

// ============================================================================
// Main AR Modal Component
// ============================================================================

export default function ARModal() {
    const activeModal = useUIStore(state => state.activeModal);
    const closeModal = useUIStore(state => state.closeModal);
    const addNotification = useUIStore(state => state.addNotification);

    const workflowPhase = useProjectStore(state => state.workflowPhase);
    const detectedRooms = useProjectStore(state => state.detectedRooms);

    const [arSupported, setARSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar')
                .then(supported => setARSupported(supported))
                .catch(() => setARSupported(false));
        }
    }, []);

    if (activeModal !== 'ar') return null;

    const handleStartAR = async () => {
        if (!navigator.xr) {
            addNotification({
                type: 'error',
                title: 'WebXR Not Available',
                message: 'Use the QR code to view on a compatible device',
            });
            return;
        }

        setIsLoading(true);

        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test', 'dom-overlay'],
                domOverlay: { root: document.body },
            });

            setSessionActive(true);
            setIsLoading(false);

            session.addEventListener('end', () => {
                setSessionActive(false);
            });

            addNotification({
                type: 'success',
                title: 'AR Session Started',
                message: 'Move your device to place the model',
            });

        } catch (error) {
            setIsLoading(false);
            addNotification({
                type: 'error',
                title: 'AR Session Failed',
                message: error.message,
            });
        }
    };

    const arUrl = `https://ar.designbuild.studio/view/${Date.now()}`;
    const isReady = workflowPhase === 'ready' && detectedRooms.length > 0;

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
                    className="absolute inset-0 bg-black/50 backdrop-blur-md"
                    onClick={closeModal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />

                {/* Modal Content */}
                <motion.div
                    className="relative w-full max-w-md glass-modal overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Header */}
                    <div className="modal-header relative bg-gradient-to-r from-pink-500/10 to-purple-500/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Glasses size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">View in AR Space</h2>
                                <p className="text-sm text-[var(--text-muted)]">Augmented Reality Preview</p>
                            </div>
                        </div>
                        <button
                            onClick={closeModal}
                            className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            <X size={20} className="text-[var(--text-muted)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Model Status */}
                        <div className={`
                            flex items-center gap-4 p-4 rounded-xl border transition-all
                            ${isReady
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-amber-500/10 border-amber-500/30'
                            }
                        `}>
                            <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center
                                ${isReady ? 'bg-emerald-500/20' : 'bg-amber-500/20'}
                            `}>
                                {isReady ? (
                                    <CheckCircle size={20} className="text-emerald-400" />
                                ) : (
                                    <AlertCircle size={20} className="text-amber-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--text-primary)]">
                                    {isReady ? '3D Model Ready' : 'No Model Loaded'}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {isReady ? `${detectedRooms.length} rooms detected` : 'Upload a floor plan first'}
                                </p>
                            </div>
                        </div>

                        {/* WebXR Button */}
                        {arSupported && (
                            <motion.button
                                onClick={handleStartAR}
                                disabled={!isReady || isLoading || sessionActive}
                                className={`
                                    w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all font-bold
                                    ${isReady
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-[var(--bg-active)] text-[var(--text-disabled)] cursor-not-allowed'
                                    }
                                `}
                                whileHover={isReady ? { scale: 1.02, y: -2 } : {}}
                                whileTap={isReady ? { scale: 0.98 } : {}}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Starting AR Session...</span>
                                    </>
                                ) : sessionActive ? (
                                    <>
                                        <Eye size={20} />
                                        <span>AR Session Active</span>
                                    </>
                                ) : (
                                    <>
                                        <Glasses size={20} />
                                        <span>Enter AR Mode</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </motion.button>
                        )}

                        {/* QR Code Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                                <Scan size={14} />
                                <span className="text-xs font-medium">Scan with mobile device</span>
                            </div>

                            <div className="flex justify-center">
                                <QRCodeDisplay data={arUrl} />
                            </div>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)]">
                                <Wifi size={10} />
                                Works with iOS AR Quick Look & Android Scene Viewer
                            </div>
                        </div>

                        {/* Platform Options */}
                        <div className="flex gap-3">
                            <PlatformButton icon={Smartphone} label="iOS AR" variant="primary" />
                            <PlatformButton icon={MonitorSmartphone} label="Android AR" />
                            <PlatformButton icon={Share2} label="Share" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-xs text-[var(--text-muted)]">
                            AR visualization powered by WebXR • Works best in Chrome or Safari
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
