import { ReactNode } from 'react';
import { RefreshCw, Filter, SlidersHorizontal } from 'lucide-react';

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
      ? `${totalCount}`
      : `${filteredCount}/${totalCount}`;

  return (
    <section className="flex flex-col gap-6">
      {/* Top Row: Title & Main Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            Interview Questions
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {countLabel}
            </span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
           {canInteract && (
            <button
              onClick={onRegenerate!}
              disabled={isRegenerating}
              className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Regenerate questions"
            >
              <RefreshCw 
                className={`h-4 w-4 text-gray-500 transition-all group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 ${isRegenerating ? 'animate-spin' : ''}`} 
              />
              <span>{isRegenerating ? 'Generating...' : 'Regenerate'}</span>
            </button>
          )}
          {actionSlot}
        </div>
      </div>

      {/* Bottom Row: Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />
        <div className="flex items-center gap-2">
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={[
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                ].join(' ')}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
