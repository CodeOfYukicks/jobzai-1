import { memo, useState } from 'react';
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
    <article className="group relative">
      {/* Card Container with subtle background on hover */}
      <div className="
        px-5 py-6 -mx-5
        rounded-xl
        transition-colors duration-200
        hover:bg-slate-50 dark:hover:bg-slate-800/30
      ">
        <div className="flex items-start gap-5">
          
          {/* Index Number - More visible */}
          <div className="flex-shrink-0 w-10 pt-0.5">
            <span className="
              inline-flex items-center justify-center
              w-8 h-8 rounded-lg
              text-sm font-bold
              bg-slate-100 dark:bg-slate-800
              text-slate-500 dark:text-slate-400
            ">
              {numberLabel}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Question Text - Darker, more readable */}
            <h3 className="text-[15px] font-medium leading-relaxed text-slate-800 dark:text-slate-100 pr-8">
              {question}
            </h3>

            {/* Tags Row - Always visible with colors */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <Tag key={tag} label={formatTagLabel(tag)} />
                ))}
              </div>
            )}

            {/* Suggested Approach Toggle */}
            {suggestedApproach && (
              <div className="pt-1">
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

          {/* Actions - Always visible save */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* Primary Action: Save */}
            <button
              type="button"
              onClick={onToggleSave}
              aria-label={isSaved ? 'Remove from saved' : 'Save question'}
              className={`
                p-2.5 rounded-lg transition-all duration-200
                ${isSaved
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Secondary Actions Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="
                  p-2.5 rounded-lg 
                  text-slate-400 dark:text-slate-500 
                  hover:text-slate-600 dark:hover:text-slate-300 
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition-all duration-200
                  opacity-0 group-hover:opacity-100
                "
                aria-label="More actions"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)} 
                  />
                  <div className="
                    absolute right-0 top-full mt-1 z-20
                    min-w-[180px] py-1.5
                    rounded-xl border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-900
                    shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50
                  ">
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNote();
                        setShowMenu(false);
                      }}
                      className="
                        w-full flex items-center gap-3 px-4 py-2.5
                        text-sm text-slate-700 dark:text-slate-200
                        hover:bg-slate-50 dark:hover:bg-slate-800
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
                          text-sm text-slate-700 dark:text-slate-200
                          hover:bg-slate-50 dark:hover:bg-slate-800
                          transition-colors
                        "
                      >
                        <Maximize2 className="w-4 h-4 text-slate-400" />
                        Focus mode
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Separator line */}
      <div className="h-px bg-slate-100 dark:bg-slate-800/50 mx-0" />
    </article>
  );
});
