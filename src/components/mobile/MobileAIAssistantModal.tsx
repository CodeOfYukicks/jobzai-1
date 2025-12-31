import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, History, Plus, MessageSquare, ChevronRight, Trash2 } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import ChatMessages from '../assistant/ChatMessages';
import MobileChatInput from './MobileChatInput';
import MobileQuickActions from './MobileQuickActions';
import { Avatar } from '../assistant/avatar';
import { DEFAULT_AVATAR_CONFIG } from '../assistant/avatar';
import { format } from 'date-fns';

interface MobileAIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileAIAssistantModal({ isOpen, onClose }: MobileAIAssistantModalProps) {
    const {
        messages,
        currentPageContext,
        closeAssistant,
        createNewConversation,
        conversations,
        switchConversation,
        deleteConversation,
        currentConversationId
    } = useAssistant();
    const { userData } = useAuth();
    const { profile } = useUserProfile();
    const [showQuickActions, setShowQuickActions] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    // Hide quick actions when there are messages
    useEffect(() => {
        if (messages.length > 0) {
            setShowQuickActions(false);
        } else {
            setShowQuickActions(true);
        }
    }, [messages.length]);

    // Handle close
    const handleClose = () => {
        onClose();
        setShowHistory(false);
        closeAssistant();
    };

    const handleNewChat = () => {
        createNewConversation();
        setShowHistory(false);
        setShowQuickActions(true);
    };

    const handleSelectConversation = (id: string) => {
        switchConversation(id);
        setShowHistory(false);
    };

    const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteConversation(id);
    };

    // Get user's first name
    const firstName = profile?.firstName || userData?.name?.split(' ')[0] || 'there';

    // Get current page name for subtitle
    const pageName = currentPageContext?.pageName || 'Jobzai';
    const subtitle = pageName === 'Jobzai' ? 'AI Assistant' : `Assistant for ${pageName}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[61] h-[92vh] bg-white dark:bg-[#1e1e1f] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none" onClick={handleClose}>
                            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600/50" />
                        </div>

                        {/* Header */}
                        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    config={DEFAULT_AVATAR_CONFIG}
                                    size={40}
                                    className="bg-gray-50 dark:bg-white/5 rounded-full shadow-sm"
                                />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                        Assistant
                                    </h2>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors
                                        ${showHistory
                                            ? 'bg-[#635BFF] text-white'
                                            : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                                        }`}
                                >
                                    <History className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleNewChat}
                                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {showHistory ? (
                                    <motion.div
                                        key="history"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute inset-0 overflow-y-auto p-4"
                                    >
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 px-2 uppercase tracking-wider">
                                            Chat History
                                        </h3>
                                        <div className="space-y-2">
                                            {conversations.length === 0 ? (
                                                <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                                    <p>No conversations yet</p>
                                                </div>
                                            ) : (
                                                conversations.map((conv) => (
                                                    <button
                                                        key={conv.id}
                                                        onClick={() => handleSelectConversation(conv.id)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                                                            ${currentConversationId === conv.id
                                                                ? 'bg-[#635BFF]/10 dark:bg-[#635BFF]/20 border border-[#635BFF]/20'
                                                                : 'bg-gray-50 dark:bg-white/5 border border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                                                            ${currentConversationId === conv.id
                                                                ? 'bg-[#635BFF] text-white'
                                                                : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            <MessageSquare className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-medium truncate ${currentConversationId === conv.id ? 'text-[#635BFF] dark:text-[#a5a0ff]' : 'text-gray-900 dark:text-white'}`}>
                                                                {conv.title || 'New Conversation'}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {format(new Date(conv.updatedAt), 'MMM d, h:mm a')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <div
                                                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                                                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="chat"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col"
                                    >
                                        <div className="flex-1 overflow-y-auto">
                                            {messages.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-20 pt-10">
                                                    <motion.div
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="mb-6"
                                                    >
                                                        <Avatar
                                                            config={DEFAULT_AVATAR_CONFIG}
                                                            size={80}
                                                            className="bg-gray-50 dark:bg-white/5 rounded-2xl"
                                                        />
                                                    </motion.div>

                                                    <motion.h3
                                                        initial={{ y: 10, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                                                    >
                                                        Hi, {firstName}
                                                    </motion.h3>

                                                    <motion.p
                                                        initial={{ y: 10, opacity: 0 }}
                                                        animate={{ y: 0, opacity: 1 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed"
                                                    >
                                                        I can help you optimize your profile, prepare for interviews, or analyze jobs.
                                                    </motion.p>
                                                </div>
                                            ) : (
                                                <div className="flex-1 px-4 py-4">
                                                    <ChatMessages avatarConfig={DEFAULT_AVATAR_CONFIG} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Section: Quick Actions & Input */}
                                        <div className="bg-white dark:bg-[#1e1e1f] border-t border-gray-100 dark:border-white/5 pb-4 pt-2">
                                            <AnimatePresence>
                                                {showQuickActions && (
                                                    <motion.div
                                                        initial={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="px-4 mb-3 overflow-hidden"
                                                    >
                                                        <MobileQuickActions />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="px-4">
                                                <MobileChatInput />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
