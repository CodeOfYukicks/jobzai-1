import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowRight, RotateCcw, MessageCircle, Mic } from 'lucide-react';
import { useLandingAssistant, LandingMessage } from '../../hooks/useLandingAssistant';
import { useNavigate } from 'react-router-dom';

// Speech Recognition Interface
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

// LocalStorage key for first visit tracking
const FIRST_VISIT_KEY = 'cubbbe_landing_assistant_visited';

// AI Avatar image path - using chatbot image
const AI_AVATAR_PATH = '/images/chatbot_image.png';

// Quick action chips - common questions
const QUICK_ACTIONS = [
    { id: 'how-it-works', label: 'How does it work?' },
    { id: 'pricing', label: 'How much does it cost?' },
    { id: 'spam', label: 'Is this like mass apply?' },
    { id: 'results', label: 'Does it actually work?' },
];

// Premium Chat Icon SVG component
const ChatBubbleIcon = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8 12H8.01"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 12H12.01"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 12H16.01"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
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

// AI Avatar component
const AIAvatar = () => (
    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#B3DE16] to-[#8ab00d] flex items-center justify-center shadow-sm">
        <img
            src={AI_AVATAR_PATH}
            alt="Cubbbe AI"
            className="w-full h-full object-cover"
            onError={(e) => {
                // Fallback to favicon if chatbot_image doesn't exist yet
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                    <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                `;
            }}
        />
    </div>
);

// Message bubble component - Premium SaaS style with avatar
const MessageBubble = ({ message }: { message: LandingMessage }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* AI Avatar - only for assistant messages */}
            {!isUser && <AIAvatar />}

            <div
                className={`max-w-[70%] px-4 py-3 text-[14px] leading-relaxed tracking-[-0.01em] ${isUser
                    ? 'bg-gradient-to-br from-[#004B23] to-[#006400] text-white rounded-[20px] rounded-br-[6px] shadow-md'
                    : 'bg-gray-50/90 text-gray-700 rounded-[20px] rounded-bl-[6px] border border-gray-100/60'
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
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
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

    // Handle voice input
    const toggleVoiceInput = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const windowObj = window as unknown as IWindow;
        const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
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
                            w-full sm:w-[360px] sm:max-w-[calc(100vw-48px)]
                            rounded-t-[20px] sm:rounded-[20px]"
                        style={{
                            height: 'min(80vh, 600px)',
                            background: 'rgba(255, 255, 255, 0.98)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15), 0 8px 32px rgba(0, 0, 0, 0.12)',
                        }}
                    >
                        {/* Dark Header - Chat Badge Style - Fixed */}
                        <div
                            className="relative overflow-hidden flex-shrink-0"
                            style={{
                                background: '#004B23',
                            }}
                        >
                            {/* Close button - positioned absolute */}
                            <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                                <button
                                    onClick={clearChat}
                                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all duration-200"
                                    title="Clear chat"
                                >
                                    <RotateCcw className="w-4 h-4 text-white/60" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all duration-200"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Content Container */}
                            <div className="pt-4 pb-5 px-6 flex flex-col items-center">
                                {/* Chat Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-700/80 mb-3">
                                    <MessageCircle className="w-4 h-4 text-white" />
                                    <span className="text-white text-[13px] font-medium">Chat</span>
                                </div>

                                {/* AI Avatar */}
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#B3DE16] to-[#8ab00d] flex items-center justify-center shadow-lg mb-3 ring-2 ring-white/20">
                                    <img
                                        src={AI_AVATAR_PATH}
                                        alt="Cubbbe AI"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.innerHTML = `
                                                <svg viewBox="0 0 24 24" class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                </svg>
                                            `;
                                        }}
                                    />
                                </div>

                                {/* Welcome Text */}
                                <h3 className="font-semibold text-white text-[15px] tracking-[-0.02em] mb-0.5">Questions? Chat with us!</h3>
                                <p className="text-[11px] text-gray-400 tracking-tight">Instant answers about Cubbbe</p>
                            </div>
                        </div>

                        {/* Messages - Scrollable area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
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
                                    onClick={toggleVoiceInput}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-400'}`}
                                >
                                    <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                                </motion.button>
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
