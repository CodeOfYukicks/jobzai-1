import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { CompactProgressRing } from './ProgressRing';

interface PremiumCardProps {
  title: string;
  icon?: ReactNode;
  completion?: number; // 0-100
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
  className?: string;
  headerActions?: ReactNode;
  highlight?: boolean;
  badge?: string;
}

const PremiumCard = ({
  title,
  icon,
  completion,
  isCollapsible = true,
  defaultCollapsed = false,
  children,
  className = '',
  headerActions,
  highlight = false,
  badge
}: PremiumCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isComplete = completion !== undefined && completion === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={`
        relative overflow-hidden
        bg-white dark:bg-gray-800/95
        backdrop-blur-xl
        rounded-2xl
        border border-gray-200/80 dark:border-gray-700/50
        shadow-sm hover:shadow-md
        transition-all duration-300
        ${highlight ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-400/20' : ''}
        ${className}
      `}
    >
      {/* Subtle gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-gray-800/50 pointer-events-none" />
      
      {/* Highlight glow effect */}
      {highlight && (
        <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-sm" />
      )}

      {/* Header */}
      <div 
        className={`
          relative px-5 py-4
          ${isCollapsible ? 'cursor-pointer select-none' : ''}
          ${!isCollapsed ? 'border-b border-gray-100 dark:border-gray-700/50' : ''}
        `}
        onClick={() => isCollapsible && setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            {icon && (
              <div className={`
                p-2 rounded-xl
                ${isComplete 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                }
                transition-colors duration-300
              `}>
                {icon}
              </div>
            )}
            
            {/* Title */}
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h2>
              
              {/* Badge */}
              {badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                  {badge}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Completion indicator */}
            {completion !== undefined && (
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Complete</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CompactProgressRing progress={completion} size={28} strokeWidth={3} />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {completion}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Header actions */}
            {headerActions && (
              <div onClick={(e) => e.stopPropagation()}>
                {headerActions}
              </div>
            )}

            {/* Collapse toggle */}
            {isCollapsible && (
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.2 }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 dark:text-gray-500"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
          >
            <div className="relative px-5 py-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Empty state component for cards
export const PremiumCardEmptyState = ({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    {icon && (
      <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 mb-3">
        {icon}
      </div>
    )}
    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
      {title}
    </p>
    {description && (
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-4">
        {description}
      </p>
    )}
    {action}
  </div>
);

// AI suggestion banner for cards
export const PremiumCardAISuggestion = ({
  suggestion,
  onAccept,
  onDismiss
}: {
  suggestion: string;
  onAccept?: () => void;
  onDismiss?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-start gap-3 p-3 mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30"
  >
    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-800/50">
      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</p>
      <div className="flex items-center gap-2 mt-2">
        {onAccept && (
          <button
            onClick={onAccept}
            className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Apply
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

export default PremiumCard;



