import { motion } from 'framer-motion';
import { LucideIcon, Sparkles } from 'lucide-react';

interface AIToolCardProps {
  type: 'cover_letter' | 'follow_up';
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

export const AIToolCard = ({
  type,
  title,
  description,
  icon: Icon,
  onClick,
  disabled = false,
}: AIToolCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative overflow-hidden
        p-8 rounded-2xl
        bg-white dark:bg-[#2b2a2c]
        border-2 border-gray-200 dark:border-[#3d3c3e]
        hover:border-purple-300 dark:hover:border-purple-600
        shadow-sm hover:shadow-xl
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:y-0
        text-left
      `}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* Icon */}
        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        
        {/* Generate indicator */}
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium text-sm group-hover:gap-3 transition-all">
          <Sparkles className="w-4 h-4" />
          <span>Generate with AI</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </motion.button>
  );
};


