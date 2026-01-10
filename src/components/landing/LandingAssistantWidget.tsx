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

// Spark icon SVG component
const SparkIcon = ({ className = '' }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
        <circle cx="12" cy="12" r="4" />
    </svg>
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

// Message bubble component
const MessageBubble = ({ message }: { message: LandingMessage }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
            >
                {message.isStreaming ? (
                    <span className="flex items-center gap-1.5">
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
                            className="relative w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Pulse animation */}
                            <span className="absolute inset-0 rounded-full bg-gray-900 animate-landing-pulse" />

                            {/* Icon */}
                            <SparkIcon className="w-6 h-6 relative z-10" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ maxHeight: 'min(600px, calc(100vh - 100px))' }}
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div>
                                <h3 className="font-semibold text-gray-900">Cubbbe Assistant</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Ask me anything about the product</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                    title="Clear chat"
                                >
                                    <RotateCcw className="w-4 h-4 text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                            {messages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions - only show if few messages */}
                        {messages.length <= 2 && (
                            <div className="px-4 pb-3 flex flex-wrap gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => handleQuickAction(action)}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors disabled:opacity-50"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* CTA Button */}
                        <AnimatePresence>
                            {showCTA && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 pb-3"
                                >
                                    <button
                                        onClick={handleCTAClick}
                                        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        Get started free
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your question..."
                                    disabled={isLoading}
                                    className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
