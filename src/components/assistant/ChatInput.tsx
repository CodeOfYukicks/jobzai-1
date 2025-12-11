import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import { Send, Square, AtSign, Globe, Pencil, X, ChevronDown, LayoutDashboard, Briefcase, Calendar, FileSearch, FileText, User, Settings, CreditCard, Mic, Lightbulb, ScrollText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recordCreditHistory } from '../../lib/creditHistory';
import { notify } from '../../lib/notify';

interface ChatInputProps {
  placeholder?: string;
}

// Available pages for context selection
const CONTEXT_PAGES = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: '#10B981' },
  { id: 'jobs', name: 'Job Board', icon: Briefcase, path: '/jobs', color: '#635BFF' },
  { id: 'applications', name: 'Applications', icon: Briefcase, path: '/applications', color: '#F59E0B' },
  { id: 'campaigns', name: 'Campaigns', icon: ScrollText, path: '/campaigns', color: '#8B5CF6' },
  { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/calendar', color: '#10B981' },
  { id: 'interviews', name: 'Interviews', icon: Clock, path: '/upcoming-interviews', color: '#3B82F6' },
  { id: 'cv-analysis', name: 'CV Analysis', icon: FileSearch, path: '/cv-analysis', color: '#EC4899' },
  { id: 'resume-builder', name: 'Documents', icon: FileText, path: '/resume-builder', color: '#14B8A6' },
  { id: 'profile', name: 'Profile', icon: User, path: '/professional-profile', color: '#8B5CF6' },
  { id: 'recommendations', name: 'Recommendations', icon: Lightbulb, path: '/recommendations', color: '#F59E0B' },
  { id: 'mock-interview', name: 'Mock Interview', icon: Mic, path: '/mock-interview', color: '#EF4444' },
  { id: 'settings', name: 'Settings', icon: Settings, path: '/settings', color: '#6B7280' },
  { id: 'billing', name: 'Billing', icon: CreditCard, path: '/billing', color: '#6B7280' },
];

interface SelectedContext {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  path: string;
}

const CREDIT_COST = 1;

export default function ChatInput({ placeholder = 'Ask, search, or make anything...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedContexts, setSelectedContexts] = useState<SelectedContext[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextSearch, setContextSearch] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    addMessage, 
    updateMessage, 
    isLoading, 
    setIsLoading,
    currentPageContext,
    pendingMessage,
    setPendingMessage,
    pageData,
    messages, // Get conversation history
  } = useAssistant();
  
  const { currentUser, userData } = useAuth();
  const { profile } = useUserProfile();

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
        setContextSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter context pages based on search
  const filteredContextPages = CONTEXT_PAGES.filter(page =>
    page.name.toLowerCase().includes(contextSearch.toLowerCase()) &&
    !selectedContexts.find(ctx => ctx.id === page.id)
  );

  // Add context to selection
  const addContext = (context: typeof CONTEXT_PAGES[0]) => {
    setSelectedContexts(prev => [...prev, context]);
    setShowContextMenu(false);
    setContextSearch('');
    textareaRef.current?.focus();
  };

  // Remove context from selection
  const removeContext = (contextId: string) => {
    setSelectedContexts(prev => prev.filter(ctx => ctx.id !== contextId));
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Process and send a message
  const processSendMessage = useCallback(async (messageContent: string) => {
    const trimmedInput = messageContent.trim();
    if (!trimmedInput || isLoading) return;

    // Check if user has enough credits
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const currentCredits = userDoc.data()?.credits ?? 0;
        const isPremium = userDoc.data()?.plan === 'premium';
        
        // Premium users have unlimited credits
        if (!isPremium && currentCredits < CREDIT_COST) {
          notify.error('Not enough credits. Please upgrade your plan.');
          return;
        }
      } catch (error) {
        console.error('Error checking credits:', error);
        // Continue anyway - don't block the user
      }
    }

    // Clear input
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Add user message
    addMessage({
      role: 'user',
      content: trimmedInput,
    });

    // Add placeholder for assistant response
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    setIsLoading(true);

    try {
      // Deduct credit before making API call
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const currentCredits = userDoc.data()?.credits ?? 0;
          const isPremium = userDoc.data()?.plan === 'premium';
          
          // Only deduct for non-premium users
          if (!isPremium && currentCredits > 0) {
            const newCredits = currentCredits - CREDIT_COST;
            await updateDoc(userRef, { credits: newCredits });
            await recordCreditHistory(
              currentUser.uid,
              newCredits,
              -CREDIT_COST,
              'assistant',
              `assistant_${Date.now()}`
            );
          }
        } catch (error) {
          console.error('Error deducting credits:', error);
          // Continue anyway - credit deduction failure shouldn't block the user
        }
      }

      // Build user context for the API
      const userContext = {
        firstName: profile?.firstName || userData?.name?.split(' ')[0] || 'User',
        email: profile?.email || currentUser?.email,
        currentJobTitle: profile?.currentJobTitle,
        industry: profile?.industry,
        skills: profile?.skills,
        yearsOfExperience: profile?.yearsOfExperience,
      };

      // Build conversation history for context (last 10 messages to avoid token limits)
      const conversationHistory = messages
        .slice(-10) // Keep last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Include selected context pages in the request
      const contextPages = selectedContexts.map(ctx => ({
        id: ctx.id,
        name: ctx.name,
        path: ctx.path,
      }));

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          conversationHistory, // Include conversation history
          pageContext: {
            pathname: location.pathname,
            pageName: currentPageContext?.pageName,
            pageDescription: currentPageContext?.pageDescription,
          },
          selectedContextPages: contextPages, // Include user-selected context pages
          userContext,
          userId: currentUser?.uid,
          pageData: pageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response with proper buffer handling
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Add new chunk to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines from buffer
            const lines = buffer.split('\n');
            // Keep the last incomplete line in the buffer
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
                    // Update message with each chunk for smooth streaming effect
                    updateMessage(assistantMessageId, fullContent, true);
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        }
        
        // Mark streaming as complete
        updateMessage(assistantMessageId, fullContent || 'No response received', false);
      } else {
        // Handle JSON response (fallback)
        const data = await response.json();
        updateMessage(assistantMessageId, data.content || data.message || 'No response received', false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessage(
        assistantMessageId, 
        'Sorry, I encountered an error. Please try again.', 
        false
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentUser, addMessage, setIsLoading, profile, userData, location.pathname, currentPageContext, updateMessage, pageData, messages, selectedContexts]);

  // Handle pending messages from QuickActions
  useEffect(() => {
    if (pendingMessage && !isLoading) {
      setPendingMessage(null);
      processSendMessage(pendingMessage);
    }
  }, [pendingMessage, isLoading, setPendingMessage, processSendMessage]);

  const sendMessage = () => {
    processSendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Handle @ key to open context menu
    if (e.key === '@') {
      e.preventDefault();
      setShowContextMenu(true);
    }
  };

  // Stop generation
  const handleStop = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {/* Main input container */}
      <div className="relative bg-white dark:bg-[#1c1c1e] 
        rounded-2xl border border-gray-200/80 dark:border-white/[0.08]
        shadow-sm
        focus-within:border-[#635BFF]/50 dark:focus-within:border-[#635BFF]/40
        focus-within:shadow-[0_0_0_3px_rgba(99,91,255,0.1)]
        transition-all duration-200">
        
        {/* Top section: Context pills + Input */}
        <div className="px-4 pt-3.5 pb-2">
          {/* Context pills row */}
          <div className="flex items-center flex-wrap gap-2 mb-2 min-h-[28px]">
            {/* @ Button to add context */}
            <div className="relative" ref={contextMenuRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowContextMenu(!showContextMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                  bg-gray-100 dark:bg-white/[0.06] 
                  hover:bg-gray-200 dark:hover:bg-white/[0.1]
                  text-gray-600 dark:text-gray-400
                  transition-colors duration-150 text-sm font-medium"
              >
                <AtSign className="h-3.5 w-3.5" />
              </motion.button>

              {/* Context selection dropdown */}
              <AnimatePresence>
                {showContextMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-64 
                      bg-white dark:bg-[#2a2a2c] 
                      rounded-xl border border-gray-200 dark:border-white/[0.08]
                      shadow-lg shadow-black/10 dark:shadow-black/30
                      overflow-hidden z-50"
                  >
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100 dark:border-white/[0.06]">
                      <input
                        type="text"
                        value={contextSearch}
                        onChange={(e) => setContextSearch(e.target.value)}
                        placeholder="Search pages..."
                        className="w-full px-3 py-2 rounded-lg
                          bg-gray-50 dark:bg-white/[0.04]
                          border border-gray-200 dark:border-white/[0.06]
                          text-sm text-gray-900 dark:text-white
                          placeholder:text-gray-400 dark:placeholder:text-gray-500
                          focus:outline-none focus:border-[#635BFF]/50"
                        autoFocus
                      />
                    </div>
                    
                    {/* Pages list */}
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      {filteredContextPages.length > 0 ? (
                        filteredContextPages.map((page) => {
                          const IconComponent = page.icon;
                          return (
                            <button
                              key={page.id}
                              onClick={() => addContext(page)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                hover:bg-gray-100 dark:hover:bg-white/[0.06]
                                transition-colors duration-150 text-left"
                            >
                              <div 
                                className="flex items-center justify-center w-8 h-8 rounded-lg"
                                style={{ backgroundColor: `${page.color}15` }}
                              >
                                <IconComponent 
                                  className="h-4 w-4" 
                                  style={{ color: page.color }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {page.name}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No pages found
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected context pills */}
            <AnimatePresence mode="popLayout">
              {selectedContexts.map((context) => {
                const IconComponent = context.icon;
                return (
                  <motion.div
                    key={context.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-lg
                      bg-gray-100 dark:bg-white/[0.06] 
                      border border-gray-200/50 dark:border-white/[0.04]
                      group"
                  >
                    <IconComponent 
                      className="h-3.5 w-3.5" 
                      style={{ color: context.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {context.name}
                    </span>
                    <button
                      onClick={() => removeContext(context.id)}
                      className="ml-0.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/[0.1]
                        text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                        transition-colors duration-150"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent resize-none
              text-[15px] text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              max-h-[120px] min-h-[40px]"
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 
          border-t border-gray-100 dark:border-white/[0.04]">
          
          {/* Left side: Mode selectors */}
          <div className="flex items-center gap-3">
            {/* Auto mode */}
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-md
              text-gray-500 dark:text-gray-400 
              hover:text-gray-700 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-white/[0.04]
              transition-colors duration-150 text-sm">
              <Pencil className="h-3.5 w-3.5" />
              <span className="font-medium">Auto</span>
            </button>

            {/* All sources */}
            <button className="flex items-center gap-1.5 px-2 py-1 rounded-md
              text-gray-500 dark:text-gray-400 
              hover:text-gray-700 dark:hover:text-gray-300
              hover:bg-gray-100 dark:hover:bg-white/[0.04]
              transition-colors duration-150 text-sm">
              <Globe className="h-3.5 w-3.5" />
              <span className="font-medium">All sources</span>
            </button>
          </div>

          {/* Right side: Send/Stop button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isLoading ? handleStop : sendMessage}
            disabled={!input.trim() && !isLoading}
            className={`flex items-center justify-center w-9 h-9 rounded-xl
              transition-all duration-200
              ${isLoading
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : input.trim()
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90' 
                  : 'bg-gray-200 dark:bg-white/[0.08] text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            aria-label={isLoading ? "Stop generation" : "Send message"}
          >
            {isLoading ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
