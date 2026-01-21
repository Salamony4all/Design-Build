/**
 * AI Architect Studio Pro - AI Chat Bot
 * Floating interactive assistant for design instructions and spatial logic
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, X, Bot, User,
    Sparkles, Brain, Move, ChevronDown, ChevronUp,
    Minimize2, Maximize2
} from 'lucide-react';
import { useChatStore, useUIStore } from '../../store';

export default function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef(null);

    const { messages, isTyping, sendMessage } = useChatStore();

    // Auto-scroll to bottom
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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-24 right-8 z-[100]">
            <AnimatePresence>
                {!isOpen ? (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 flex items-center justify-center border border-white/20"
                    >
                        <Bot size={28} />
                        <motion.div
                            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.95 }}
                        className={`
              w-[380px] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden
              ${isMinimized ? 'h-16' : 'h-[550px]'}
            `}
                        style={{ position: 'relative' }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white leading-tight">AI Assistant</h3>
                                    <p className="text-[10px] text-emerald-400 font-medium">BIM Intelligence Active</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-500 hover:text-white transition-colors"
                                >
                                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-500 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages Area */}
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800"
                                >
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`
                        max-w-[85%] rounded-2xl px-3 py-2 text-sm
                        ${msg.role === 'user'
                                                    ? 'bg-cyan-500 text-white rounded-tr-none'
                                                    : 'bg-slate-800 text-gray-200 rounded-tl-none border border-slate-700'}
                      `}>
                                                {msg.content}
                                                <p className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-cyan-100' : 'text-gray-500'} font-mono`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800 px-3 py-2 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask for design upgrades or moves..."
                                            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSend}
                                            className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20"
                                        >
                                            <Send size={18} />
                                        </motion.button>
                                    </div>

                                    {/* Quick Commands */}
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                                        {[
                                            { icon: Sparkles, label: 'Improve Design', text: 'Apply design improvements' },
                                            { icon: Move, label: 'Move Elements', text: 'Optimize 3D positions' },
                                            { icon: Brain, label: 'Self Learn', text: 'Learn from my feedback' },
                                        ].map((cmd) => (
                                            <button
                                                key={cmd.label}
                                                onClick={() => sendMessage(cmd.text)}
                                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                                            >
                                                <cmd.icon size={12} />
                                                {cmd.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
