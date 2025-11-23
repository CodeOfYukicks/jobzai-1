import { memo } from 'react';
import { Bookmark, Maximize2, StickyNote } from 'lucide-react';
import { ReactNode } from 'react';
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
  const numberLabel = String(index + 1).padStart(2, '0');

  return (
    <article
      className="group relative overflow-visible rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none dark:hover:border-gray-700"
    >
      <div className="flex gap-6">
        {/* Number Badge - Premium Style */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm font-bold text-gray-400 dark:bg-gray-800 dark:text-gray-500">
          {numberLabel}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Section */}
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold leading-snug text-gray-900 dark:text-white">
                {question}
              </h3>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Tag key={tag} label={formatTagLabel(tag)} />
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-start">
              <GhostIconButton
                ariaLabel={isSaved ? 'Remove from saved questions' : 'Save question'}
                isActive={isSaved}
                onClick={onToggleSave}
              >
                <Bookmark className={isSaved ? 'h-5 w-5 fill-current' : 'h-5 w-5'} />
              </GhostIconButton>
              <GhostIconButton ariaLabel="Create note from question" onClick={onCreateNote}>
                <StickyNote className="h-5 w-5" />
              </GhostIconButton>
              {onFocus && (
                <GhostIconButton ariaLabel="Focus on this question" onClick={onFocus}>
                  <Maximize2 className="h-5 w-5" />
                </GhostIconButton>
              )}
            </div>
          </header>

          {/* Suggested Approach */}
          {suggestedApproach && (
            <div className="mt-5">
              <Toggle
                isOpen={isSuggestionOpen}
                onToggle={onToggleSuggestion}
                icon="💡"
                label="Suggested approach"
              >
                <div className="mt-4 rounded-xl bg-indigo-50/50 p-5 text-base leading-relaxed text-gray-700 dark:bg-indigo-500/10 dark:text-gray-300">
                  {suggestedApproach}
                </div>
              </Toggle>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

const GhostIconButton = memo(function GhostIconButton({
  children,
  ariaLabel,
  onClick,
  isActive,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        'rounded-lg p-2 transition-all duration-200',
        isActive
          ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400',
      ].join(' ')}
    >
      {children}
    </button>
  );
});

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
