import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUp, Bot, Sparkles, Zap, Check, Loader2 } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordCreditHistory } from '../../lib/creditHistory';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePersonaPrompt, DEFAULT_PERSONA_CONFIG } from '../assistant/avatar/personaConfig';

interface MobileChatInputProps {
    placeholder?: string;
    onFocus?: () => void;
}

// AI Provider types
type AIProvider = 'openai' | 'anthropic' | 'gemini';

interface AIProviderOption {
    id: AIProvider;
    name: string;
    model: string;
    icon: React.ReactNode;
    color: string;
}

const aiProviders: AIProviderOption[] = [
    {
        id: 'openai',
        name: 'GPT 5.2',
        model: 'gpt-5.2',
        icon: (
            <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.3829a.0758.0758 0 0 1-.0473-.0615V2.7082a4.4848 4.4848 0 0 1 3.9154 1.5661 4.4848 4.4848 0 0 1 2.228 2.4412l-.142.0805-4.783 2.7582a.7712.7712 0 0 0-.3927.6813zm2.0249 2.2951l-2.02-1.1686a.0758.0758 0 0 1-.038-.0616v-5.5826a4.4848 4.4848 0 0 1 2.3655 1.9728 4.4706 4.4706 0 0 1 2.1289 2.5316l-.1419.0805-4.783 2.7629a.7948.7948 0 0 0-.3927.6813v6.7369a4.4848 4.4848 0 0 1-2.6235-1.0123zm-8.8658-9.9174l-5.8428 3.3685-2.02-1.1686a.0758.0758 0 0 1-.0379-.0568V6.0743a4.4755 4.4755 0 0 1 2.8764-1.0408 4.4944 4.4944 0 0 1 3.2642 1.4052l-.1419.0805-4.783 2.7582a.7712.7712 0 0 0-.3927.6813z" />
            </svg>
        ),
        color: '#000000', // OpenAI black/white
    },
    {
        id: 'anthropic',
        name: 'Sonnet 4.5',
        model: 'claude-3-5-sonnet-20240620', // Keeping underlying model ID for now
        icon: (
            <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.422 18.569l-1.953-4.394h-6.94l-1.953 4.394H2.46L10.28 1.431h3.44l7.82 17.138h-4.118zM12 5.862l-2.422 5.453h4.844L12 5.862z" />
            </svg>
        ),
        color: '#d97757',
    },
    {
        id: 'gemini',
        name: 'Gemini 2.0',
        model: 'gemini-1.5-pro',
        icon: (
            <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z" />
            </svg>
        ),
        color: '#4285f4',
    },
];

const CREDIT_COST = 1;

export default function MobileChatInput({
    placeholder = 'Ask anything...',
    onFocus
}: MobileChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
        addMessage,
        updateMessage,
        setIsLoading,
        isLoading,
        pendingMessage,
        setPendingMessage,
        currentConversationId,
        createNewConversation,
        messages,
        currentPageContext,
        pageData
    } = useAssistant();
    const { userData, currentUser } = useAuth();
    const { profile } = useUserProfile();

    // AI Provider State
    const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>('openai');
    const [showAISelector, setShowAISelector] = useState(false);
    const [isLoadingAIPreference, setIsLoadingAIPreference] = useState(true);

    // Load AI preference
    useEffect(() => {
        const loadAIPreference = async () => {
            if (!currentUser) {
                setIsLoadingAIPreference(false);
                return;
            }
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists() && userDoc.data()?.assistantAIProvider) {
                    setSelectedAIProvider(userDoc.data().assistantAIProvider as AIProvider);
                }
            } catch (error) {
                console.error('Error loading AI preference:', error);
            } finally {
                setIsLoadingAIPreference(false);
            }
        };
        loadAIPreference();
    }, [currentUser]);

    // Save AI preference
    const saveAIPreference = async (provider: AIProvider) => {
        setSelectedAIProvider(provider);
        setShowAISelector(false);
        if (currentUser) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await setDoc(userRef, { assistantAIProvider: provider }, { merge: true });
            } catch (error) {
                console.error('Error saving AI preference:', error);
            }
        }
    };

    // Handle pending messages (from Quick Actions)
    useEffect(() => {
        if (pendingMessage && !isLoading) {
            handleSendMessage(pendingMessage);
            setPendingMessage(null);
        }
    }, [pendingMessage, isLoading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleSendMessage = async (content: string) => {
        const trimmedInput = content.trim();
        if (!trimmedInput || isLoading) return;

        // Create conversation if none exists
        if (!currentConversationId) {
            createNewConversation();
        }

        // Add user message
        addMessage({
            role: 'user',
            content: trimmedInput,
        });

        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Add placeholder for assistant response
        const assistantMessageId = addMessage({
            role: 'assistant',
            content: '',
            isStreaming: true,
        });

        setIsLoading(true);

        try {
            // Deduct credit logic (simplified for mobile)
            if (currentUser) {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userRef);
                    const currentCredits = userDoc.data()?.credits ?? 0;
                    const isPremium = userDoc.data()?.plan === 'premium';

                    if (!isPremium && currentCredits > 0) {
                        const newCredits = currentCredits - CREDIT_COST;
                        await updateDoc(userRef, { credits: newCredits });
                        await recordCreditHistory(currentUser.uid, newCredits, -CREDIT_COST, 'assistant', `assistant_${Date.now()}`);
                    }
                } catch (error) {
                    console.error('Error deducting credits:', error);
                }
            }

            // Build context
            const userContext = {
                firstName: profile?.firstName || userData?.name?.split(' ')[0] || 'User',
                currentJobTitle: profile?.currentJobTitle,
                skills: profile?.skills,
                // Add more fields as needed, keeping payload light for mobile
            };

            const conversationHistory = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            // API URL
            const apiUrl = import.meta.env.PROD
                ? 'https://assistant-pyozgz4rbq-uc.a.run.app'
                : '/api/assistant';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmedInput,
                    aiProvider: selectedAIProvider,
                    conversationHistory,
                    pageContext: {
                        pathname: window.location.pathname,
                        pageName: currentPageContext?.pageName,
                        pageDescription: currentPageContext?.pageDescription,
                    },
                    selectedContextItems: [], // Mobile currently doesn't support manual context selection
                    userContext,
                    userId: currentUser?.uid,
                    pageData: pageData,
                    personaConfig: DEFAULT_PERSONA_CONFIG,
                    personaPrompt: generatePersonaPrompt(DEFAULT_PERSONA_CONFIG),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            // Handle streaming
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('text/event-stream')) {
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';
                let buffer = '';

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (trimmedLine.startsWith('data: ')) {
                                const data = trimmedLine.slice(6);
                                if (data === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.content) {
                                        fullContent += parsed.content;
                                        updateMessage(assistantMessageId, fullContent, true);
                                    }
                                } catch { }
                            }
                        }
                    }
                }
                updateMessage(assistantMessageId, fullContent || 'No response received', false);
            } else {
                const data = await response.json();
                updateMessage(assistantMessageId, data.content || data.message || 'No response received', false);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            updateMessage(assistantMessageId, 'Sorry, I encountered an error. Please try again.', false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {/* AI Model Selector */}
            <div className="flex justify-start px-1">
                <div className="relative">
                    <button
                        onClick={() => setShowAISelector(!showAISelector)}
                        disabled={isLoadingAIPreference}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full
              bg-gray-100 dark:bg-white/5 
              border border-gray-200 dark:border-white/10
              text-xs font-medium text-gray-600 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        {isLoadingAIPreference ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>
                                {React.cloneElement(aiProviders.find(p => p.id === selectedAIProvider)?.icon as React.ReactElement, {
                                    className: "w-3 h-3"
                                })}
                                <span>{aiProviders.find(p => p.id === selectedAIProvider)?.name}</span>
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {showAISelector && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowAISelector(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 mb-2 w-48 z-20
                    bg-white dark:bg-[#2a2a2c] 
                    rounded-xl border border-gray-200 dark:border-white/10
                    shadow-xl shadow-black/20 overflow-hidden"
                                >
                                    <div className="p-1">
                                        {aiProviders.map((provider) => (
                                            <button
                                                key={provider.id}
                                                onClick={() => saveAIPreference(provider.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                          ${selectedAIProvider === provider.id
                                                        ? 'bg-gray-100 dark:bg-white/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${provider.color}20`, color: provider.color }}>
                                                    {React.cloneElement(provider.icon as React.ReactElement, { className: "w-3 h-3" })}
                                                </div>
                                                <span className="flex-1 text-xs font-medium text-gray-900 dark:text-white">
                                                    {provider.name}
                                                </span>
                                                {selectedAIProvider === provider.id && (
                                                    <Check className="w-3 h-3 text-gray-900 dark:text-white" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input Area */}
            <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-[#2a2a2b] p-1.5 rounded-[24px]">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={onFocus}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 max-h-[120px] py-2.5 pl-4 pr-2 bg-transparent border-none outline-none text-[15px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    style={{ minHeight: '44px' }}
                />

                <button
                    onClick={() => handleSendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className={`
            flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mb-0.5
            transition-all duration-200
            ${input.trim() && !isLoading
                            ? 'bg-[#635BFF] text-white shadow-md shadow-[#635BFF]/20 transform hover:scale-105 active:scale-95'
                            : 'bg-gray-200 dark:bg-[#3d3d3e] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }
          `}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                    )}
                </button>
            </div>
        </div>
    );
}
