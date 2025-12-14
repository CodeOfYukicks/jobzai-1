import { memo, useState } from 'react';
import { Bookmark, ChevronRight } from 'lucide-react';
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
}: QuestionCardProps) {
  const numberLabel = String(index + 1).padStart(2, '0');

  return (
    <article className="group border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
      <div className="py-5 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
        <div className="flex items-start gap-4">
          
          {/* Index Number - Simple text */}
          <span className="flex-shrink-0 w-8 text-xs font-medium text-neutral-400 dark:text-neutral-500 pt-0.5">
            {numberLabel}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Question Text */}
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed pr-4">
              {question}
            </p>

            {/* Tags Row */}
            {tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <Tag key={tag} label={formatTagLabel(tag)} />
                ))}
              </div>
            )}

            {/* Suggested Approach Toggle */}
            {suggestedApproach && (
              <div className="pt-1">
                <button
                  onClick={onToggleSuggestion}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${isSuggestionOpen ? 'rotate-90' : ''}`} />
                  View suggested approach
                </button>
                
                {isSuggestionOpen && (
                  <div className="mt-2 pl-4 border-l-2 border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {suggestedApproach}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save question'}
            className={`
              flex-shrink-0 p-1.5 rounded transition-colors
              ${isSaved
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400'
              }
            `}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
});
