/**
 * SummaryDiff Component
 * Professional summary comparison view
 */

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { SummaryComparison, ComparisonViewMode } from '../../../types/cvComparison';
import { computeWordLevelDiff } from '../../../lib/cvComparisonEngine';
import WordDiff from './WordDiff';
import DiffStats from './DiffStats';

interface SummaryDiffProps {
  comparison: SummaryComparison;
  viewMode: ComparisonViewMode;
}

export default function SummaryDiff({ comparison, viewMode }: SummaryDiffProps) {
  const { original, modified, diff, changeStats } = comparison;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 
                          flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Professional Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {comparison.hasChanges 
                ? 'AI has optimized your summary' 
                : 'No changes to summary'}
            </p>
          </div>
        </div>
        <DiffStats
          added={changeStats.added}
          removed={changeStats.removed}
          modified={changeStats.modified}
          size="sm"
        />
      </div>

      {/* Content based on view mode */}
      {viewMode === 'split' ? (
        <SplitView original={original} modified={modified} />
      ) : viewMode === 'before' ? (
        <BeforeView original={original} />
      ) : viewMode === 'after' ? (
        <AfterView modified={modified} />
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
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {modified || original}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 
                    rounded-xl border border-gray-200 dark:border-gray-700/50">
      <p className="text-sm leading-relaxed">
        <WordDiff diff={diff} />
      </p>
    </div>
  );
}

function SplitView({ original, modified }: { original: string; modified: string }) {
  const diff = computeWordLevelDiff(original || '', modified || '');
  
  // Render text with only removed words highlighted (for Before column)
  const renderBeforeText = () => {
    if (!original) return <span className="text-gray-400 italic">No summary</span>;
    if (!modified) {
      return (
        <span className="bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-300 
                         line-through decoration-red-500/70">
          {original}
        </span>
      );
    }
    
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-gray-700 dark:text-gray-300">{segment.value}</span>;
      }
      if (segment.type === 'removed') {
        return (
          <span 
            key={idx} 
            className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 
                       line-through decoration-red-500/70 px-0.5 rounded-sm"
          >
            {segment.value}
          </span>
        );
      }
      return null; // Skip 'added' in Before column
    });
  };
  
  // Render text with only added words highlighted (for After column)
  const renderAfterText = () => {
    if (!modified) return <span className="text-gray-400 italic">No summary</span>;
    if (!original) {
      return (
        <span className="bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 
                         font-medium border-b-2 border-emerald-400">
          {modified}
        </span>
      );
    }
    
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-gray-700 dark:text-gray-300">{segment.value}</span>;
      }
      if (segment.type === 'added') {
        return (
          <span 
            key={idx} 
            className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 
                       font-medium px-0.5 rounded-sm border-b border-emerald-400 dark:border-emerald-600"
          >
            {segment.value}
          </span>
        );
      }
      return null; // Skip 'removed' in After column
    });
  };
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Before
          </span>
          <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl 
                        border border-gray-200/80 dark:border-gray-700/50">
          <p className="text-sm leading-relaxed">
            {renderBeforeText()}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            After
          </span>
          <span className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800" />
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl 
                        border border-emerald-200/80 dark:border-emerald-800/50">
          <p className="text-sm leading-relaxed">
            {renderAfterText()}
          </p>
        </div>
      </div>
    </div>
  );
}

function BeforeView({ original }: { original: string }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl 
                    border border-gray-200 dark:border-gray-700/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Original Version
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {original || <span className="text-gray-400 italic">No summary in original CV</span>}
      </p>
    </div>
  );
}

function AfterView({ modified }: { modified: string }) {
  return (
    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl 
                    border border-emerald-200/50 dark:border-emerald-800/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          AI-Optimized Version
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {modified || <span className="text-gray-400 italic">No summary generated</span>}
      </p>
    </div>
  );
}

