import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  badge?: string | null;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export const CollapsibleSection = ({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  badge,
  children
}: CollapsibleSectionProps) => {
  return (
    <div className="border-t border-gray-100 dark:border-gray-700/50 first:border-t-0">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-1 text-left group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-tight">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleSection;









