/**
 * EducationDiff Component
 * Education section comparison view
 */

import { motion } from 'framer-motion';
import { GraduationCap, Plus, Minus, Edit3, Building2, Calendar } from 'lucide-react';
import { 
  EducationComparison, 
  EducationComparisonItem,
  ComparisonViewMode 
} from '../../../types/cvComparison';
import { computeWordLevelDiff } from '../../../lib/cvComparisonEngine';
import WordDiff from './WordDiff';
import DiffStats from './DiffStats';

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
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 
                          flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Education
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} entr{items.length !== 1 ? 'ies' : 'y'} • 
              {comparison.hasChanges 
                ? ` ${changeStats.modified} modified` 
                : ' No changes'}
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
  
  const statusColors = {
    added: 'border-l-[#635BFF] bg-[#635BFF]/5 dark:bg-[#5249e6]/10',
    removed: 'border-l-red-500 bg-red-50/30 dark:bg-red-900/10',
    modified: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10',
    unchanged: 'border-l-gray-300 dark:border-l-gray-600 bg-gray-50/50 dark:bg-gray-800/30',
  };

  const StatusIcon = {
    added: Plus,
    removed: Minus,
    modified: Edit3,
    unchanged: null,
  }[item.status];

  if (viewMode === 'split') {
    // Compute word diffs for each field
    const degreeDiff = item.original && item.modified 
      ? computeWordLevelDiff(item.original.degree || '', item.modified.degree || '')
      : null;
    const institutionDiff = item.original && item.modified
      ? computeWordLevelDiff(item.original.institution || '', item.modified.institution || '')
      : null;
    const fieldDiff = item.original && item.modified
      ? computeWordLevelDiff(item.original.field || '', item.modified.field || '')
      : null;
    
    // Helper to render text with removed highlights
    const renderBeforeText = (diff: ReturnType<typeof computeWordLevelDiff> | null, original: string | undefined) => {
      if (!diff || !original) return original || null;
      return diff.segments.map((segment, idx) => {
        if (segment.type === 'unchanged') {
          return <span key={idx}>{segment.value}</span>;
        }
        if (segment.type === 'removed') {
          return (
            <span key={idx} className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 
                                       line-through decoration-red-500/70 px-0.5 rounded-sm">
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
          return <span key={idx}>{segment.value}</span>;
        }
        if (segment.type === 'added') {
          return (
            <span key={idx} className="bg-[#635BFF]/10 dark:bg-[#5249e6]/50 text-[#635BFF] dark:text-[#a5a0ff] 
                                       font-medium px-0.5 rounded-sm border-b border-[#7c75ff] dark:border-[#a5a0ff]">
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
        className="grid grid-cols-2 gap-6"
      >
        {/* Before */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Before
            </span>
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="p-4 bg-gray-50/80 dark:bg-gray-800/30 rounded-xl border border-gray-200/80 dark:border-gray-700/50">
            {item.original ? (
              <>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {item.status === 'modified' ? renderBeforeText(degreeDiff, item.original.degree) : item.original.degree}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  {item.status === 'modified' ? renderBeforeText(institutionDiff, item.original.institution) : item.original.institution}
                </p>
                {item.original.field && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {item.status === 'modified' ? renderBeforeText(fieldDiff, item.original.field) : item.original.field}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-300 dark:text-gray-600 italic">(new entry added →)</p>
            )}
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5249e6] dark:text-[#a5a0ff]">
              After
            </span>
            <span className="flex-1 h-px bg-[#635BFF]/20 dark:bg-[#5249e6]/50" />
          </div>
          <div className="p-4 bg-[#635BFF]/5 dark:bg-[#5249e6]/10 rounded-xl border border-[#635BFF]/20 dark:border-[#5249e6]/50">
            {item.modified ? (
              <>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {item.status === 'modified' ? renderAfterText(degreeDiff, item.modified.degree) : item.modified.degree}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  {item.status === 'modified' ? renderAfterText(institutionDiff, item.modified.institution) : item.modified.institution}
                </p>
                {item.modified.field && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {item.status === 'modified' ? renderAfterText(fieldDiff, item.modified.field) : item.modified.field}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-red-300 dark:text-red-600 italic line-through">(← removed)</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700/50 
                  border-l-4 ${statusColors[item.status]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {StatusIcon && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                            ${item.status === 'added' ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/40 text-[#5249e6] dark:text-[#a5a0ff]' : ''}
                            ${item.status === 'removed' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : ''}
                            ${item.status === 'modified' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : ''}`}>
              <StatusIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {viewMode === 'diff' && item.degreeDiff ? (
                <WordDiff diff={item.degreeDiff} showAnimations={false} />
              ) : (
                data?.degree
              )}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
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
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="truncate">
                  {viewMode === 'diff' && item.fieldDiff ? (
                    <WordDiff diff={item.fieldDiff} showAnimations={false} />
                  ) : (
                    data.field
                  )}
                </span>
              </div>
            )}
            {(data?.startDate || data?.endDate) && (
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
                <Calendar className="w-3 h-3" />
                <span>{data.startDate || ''} {data.startDate && data.endDate ? '-' : ''} {data.endDate || ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

