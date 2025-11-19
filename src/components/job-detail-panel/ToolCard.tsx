import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight, History } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  color: 'purple' | 'green' | 'blue' | 'red' | 'orange';
  icon: LucideIcon;
  onGenerate: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  historyCount?: number;
  onViewHistory?: () => void;
}

const colorClasses = {
  purple: {
    text: 'text-purple-600 dark:text-purple-400',
    hover: 'hover:text-purple-700 dark:hover:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
  },
  green: {
    text: 'text-green-600 dark:text-green-400',
    hover: 'hover:text-green-700 dark:hover:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-900/10',
  },
  blue: {
    text: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:text-blue-700 dark:hover:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
  },
  red: {
    text: 'text-red-600 dark:text-red-400',
    hover: 'hover:text-red-700 dark:hover:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-900/10',
  },
  orange: {
    text: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:text-orange-700 dark:hover:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
  },
};

export const ToolCard = ({
  title,
  description,
  color,
  icon: Icon,
  onGenerate,
  isGenerating = false,
  disabled = false,
  historyCount = 0,
  onViewHistory,
}: ToolCardProps) => {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden
        p-4 rounded-lg
        bg-white dark:bg-gray-800
        border ${colors.border}
        shadow-sm hover:shadow-md
        transition-all duration-200
        h-full flex flex-col
      `}
    >
      {/* Content */}
      <div className="flex flex-col flex-1 space-y-3">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
          {description}
        </p>
        
        {/* Generate Button and History */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <button
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            className={`
              group inline-flex items-center gap-1.5
              font-medium text-xs
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${colors.text} ${!disabled && !isGenerating ? colors.hover : ''}
            `}
          >
            <span>Generate {title}</span>
            <ArrowRight 
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                !disabled && !isGenerating ? 'group-hover:translate-x-0.5' : ''
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            {historyCount > 0 && onViewHistory && (
              <button
                onClick={onViewHistory}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
              >
                <History className="w-3 h-3" />
                <span>{historyCount}</span>
              </button>
            )}
            {disabled && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                Coming Soon
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

