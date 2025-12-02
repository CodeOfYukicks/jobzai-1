import { ReactNode, useRef, useState, useEffect } from 'react';
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
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Calculate underline position
  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-filter-id="${activeFilter}"]`) as HTMLButtonElement;
      if (activeButton) {
        const containerRect = tabsRef.current.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    }
  }, [activeFilter, filters]);

  return (
    <section className="space-y-6">
      {/* Top Row: Count Hero + Actions */}
      <div className="flex items-start justify-between">
        {/* Left: Count + Label - More balanced */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {totalCount}
          </span>
          <span className="text-lg font-medium text-slate-600 dark:text-slate-300">
            Questions
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="
                inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                text-sm font-medium
                border border-slate-200 dark:border-slate-700
                text-slate-600 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                hover:text-slate-900 dark:hover:text-white
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </button>
          )}
          {actionSlot}
        </div>
      </div>

      {/* Bottom Row: Filter Tabs with Underline */}
      <div className="relative" ref={tabsRef}>
        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;
            const count = filter.id === 'all' ? totalCount : 
              filter.id === activeFilter ? filteredCount : null;
            
            return (
              <button
                key={filter.id}
                data-filter-id={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`
                  relative px-4 py-3 text-sm font-medium
                  transition-colors duration-200
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }
                `}
              >
                {filter.label}
                {count !== null && isActive && (
                  <span className="ml-1.5 text-slate-300 dark:text-slate-600">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Subtle bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-100 dark:bg-slate-800" />

        {/* Animated underline indicator - Google Blue */}
        <div
          className="
            absolute bottom-0 h-0.5
            bg-blue-600 dark:bg-blue-400
            transition-all duration-300 ease-out
          "
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </section>
  );
}
