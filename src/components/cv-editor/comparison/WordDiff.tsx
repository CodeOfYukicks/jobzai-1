/**
 * WordDiff Component
 * Renders word-level diff with animated highlighting - Premium dark design
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
  const baseDelay = index * 0.015;

  if (segment.type === 'unchanged') {
    return (
      <span className="text-white/70">
        {segment.value}
      </span>
    );
  }

  if (segment.type === 'removed') {
    return (
      <motion.span
        initial={showAnimations ? { opacity: 0, y: -3 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: baseDelay, duration: 0.25 }}
        className="inline-block px-0.5 mx-0.5 rounded text-red-400 line-through"
        style={{
          background: 'rgba(248,113,113,0.15)',
          textDecorationColor: 'rgba(248,113,113,0.5)',
        }}
      >
        {segment.value}
      </motion.span>
    );
  }

  if (segment.type === 'added') {
    return (
      <motion.span
        initial={showAnimations ? { opacity: 0, y: 3, scale: 0.95 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay: baseDelay, 
          duration: 0.3, 
          type: 'spring', 
          stiffness: 200,
          damping: 20 
        }}
        className="inline-block px-0.5 mx-0.5 rounded font-medium text-emerald-400"
        style={{
          background: 'rgba(16,185,129,0.15)',
          borderBottom: '2px solid rgba(16,185,129,0.5)',
        }}
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
            <span key={index} className="text-white/50">
              {segment.value}
            </span>
          );
        }

        if (segment.type === 'removed') {
          return (
            <span
              key={index}
              className="text-red-400 line-through text-xs px-0.5 rounded"
              style={{ background: 'rgba(248,113,113,0.1)' }}
            >
              {segment.value}
            </span>
          );
        }

        if (segment.type === 'added') {
          return (
            <span
              key={index}
              className="text-emerald-400 font-medium text-xs px-0.5 rounded"
              style={{ background: 'rgba(16,185,129,0.1)' }}
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
        <span className="w-8 flex-shrink-0 text-right pr-3 text-xs text-white/20 font-mono select-none">
          {lineNumber}
        </span>
      )}
      
      {/* Change indicator */}
      <span className={`w-4 flex-shrink-0 text-center text-xs font-bold select-none ${
        hasAdditions && hasRemovals 
          ? 'text-amber-400' 
          : hasAdditions 
            ? 'text-emerald-400' 
            : hasRemovals 
              ? 'text-red-400' 
              : 'text-white/10'
      }`}>
        {hasAdditions && hasRemovals ? '~' : hasAdditions ? '+' : hasRemovals ? '-' : ' '}
      </span>
      
      {/* Content */}
      <span className="flex-1 font-mono text-sm">
        <WordDiff diff={diff} showAnimations={false} />
      </span>
    </div>
  );
}

/**
 * Split view word diff - shows before/after with connecting animation
 */
interface SplitWordDiffProps {
  original: string;
  modified: string;
  diff: WordDiffResult;
}

export function SplitWordDiff({ original, modified, diff }: SplitWordDiffProps) {
  return (
    <div className="grid grid-cols-2 gap-4 items-start">
      {/* Before */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-3 rounded-lg text-sm font-mono"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {diff.segments.map((segment, idx) => {
          if (segment.type === 'unchanged') {
            return <span key={idx} className="text-white/50">{segment.value}</span>;
          }
          if (segment.type === 'removed') {
            return (
              <span 
                key={idx} 
                className="text-red-400 line-through px-0.5 rounded"
                style={{ background: 'rgba(248,113,113,0.15)' }}
              >
                {segment.value}
              </span>
            );
          }
          return null;
        })}
      </motion.div>
      
      {/* After */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-3 rounded-lg text-sm font-mono"
        style={{
          background: 'rgba(16,185,129,0.03)',
          border: '1px solid rgba(16,185,129,0.15)',
        }}
      >
        {diff.segments.map((segment, idx) => {
          if (segment.type === 'unchanged') {
            return <span key={idx} className="text-white/70">{segment.value}</span>;
          }
          if (segment.type === 'added') {
            return (
              <span 
                key={idx} 
                className="text-emerald-400 font-medium px-0.5 rounded"
                style={{ 
                  background: 'rgba(16,185,129,0.15)',
                  borderBottom: '2px solid rgba(16,185,129,0.5)',
                }}
              >
                {segment.value}
              </span>
            );
          }
          return null;
        })}
      </motion.div>
    </div>
  );
}
