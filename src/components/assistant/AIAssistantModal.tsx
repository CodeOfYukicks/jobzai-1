import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Plus, History, Trash2, MessageSquare, ChevronLeft, TrendingUp, AlertCircle, Calendar, Briefcase, FileText, Target, Type, Pencil } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import QuickActions from './QuickActions';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Link, useLocation } from 'react-router-dom';
import { 
  Avatar, 
  AvatarEditor, 
  AvatarConfig, 
  DEFAULT_AVATAR_CONFIG, 
  loadAvatarConfig, 
  saveAvatarConfig,
  PersonaConfig,
  DEFAULT_PERSONA_CONFIG,
  loadPersonaConfig,
  savePersonaConfig,
} from './avatar';

// Pages where the assistant should NOT have a backdrop (to allow interaction with content)
const PAGES_WITHOUT_BACKDROP = ['/notes'];

interface AIAssistantModalProps {
  className?: string;
}

// Format relative time for conversation list
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Generate contextual greeting based on page and data
interface ContextualInsight {
  icon: React.ReactNode;
  text: string;
  highlight?: string;
  type: 'info' | 'action' | 'success' | 'warning';
}

function generateContextualInsight(pathname: string, pageData: Record<string, any>): ContextualInsight | null {
  // Dashboard insights
  if (pathname === '/dashboard' && pageData.dashboardStats) {
    const stats = pageData.dashboardStats;
    
    if (stats.interviewStats?.upcoming > 0) {
      return {
        icon: <Calendar className="h-3.5 w-3.5" />,
        text: `${stats.interviewStats.upcoming} upcoming interview${stats.interviewStats.upcoming > 1 ? 's' : ''}`,
        highlight: stats.interviewStats.nextInterview?.company,
        type: 'action',
      };
    }
    
    if (stats.insights?.wins?.length > 0) {
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        text: stats.insights.wins[0],
        type: 'success',
      };
    }
    
    if (stats.totalApplications > 0) {
      return {
        icon: <Briefcase className="h-3.5 w-3.5" />,
        text: `${stats.totalApplications} applications tracked`,
        highlight: `${stats.metrics?.responseRate || 0}% response rate`,
        type: 'info',
      };
    }
  }
  
  // Applications insights
  if (pathname === '/applications') {
    // Prioritize currentBoard data over applications data for accurate counts
    const board = pageData.currentBoard;
    const apps = pageData.applications;
    
    // CRITICAL: Always use currentBoard.totalApplicationsOnBoard if board exists
    // This is the authoritative source for the board total
    let totalApplications = 0;
    if (board && typeof board.totalApplicationsOnBoard === 'number') {
      // Board data is available - use it (this is the correct source)
      totalApplications = board.totalApplicationsOnBoard;
    } else if (apps && typeof apps.total === 'number') {
      // Fallback to applications.total only if board data is not available
      totalApplications = apps.total;
    }
    
    // Debug log (can be removed later)
    if (process.env.NODE_ENV === 'development') {
      console.log('[AIAssistantModal] Applications insight:', {
        board: board ? { name: board.boardName, total: board.totalApplicationsOnBoard } : null,
        apps: apps ? { total: apps.total } : null,
        finalTotal: totalApplications
      });
    }
    
    // Only show insights if we have valid data
    if (apps?.insights?.needsFollowUp?.length > 0) {
      const first = apps.insights.needsFollowUp[0];
      return {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        text: `${first.company} needs follow-up`,
        highlight: `${first.daysSinceApplied} days ago`,
        type: 'warning',
      };
    }
    
    if (apps?.insights?.hotOpportunities?.length > 0) {
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        text: `${apps.insights.hotOpportunitiesCount} hot opportunit${apps.insights.hotOpportunitiesCount > 1 ? 'ies' : 'y'}`,
        highlight: apps.insights.hotOpportunities[0]?.company,
        type: 'success',
      };
    }
    
    // Show total applications badge - ALWAYS prioritize board data
    // If board exists, use its totalApplicationsOnBoard even if it's 0
    // Only fall back to apps.total if board doesn't exist
    if (board && board.boardName) {
      // Board exists - use its totalApplicationsOnBoard (this is the authoritative source)
      const boardTotal = typeof board.totalApplicationsOnBoard === 'number' ? board.totalApplicationsOnBoard : (apps?.total || 0);
      return {
        icon: <Briefcase className="h-3.5 w-3.5" />,
        text: `${boardTotal} applications`,
        highlight: `on "${board.boardName}"`,
        type: apps?.insights?.staleApplicationsCount > 0 ? 'warning' : 'info',
      };
    } else if (totalApplications > 0) {
      // No board context - use apps.total as fallback
      return {
        icon: <Briefcase className="h-3.5 w-3.5" />,
        text: `${totalApplications} applications`,
        highlight: apps?.insights?.staleApplicationsCount > 0 ? `${apps.insights.staleApplicationsCount} need attention` : undefined,
        type: apps?.insights?.staleApplicationsCount > 0 ? 'warning' : 'info',
      };
    }
  }
  
  // Job Board insights
  if (pathname === '/jobs') {
    if (pageData.selectedJob) {
      const job = pageData.selectedJob;
      return {
        icon: <Target className="h-3.5 w-3.5" />,
        text: `Viewing ${job.company}`,
        highlight: job.matchScore ? `${job.matchScore}% match` : job.title,
        type: job.matchScore && job.matchScore >= 70 ? 'success' : 'info',
      };
    }
    
    if (pageData.jobListings?.insights?.highMatchCount > 0) {
      return {
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        text: `${pageData.jobListings.insights.highMatchCount} high-match jobs found`,
        type: 'success',
      };
    }
  }
  
  // CV Analysis insights
  if (pathname.includes('/cv-analysis') && pageData.cvAnalysis) {
    const cv = pageData.cvAnalysis;
    
    if (cv.performance?.averageScore) {
      return {
        icon: <FileText className="h-3.5 w-3.5" />,
        text: 'CV Score',
        highlight: `${cv.performance.averageScore}%`,
        type: cv.performance.averageScore >= 70 ? 'success' : cv.performance.averageScore >= 50 ? 'info' : 'warning',
      };
    }
  }
  
  // Notes insights
  if (pathname.includes('/notes') && pageData.currentNote) {
    const note = pageData.currentNote;
    return {
      icon: <FileText className="h-3.5 w-3.5" />,
      text: `Editing "${note.title?.substring(0, 20)}${note.title?.length > 20 ? '...' : ''}"`,
      highlight: `${note.wordCount} words`,
      type: 'info',
    };
  }
  
  return null;
}

export default function AIAssistantModal({ className = '' }: AIAssistantModalProps) {
  const { 
    isOpen, 
    closeAssistant, 
    messages, 
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    pageData,
    currentPageContext,
    editorSelection,
    setEditorSelection,
  } = useAssistant();
  const { userData, currentUser } = useAuth();
  const { profile } = useUserProfile();
  const modalRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  
  // Avatar customization state
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  
  // Persona customization state
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig>(DEFAULT_PERSONA_CONFIG);
  const [personaLoaded, setPersonaLoaded] = useState(false);

  // Get user's first name
  const firstName = profile?.firstName || userData?.name?.split(' ')[0] || 'there';
  
  // Load avatar config on mount
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (currentUser?.uid && !avatarLoaded) {
        try {
          const config = await loadAvatarConfig(currentUser.uid);
          setAvatarConfig(config);
          setAvatarLoaded(true);
        } catch (error) {
          console.error('[Avatar] Error loading config:', error);
          setAvatarLoaded(true);
        }
      }
    };
    loadUserAvatar();
  }, [currentUser?.uid, avatarLoaded]);
  
  // Load persona config on mount
  useEffect(() => {
    const loadUserPersona = async () => {
      if (currentUser?.uid && !personaLoaded) {
        try {
          const config = await loadPersonaConfig(currentUser.uid);
          setPersonaConfig(config);
          setPersonaLoaded(true);
        } catch (error) {
          console.error('[Persona] Error loading config:', error);
          setPersonaLoaded(true);
        }
      }
    };
    loadUserPersona();
  }, [currentUser?.uid, personaLoaded]);
  
  // Handle avatar config change
  const handleAvatarConfigChange = useCallback((newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
  }, []);
  
  // Handle persona config change
  const handlePersonaConfigChange = useCallback((newConfig: PersonaConfig) => {
    setPersonaConfig(newConfig);
  }, []);

  // Handle avatar and persona save
  const handleSave = useCallback(async () => {
    if (currentUser?.uid) {
      try {
        await Promise.all([
          saveAvatarConfig(currentUser.uid, avatarConfig),
          savePersonaConfig(currentUser.uid, personaConfig),
        ]);
      } catch (error) {
        console.error('[Avatar/Persona] Error saving config:', error);
      }
    }
  }, [currentUser?.uid, avatarConfig, personaConfig]);
  
  // Generate contextual insight based on current page and data
  const contextualInsight = useMemo(() => {
    return generateContextualInsight(location.pathname, pageData);
  }, [location.pathname, pageData]);

  // Check if user is on free plan (for upgrade prompt)
  const isPremium = (userData as any)?.plan === 'premium' || (userData as any)?.plan === 'standard';
  const credits = (userData as any)?.credits ?? 25;
  const showUpgradePrompt = !isPremium && credits <= 5;

  // Reset views when assistant is closed
  useEffect(() => {
    if (!isOpen) {
      setShowHistory(false);
      setShowAvatarEditor(false);
    }
  }, [isOpen]);

  // Close on click outside (disabled on Notes page to allow interaction)
  useEffect(() => {
    // Don't close on click outside if we're on a page without backdrop
    const isPageWithoutBackdrop = PAGES_WITHOUT_BACKDROP.some(path => location.pathname.startsWith(path));
    
    if (isPageWithoutBackdrop) {
      return; // Skip this effect on pages without backdrop
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the TopBar (header) - check if target is in header
      const header = document.querySelector('header');
      if (header && (header.contains(target) || header === target)) {
        return;
      }
      
      // Don't close if clicking inside the modal
      if (modalRef.current && !modalRef.current.contains(target)) {
        closeAssistant();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeAssistant, location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAssistant();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeAssistant]);

  const hasMessages = messages.length > 0;
  
  // Filter conversations that have actual messages (not empty new conversations)
  const conversationsWithMessages = conversations.filter(c => 
    c.messages.length > 0 && c.id !== currentConversationId
  );

  // Handle selecting a conversation from history
  const handleSelectConversation = (conversationId: string) => {
    switchConversation(conversationId);
    setShowHistory(false);
  };

  // Handle deleting a conversation
  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    deleteConversation(conversationId);
  };

  // Check if current page should have backdrop
  const shouldShowBackdrop = !PAGES_WITHOUT_BACKDROP.some(path => location.pathname.startsWith(path));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Below TopBar (only on pages that need it) */}
          {shouldShowBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeAssistant}
              className="fixed top-12 left-0 right-0 bottom-0 bg-black/10 dark:bg-black/30 z-50"
            />
          )}

          {/* Fixed Right Panel - Below TopBar */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 40,
            }}
            className={`fixed top-12 right-0 w-[440px] h-[calc(100vh-48px)]
              bg-white dark:bg-[#1e1e1f] 
              shadow-2xl border-l border-gray-200/80 dark:border-[#2d2d2e]
              flex flex-col overflow-hidden ${shouldShowBackdrop ? 'z-50' : 'z-40'} ${className}`}
          >
            {/* Header - Compact when chatting, full when empty */}
            <motion.div 
              className="flex-shrink-0 relative"
              initial={false}
              animate={{ 
                paddingTop: hasMessages || showHistory ? '12px' : '32px',
                paddingBottom: hasMessages || showHistory ? '12px' : '24px',
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header buttons - Always visible */}
              <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                {/* History button - show when there are past conversations */}
                {conversationsWithMessages.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-2 rounded-lg transition-all duration-200
                      ${showHistory 
                        ? 'text-[#635BFF] bg-[#635BFF]/10' 
                        : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    aria-label="Chat history"
                    title="Chat history"
                  >
                    <History className="h-4 w-4" />
                  </button>
                )}
                {/* New Chat button - only show when there are messages */}
                {hasMessages && (
                  <button
                    onClick={() => {
                      createNewConversation();
                      setShowHistory(false);
                    }}
                    className="p-2 rounded-lg 
                      text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                      hover:bg-gray-100 dark:hover:bg-white/5
                      transition-all duration-200"
                    aria-label="New chat"
                    title="Start new chat"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {/* Close button */}
                <button
                  onClick={closeAssistant}
                  className="p-2 rounded-lg 
                    text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-white/5
                    transition-all duration-200"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Collapsible content - Avatar, Greeting, Insight */}
              <AnimatePresence mode="wait">
                {!hasMessages && !showHistory ? (
                  <motion.div
                    key="full-header"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="px-8 overflow-hidden"
                  >
                    {/* AI Avatar - Customizable DiceBear avatar */}
                    <div className="flex justify-center mb-5">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative group"
                      >
                        <Avatar 
                          config={avatarConfig}
                          size={56}
                          className="rounded-2xl ring-1 ring-gray-200/80 dark:ring-white/10 
                            bg-gray-50 dark:bg-[#2a2a2b] cursor-pointer
                            transition-transform hover:scale-105"
                          onClick={() => setShowAvatarEditor(true)}
                        />
                        {/* Edit hint on hover */}
                        <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 
                          group-hover:opacity-100 transition-opacity flex items-center justify-center
                          pointer-events-none">
                          <Pencil className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    </div>

                    {/* Greeting */}
                    <div className="text-center">
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-sm font-medium text-gray-400 dark:text-gray-500"
                      >
                        Hi, {firstName}
                      </motion.p>
                      <motion.h1 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-semibold text-gray-900 dark:text-white mt-1 tracking-tight"
                      >
                        {currentPageContext?.pageName && currentPageContext.pageName !== 'Cubbbe'
                          ? `How can I help with ${currentPageContext.pageName}?`
                          : 'Can I help you with anything?'
                        }
                      </motion.h1>
                      
                      {/* Contextual insight badge */}
                      {contextualInsight && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs font-medium
                            ${contextualInsight.type === 'success' 
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200/60 dark:ring-emerald-700/40' 
                              : contextualInsight.type === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/40'
                              : contextualInsight.type === 'action'
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/60 dark:ring-blue-700/40'
                              : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 ring-1 ring-gray-200/60 dark:ring-gray-700/40'
                            }`}
                        >
                          {contextualInsight.icon}
                          <span>{contextualInsight.text}</span>
                          {contextualInsight.highlight && (
                            <>
                              <span className="text-gray-400 dark:text-gray-500">·</span>
                              <span className="font-semibold">{contextualInsight.highlight}</span>
                            </>
                          )}
                        </motion.div>
                      )}
                      
                      {!contextualInsight && (
                        <motion.p 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-[300px] mx-auto leading-relaxed"
                        >
                          Ready to assist with anything you need. Let's get started!
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* Compact header when chatting */
                  <motion.div
                    key="compact-header"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 flex items-center gap-3"
                  >
                    <Avatar 
                      config={avatarConfig}
                      size={32}
                      className="rounded-xl ring-1 ring-gray-200/80 dark:ring-white/10 
                        bg-gray-50 dark:bg-[#2a2a2b]"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {showHistory ? 'Chat History' : 'AI Assistant'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                {showHistory ? (
                  /* Chat History Panel */
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto px-6 py-2"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Chat History
                      </h3>
                      <button
                        onClick={() => setShowHistory(false)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                          flex items-center gap-1 transition-colors"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        Back
                      </button>
                    </div>
                    
                    {conversationsWithMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No previous conversations
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {conversationsWithMessages.map((conversation) => (
                          <motion.div
                            key={conversation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative"
                          >
                            <button
                              onClick={() => handleSelectConversation(conversation.id)}
                              className="w-full text-left p-3 rounded-xl 
                                bg-gray-50 dark:bg-white/[0.03] 
                                hover:bg-gray-100 dark:hover:bg-white/[0.06]
                                border border-gray-200/60 dark:border-white/[0.06]
                                transition-all duration-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2b] 
                                  flex items-center justify-center">
                                  <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate pr-8">
                                    {conversation.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {formatRelativeTime(conversation.updatedAt)} · {conversation.messages.length} messages
                                  </p>
                                </div>
                              </div>
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={(e) => handleDeleteConversation(e, conversation.id)}
                              className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                                text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400
                                hover:bg-red-50 dark:hover:bg-red-500/10
                                transition-all duration-200"
                              title="Delete conversation"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : hasMessages ? (
                  /* Chat Messages */
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700"
                  >
                    <ChatMessages avatarConfig={avatarConfig} />
                  </motion.div>
                ) : (
                  /* Quick Actions (when no messages) */
                  <motion.div
                    key="quick-actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-y-auto px-8 pb-4"
                  >
                    <QuickActions />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Upgrade Prompt (for free users with low credits) */}
            {showUpgradePrompt && (
              <div className="flex-shrink-0 mx-6 mb-5">
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 
                  rounded-2xl p-5 border border-violet-100/80 dark:border-violet-800/30">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-[15px]">
                        Your AI trial is over.
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        This is a Pro feature. Upgrade to keep using AI.
                      </p>
                      <Link
                        to="/billing"
                        onClick={closeAssistant}
                        className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 
                          bg-gray-900 dark:bg-white text-white dark:text-gray-900 
                          text-sm font-medium rounded-xl
                          hover:bg-gray-800 dark:hover:bg-gray-100
                          transition-all duration-200 shadow-sm"
                      >
                        Upgrade
                      </Link>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Rocket className="h-14 w-14 text-violet-400 dark:text-violet-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selection Indicator */}
            <AnimatePresence>
              {editorSelection && editorSelection.text && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-shrink-0 px-6"
                >
                  <div className="flex items-center gap-2 px-3 py-2 mb-2
                    bg-violet-50 dark:bg-violet-500/10
                    border border-violet-200 dark:border-violet-500/20
                    rounded-xl"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg 
                      bg-violet-100 dark:bg-violet-500/20
                      flex items-center justify-center"
                    >
                      <Type className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-0.5">
                        Selected text
                      </p>
                      <p className="text-xs text-violet-600/80 dark:text-violet-400/80 truncate">
                        "{editorSelection.text.length > 50 
                          ? editorSelection.text.substring(0, 50) + '...' 
                          : editorSelection.text}"
                      </p>
                    </div>
                    <button
                      onClick={() => setEditorSelection(null)}
                      className="flex-shrink-0 p-1 rounded-md
                        text-violet-400 hover:text-violet-600
                        dark:text-violet-500 dark:hover:text-violet-300
                        hover:bg-violet-100 dark:hover:bg-violet-500/20
                        transition-colors"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Input */}
            <div className="flex-shrink-0 px-6 pb-6 pt-3 border-t border-gray-100 dark:border-white/5">
              <ChatInput />
            </div>
            
            {/* Avatar Editor Overlay */}
            <AnimatePresence>
              {showAvatarEditor && (
                <AvatarEditor
                  config={avatarConfig}
                  onConfigChange={handleAvatarConfigChange}
                  onClose={() => setShowAvatarEditor(false)}
                  onSave={handleSave}
                  personaConfig={personaConfig}
                  onPersonaConfigChange={handlePersonaConfigChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

