/**
 * EducationDiff Component
 * Education section comparison view - Light/dark mode support
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
            <GraduationCap className="w-4 h-4 text-[#7cb305] dark:text-[#b7e219]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Education
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
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

      {/* Education Items */}
      <div className="space-y-2">
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
  
  const getStatusClasses = () => {
    switch (item.status) {
      case 'added':
        return {
          border: 'border-emerald-200 dark:border-emerald-500/20',
          indicator: 'bg-emerald-500',
          iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'removed':
        return {
          border: 'border-red-200 dark:border-red-500/20',
          indicator: 'bg-red-500',
          iconBg: 'bg-red-100 dark:bg-red-500/10',
          iconColor: 'text-red-600 dark:text-red-400',
        };
      case 'modified':
        return {
          border: 'border-[#b7e219]/30 dark:border-[#b7e219]/30',
          indicator: 'bg-[#7cb305] dark:bg-[#b7e219]',
          iconBg: 'bg-[#b7e219]/10 dark:bg-[#b7e219]/15',
          iconColor: 'text-[#7cb305] dark:text-[#b7e219]',
        };
      default:
        return {
          border: 'border-gray-200 dark:border-white/[0.08]',
          indicator: 'bg-gray-300 dark:bg-white/20',
          iconBg: '',
          iconColor: '',
        };
    }
  };

  const styles = getStatusClasses();

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
    <div className={`rounded-lg overflow-hidden bg-white dark:bg-[#1a1a1a] border ${styles.border}`}>
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Status indicator */}
        <div className={`w-0.5 h-10 rounded-full ${styles.indicator}`} />
        
        {StatusIcon && (
          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${styles.iconBg} ${styles.iconColor}`}>
            <StatusIcon className="w-3 h-3" />
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {viewMode === 'diff' && item.degreeDiff ? (
              <WordDiff diff={item.degreeDiff} showAnimations={false} />
            ) : (
              data?.degree
            )}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/40 mt-0.5">
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
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
              {viewMode === 'diff' && item.fieldDiff ? (
                <WordDiff diff={item.fieldDiff} showAnimations={false} />
              ) : (
                data.field
              )}
            </p>
          )}
          {(data?.startDate || data?.endDate) && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-white/30 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{data.startDate || ''} {data.startDate && data.endDate ? '—' : ''} {data.endDate || ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
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
        return <span key={idx} className="text-gray-500 dark:text-white/60">{segment.value}</span>;
      }
      if (segment.type === 'removed') {
        return (
          <span key={idx} className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 line-through px-0.5 rounded">
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
        return <span key={idx} className="text-gray-700 dark:text-white/70">{segment.value}</span>;
      }
      if (segment.type === 'added') {
        return (
          <span key={idx} className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-0.5 rounded">
            {segment.value}
          </span>
        );
      }
      return null;
    });
  };
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Before */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-white/40">
            Before
          </span>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/[0.08]">
          {item.original ? (
            <>
              <h4 className="text-sm font-medium text-gray-600 dark:text-white/70 leading-relaxed">
                {item.status === 'modified' ? renderBeforeText(degreeDiff, item.original.degree) : item.original.degree}
              </h4>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1 leading-relaxed">
                {item.status === 'modified' ? renderBeforeText(institutionDiff, item.original.institution) : item.original.institution}
              </p>
              {item.original.field && (
                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 leading-relaxed">
                  {item.status === 'modified' ? renderBeforeText(fieldDiff, item.original.field) : item.original.field}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400 dark:text-white/20 italic">(new entry →)</p>
          )}
        </div>
      </div>

      {/* After */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            After
          </span>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-[#1a1a1a] border border-emerald-200 dark:border-emerald-500/15">
          {item.modified ? (
            <>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                {item.status === 'modified' ? renderAfterText(degreeDiff, item.modified.degree) : item.modified.degree}
              </h4>
              <p className="text-xs text-gray-600 dark:text-white/50 mt-1 leading-relaxed">
                {item.status === 'modified' ? renderAfterText(institutionDiff, item.modified.institution) : item.modified.institution}
              </p>
              {item.modified.field && (
                <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 leading-relaxed">
                  {item.status === 'modified' ? renderAfterText(fieldDiff, item.modified.field) : item.modified.field}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-red-400 dark:text-red-400/50 italic line-through">(← removed)</p>
          )}
        </div>
      </div>
    </div>
  );
}
