/**
 * SummaryDiff Component
 * Professional summary comparison view with premium dark design
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%)',
                 border: '1px solid rgba(59,130,246,0.2)',
               }}>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Professional Summary
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              {comparison.hasChanges 
                ? 'AI has optimized your summary' 
                : 'No changes to summary'}
            </p>
          </div>
        </div>
        
        {/* Mini stats */}
        <div className="flex items-center gap-3">
          {changeStats.added > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Plus className="w-3 h-3" />
              {changeStats.added}
            </span>
          )}
          {changeStats.removed > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <Minus className="w-3 h-3" />
              {changeStats.removed}
            </span>
          )}
          {changeStats.modified > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
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
      <div className="p-5 rounded-xl"
           style={{
             background: 'rgba(255,255,255,0.02)',
             border: '1px solid rgba(255,255,255,0.06)',
           }}>
        <p className="text-sm text-white/70 leading-relaxed font-mono">
          {modified || original}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Code editor style header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
        <span className="w-3 h-3 rounded-full bg-red-500/60" />
        <span className="w-3 h-3 rounded-full bg-amber-500/60" />
        <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
        <span className="ml-3 text-xs text-white/30 font-mono">summary.diff</span>
      </div>
      
      {/* Diff content */}
      <div className="p-5">
        <p className="text-sm leading-loose font-mono">
          <WordDiff diff={diff} />
        </p>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)' }} />
          <span className="text-[10px] text-white/40">Added</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded"
                style={{ background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)' }} />
          <span className="text-[10px] text-white/40">Removed</span>
        </div>
      </div>
    </motion.div>
  );
}

function SplitView({ original, modified }: { original: string; modified: string }) {
  const diff = useMemo(() => computeWordLevelDiff(original || '', modified || ''), [original, modified]);
  
  // Render text with only removed words highlighted (for Before column)
  const renderBeforeText = () => {
    if (!original) return <span className="text-white/30 italic">No summary</span>;
    if (!modified) {
      return (
        <span className="bg-red-500/10 text-red-400 line-through px-1 rounded">
          {original}
        </span>
      );
    }
    
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-white/60">{segment.value}</span>;
      }
      if (segment.type === 'removed') {
        return (
          <motion.span 
            key={idx}
            initial={{ opacity: 0, backgroundColor: 'rgba(248,113,113,0.3)' }}
            animate={{ opacity: 1, backgroundColor: 'rgba(248,113,113,0.15)' }}
            transition={{ duration: 0.5, delay: idx * 0.02 }}
            className="text-red-400 line-through px-0.5 mx-0.5 rounded"
          >
            {segment.value}
          </motion.span>
        );
      }
      return null; // Skip 'added' in Before column
    });
  };
  
  // Render text with only added words highlighted (for After column)
  const renderAfterText = () => {
    if (!modified) return <span className="text-white/30 italic">No summary</span>;
    if (!original) {
      return (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald-500/10 text-emerald-400 px-1 rounded border-b border-emerald-500/50"
        >
          {modified}
        </motion.span>
      );
    }
    
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-white/70">{segment.value}</span>;
      }
      if (segment.type === 'added') {
        return (
          <motion.span 
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.02 }}
            className="bg-emerald-500/15 text-emerald-400 font-medium px-0.5 mx-0.5 rounded
                       border-b border-emerald-500/50"
          >
            {segment.value}
          </motion.span>
        );
      }
      return null; // Skip 'removed' in After column
    });
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Before Column */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Before
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <div className="p-4 rounded-xl"
             style={{
               background: 'rgba(255,255,255,0.02)',
               border: '1px solid rgba(255,255,255,0.06)',
             }}>
          <p className="text-sm leading-relaxed font-mono">
            {renderBeforeText()}
          </p>
        </div>
      </motion.div>
      
      {/* After Column */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            After
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
        </div>
        <div className="p-4 rounded-xl"
             style={{
               background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.02) 100%)',
               border: '1px solid rgba(16,185,129,0.15)',
             }}>
          <p className="text-sm leading-relaxed font-mono">
            {renderAfterText()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
