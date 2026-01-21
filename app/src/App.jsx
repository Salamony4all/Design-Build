/**
 * Design & Build - Main Application
 * PDF-First Lightweight Workflow with Nano Panana Pro
 * 
 * NEW WORKFLOW:
 * 1. Upload Area (center) - PDF/Images primary
 * 2. AI Chat for Nano Panana Pro instructions
 * 3. After processing → 3D preview option
 * 4. Export with full render package (4K, Mood Board, PPTX, BOQ)
 * 
 * CAD support preserved for future development.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, AlertCircle, Info, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useUIStore, useBOQStore } from './store';

// Core Components
import Header from './components/layout/Header';
import LeftSidebar from './components/layout/LeftSidebar';
import MainWorkspace from './components/layout/MainWorkspace';
import RightSidebar from './components/layout/RightSidebar';
import CostTicker from './components/ui/CostTicker';
import ExportModal from './components/ui/ExportModal';
import ARModal from './components/ui/ARModal';
import CADEditorModal from './components/ui/CADEditorModal';

// ============================================================================
// Splash Loading Screen
// ============================================================================

function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 300);
          return 100;
        }
        return prev + 5;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo/Icon */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          {/* Animated Glow Wrapper */}
          <div className="relative">
            <motion.div
              className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_-4px_8px_rgba(0,0,0,0.2)] relative z-10">
              <img
                src="/logo.jpg"
                alt="Design & Build Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          className="text-5xl font-extrabold mb-4"
          style={{
            color: '#E0F2FE',
            textShadow: '0 0 30px rgba(14, 165, 233, 0.4)',
            letterSpacing: '-0.02em'
          }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Design & Build
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-sm text-slate-200 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Initializing AI Agents & 3D Engine...
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>

        {/* Progress Text */}
        <motion.p
          className="mt-3 text-xs text-slate-300 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {progress < 100 ? `Loading... ${progress}%` : 'Ready!'}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Notification System
// ============================================================================

function Notification({ notification, onClose }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    error: 'text-red-400 bg-red-500/10 border-red-500/30',
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };

  const Icon = icons[notification.type] || icons.info;
  const colorClass = colors[notification.type] || colors.info;

  return (
    <motion.div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl ${colorClass}`}
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      layout
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{notification.title}</p>
        {notification.message && (
          <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
        )}
      </div>
      <button onClick={() => onClose(notification.id)} className="p-1 rounded-lg hover:bg-white/10">
        <X size={14} className="text-gray-400" />
      </button>
    </motion.div>
  );
}

function NotificationsContainer() {
  const notifications = useUIStore(state => state.notifications);
  const removeNotification = useUIStore(state => state.removeNotification);

  return (
    <div className="fixed top-20 right-4 z-50 w-80 space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main App Component
// ============================================================================

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const theme = useUIStore(state => state.theme);
  const loadBOQLibrary = useBOQStore(state => state.loadBOQLibrary);
  const addNotification = useUIStore(state => state.addNotification);
  const leftSidebarOpen = useUIStore(state => state.leftSidebarOpen);
  const rightSidebarOpen = useUIStore(state => state.rightSidebarOpen);
  const toggleLeftSidebar = useUIStore(state => state.toggleLeftSidebar);
  const toggleRightSidebar = useUIStore(state => state.toggleRightSidebar);

  // Initialize application - Clear persisted BOQ items for a fresh start
  useEffect(() => {
    // Clear any leftover BOQ items from previous sessions
    const boqState = useBOQStore.getState();
    if (boqState.selectedItems?.length > 0) {
      console.log('[App] Clearing persisted BOQ items for fresh session start');
      boqState.clearScene();
    }

    loadBOQLibrary();
  }, []);

  const handleSplashComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* Splash Loading Screen */}
      <AnimatePresence>
        {isLoading && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      {/* Main Application */}
      <div className={`h-screen flex flex-col transition-colors duration-500 overflow-hidden bg-[var(--bg-primary)]`} data-theme="day">
        {/* Header - Hidden for Gemini Look */}
        {/* <Header /> */}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar Toggle */}
          {!leftSidebarOpen && (
            <button
              onClick={toggleLeftSidebar}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-r-lg hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} className="text-white/40" />
            </button>
          )}

          {/* Left Sidebar - Layers & Library (No Upload) */}
          <AnimatePresence>
            {leftSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-shrink-0"
              >
                <LeftSidebar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Workspace (Upload + AI Chat + Preview) - Centered */}
          <MainWorkspace />

          {/* Right Sidebar - Studio Controls (Lighting & Materials) */}
          <AnimatePresence>
            {rightSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-shrink-0"
              >
                <RightSidebar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Sidebar Toggle */}
          {!rightSidebarOpen && (
            <button
              onClick={toggleRightSidebar}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-l-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} className="text-white/40" />
            </button>
          )}
        </div>

        {/* Cost-to-Build Ticker */}
        <CostTicker />

        {/* Notifications */}
        <NotificationsContainer />

        {/* Modals */}
        <ExportModal />
        <ARModal />
        <CADEditorModal />
      </div>
    </>
  );
}
