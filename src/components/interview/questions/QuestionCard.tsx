import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function QuestionCard({
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
    <motion.article
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-5 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5"
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] text-sm font-semibold text-neutral-600 shadow-inner shadow-white/40 dark:bg-white/10 dark:text-white/80">
          {numberLabel}
        </div>
        <div className="flex-1 space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="flex-1 space-y-1.5">
              <p className="text-[13px] uppercase tracking-[0.2em] text-neutral-400">Question {numberLabel}</p>
              <h3 className="text-lg font-semibold leading-snug text-neutral-900 dark:text-white">{question}</h3>
            </div>
            <div className="flex items-center gap-2 self-start text-neutral-500">
              <GhostIconButton
                ariaLabel={isSaved ? 'Remove from saved questions' : 'Save question'}
                isActive={isSaved}
                onClick={onToggleSave}
              >
                <Bookmark className={isSaved ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
              </GhostIconButton>
              <GhostIconButton ariaLabel="Create note from question" onClick={onCreateNote}>
                <StickyNote className="h-4 w-4" />
              </GhostIconButton>
              {onFocus && (
                <GhostIconButton ariaLabel="Focus on this question" onClick={onFocus}>
                  <Maximize2 className="h-4 w-4" />
                </GhostIconButton>
              )}
            </div>
          </header>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Tag key={tag} label={formatTagLabel(tag)} />
              ))}
            </div>
          )}

          {suggestedApproach && (
            <Toggle
              isOpen={isSuggestionOpen}
              onToggle={onToggleSuggestion}
              icon="💡"
              label="Suggested approach"
              description="Tap to reveal how to tackle this question"
            >
              <div className="mt-3 rounded-[12px] border border-black/[0.04] bg-white/80 p-4 text-[15px] leading-relaxed text-neutral-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/5 dark:text-neutral-200">
                {suggestedApproach}
              </div>
            </Toggle>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function GhostIconButton({
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
        'rounded-full border border-transparent p-2 transition-all duration-150',
        'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white',
        'hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10',
        isActive ? 'text-neutral-900 dark:text-white' : 'opacity-70 hover:opacity-100',
      ].join(' ')}
    >
      {children}
    </button>
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

