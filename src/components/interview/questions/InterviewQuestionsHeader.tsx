import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

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
    <section className="rounded-2xl bg-white dark:bg-[#2b2a2c] ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60 p-4 sm:p-6 mb-6">
      {/* Top Row: Title + Actions */}
      <div className="flex items-center justify-between gap-2 mb-5 overflow-hidden">
        {/* Left: Title + Badge + Regenerate */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap">
            Interview Questions
          </span>
          {totalCount > 0 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 91, 255, 0.1) 0%, rgba(82, 73, 230, 0.1) 100%)',
                color: '#635BFF',
              }}
            >
              {totalCount}
            </span>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="
                hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5
                text-xs font-medium rounded-lg
                text-slate-500 dark:text-slate-400
                hover:text-jobzai-600 dark:hover:text-jobzai-400
                hover:bg-jobzai-50 dark:hover:bg-jobzai-500/10
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 min-h-[36px]
              "
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
        </div>

        {/* Right: Action slot (Sessions + Practice Live) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {actionSlot}
        </div>
      </div>

      {/* Filter Pills - Premium style */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => {
          const isActive = filter.id === activeFilter;
          const count = filter.id === 'all' ? totalCount :
            (filter.id === activeFilter ? filteredCount : null);

          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`
                px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl min-h-[36px]
                transition-all duration-200
                ${isActive
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100/80 dark:bg-[#1a1b1e] hover:bg-slate-200/80 dark:hover:bg-[#252527]'
                }
              `}
              style={isActive ? {
                background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)',
                boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)',
              } : undefined}
            >
              {filter.label}
              {count !== null && isActive && (
                <span className="ml-1.5 opacity-80">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
