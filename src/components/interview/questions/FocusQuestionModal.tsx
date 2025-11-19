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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative mx-4 w-full max-w-3xl rounded-2xl border border-black/[0.08] bg-white p-8 shadow-xl dark:border-white/[0.12] dark:bg-[#1c1c1e]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close question focus view"
              className="absolute right-4 top-4 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Focus mode
                </p>
                <h3 className="pr-12 text-[20px] font-semibold leading-relaxed text-neutral-900 dark:text-white">
                  {question.title}
                </h3>
              </div>

              {question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {question.tags.map((tag) => (
                    <Tag key={tag} label={formatTagLabel(tag)} />
                  ))}
                </div>
              )}

              {question.suggestedApproach && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <p className="text-[13px] font-medium text-purple-700 dark:text-purple-300">
                      Suggested approach
                    </p>
                  </div>
                  <div className="rounded-lg border border-purple-200/40 bg-purple-50/50 px-5 py-4 text-[15px] leading-relaxed text-neutral-700 dark:border-purple-500/20 dark:bg-purple-500/5 dark:text-neutral-300">
                    {question.suggestedApproach}
                  </div>
                </div>
              )}
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



