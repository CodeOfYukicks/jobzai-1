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
    <section className="rounded-xl border border-black/[0.06] bg-white p-6 transition-colors dark:border-white/[0.08] dark:bg-[#1c1c1e]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-[22px] font-semibold tracking-tight text-neutral-900 dark:text-white">
            Interview Questions
          </h2>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-purple-200/60 bg-purple-50 px-3 py-1.5 text-[12px] font-medium text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
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
              <FilterButton
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                isActive={isActive}
                ariaLabel={`Filter by ${filter.label}`}
              >
                {filter.label}
              </FilterButton>
            );
          })}
        </div>

        {canInteract && (
          <RegenerateButton
            onClick={onRegenerate!}
            ariaLabel="Regenerate interview questions"
            isLoading={isRegenerating}
            className="self-start lg:self-auto"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-[15px] w-[15px] ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Generating…' : 'Regenerate'}</span>
            </div>
          </RegenerateButton>
        )}
      </div>
    </section>
  );
}

function FilterButton({
  children,
  onClick,
  isActive,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        'rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-purple-400 dark:focus-visible:ring-offset-[#1c1c1e]',
        isActive
          ? 'border-purple-600 bg-purple-600 text-white shadow-sm shadow-purple-600/20 dark:border-purple-500 dark:bg-purple-500'
          : 'border-black/[0.08] bg-transparent text-neutral-600 hover:border-purple-200 hover:bg-purple-50 dark:border-white/[0.12] dark:text-neutral-400 dark:hover:border-purple-500/30 dark:hover:bg-purple-500/10',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function RegenerateButton({
  children,
  onClick,
  ariaLabel,
  isLoading,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
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
        'rounded-lg border border-purple-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-purple-700 transition-all duration-200',
        'hover:border-purple-300 hover:bg-purple-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        'dark:border-purple-500/30 dark:bg-[#1c1c1e] dark:text-purple-300 dark:hover:border-purple-500/50 dark:hover:bg-purple-500/10',
        'dark:focus-visible:ring-purple-400 dark:focus-visible:ring-offset-[#1c1c1e]',
        isLoading ? 'opacity-60' : 'opacity-100',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}



