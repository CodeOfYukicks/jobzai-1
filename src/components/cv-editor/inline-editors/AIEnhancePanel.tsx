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
  fullCV
}: AIEnhancePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleQuickAction = async (actionId: string) => {
    if (!jobContext) {
      toast.error('Job context required for AI enhancement');
      return;
    }

    if (!currentContent.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsLoading(true);
    setActiveAction(actionId);

    try {
      const result = await rewriteSection({
        action: actionId as any,
        sectionType,
        currentContent,
        fullCV: fullCV || '',
        jobContext
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
    
    if (!jobContext) {
      toast.error('Job context required');
      return;
    }

    setIsLoading(true);
    setActiveAction('custom');

    try {
      // For custom requests, we use the 'rewrite' action with custom instructions
      const result = await rewriteSection({
        action: 'rewrite',
        sectionType,
        currentContent: `${currentContent}\n\n[USER REQUEST]: ${customPrompt}`,
        fullCV: fullCV || '',
        jobContext
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
      {/* Collapsed State - Premium Button */}
      {!isExpanded && !suggestion && (
        <motion.button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group relative w-full overflow-hidden rounded-lg"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          {/* Shimmer Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-2 py-2 px-4">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Enhance with AI</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
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
            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-500">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Enhancement</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

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
                        group relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                        ${isActive 
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {isActive && isLoading ? (
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      ) : (
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-500 group-hover:text-emerald-600'} transition-colors`} />
                      )}
                      <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}>
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
                    placeholder="Custom request... (e.g., 'make it more technical')"
                    disabled={isLoading}
                    className="w-full px-3 py-2 pr-8 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomRequest}
                  disabled={isLoading || !customPrompt.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <div className="p-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 rounded-md bg-emerald-500">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Suggestion</span>
              </div>

              {/* Suggestion Content */}
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 mb-3">
                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
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
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try again
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md transition-all"
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

