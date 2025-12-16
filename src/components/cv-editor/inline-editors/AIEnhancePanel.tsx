import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Wand2, TrendingUp, Zap, Target, 
  ChevronDown, Send, Loader2, Check, X, RefreshCw
} from 'lucide-react';
import { rewriteSection } from '../../../lib/cvSectionAI';
import { notify } from '@/lib/notify';
import { Avatar, DEFAULT_AVATAR_CONFIG } from '../../assistant/avatar';

interface AIEnhancePanelProps {
  sectionType: 'experience' | 'project' | 'summary';
  currentContent: string;
  onApply: (enhancedContent: string) => void;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  fullCV?: string;
  conversationHistory?: string[];
  onAddToHistory?: (message: string) => void;
  onResetHistory?: () => void;
}

const QUICK_ACTIONS = [
  { id: 'improve', label: 'Improve', icon: Wand2, description: 'Enhance wording & impact' },
  { id: 'metrics', label: 'Add Metrics', icon: TrendingUp, description: 'Add quantifiable results' },
  { id: 'shorten', label: 'Shorten', icon: Zap, description: 'Make concise & punchy' },
  { id: 'keywords', label: 'ATS Keywords', icon: Target, description: 'Optimize for job match' }
];

export default function AIEnhancePanel({
  sectionType,
  currentContent,
  onApply,
  jobContext,
  fullCV,
  conversationHistory,
  onAddToHistory,
  onResetHistory
}: AIEnhancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleQuickAction = async (actionId: string) => {
    // For quick actions, require content - show message in panel instead of processing
    if (!currentContent.trim()) {
      // Message is shown in panel, just return without processing
      return;
    }

    // If no job context, use general enhancement mode
    if (!jobContext) {
      // Create a minimal job context for general enhancement
      const generalJobContext = {
        jobTitle: 'General Professional Role',
        company: 'Target Company',
        jobDescription: 'General professional position',
        keywords: [],
        strengths: [],
        gaps: []
      };
      
      setIsLoading(true);
      setActiveAction(actionId);
      
      try {
        const result = await rewriteSection({
          action: actionId as any,
          sectionType,
          currentContent,
          fullCV: fullCV || '',
          jobContext: generalJobContext,
          conversationHistory: conversationHistory || []
        });
        
        setSuggestion(result);
        notify.success('AI suggestion ready!');
      } catch (error) {
        console.error('AI enhancement error:', error);
        notify.error('Failed to generate suggestion');
      } finally {
        setIsLoading(false);
        setActiveAction(null);
      }
      return;
    }

    // Add quick action to conversation history with readable name
    const actionLabels: Record<string, string> = {
      'improve': 'Improve with storytelling',
      'metrics': 'Add metrics',
      'shorten': 'Make it shorter',
      'keywords': 'Add ATS keywords'
    };
    onAddToHistory?.(actionLabels[actionId] || actionId);

    setIsLoading(true);
    setActiveAction(actionId);

    try {
      const result = await rewriteSection({
        action: actionId as any,
        sectionType,
        currentContent,
        fullCV: fullCV || '',
        jobContext,
        conversationHistory: conversationHistory || []
      });

      setSuggestion(result);
      notify.success('AI suggestion ready!');
    } catch (error) {
      console.error('AI enhancement error:', error);
      notify.error('Failed to generate suggestion');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const handleCustomRequest = async () => {
    if (!customPrompt.trim()) return;
    
    // If no job context, use general enhancement mode
    if (!jobContext) {
      const generalJobContext = {
        jobTitle: 'General Professional Role',
        company: 'Target Company',
        jobDescription: 'General professional position',
        keywords: [],
        strengths: [],
        gaps: []
      };
      
      onAddToHistory?.(customPrompt);
      setIsLoading(true);
      setActiveAction('custom');
      
      try {
        // If no current content, use the custom prompt as the content to generate from
        const contentToUse = currentContent.trim() 
          ? `${currentContent}\n\n[USER REQUEST]: ${customPrompt}`
          : `[USER REQUEST]: ${customPrompt}`;
        
        const result = await rewriteSection({
          action: 'rewrite',
          sectionType,
          currentContent: contentToUse,
          fullCV: fullCV || '',
          jobContext: generalJobContext,
          conversationHistory: conversationHistory || []
        });
        
        setSuggestion(result);
        setCustomPrompt('');
        notify.success('AI suggestion ready!');
      } catch (error) {
        console.error('AI custom request error:', error);
        notify.error('Failed to generate suggestion');
      } finally {
        setIsLoading(false);
        setActiveAction(null);
      }
      return;
    }

    // Add to conversation history
    onAddToHistory?.(customPrompt);

    setIsLoading(true);
    setActiveAction('custom');

    try {
      // If no current content, use the custom prompt as the content to generate from
      const contentToUse = currentContent.trim() 
        ? `${currentContent}\n\n[USER REQUEST]: ${customPrompt}`
        : `[USER REQUEST]: ${customPrompt}`;
      
      // For custom requests, we use the 'rewrite' action with custom instructions
      const result = await rewriteSection({
        action: 'rewrite',
        sectionType,
        currentContent: contentToUse,
        fullCV: fullCV || '',
        jobContext,
        conversationHistory: conversationHistory || []
      });

      setSuggestion(result);
      setCustomPrompt('');
      notify.success('AI suggestion ready!');
    } catch (error) {
      console.error('AI custom request error:', error);
      notify.error('Failed to generate suggestion');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion);
      setSuggestion(null);
      setIsExpanded(false);
      notify.success('Applied!');
    }
  };

  const handleReject = () => {
    setSuggestion(null);
  };

  return (
    <div className="mb-3">
      {/* Collapsed State - Premium Glassmorphism Button */}
      {!isExpanded && !suggestion && (
        <motion.button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative w-full overflow-hidden rounded-xl 
            bg-white/70 dark:bg-white/[0.06] 
            backdrop-blur-xl 
            border border-white/40 dark:border-white/[0.08] 
            shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]
            hover:bg-white/80 dark:hover:bg-white/[0.1] 
            hover:border-white/60 dark:hover:border-white/[0.12]
            hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
            transition-all duration-300 ease-out"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Subtle shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/[0.04] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-2.5 py-2.5 px-4">
            {/* Mini AI Avatar */}
            <div className="relative">
              <Avatar 
                config={DEFAULT_AVATAR_CONFIG} 
                size={18} 
                className="rounded-md shadow-sm group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {jobContext ? 'Enhance with AI' : 'Enhance with AI'}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </div>
        </motion.button>
      )}

      {/* Expanded State - Actions Panel */}
      <AnimatePresence>
        {isExpanded && !suggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl border border-white/40 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar 
                    config={DEFAULT_AVATAR_CONFIG} 
                    size={20} 
                    className="rounded-md shadow-sm"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-wide">AI Enhancement</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Conversation History */}
              {conversationHistory && conversationHistory.length > 0 && (
                <div className="mb-3 pb-3 border-b border-white/20 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Previous requests:</span>
                    {onResetHistory && (
                      <button
                        type="button"
                        onClick={() => {
                          onResetHistory();
                          notify.success('Conversation reset');
                        }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Clear conversation history"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {conversationHistory.map((msg, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-white/50 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 border border-white/30 dark:border-white/[0.08] rounded-md backdrop-blur-sm"
                      >
                        <span className="opacity-50">{idx + 1}.</span>
                        <span className="font-medium">{msg.length > 35 ? msg.substring(0, 35) + '...' : msg}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Content Message */}
              {!currentContent.trim() && (
                <div className="mb-3 p-3 rounded-lg border border-amber-300/30 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.06] backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded-md bg-amber-100/80 dark:bg-amber-500/20 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        No content yet
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 leading-relaxed">
                        {sectionType === 'experience' 
                          ? 'Add your achievements first, or use the chatbox below to describe your work.'
                          : sectionType === 'project'
                          ? 'Add your project details first, or use the chatbox below to describe your project.'
                          : 'Add your summary content first, or use the chatbox below to describe your background.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isActive = activeAction === action.id;
                  
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action.id)}
                      disabled={isLoading}
                      className={`
                        group relative flex flex-col items-center gap-1 p-2 rounded-lg border backdrop-blur-sm transition-all duration-200
                        ${isActive 
                          ? 'border-gray-300/60 dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.08] shadow-sm' 
                          : 'border-white/30 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] hover:border-white/50 dark:hover:border-white/[0.1] hover:bg-white/60 dark:hover:bg-white/[0.06]'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {isActive && isLoading ? (
                        <Loader2 className="w-4 h-4 text-gray-700 dark:text-gray-300 animate-spin" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'} transition-colors`} />
                      )}
                      <span className={`text-[10px] font-medium ${isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomRequest()}
                    placeholder={currentContent.trim() ? "Custom request... (e.g., 'make it more technical')" : "Describe your work..."}
                    disabled={isLoading}
                    className="w-full px-3 py-2.5 pr-8 text-xs bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm border border-white/40 dark:border-white/[0.06] rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300/60 dark:focus:border-white/[0.12] focus:ring-2 focus:ring-white/30 dark:focus:ring-white/[0.05] transition-all duration-200 disabled:opacity-50 text-gray-700 dark:text-gray-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomRequest}
                  disabled={isLoading || !customPrompt.trim()}
                  className="px-3.5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading && activeAction === 'custom' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Context Info */}
              {jobContext && (
                <p className="mt-2 text-[10px] text-gray-400 text-center">
                  Optimizing for {jobContext.jobTitle} at {jobContext.company}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestion Result */}
      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl border border-white/40 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <Avatar 
                  config={DEFAULT_AVATAR_CONFIG} 
                  size={20} 
                  className="rounded-md shadow-sm"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 tracking-wide">AI Suggestion</span>
              </div>

              {/* Suggestion Content */}
              <div className="p-3 bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm rounded-lg border border-white/30 dark:border-white/[0.06] mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {suggestion}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSuggestion(null);
                    setIsExpanded(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try again
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm border border-white/40 dark:border-white/[0.08] rounded-lg hover:bg-white/80 dark:hover:bg-white/[0.08] hover:border-white/60 dark:hover:border-white/[0.12] transition-all duration-200"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Check className="w-3 h-3" />
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

