/**
 * DiffStats Component
 * Shows change statistics with animated counters - Premium dark design
 */

import { motion } from 'framer-motion';
import { Plus, Minus, RefreshCw, Equal } from 'lucide-react';

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
    sm: 'text-[10px] gap-2 px-2.5 py-1',
    md: 'text-xs gap-3 px-3 py-1.5',
    lg: 'text-sm gap-4 px-4 py-2',
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
                        rounded-lg font-medium text-white/30 ${className}`}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
        <Equal className={iconSizes[size]} />
        <span>No changes</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} 
                     rounded-lg font-medium ${className}`}
         style={{
           background: 'rgba(255,255,255,0.03)',
           border: '1px solid rgba(255,255,255,0.06)',
         }}>
      {added > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
          className="inline-flex items-center gap-1 text-emerald-400"
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
          className="inline-flex items-center gap-1 text-amber-400"
        >
          <RefreshCw className={iconSizes[size]} />
          <span>{modified}</span>
        </motion.span>
      )}

      {removed > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          className="inline-flex items-center gap-1 text-red-400"
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
          className="inline-flex items-center gap-1 text-white/30"
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
                  text-[10px] font-bold rounded-md text-amber-400
                  ${className}`}
      style={{
        background: 'rgba(251,191,36,0.15)',
        border: '1px solid rgba(251,191,36,0.3)',
      }}
    >
      {changes}
    </motion.span>
  );
}

/**
 * Large stats display for headers
 */
export function DiffStatsLarge({
  added,
  removed,
  modified,
}: {
  added: number;
  removed: number;
  modified: number;
}) {
  return (
    <div className="flex items-center gap-6">
      {/* Added */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'rgba(16,185,129,0.15)' }}>
          <Plus className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <span className="text-lg font-bold text-emerald-400">{added}</span>
          <span className="text-xs text-white/30 ml-1.5">added</span>
        </div>
      </div>

      {/* Removed */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'rgba(248,113,113,0.15)' }}>
          <Minus className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <span className="text-lg font-bold text-red-400">{removed}</span>
          <span className="text-xs text-white/30 ml-1.5">removed</span>
        </div>
      </div>

      {/* Modified */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'rgba(251,191,36,0.15)' }}>
          <RefreshCw className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <span className="text-lg font-bold text-amber-400">{modified}</span>
          <span className="text-xs text-white/30 ml-1.5">modified</span>
        </div>
      </div>
    </div>
  );
}
