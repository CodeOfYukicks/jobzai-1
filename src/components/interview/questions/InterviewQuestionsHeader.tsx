import { ReactNode } from 'react';
import { RefreshCw, Play } from 'lucide-react';

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
  actionSlot,
}: InterviewQuestionsHeaderProps<T>) {
  return (
    <section className="space-y-4">
      {/* Top Row: Title + Actions */}
      <div className="flex items-center justify-between">
        {/* Left: Count + Label */}
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {totalCount} Questions
        </h2>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium
                text-neutral-500 dark:text-neutral-400
                hover:text-neutral-900 dark:hover:text-white
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
          {actionSlot}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1">
        {filters.map((filter) => {
          const isActive = filter.id === activeFilter;
          const count = filter.id === 'all' ? totalCount : 
            (filter.id === activeFilter ? filteredCount : null);
          
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md
                transition-colors duration-150
                ${isActive
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }
              `}
            >
              {filter.label}
              {count !== null && isActive && (
                <span className="ml-1.5 opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
