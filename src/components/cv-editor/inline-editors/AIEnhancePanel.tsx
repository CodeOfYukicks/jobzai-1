import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Wand2, TrendingUp, Zap, Target, 
  ChevronDown, Send, Loader2, Check, X, RefreshCw
} from 'lucide-react';
import { rewriteSection } from '../../../lib/cvSectionAI';
import { toast } from 'sonner';

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
        toast.success('AI suggestion ready!');
      } catch (error) {
        console.error('AI enhancement error:', error);
        toast.error('Failed to generate suggestion');
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
      toast.success('AI suggestion ready!');
    } catch (error) {
      console.error('AI enhancement error:', error);
      toast.error('Failed to generate suggestion');
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
        toast.success('AI suggestion ready!');
      } catch (error) {
        console.error('AI custom request error:', error);
        toast.error('Failed to generate suggestion');
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
      toast.success('AI suggestion ready!');
    } catch (error) {
      console.error('AI custom request error:', error);
      toast.error('Failed to generate suggestion');
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
      toast.success('Applied!');
    }
  };

  const handleReject = () => {
    setSuggestion(null);
  };

  return (
    <div className="mb-3">
      {/* Collapsed State - Premium Button - Always show, even without job context */}
      {!isExpanded && !suggestion && (
        <motion.button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative w-full overflow-hidden rounded-lg border border-purple-200/50 dark:border-purple-700/50 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-2 py-2 px-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors">
              {jobContext ? 'Enhance with AI' : 'Enhance with AI (General)'}
            </span>
            <ChevronDown className="w-3 h-3 text-purple-600 dark:text-purple-400 group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors" />
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
            <div className="p-3 rounded-lg border border-gray-200/80 dark:border-gray-700/60 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-900/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-gray-700 dark:bg-gray-600">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">AI Enhancement</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Conversation History */}
              {conversationHistory && conversationHistory.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200/60 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Previous requests:</span>
                    {onResetHistory && (
                      <button
                        type="button"
                        onClick={() => {
                          onResetHistory();
                          toast.success('Conversation reset');
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
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 rounded"
                      >
                        <span className="opacity-60">{idx + 1}.</span>
                        <span className="font-medium">{msg.length > 35 ? msg.substring(0, 35) + '...' : msg}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Content Message */}
              {!currentContent.trim() && (
                <div className="mb-3 p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10">
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/40 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                        No content yet
                      </p>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                        {sectionType === 'experience' 
                          ? 'Add your achievements first, or use the chatbox below to describe your work and we\'ll create professional bullet points for you.'
                          : sectionType === 'project'
                          ? 'Add your project details first, or use the chatbox below to describe your project and we\'ll create professional content for you.'
                          : 'Add your summary content first, or use the chatbox below to describe your professional background and we\'ll create a compelling summary for you.'}
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
                        group relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200
                        ${isActive 
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 shadow-sm' 
                          : 'border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
                    placeholder={currentContent.trim() ? "Custom request... (e.g., 'make it more technical')" : "Describe your work... (e.g., 'I worked as full stack dev in a project for a retail client, please create two bullet points for me')"}
                    disabled={isLoading}
                    className="w-full px-3 py-2 pr-8 text-xs bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200 disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomRequest}
                  disabled={isLoading || !customPrompt.trim()}
                  className="px-3 py-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
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
            <div className="p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-900/20 shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded-md bg-gray-700 dark:bg-gray-600">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">AI Suggestion</span>
              </div>

              {/* Suggestion Content */}
              <div className="p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200/60 dark:border-gray-700/50 mb-3">
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
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try again
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg shadow-sm hover:shadow transition-all duration-200"
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

