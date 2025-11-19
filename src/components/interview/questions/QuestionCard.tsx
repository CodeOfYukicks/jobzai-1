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
      className="group relative overflow-hidden rounded-xl border border-black/[0.06] bg-white px-6 py-5 transition-all duration-300 hover:border-purple-200 dark:border-white/[0.08] dark:bg-[#1c1c1e] dark:hover:border-purple-500/30"
    >
      <div className="flex gap-5">
        {/* Number Badge - Style Notion/Apple */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[13px] font-semibold text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-400">
          {numberLabel}
        </div>

        <div className="flex-1 space-y-4">
          {/* Header Section */}
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <h3 className="text-[15px] font-medium leading-relaxed text-neutral-900 dark:text-white">
                {question}
              </h3>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Tag key={tag} label={formatTagLabel(tag)} />
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 self-start">
              <GhostIconButton
                ariaLabel={isSaved ? 'Remove from saved questions' : 'Save question'}
                isActive={isSaved}
                onClick={onToggleSave}
              >
                <Bookmark className={isSaved ? 'h-[18px] w-[18px] fill-current' : 'h-[18px] w-[18px]'} />
              </GhostIconButton>
              <GhostIconButton ariaLabel="Create note from question" onClick={onCreateNote}>
                <StickyNote className="h-[18px] w-[18px]" />
              </GhostIconButton>
              {onFocus && (
                <GhostIconButton ariaLabel="Focus on this question" onClick={onFocus}>
                  <Maximize2 className="h-[18px] w-[18px]" />
                </GhostIconButton>
              )}
            </div>
          </header>

          {/* Suggested Approach */}
          {suggestedApproach && (
            <Toggle
              isOpen={isSuggestionOpen}
              onToggle={onToggleSuggestion}
              icon="💡"
              label="Suggested approach"
            >
              <div className="mt-3 rounded-lg border border-black/[0.06] bg-neutral-50/50 px-4 py-3.5 text-[14px] leading-relaxed text-neutral-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-300">
                {suggestedApproach}
              </div>
            </Toggle>
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
        'rounded-md p-1.5 transition-all duration-200',
        isActive
          ? 'bg-purple-600 text-white dark:bg-purple-500'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-purple-400 dark:focus-visible:ring-offset-[#1c1c1e]',
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

