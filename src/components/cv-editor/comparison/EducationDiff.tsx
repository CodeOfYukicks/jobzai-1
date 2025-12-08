/**
 * EducationDiff Component
 * Education section comparison view - Premium dark design
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Plus, Minus, RefreshCw, Building2, Calendar } from 'lucide-react';
import { 
  EducationComparison, 
  EducationComparisonItem,
  ComparisonViewMode 
} from '../../../types/cvComparison';
import { computeWordLevelDiff } from '../../../lib/cvComparisonEngine';
import WordDiff from './WordDiff';

interface EducationDiffProps {
  comparison: EducationComparison;
  viewMode: ComparisonViewMode;
}

export default function EducationDiff({ comparison, viewMode }: EducationDiffProps) {
  const { items, changeStats } = comparison;

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
                 background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.1) 100%)',
                 border: '1px solid rgba(99,102,241,0.2)',
               }}>
            <GraduationCap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Education
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              {items.length} entr{items.length !== 1 ? 'ies' : 'y'} • 
              {comparison.hasChanges 
                ? ` ${changeStats.modified} modified` 
                : ' No changes'}
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

      {/* Education Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <EducationItemDiff
            key={item.id}
            item={item}
            index={index}
            viewMode={viewMode}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface EducationItemDiffProps {
  item: EducationComparisonItem;
  index: number;
  viewMode: ComparisonViewMode;
}

function EducationItemDiff({ item, index, viewMode }: EducationItemDiffProps) {
  const data = item.modified || item.original;
  
  const getStatusStyles = () => {
    switch (item.status) {
      case 'added':
        return {
          border: '1px solid rgba(16,185,129,0.3)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
          indicator: 'bg-emerald-500',
        };
      case 'removed':
        return {
          border: '1px solid rgba(248,113,113,0.3)',
          background: 'linear-gradient(135deg, rgba(248,113,113,0.08) 0%, rgba(248,113,113,0.03) 100%)',
          indicator: 'bg-red-500',
        };
      case 'modified':
        return {
          border: '1px solid rgba(251,191,36,0.3)',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.03) 100%)',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          indicator: 'bg-white/20',
        };
    }
  };

  const styles = getStatusStyles();

  const StatusIcon = {
    added: Plus,
    removed: Minus,
    modified: RefreshCw,
    unchanged: null,
  }[item.status];

  if (viewMode === 'split') {
    return <EducationSplitView item={item} index={index} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden"
      style={{ border: styles.border, background: styles.background }}
    >
      <div className="px-4 py-4 flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-1 h-12 rounded-full ${styles.indicator}`} />
        
        {StatusIcon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                          ${item.status === 'added' ? 'bg-emerald-500/15 text-emerald-400' : ''}
                          ${item.status === 'removed' ? 'bg-red-500/15 text-red-400' : ''}
                          ${item.status === 'modified' ? 'bg-amber-500/15 text-amber-400' : ''}`}>
            <StatusIcon className="w-3.5 h-3.5" />
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white">
            {viewMode === 'diff' && item.degreeDiff ? (
              <WordDiff diff={item.degreeDiff} showAnimations={false} />
            ) : (
              data?.degree
            )}
          </h4>
          <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {viewMode === 'diff' && item.institutionDiff ? (
                <WordDiff diff={item.institutionDiff} showAnimations={false} />
              ) : (
                data?.institution
              )}
            </span>
          </div>
          {data?.field && (
            <p className="text-xs text-white/30 mt-1">
              {viewMode === 'diff' && item.fieldDiff ? (
                <WordDiff diff={item.fieldDiff} showAnimations={false} />
              ) : (
                data.field
              )}
            </p>
          )}
          {(data?.startDate || data?.endDate) && (
            <div className="flex items-center gap-2 text-xs text-white/30 mt-1">
              <Calendar className="w-3 h-3" />
              <span>{data.startDate || ''} {data.startDate && data.endDate ? '—' : ''} {data.endDate || ''}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EducationSplitView({ item, index }: { item: EducationComparisonItem; index: number }) {
  // Compute word diffs for each field
  const degreeDiff = useMemo(() => {
    if (!item.original || !item.modified) return null;
    return computeWordLevelDiff(item.original.degree || '', item.modified.degree || '');
  }, [item.original, item.modified]);

  const institutionDiff = useMemo(() => {
    if (!item.original || !item.modified) return null;
    return computeWordLevelDiff(item.original.institution || '', item.modified.institution || '');
  }, [item.original, item.modified]);

  const fieldDiff = useMemo(() => {
    if (!item.original || !item.modified) return null;
    return computeWordLevelDiff(item.original.field || '', item.modified.field || '');
  }, [item.original, item.modified]);
  
  // Helper to render text with removed highlights
  const renderBeforeText = (diff: ReturnType<typeof computeWordLevelDiff> | null, original: string | undefined) => {
    if (!diff || !original) return original || null;
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-white/60">{segment.value}</span>;
      }
      if (segment.type === 'removed') {
        return (
          <span key={idx} className="bg-red-500/15 text-red-400 line-through px-0.5 rounded">
            {segment.value}
          </span>
        );
      }
      return null;
    });
  };
  
  // Helper to render text with added highlights
  const renderAfterText = (diff: ReturnType<typeof computeWordLevelDiff> | null, modified: string | undefined) => {
    if (!diff || !modified) return modified || null;
    return diff.segments.map((segment, idx) => {
      if (segment.type === 'unchanged') {
        return <span key={idx} className="text-white/70">{segment.value}</span>;
      }
      if (segment.type === 'added') {
        return (
          <span key={idx} className="bg-emerald-500/15 text-emerald-400 font-medium px-0.5 rounded
                                     border-b border-emerald-500/50">
            {segment.value}
          </span>
        );
      }
      return null;
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="grid grid-cols-2 gap-4"
    >
      {/* Before */}
      <div className="space-y-3">
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
          {item.original ? (
            <>
              <h4 className="text-sm font-semibold text-white/70 leading-relaxed">
                {item.status === 'modified' ? renderBeforeText(degreeDiff, item.original.degree) : item.original.degree}
              </h4>
              <p className="text-xs text-white/40 mt-1 leading-relaxed">
                {item.status === 'modified' ? renderBeforeText(institutionDiff, item.original.institution) : item.original.institution}
              </p>
              {item.original.field && (
                <p className="text-xs text-white/30 mt-0.5 leading-relaxed">
                  {item.status === 'modified' ? renderBeforeText(fieldDiff, item.original.field) : item.original.field}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-white/20 italic">(new entry →)</p>
          )}
        </div>
      </div>

      {/* After */}
      <div className="space-y-3">
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
          {item.modified ? (
            <>
              <h4 className="text-sm font-semibold text-white leading-relaxed">
                {item.status === 'modified' ? renderAfterText(degreeDiff, item.modified.degree) : item.modified.degree}
              </h4>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                {item.status === 'modified' ? renderAfterText(institutionDiff, item.modified.institution) : item.modified.institution}
              </p>
              {item.modified.field && (
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                  {item.status === 'modified' ? renderAfterText(fieldDiff, item.modified.field) : item.modified.field}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-red-400/50 italic line-through">(← removed)</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
