import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowRight, RotateCcw } from 'lucide-react';
import { useLandingAssistant, LandingMessage } from '../../hooks/useLandingAssistant';
import { useNavigate } from 'react-router-dom';

// LocalStorage key for first visit tracking
const FIRST_VISIT_KEY = 'cubbbe_landing_assistant_visited';

// Quick action chips - common questions
const QUICK_ACTIONS = [
    { id: 'how-it-works', label: 'How does it work?' },
    { id: 'pricing', label: 'How much does it cost?' },
    { id: 'spam', label: 'Is this like mass apply?' },
    { id: 'results', label: 'Does it actually work?' },
];

// Animated chat bubble icon SVG component
const ChatBubbleIcon = ({ isActive, className = '' }: { isActive?: boolean; className?: string }) => (
    <div className={`chat-bubble-wrapper ${isActive ? 'active' : ''} ${className}`}>
        <svg viewBox="0 0 100 100" height={56} width={56} className="chat-bubble-svg">
            <g className="bubble">
                <path
                    d="M 30.7873,85.113394 30.7873,46.556405 C 30.7873,41.101961 36.826342,35.342 40.898074,35.342 H 59.113981 C 63.73287,35.342 69.29995,40.103201 69.29995,46.784744"
                    className="line line1"
                />
                <path
                    d="M 13.461999,65.039335 H 58.028684 C 63.483128,65.039335 69.243089,59.000293 69.243089,54.928561 V 45.605853 C 69.243089,40.986964 65.02087,35.419884 58.339327,35.419884"
                    className="line line2"
                />
            </g>
            <circle cx="42.5" cy="50.7" r="1.9" className="circle circle1" />
            <circle r="1.9" cy="50.7" cx="49.9" className="circle circle2" />
            <circle cx="57.3" cy="50.7" r="1.9" className="circle circle3" />
        </svg>
        <style>{`
            .chat-bubble-wrapper .bubble {
                transform-origin: 50%;
                transition: transform 500ms cubic-bezier(0.17, 0.61, 0.54, 0.9);
            }
            .chat-bubble-wrapper .line {
                fill: none;
                stroke: #ffffff;
                stroke-width: 2.75;
                stroke-linecap: round;
                transition: stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1);
            }
            .chat-bubble-wrapper .line1 {
                stroke-dasharray: 60 90;
                stroke-dashoffset: -20;
            }
            .chat-bubble-wrapper .line2 {
                stroke-dasharray: 67 87;
                stroke-dashoffset: -18;
            }
            .chat-bubble-wrapper .circle {
                fill: #ffffff;
                stroke: none;
                transform-origin: 50%;
                transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
            }
            .chat-bubble-wrapper.active .bubble {
                transform: translateX(24px) translateY(4px) rotate(45deg);
            }
            .chat-bubble-wrapper.active .line1 {
                stroke-dashoffset: 21;
            }
            .chat-bubble-wrapper.active .line2 {
                stroke-dashoffset: 30;
            }
            .chat-bubble-wrapper.active .circle {
                transform: scale(0);
            }
        `}</style>
    </div>
);

// Simple markdown parser for chat messages
const parseMarkdown = (text: string): React.ReactNode => {
    // Split by bold markers (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
        // Check for bold
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

// Message bubble component - Premium SaaS style
const MessageBubble = ({ message }: { message: LandingMessage }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[75%] px-4 py-3 text-[14px] leading-relaxed tracking-[-0.01em] ${isUser
                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-[20px] rounded-br-[6px] shadow-md'
                    : 'bg-gray-50/80 text-gray-700 rounded-[20px] rounded-bl-[6px] border border-gray-100/60'
                    }`}
                style={{
                    backdropFilter: isUser ? 'none' : 'blur(8px)',
                }}
            >
                {message.isStreaming ? (
                    <span className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                ) : (
                    <span className="whitespace-pre-wrap">{parseMarkdown(message.content)}</span>
                )}
            </div>
        </motion.div>
    );
};

export default function LandingAssistantWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const {
        messages,
        isLoading,
        showCTA,
        sendMessage,
        addWelcomeMessage,
        clearChat,
    } = useLandingAssistant();

    // Check if first visit and show tooltip
    useEffect(() => {
        const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
        if (!hasVisited) {
            // Show tooltip after a short delay
            const timer = setTimeout(() => setShowTooltip(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Hide tooltip after 5 seconds or when opened
    useEffect(() => {
        if (showTooltip) {
            const timer = setTimeout(() => setShowTooltip(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showTooltip]);

    // Add welcome message when chat opens
    useEffect(() => {
        if (isOpen) {
            addWelcomeMessage();
            // Focus input
            setTimeout(() => inputRef.current?.focus(), 100);
            // Mark as visited
            localStorage.setItem(FIRST_VISIT_KEY, 'true');
            setShowTooltip(false);
        }
    }, [isOpen, addWelcomeMessage]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle sending message
    const handleSend = useCallback(() => {
        if (inputValue.trim() && !isLoading) {
            sendMessage(inputValue);
            setInputValue('');
        }
    }, [inputValue, isLoading, sendMessage]);

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle quick action click
    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        console.log('Quick action clicked:', action.label, 'isLoading:', isLoading);
        sendMessage(action.label);
    };

    // Handle CTA click
    const handleCTAClick = () => {
        navigate('/signup');
        setIsOpen(false);
    };

    return (
        <>
            {/* Floating Bubble */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        {/* Tooltip */}
                        <AnimatePresence>
                            {showTooltip && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 10, scale: 0.9 }}
                                    className="absolute right-16 bottom-2 bg-white rounded-xl px-4 py-2.5 shadow-lg border border-gray-100 whitespace-nowrap"
                                >
                                    <span className="text-sm text-gray-700">Questions? Ask me 👋</span>
                                    <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-[-45deg]" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Button */}
                        <motion.button
                            onClick={() => setIsOpen(true)}
                            className="relative w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
                            style={{ backgroundColor: '#1a1a1a', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)' }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Pulse animation */}
                            <span
                                className="absolute inset-0 rounded-full animate-landing-pulse"
                                style={{ backgroundColor: '#1a1a1a' }}
                            />

                            {/* Icon */}
                            <ChatBubbleIcon className="relative z-10 scale-75" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel - Premium Glassmorphism - Responsive */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 24 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        className="fixed z-50 overflow-hidden flex flex-col
                            bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto
                            w-full sm:w-[400px] sm:max-w-[calc(100vw-48px)]
                            rounded-t-[20px] sm:rounded-[24px]"
                        style={{
                            maxHeight: 'min(85vh, 640px)',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        {/* Header - Minimal & Elegant */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100/50">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-[15px] tracking-[-0.02em]">Cubbbe Assistant</h3>
                                <p className="text-[12px] text-gray-400 mt-0.5 tracking-tight">Ask me anything about the product</p>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={clearChat}
                                    className="w-9 h-9 rounded-xl hover:bg-gray-100/70 flex items-center justify-center transition-all duration-200"
                                    title="Clear chat"
                                >
                                    <RotateCcw className="w-4 h-4 text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 rounded-xl hover:bg-gray-100/70 flex items-center justify-center transition-all duration-200"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Messages - Airy layout */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-[200px]">
                            {messages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions - Pill style with hover lift */}
                        {messages.length <= 2 && (
                            <div className="px-5 pb-4 flex flex-wrap gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <motion.button
                                        key={action.id}
                                        onClick={() => handleQuickAction(action)}
                                        disabled={isLoading}
                                        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}
                                        whileTap={{ scale: 0.97 }}
                                        className="px-3.5 py-2 text-[12px] font-medium bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full border border-gray-200/60 transition-all duration-200 disabled:opacity-40 tracking-tight"
                                    >
                                        {action.label}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* CTA Button - Gradient style */}
                        <AnimatePresence>
                            {showCTA && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-5 pb-4"
                                >
                                    <motion.button
                                        onClick={handleCTAClick}
                                        whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(179, 222, 22, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-3 bg-[#B3DE16] hover:bg-[#a1c814] text-gray-900 text-[13px] font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 tracking-tight"
                                    >
                                        Get started free
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input - Premium minimal */}
                        <div className="p-5 pt-3">
                            <div
                                className="flex items-center gap-3 bg-white/60 rounded-2xl px-4 py-3 transition-all duration-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(179,222,22,0.15)]"
                                style={{
                                    border: '1px solid rgba(0, 0, 0, 0.06)',
                                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask anything..."
                                    disabled={isLoading}
                                    className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50 tracking-[-0.01em]"
                                />
                                <motion.button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                                    style={{
                                        background: inputValue.trim() ? 'linear-gradient(135deg, #B3DE16 0%, #9BC914 100%)' : '#e5e7eb',
                                        boxShadow: inputValue.trim() ? '0 4px 12px rgba(179, 222, 22, 0.35)' : 'none',
                                    }}
                                >
                                    <Send className="w-4 h-4 text-gray-900" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
