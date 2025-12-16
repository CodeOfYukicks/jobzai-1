/**
 * SummaryDiff Component
 * Professional summary comparison view with light/dark mode support
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Minus, RefreshCw } from 'lucide-react';
import { SummaryComparison, ComparisonViewMode } from '../../../types/cvComparison';
import { computeWordLevelDiff } from '../../../lib/cvComparisonEngine';
import WordDiff from './WordDiff';

interface SummaryDiffProps {
  comparison: SummaryComparison;
  viewMode: ComparisonViewMode;
}

export default function SummaryDiff({ comparison, viewMode }: SummaryDiffProps) {
  const { original, modified, diff, changeStats } = comparison;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center
                          bg-[#b7e219]/10 dark:bg-[#b7e219]/15
                          border border-[#b7e219]/20 dark:border-[#b7e219]/25">
            <FileText className="w-4 h-4 text-[#7cb305] dark:text-[#b7e219]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Professional Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {comparison.hasChanges 
                ? 'AI has optimized your summary' 
                : 'No changes to summary'}
            </p>
          </div>
        </div>
        
        {/* Mini stats */}
        <div className="flex items-center gap-3">
          {changeStats.added > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Plus className="w-3 h-3" />
              {changeStats.added}
            </span>
          )}
          {changeStats.removed > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <Minus className="w-3 h-3" />
              {changeStats.removed}
            </span>
          )}
          {changeStats.modified > 0 && (
            <span className="flex items-center gap-1 text-xs text-[#7cb305] dark:text-[#b7e219]">
              <RefreshCw className="w-3 h-3" />
              {changeStats.modified}
            </span>
          )}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'split' ? (
        <SplitView original={original} modified={modified} />
      ) : (
        <DiffView diff={diff} original={original} modified={modified} />
      )}
    </motion.div>
  );
}

function DiffView({ diff, original, modified }: { 
  diff: SummaryComparison['diff']; 
  original: string;
  modified: string;
}) {
  if (!diff.hasChanges) {
    return (
      <div className="p-4 rounded-lg
                      bg-white dark:bg-[#1a1a1a]
                      border border-gray-200 dark:border-white/[0.08]">
        <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">
          {modified || original}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden
                    bg-white dark:bg-[#1a1a1a]
                    border border-gray-200 dark:border-white/[0.08]">
      {/* Minimal header */}
      <div className="flex items-center px-4 py-2 
                      border-b border-gray-100 dark:border-white/[0.08]">
        <span className="text-xs text-gray-400 dark:text-white/30 font-mono">summary.diff</span>
      </div>
      
      {/* Diff content */}
      <div className="p-4">
        <p className="text-sm leading-relaxed">
          <WordDiff diff={diff} />
        </p>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 
                      bg-gray-50 dark:bg-[#0a0a0a]
                      border-t border-gray-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 dark:bg-emerald-500/30" />
          <span className="text-[10px] text-gray-500 dark:text-white/40">Added</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 dark:bg-red-500/30" />
          <span className="text-[10px] text-gray-500 dark:text-white/40">Removed</span>
        </div>
      </div>
    </div>
  );
}

function SplitView({ original, modified }: { original: string; modified: string }) {
  const diff = useMemo(() => computeWordLevelDiff(original || '', modified || ''), [original, modified]);
  
  // Render text with only removed words highlighted (for Before column)
  const renderBeforeText = () => {
    if (!original) return <span className="text-gray-400 dark:text-white/30 italic">No summary</span>;
    if (!modified) {
      return (
        <span className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 line-through px-1 rounded">
          {original}
        </span>
      );
    }
    
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-gray-500 dark:text-white/60">{segment.value}</span>;
      }
      if (segment.type === 'removed') {
        return (
          <span 
            key={idx}
            className="text-red-600 dark:text-red-400 line-through px-0.5 mx-0.5 rounded bg-red-100 dark:bg-red-500/10"
          >
            {segment.value}
          </span>
        );
      }
      return null;
    });
  };
  
  // Render text with only added words highlighted (for After column)
  const renderAfterText = () => {
    if (!modified) return <span className="text-gray-400 dark:text-white/30 italic">No summary</span>;
    if (!original) {
      return (
        <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 rounded">
          {modified}
        </span>
      );
    }
    
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-gray-700 dark:text-white/70">{segment.value}</span>;
      }
      if (segment.type === 'added') {
        return (
          <span 
            key={idx}
            className="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-0.5 mx-0.5 rounded"
          >
            {segment.value}
          </span>
        );
      }
      return null;
    });
  };
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Before Column */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-white/40">
            Before
          </span>
        </div>
        <div className="p-4 rounded-lg
                        bg-white dark:bg-[#1a1a1a]
                        border border-gray-200 dark:border-white/[0.08]">
          <p className="text-sm leading-relaxed">
            {renderBeforeText()}
          </p>
        </div>
      </div>
      
      {/* After Column */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            After
          </span>
        </div>
        <div className="p-4 rounded-lg
                        bg-white dark:bg-[#1a1a1a]
                        border border-emerald-200 dark:border-emerald-500/15">
          <p className="text-sm leading-relaxed">
            {renderAfterText()}
          </p>
        </div>
      </div>
    </div>
  );
}
