import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Edit3, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import TextDiffViewer from './TextDiffViewer';
import { getChangeStats, calculateSimilarity } from '../../utils/textDiff';

export type ActionType = 'improve' | 'shorten' | 'expand' | 'formal' | 'casual' | 'grammar';

interface RewritePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  rewrittenText: string;
  actionType: ActionType;
  onAccept: () => Promise<void>;
  onReject: () => void;
  onEdit?: (text: string) => void;
}

const actionLabels: Record<ActionType, { label: string; icon: React.ReactNode; color: string }> = {
  improve: { 
    label: 'Improve Writing', 
    icon: <Sparkles className="w-4 h-4" />, 
    color: 'text-purple-600 dark:text-purple-400' 
  },
  shorten: { 
    label: 'Make Concise', 
    icon: <TrendingDown className="w-4 h-4" />, 
    color: 'text-blue-600 dark:text-blue-400' 
  },
  expand: { 
    label: 'Add Detail', 
    icon: <TrendingUp className="w-4 h-4" />, 
    color: 'text-indigo-600 dark:text-indigo-400' 
  },
  formal: { 
    label: 'Professional Tone', 
    icon: <Edit3 className="w-4 h-4" />, 
    color: 'text-gray-600 dark:text-gray-400' 
  },
  casual: { 
    label: 'Casual Tone', 
    icon: <Edit3 className="w-4 h-4" />, 
    color: 'text-teal-600 dark:text-teal-400' 
  },
  grammar: { 
    label: 'Fix Grammar', 
    icon: <Check className="w-4 h-4" />, 
    color: 'text-emerald-600 dark:text-emerald-400' 
  },
};

export default function RewritePreviewModal({
  isOpen,
  onClose,
  originalText,
  rewrittenText,
  actionType,
  onAccept,
  onReject,
  onEdit,
}: RewritePreviewModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(rewrittenText);
  
  // Reset edited text when rewritten text changes
  useEffect(() => {
    setEditedText(rewrittenText);
    setIsEditing(false);
  }, [rewrittenText]);

  // Calculate stats
  const stats = getChangeStats(originalText, editedText);
  const similarity = calculateSimilarity(originalText, editedText);
  
  const actionInfo = actionLabels[actionType];

  const handleAccept = async () => {
    setIsApplying(true);
    try {
      if (isEditing && onEdit) {
        onEdit(editedText);
      }
      await onAccept();
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = () => {
    onReject();
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter to accept
      handleAccept();
    } else if (e.key === 'Escape') {
      // Escape to reject
      handleReject();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleReject}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onKeyDown={handleKeyDown}
              className="bg-white dark:bg-[#1e1e1f] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2d2d2e] 
                w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${actionInfo.color}`}>
                    {actionInfo.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {actionInfo.label}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Review changes before applying
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReject}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Stats Bar */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-[#2a2a2b] border-b border-gray-200 dark:border-[#2d2d2e]">
                <div className="flex items-center justify-center gap-6 text-xs">
                  {stats.additions > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          +{stats.additions}
                        </span>{' '}
                        {stats.additions === 1 ? 'word' : 'words'} added
                      </span>
                    </div>
                  )}
                  {stats.deletions > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{stats.deletions}
                        </span>{' '}
                        {stats.deletions === 1 ? 'word' : 'words'} removed
                      </span>
                    </div>
                  )}
                  {stats.totalChanges === 0 && (
                    <div className="flex items-center gap-1.5">
                      <Minus className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        No changes detected
                      </span>
                    </div>
                  )}
                  <div className="h-3 w-px bg-gray-300 dark:bg-gray-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {similarity}% similar
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {isEditing ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Edit3 className="w-4 h-4 text-[#635BFF]" />
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Edit Rewritten Text
                      </h3>
                    </div>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full h-64 p-4 rounded-xl bg-white dark:bg-[#2a2a2b] border-2 border-[#635BFF]/50 
                        focus:border-[#635BFF] focus:outline-none focus:ring-4 focus:ring-[#635BFF]/10
                        text-sm leading-relaxed text-gray-900 dark:text-gray-100 resize-none
                        transition-all duration-200"
                      placeholder="Edit your text here..."
                      autoFocus
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 
                          hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel editing
                      </button>
                      <button
                        onClick={() => setEditedText(rewrittenText)}
                        className="px-3 py-1.5 text-xs font-medium text-[#635BFF] hover:text-[#5249e6] transition-colors"
                      >
                        Reset to AI version
                      </button>
                    </div>
                  </div>
                ) : (
                  <TextDiffViewer 
                    originalText={originalText} 
                    rewrittenText={editedText}
                    showAnimation={true}
                  />
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-[#2a2a2b] border-t border-gray-200 dark:border-[#2d2d2e]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {onEdit && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        disabled={isApplying}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium
                          text-gray-700 dark:text-gray-300
                          bg-white dark:bg-[#2d2d2e]
                          border border-gray-300 dark:border-white/10
                          hover:bg-gray-50 dark:hover:bg-[#3d3d3e]
                          transition-all duration-200
                          flex items-center gap-2
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={handleReject}
                      disabled={isApplying}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium
                        text-gray-700 dark:text-gray-300
                        bg-white dark:bg-[#2d2d2e]
                        border border-gray-300 dark:border-white/10
                        hover:bg-gray-50 dark:hover:bg-[#3d3d3e]
                        transition-all duration-200
                        flex items-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      <kbd className="px-2 py-1 rounded bg-gray-200 dark:bg-[#3d3d3e] font-mono text-xs">
                        ⌘ Enter
                      </kbd>{' '}
                      to accept
                    </div>
                    <button
                      onClick={handleAccept}
                      disabled={isApplying || stats.totalChanges === 0}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold
                        bg-gradient-to-r from-[#635BFF] to-[#8B5CF6]
                        text-white
                        hover:from-[#5249e6] hover:to-[#7c4fe0]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-lg shadow-[#635BFF]/25 hover:shadow-[#635BFF]/40
                        transition-all duration-200
                        flex items-center gap-2"
                    >
                      {isApplying ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                          Applying...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Accept Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}






