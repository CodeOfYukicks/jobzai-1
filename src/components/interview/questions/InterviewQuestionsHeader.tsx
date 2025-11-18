import { RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

type FilterOption<T extends string> = {
  id: T;
  label: string;
};

export interface InterviewQuestionsHeaderProps<T extends string = string> {
  totalCount: number;
  filteredCount: number;
  filters: FilterOption<T>[];
  activeFilter: T;
  onFilterChange: (value: T) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  subtitle?: string;
  actionSlot?: ReactNode;
}

export function InterviewQuestionsHeader<T extends string = string>({
  totalCount,
  filteredCount,
  filters,
  activeFilter,
  onFilterChange,
  onRegenerate,
  isRegenerating,
  subtitle = 'Tailored questions for this interview',
  actionSlot,
}: InterviewQuestionsHeaderProps<T>) {
  const canInteract = Boolean(onRegenerate);
  const countLabel =
    activeFilter === 'all' || filteredCount === totalCount
      ? `${totalCount} ${totalCount === 1 ? 'question' : 'questions'}`
      : `${filteredCount} / ${totalCount} questions`;

  return (
    <section className="rounded-[24px] border border-black/[0.04] bg-gradient-to-br from-[#f7f7f9] via-white to-[#f2f2f4] p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition dark:border-white/5 dark:from-white/5 dark:via-white/[0.02] dark:to-white/[0.04]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-neutral-400">Interview</p>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Interview Questions</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-600 shadow-[0_1px_4px_rgba(0,0,0,0.08)] dark:bg-white/10 dark:text-neutral-200">
            {countLabel}
          </span>
          {actionSlot}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <GhostButton
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                isActive={isActive}
                ariaLabel={`Filter by ${filter.label}`}
              >
                {filter.label}
              </GhostButton>
            );
          })}
        </div>

        {canInteract && (
          <GhostButton
            onClick={onRegenerate!}
            ariaLabel="Regenerate interview questions"
            isLoading={isRegenerating}
            className="self-start lg:self-auto"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Generating…' : 'Regenerate questions'}</span>
            </div>
          </GhostButton>
        )}
      </div>
    </section>
  );
}

function GhostButton({
  children,
  onClick,
  isActive,
  ariaLabel,
  isLoading,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  ariaLabel: string;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={isLoading}
      className={[
        'rounded-[10px] border px-4 py-2 text-sm font-medium transition-all duration-150',
        'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white',
        'hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:focus-visible:ring-white/20',
        isActive
          ? 'border-black/10 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/10'
          : 'border-black/5 bg-transparent hover:bg-white/70 dark:border-white/10 dark:hover:bg-white/5',
        isLoading ? 'opacity-60' : 'opacity-100',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

