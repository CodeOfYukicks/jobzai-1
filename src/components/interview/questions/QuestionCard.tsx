import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, ChevronDown, Focus } from 'lucide-react';
import { Tag } from './Tag';

export type QuestionTag = 'technical' | 'behavioral' | 'company-specific' | 'role-specific';

export interface QuestionCardProps {
  index: number;
  question: string;
  tags: QuestionTag[];
  suggestedApproach?: string | null;
  isSuggestionOpen: boolean;
  isSaved: boolean;
  onToggleSuggestion: () => void;
  onToggleSave: () => void;
  onCreateNote: () => void;
  onFocus?: () => void;
}

function formatTagLabel(tag: QuestionTag): string {
  switch (tag) {
    case 'technical': return 'Technical';
    case 'behavioral': return 'Behavioral';
    case 'company-specific': return 'Company';
    case 'role-specific': return 'Role';
    default: return tag;
  }
}

export const QuestionCard = memo(function QuestionCard({
  index,
  question,
  tags,
  suggestedApproach,
  isSuggestionOpen,
  isSaved,
  onToggleSuggestion,
  onToggleSave,
  onFocus,
}: QuestionCardProps) {
  const numberLabel = String(index + 1).padStart(2, '0');

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="group rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 p-5 transition-all duration-200 hover:shadow-md dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:ring-slate-300/80 dark:hover:ring-[#4d4c4e]/80 mb-3"
    >
      <div className="flex items-start gap-4">
        {/* Number indicator - Premium violet gradient */}
        <motion.span
          whileHover={{ scale: 1.1 }}
          className="flex-shrink-0 w-8 h-8 rounded-xl text-white text-xs font-bold flex items-center justify-center shadow-sm cursor-default"
          style={{
            background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
            boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)',
          }}
        >
          {numberLabel}
        </motion.span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Question Text */}
          <p className="text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed mb-3">
            {question}
          </p>

          {/* Tags Row */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {tags.map((tag) => (
                <Tag key={tag} label={formatTagLabel(tag)} />
              ))}
            </div>
          )}

          {/* Suggested Approach - Collapsible */}
          {suggestedApproach && (
            <div className="pt-2 border-t border-slate-100 dark:border-[#3d3c3e]/60">
              <button
                onClick={onToggleSuggestion}
                className="flex items-center gap-2 text-xs font-semibold text-jobzai-600 hover:text-jobzai-700 dark:text-jobzai-400 dark:hover:text-jobzai-300 transition-colors py-1"
              >
                <span className="text-base">💡</span>
                <span>Suggested approach</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isSuggestionOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSuggestionOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3"
                >
                  <div className="rounded-xl border border-jobzai-200/40 bg-jobzai-50/50 dark:border-jobzai-500/20 dark:bg-jobzai-500/5 px-4 py-3">
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {suggestedApproach}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Focus Button */}
          {onFocus && (
            <motion.button
              type="button"
              onClick={onFocus}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Focus on this question"
              className="p-2 rounded-lg transition-colors text-slate-400 dark:text-slate-500 hover:text-jobzai-500 dark:hover:text-jobzai-400 hover:bg-jobzai-50 dark:hover:bg-jobzai-500/10"
            >
              <Focus className="w-4 h-4" />
            </motion.button>
          )}

          {/* Save Button */}
          <motion.button
            type="button"
            onClick={onToggleSave}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isSaved ? 'Remove from saved' : 'Save question'}
            className={`
              p-2 rounded-lg transition-colors
              ${isSaved
                ? 'text-jobzai-600 dark:text-jobzai-400 bg-jobzai-50 dark:bg-jobzai-500/10'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }
            `}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
});
