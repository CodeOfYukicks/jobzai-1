/**
 * DiffStats Component
 * Shows change statistics with animated counters
 */

import { motion } from 'framer-motion';
import { Plus, Minus, Edit3, Equal } from 'lucide-react';

interface DiffStatsProps {
  added: number;
  removed: number;
  modified: number;
  unchanged?: number;
  size?: 'sm' | 'md' | 'lg';
  showUnchanged?: boolean;
  className?: string;
}

export default function DiffStats({
  added,
  removed,
  modified,
  unchanged = 0,
  size = 'md',
  showUnchanged = false,
  className = '',
}: DiffStatsProps) {
  const sizeClasses = {
    sm: 'text-[10px] gap-1.5 px-2 py-0.5',
    md: 'text-xs gap-2 px-3 py-1',
    lg: 'text-sm gap-3 px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const hasChanges = added > 0 || removed > 0 || modified > 0;

  if (!hasChanges && !showUnchanged) {
    return (
      <span className={`inline-flex items-center ${sizeClasses[size]} 
                        bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 
                        rounded-full font-medium ${className}`}>
        <Equal className={iconSizes[size]} />
        <span>No changes</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} 
                     bg-gray-100/80 dark:bg-gray-800/80 rounded-full font-medium ${className}`}>
      {added > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
          className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
        >
          <Plus className={iconSizes[size]} />
          <span>{added}</span>
        </motion.span>
      )}

      {modified > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
        >
          <Edit3 className={iconSizes[size]} />
          <span>{modified}</span>
        </motion.span>
      )}

      {removed > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400"
        >
          <Minus className={iconSizes[size]} />
          <span>{removed}</span>
        </motion.span>
      )}

      {showUnchanged && unchanged > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.4 }}
          className="inline-flex items-center gap-0.5 text-gray-500 dark:text-gray-400"
        >
          <Equal className={iconSizes[size]} />
          <span>{unchanged}</span>
        </motion.span>
      )}
    </div>
  );
}

/**
 * Compact badge showing total changes
 */
export function DiffBadge({ 
  changes, 
  className = '' 
}: { 
  changes: number; 
  className?: string;
}) {
  if (changes === 0) {
    return null;
  }

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5
                  text-[10px] font-bold rounded-full
                  bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300
                  ${className}`}
    >
      {changes}
    </motion.span>
  );
}

