import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { QuestionTag } from './QuestionCard';
import { Tag } from './Tag';

interface FocusQuestionModalProps {
  open: boolean;
  question?: {
    title: string;
    tags: QuestionTag[];
    suggestedApproach?: string | null;
  };
  onClose: () => void;
}

export function FocusQuestionModal({ open, question, onClose }: FocusQuestionModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && question && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative mx-4 w-full max-w-3xl rounded-3xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              type="button"
              aria-label="Close question focus view"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-4 top-4 rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-[#1a1b1e] dark:hover:text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </motion.button>

            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span 
                    className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] text-white"
                    style={{
                      background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
                      boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)',
                    }}
                  >
                    Focus Mode
                  </span>
                </div>
                
                <h3 className="pr-12 text-2xl font-semibold leading-relaxed text-slate-900 dark:text-white">
                  {question.title}
                </h3>
              </div>

              {/* Tags */}
              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Tag key={tag} label={formatTagLabel(tag)} />
                  ))}
                </div>
              )}

              {/* Suggested Approach */}
              {question.suggestedApproach && (
                <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-[#3d3c3e]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <p className="text-sm font-semibold text-jobzai-600 dark:text-jobzai-400">
                      Suggested approach
                    </p>
                  </div>
                  <div className="rounded-2xl border border-jobzai-200/40 bg-jobzai-50/50 px-6 py-5 dark:border-jobzai-500/20 dark:bg-jobzai-500/5">
                    <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {question.suggestedApproach}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Keyboard hint */}
            <div className="mt-8 flex justify-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1a1b1e] text-slate-600 dark:text-slate-400 font-mono text-[10px]">ESC</kbd> or click outside to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function formatTagLabel(tag: QuestionTag) {
  switch (tag) {
    case 'technical':
      return 'Technical';
    case 'behavioral':
      return 'Behavioral';
    case 'company-specific':
      return 'Company';
    case 'role-specific':
      return 'Role';
    default:
      return tag;
  }
}
