/**
 * WordDiff Component
 * Renders word-level diff with animated highlighting
 */

import { motion } from 'framer-motion';
import { DiffSegment, WordDiffResult } from '../../../types/cvComparison';

interface WordDiffProps {
  diff: WordDiffResult;
  className?: string;
  showAnimations?: boolean;
}

export default function WordDiff({ diff, className = '', showAnimations = true }: WordDiffProps) {
  if (!diff || diff.segments.length === 0) {
    return null;
  }

  return (
    <span className={`inline ${className}`}>
      {diff.segments.map((segment, index) => (
        <DiffSegmentRenderer
          key={index}
          segment={segment}
          index={index}
          showAnimations={showAnimations}
        />
      ))}
    </span>
  );
}

interface DiffSegmentRendererProps {
  segment: DiffSegment;
  index: number;
  showAnimations: boolean;
}

function DiffSegmentRenderer({ segment, index, showAnimations }: DiffSegmentRendererProps) {
  const baseDelay = index * 0.02;

  if (segment.type === 'unchanged') {
    return (
      <span className="text-gray-800 dark:text-gray-200">
        {segment.value}
      </span>
    );
  }

  if (segment.type === 'removed') {
    return (
      <motion.span
        initial={showAnimations ? { opacity: 0, y: -2 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: baseDelay, duration: 0.2 }}
        className="inline-block bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 
                   line-through decoration-red-500/50 px-0.5 mx-0.5 rounded-sm
                   border-b border-red-300 dark:border-red-700"
      >
        {segment.value}
      </motion.span>
    );
  }

  if (segment.type === 'added') {
    return (
      <motion.span
        initial={showAnimations ? { opacity: 0, y: 2, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: baseDelay, duration: 0.25, type: 'spring', stiffness: 200 }}
        className="inline-block bg-[#635BFF]/10 dark:bg-[#5249e6]/40 text-[#635BFF] dark:text-[#a5a0ff] 
                   font-medium px-0.5 mx-0.5 rounded-sm
                   border-b-2 border-[#7c75ff] dark:border-[#a5a0ff]"
      >
        {segment.value}
      </motion.span>
    );
  }

  return <span>{segment.value}</span>;
}

/**
 * Compact word diff for inline display
 */
export function WordDiffCompact({ diff, className = '' }: WordDiffProps) {
  if (!diff || diff.segments.length === 0) {
    return null;
  }

  return (
    <span className={`inline text-sm ${className}`}>
      {diff.segments.map((segment, index) => {
        if (segment.type === 'unchanged') {
          return (
            <span key={index} className="text-gray-600 dark:text-gray-400">
              {segment.value}
            </span>
          );
        }

        if (segment.type === 'removed') {
          return (
            <span
              key={index}
              className="bg-red-100/60 dark:bg-red-900/30 text-red-600 dark:text-red-400 
                         line-through text-xs px-0.5 rounded"
            >
              {segment.value}
            </span>
          );
        }

        if (segment.type === 'added') {
          return (
            <span
              key={index}
              className="bg-[#635BFF]/10 dark:bg-[#5249e6]/30 text-[#5249e6] dark:text-[#a5a0ff] 
                         font-medium text-xs px-0.5 rounded"
            >
              {segment.value}
            </span>
          );
        }

        return <span key={index}>{segment.value}</span>;
      })}
    </span>
  );
}




