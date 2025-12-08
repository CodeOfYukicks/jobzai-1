import { ReactNode, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
        {/* Left: Count + Label - Premium typography */}
        <div className="flex items-baseline gap-3">
          <motion.span 
            key={totalCount}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white"
          >
            {totalCount}
          </motion.span>
          <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Questions
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {onRegenerate && (
            <motion.button
              onClick={onRegenerate}
              disabled={isRegenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                text-sm font-semibold
                ring-1 ring-slate-200/60 dark:ring-[#3d3c3e]/60
                bg-white dark:bg-[#2b2a2c]
                text-slate-600 dark:text-slate-300
                hover:ring-jobzai-300/50 dark:hover:ring-jobzai-700/50
                hover:text-jobzai-600 dark:hover:text-jobzai-400
                hover:shadow-premium-soft
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Generating...' : 'Regenerate'}
            </motion.button>
          )}
          {actionSlot}
        </div>
      </div>

      {/* Bottom Row: Filter Tabs with Premium Underline */}
      <div className="relative" ref={tabsRef}>
        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;
            const count = filter.id === 'all' ? totalCount : 
              filter.id === activeFilter ? filteredCount : null;
            
            return (
              <motion.button
                key={filter.id}
                data-filter-id={filter.id}
                onClick={() => onFilterChange(filter.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative px-4 py-3 text-sm font-medium rounded-t-lg
                  transition-all duration-200
                  ${isActive
                    ? 'text-jobzai-600 dark:text-jobzai-400 bg-jobzai-50/50 dark:bg-jobzai-950/20'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-[#3d3c3e]/30'
                  }
                `}
              >
                {filter.label}
                {count !== null && isActive && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-jobzai-100 dark:bg-jobzai-900/50 text-jobzai-600 dark:text-jobzai-400">
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Subtle bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-200/60 dark:bg-[#2b2a2c]/60" />

        {/* Animated underline indicator - Jobzai Violet gradient */}
        <motion.div
          className="absolute bottom-0 h-0.5 rounded-full"
          style={{ background: 'linear-gradient(90deg, #635BFF 0%, #5249e6 100%)' }}
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </div>
    </section>
  );
}
