/**
 * Design & Build - Camera Controls
 * 3D viewport camera mode controls
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Camera,
    Box,
    Layers,
    ArrowUp,
    ArrowRight,
    Grid3X3,
    Eye,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Maximize
} from 'lucide-react';
import { useUIStore } from '../../store';

const cameraModes = [
    { id: 'perspective', icon: Camera, label: 'Perspective' },
    { id: 'isometric', icon: Box, label: 'Isometric (30° Ortho)' },
    { id: 'top', icon: Layers, label: 'Top View' },
    { id: 'front', icon: ArrowRight, label: 'Front View' },
];

export default function CameraControls() {
    const cameraMode = useUIStore(state => state.cameraMode);
    const setCameraMode = useUIStore(state => state.setCameraMode);
    const showGrid = useUIStore(state => state.showGrid);
    const toggleGrid = useUIStore(state => state.toggleGrid);
    const showWireframe = useUIStore(state => state.showWireframe);
    const toggleWireframe = useUIStore(state => state.toggleWireframe);

    return (
        <motion.div
            className="camera-controls"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            {/* Camera Mode Buttons */}
            <div className="flex gap-1 border-r border-studio-border pr-2 mr-2">
                {cameraModes.map(mode => {
                    const Icon = mode.icon;
                    const isActive = cameraMode === mode.id;

                    return (
                        <motion.button
                            key={mode.id}
                            className={`camera-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setCameraMode(mode.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title={mode.label}
                        >
                            <Icon size={18} />
                        </motion.button>
                    );
                })}
            </div>

            {/* View Options */}
            <div className="flex gap-1 border-r border-studio-border pr-2 mr-2">
                <motion.button
                    className={`camera-btn ${showGrid ? 'active' : ''}`}
                    onClick={toggleGrid}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Toggle Grid"
                >
                    <Grid3X3 size={18} />
                </motion.button>

                <motion.button
                    className={`camera-btn ${showWireframe ? 'active' : ''}`}
                    onClick={toggleWireframe}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Toggle Wireframe"
                >
                    <Eye size={18} />
                </motion.button>
            </div>

            {/* Zoom Controls */}
            <div className="flex gap-1">
                <motion.button
                    className="camera-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Zoom In"
                >
                    <ZoomIn size={18} />
                </motion.button>

                <motion.button
                    className="camera-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Zoom Out"
                >
                    <ZoomOut size={18} />
                </motion.button>

                <motion.button
                    className="camera-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Reset View"
                >
                    <RotateCcw size={18} />
                </motion.button>

                <motion.button
                    className="camera-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Fullscreen"
                >
                    <Maximize size={18} />
                </motion.button>
            </div>
        </motion.div>
    );
}
