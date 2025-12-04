import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface InsightCardProps {
  id: string;
  title: string;
  summary: string;
  metric?: string;
  isExpanded: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  children: ReactNode;
}

export default function InsightCard({
  id,
  title,
  summary,
  metric,
  isExpanded,
  onToggle,
  isLoading,
  children
}: InsightCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`
        bg-white dark:bg-[#111113] 
        border border-gray-100 dark:border-gray-800/80
        rounded-xl overflow-hidden
        transition-shadow duration-300
        ${isExpanded ? 'shadow-lg shadow-gray-200/50 dark:shadow-black/20' : 'shadow-sm hover:shadow-md'}
      `}
    >
      {/* Header - Always visible */}
      <motion.button
        onClick={onToggle}
        disabled={isLoading}
        className="w-full px-6 py-5 flex items-center justify-between text-left
          hover:bg-gray-50/50 dark:hover:bg-gray-800/30 
          transition-colors duration-200
          disabled:cursor-wait"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {metric && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium 
                text-indigo-600 dark:text-indigo-400 
                bg-indigo-50 dark:bg-indigo-900/30 
                rounded-full">
                {metric}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-4">
            {summary}
          </p>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </motion.button>

      {/* Content - Expandable */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
              opacity: { duration: 0.2 }
            }}
          >
            <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


