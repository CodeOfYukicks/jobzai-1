import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, ArrowRight } from 'lucide-react';
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

const actionLabels: Record<ActionType, { label: string; emoji: string }> = {
  improve: { label: 'Improve Writing', emoji: '✨' },
  shorten: { label: 'Make Concise', emoji: '📝' },
  expand: { label: 'Add Detail', emoji: '📖' },
  formal: { label: 'Professional Tone', emoji: '👔' },
  casual: { label: 'Casual Tone', emoji: '💬' },
  grammar: { label: 'Fix Grammar', emoji: '✓' },
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
  const [editedText, setEditedText] = useState(rewrittenText);
  
  // Reset edited text when rewritten text changes
  useEffect(() => {
    setEditedText(rewrittenText);
  }, [rewrittenText]);

  // Calculate stats
  const stats = getChangeStats(originalText, editedText);
  const similarity = calculateSimilarity(originalText, editedText);
  
  const actionInfo = actionLabels[actionType];

  const handleAccept = async () => {
    setIsApplying(true);
    try {
      if (onEdit) {
        onEdit(editedText);
      }
      await onAccept();
    } finally {
      setIsApplying(false);
    }
  };

  const handleReject = () => {
    onReject();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAccept();
    } else if (e.key === 'Escape') {
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
            transition={{ duration: 0.15 }}
            onClick={handleReject}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              onKeyDown={handleKeyDown}
              className="
                bg-white dark:bg-[#191919]
                rounded-xl
                shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
                border border-[#e8e8e8] dark:border-[#2f2f2f]
                w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden
              "
            >
              {/* Header - Minimal Notion style */}
              <div className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{actionInfo.emoji}</span>
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#37352f] dark:text-[#ffffffcf]">
                      {actionInfo.label}
                    </h2>
                    <p className="text-[12px] text-[#9b9a97] dark:text-[#7f7f7f] mt-0.5">
                      Review changes before applying
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReject}
                  className="p-2 -mr-2 rounded-lg hover:bg-[#f1f1f0] dark:hover:bg-[#2f2f2f] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-[#9b9a97] dark:text-[#7f7f7f]" />
                </button>
              </div>

              {/* Stats Bar - Subtle Notion style */}
              <div className="px-6 py-2.5 border-y border-[#ebebea] dark:border-[#2f2f2f]">
                <div className="flex items-center justify-center gap-5 text-[12px]">
                  {stats.additions > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#0f7b6c]" />
                      <span className="text-[#37352f] dark:text-[#ffffffcf]">
                        <span className="font-medium text-[#0f7b6c]">+{stats.additions}</span>
                        <span className="text-[#9b9a97] dark:text-[#7f7f7f] ml-1">words added</span>
                      </span>
                    </div>
                  )}
                  {stats.deletions > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#eb5757]" />
                      <span className="text-[#37352f] dark:text-[#ffffffcf]">
                        <span className="font-medium text-[#eb5757]">-{stats.deletions}</span>
                        <span className="text-[#9b9a97] dark:text-[#7f7f7f] ml-1">words removed</span>
                      </span>
                    </div>
                  )}
                  {stats.totalChanges === 0 && (
                    <span className="text-[#9b9a97] dark:text-[#7f7f7f]">No changes detected</span>
                  )}
                  <span className="text-[#d3d3d2] dark:text-[#3f3f3f]">|</span>
                  <span className="text-[#9b9a97] dark:text-[#7f7f7f]">{similarity}% similar</span>
                </div>
              </div>

              {/* Content - Clean diff view */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <TextDiffViewer 
                  originalText={originalText} 
                  rewrittenText={editedText}
                  showAnimation={true}
                />
              </div>

              {/* Footer - Minimal action bar */}
              <div className="px-6 py-4 border-t border-[#ebebea] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  {/* Reject */}
                  <button
                    onClick={handleReject}
                    disabled={isApplying}
                    className="
                      px-4 py-2 rounded-lg
                      text-[13px] font-medium
                      text-[#37352f] dark:text-[#ffffffcf]
                      bg-white dark:bg-[#2f2f2f]
                      border border-[#e0e0de] dark:border-[#3f3f3f]
                      hover:bg-[#f7f6f3] dark:hover:bg-[#383838]
                      transition-colors duration-150
                      flex items-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <X className="w-3.5 h-3.5 opacity-60" />
                    <span>Reject</span>
                  </button>

                  {/* Accept with keyboard hint */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#9b9a97] dark:text-[#7f7f7f]">
                      <kbd className="px-1.5 py-0.5 rounded bg-[#f1f1f0] dark:bg-[#2f2f2f] font-mono border border-[#e0e0de] dark:border-[#3f3f3f]">
                        ⌘ Enter
                      </kbd>
                      <span>to accept</span>
                    </div>
                    <button
                      onClick={handleAccept}
                      disabled={isApplying || stats.totalChanges === 0}
                      className="
                        px-5 py-2 rounded-lg
                        text-[13px] font-medium
                        bg-[#2383e2] hover:bg-[#0077d4]
                        text-white
                        transition-colors duration-150
                        flex items-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {isApplying ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </motion.div>
                          <span>Applying...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Changes</span>
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
