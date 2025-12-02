import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, MoreHorizontal, StickyNote, Maximize2 } from 'lucide-react';
import { Tag } from './Tag';
import { Toggle } from './Toggle';

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
  onCreateNote,
  onFocus,
}: QuestionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const numberLabel = String(index + 1).padStart(2, '0');

  return (
    <motion.article 
      className="group relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Card Container with premium hover effect */}
      <div className="
        px-6 py-6 -mx-6
        rounded-2xl
        transition-all duration-200
        hover:bg-slate-50/80 dark:hover:bg-slate-800/20
        hover:shadow-premium-soft
      ">
        <div className="flex items-start gap-5">
          
          {/* Index Number - Premium gradient badge */}
          <div className="flex-shrink-0 w-10 pt-0.5">
            <span className="
              inline-flex items-center justify-center
              w-9 h-9 rounded-xl
              text-sm font-bold
              bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900
              text-slate-500 dark:text-slate-400
              ring-1 ring-slate-200/60 dark:ring-slate-700/60
              group-hover:ring-jobzai-300/50 dark:group-hover:ring-jobzai-700/50
              group-hover:text-jobzai-600 dark:group-hover:text-jobzai-400
              transition-all duration-200
            ">
              {numberLabel}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Question Text - Premium typography */}
            <h3 className="text-[15px] font-semibold leading-relaxed text-slate-800 dark:text-slate-100 pr-8">
              {question}
            </h3>

            {/* Tags Row - Premium pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <Tag key={tag} label={formatTagLabel(tag)} />
                ))}
              </div>
            )}

            {/* Suggested Approach Toggle */}
            {suggestedApproach && (
              <div className="pt-2">
                <Toggle
                  label="View suggested approach"
                  isOpen={isSuggestionOpen}
                  onToggle={onToggleSuggestion}
                >
                  {suggestedApproach}
                </Toggle>
              </div>
            )}
          </div>

          {/* Actions - Premium buttons */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {/* Primary Action: Save */}
            <motion.button
              type="button"
              onClick={onToggleSave}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isSaved ? 'Remove from saved' : 'Save question'}
              className={`
                p-2.5 rounded-xl transition-all duration-200
                ${isSaved
                  ? 'text-jobzai-600 dark:text-jobzai-400 bg-jobzai-50 dark:bg-jobzai-950/50 ring-1 ring-jobzai-200/50 dark:ring-jobzai-800/30 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-jobzai-600 dark:hover:text-jobzai-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Secondary Actions Menu */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="
                  p-2.5 rounded-xl 
                  text-slate-400 dark:text-slate-500 
                  hover:text-slate-600 dark:hover:text-slate-300 
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-all duration-200
                  opacity-0 group-hover:opacity-100
                "
                aria-label="More actions"
              >
                <MoreHorizontal className="w-5 h-5" />
              </motion.button>

              {/* Dropdown Menu - Premium design */}
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="
                      absolute right-0 top-full mt-2 z-20
                      min-w-[180px] py-2
                      rounded-xl
                      bg-white dark:bg-slate-900
                      ring-1 ring-slate-200/60 dark:ring-slate-700/60
                      shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50
                    "
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNote();
                        setShowMenu(false);
                      }}
                      className="
                        w-full flex items-center gap-3 px-4 py-2.5
                        text-sm font-medium text-slate-700 dark:text-slate-200
                        hover:bg-slate-50 dark:hover:bg-slate-800
                        hover:text-jobzai-600 dark:hover:text-jobzai-400
                        transition-colors
                      "
                    >
                      <StickyNote className="w-4 h-4 text-slate-400" />
                      Create note
                    </button>
                    {onFocus && (
                      <button
                        type="button"
                        onClick={() => {
                          onFocus();
                          setShowMenu(false);
                        }}
                        className="
                          w-full flex items-center gap-3 px-4 py-2.5
                          text-sm font-medium text-slate-700 dark:text-slate-200
                          hover:bg-slate-50 dark:hover:bg-slate-800
                          hover:text-jobzai-600 dark:hover:text-jobzai-400
                          transition-colors
                        "
                      >
                        <Maximize2 className="w-4 h-4 text-slate-400" />
                        Focus mode
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Separator line - subtle gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mx-6" />
    </motion.article>
  );
});
