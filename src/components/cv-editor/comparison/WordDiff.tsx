/**
 * WordDiff Component
 * Renders word-level diff with subtle highlighting - Light/dark mode support
 */

import { DiffSegment, WordDiffResult } from '../../../types/cvComparison';

interface WordDiffProps {
  diff: WordDiffResult;
  className?: string;
  showAnimations?: boolean;
}

export default function WordDiff({ diff, className = '' }: WordDiffProps) {
  if (!diff || diff.segments.length === 0) {
    return null;
  }

  return (
    <span className={`inline ${className}`}>
      {diff.segments.map((segment, index) => (
        <DiffSegmentRenderer
          key={index}
          segment={segment}
        />
      ))}
    </span>
  );
}

interface DiffSegmentRendererProps {
  segment: DiffSegment;
}

function DiffSegmentRenderer({ segment }: DiffSegmentRendererProps) {
  if (segment.type === 'unchanged') {
    return (
      <span className="text-gray-700 dark:text-white/70">
        {segment.value}
      </span>
    );
  }

  if (segment.type === 'removed') {
    return (
      <span className="inline px-0.5 mx-0.5 rounded 
                       text-red-600 dark:text-red-400 
                       line-through 
                       bg-red-100 dark:bg-red-500/10">
        {segment.value}
      </span>
    );
  }

  if (segment.type === 'added') {
    return (
      <span className="inline px-0.5 mx-0.5 rounded 
                       text-emerald-600 dark:text-emerald-400 
                       bg-emerald-100 dark:bg-emerald-500/10">
        {segment.value}
      </span>
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
            <span key={index} className="text-gray-500 dark:text-white/50">
              {segment.value}
            </span>
          );
        }

        if (segment.type === 'removed') {
          return (
            <span
              key={index}
              className="text-red-600 dark:text-red-400 line-through text-xs px-0.5 rounded 
                         bg-red-100 dark:bg-red-500/10"
            >
              {segment.value}
            </span>
          );
        }

        if (segment.type === 'added') {
          return (
            <span
              key={index}
              className="text-emerald-600 dark:text-emerald-400 text-xs px-0.5 rounded 
                         bg-emerald-100 dark:bg-emerald-500/10"
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

/**
 * Inline word diff with gutter indicators (for code-editor style view)
 */
export function WordDiffWithGutter({ diff, lineNumber }: { diff: WordDiffResult; lineNumber?: number }) {
  if (!diff || diff.segments.length === 0) {
    return null;
  }

  const hasAdditions = diff.addedCount > 0;
  const hasRemovals = diff.removedCount > 0;

  return (
    <div className="flex items-start group">
      {/* Line number gutter */}
      {lineNumber !== undefined && (
        <span className="w-8 flex-shrink-0 text-right pr-3 text-xs text-gray-300 dark:text-white/20 font-mono select-none">
          {lineNumber}
        </span>
      )}
      
      {/* Change indicator */}
      <span className={`w-4 flex-shrink-0 text-center text-xs font-medium select-none ${
        hasAdditions && hasRemovals 
          ? 'text-[#7cb305] dark:text-[#b7e219]' 
          : hasAdditions 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : hasRemovals 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-300 dark:text-white/10'
      }`}>
        {hasAdditions && hasRemovals ? '~' : hasAdditions ? '+' : hasRemovals ? '-' : ' '}
      </span>
      
      {/* Content */}
      <span className="flex-1 text-sm">
        <WordDiff diff={diff} />
      </span>
    </div>
  );
}

/**
 * Split view word diff - shows before/after
 */
interface SplitWordDiffProps {
  original: string;
  modified: string;
  diff: WordDiffResult;
}

export function SplitWordDiff({ diff }: SplitWordDiffProps) {
  return (
    <div className="grid grid-cols-2 gap-3 items-start">
      {/* Before */}
      <div className="p-3 rounded-lg text-sm
                      bg-white dark:bg-[#1a1a1a]
                      border border-gray-200 dark:border-white/[0.08]">
        {diff.segments.map((segment, idx) => {
          if (segment.type === 'unchanged') {
            return <span key={idx} className="text-gray-500 dark:text-white/50">{segment.value}</span>;
          }
          if (segment.type === 'removed') {
            return (
              <span 
                key={idx} 
                className="text-red-600 dark:text-red-400 line-through px-0.5 rounded 
                           bg-red-100 dark:bg-red-500/10"
              >
                {segment.value}
              </span>
            );
          }
          return null;
        })}
      </div>
      
      {/* After */}
      <div className="p-3 rounded-lg text-sm
                      bg-white dark:bg-[#1a1a1a]
                      border border-emerald-200 dark:border-emerald-500/15">
        {diff.segments.map((segment, idx) => {
          if (segment.type === 'unchanged') {
            return <span key={idx} className="text-gray-700 dark:text-white/70">{segment.value}</span>;
          }
          if (segment.type === 'added') {
            return (
              <span 
                key={idx} 
                className="text-emerald-600 dark:text-emerald-400 px-0.5 rounded 
                           bg-emerald-100 dark:bg-emerald-500/10"
              >
                {segment.value}
              </span>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
