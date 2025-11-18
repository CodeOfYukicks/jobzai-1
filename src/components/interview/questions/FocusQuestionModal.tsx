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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative mx-4 w-full max-w-3xl rounded-[28px] bg-white p-10 shadow-2xl dark:bg-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close question focus view"
              className="absolute right-4 top-4 rounded-full bg-black/5 p-2 text-neutral-500 transition hover:text-neutral-900 dark:bg-white/10 dark:text-neutral-400 dark:hover:text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Focus mode</p>
            <h3 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">{question.title}</h3>

            {question.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <Tag key={tag} label={formatTagLabel(tag)} />
                ))}
              </div>
            )}

            {question.suggestedApproach && (
              <div className="mt-6 rounded-[18px] border border-black/5 bg-[#f7f7f9] p-6 text-[15px] leading-relaxed text-neutral-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-white/[0.04] dark:text-neutral-200">
                {question.suggestedApproach}
              </div>
            )}
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

