import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sun, Snowflake } from 'lucide-react';
import { WarmthLevel, WARMTH_LEVEL_LABELS, WARMTH_LEVEL_COLORS } from '../../types/job';

interface WarmthIndicatorProps {
  level: WarmthLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  interactive?: boolean;
  onChange?: (level: WarmthLevel) => void;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-sm px-2 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const WarmthIcon = ({ level, size }: { level: WarmthLevel; size: 'sm' | 'md' | 'lg' }) => {
  const className = `${iconSizes[size]} flex-shrink-0`;
  
  switch (level) {
    case 'cold':
      return <Snowflake className={`${className} text-slate-500`} />;
    case 'warm':
      return <Sun className={`${className} text-amber-500`} />;
    case 'hot':
      return <Flame className={`${className} text-red-500`} />;
  }
};

export function WarmthIndicator({ 
  level, 
  size = 'md', 
  showLabel = true,
  interactive = false,
  onChange,
}: WarmthIndicatorProps) {
  const colors = WARMTH_LEVEL_COLORS[level];
  
  if (interactive && onChange) {
    return (
      <div className="flex items-center gap-1">
        {(['cold', 'warm', 'hot'] as WarmthLevel[]).map((warmth) => {
          const isActive = warmth === level;
          const warmthColors = WARMTH_LEVEL_COLORS[warmth];
          
          return (
            <motion.button
              key={warmth}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(warmth)}
              className={`
                ${sizeClasses[size]}
                inline-flex items-center rounded-full font-medium
                border transition-all duration-200
                ${isActive 
                  ? `${warmthColors.bg} ${warmthColors.text} ${warmthColors.border}` 
                  : 'bg-gray-50 dark:bg-[#2b2a2c] text-gray-400 border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-100 dark:hover:bg-[#3d3c3e]'
                }
              `}
            >
              <WarmthIcon level={warmth} size={size} />
              {showLabel && (
                <span className={isActive ? '' : 'opacity-60'}>
                  {WARMTH_LEVEL_LABELS[warmth]}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }
  
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center rounded-full font-medium
        ${colors.bg} ${colors.text} border ${colors.border}
      `}
    >
      <WarmthIcon level={level} size={size} />
      {showLabel && <span>{WARMTH_LEVEL_LABELS[level]}</span>}
    </motion.span>
  );
}

export default WarmthIndicator;

