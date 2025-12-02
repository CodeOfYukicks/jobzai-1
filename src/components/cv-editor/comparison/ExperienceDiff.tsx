/**
 * ExperienceDiff Component
 * Work experience comparison with expandable entries
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, ChevronDown, Plus, Minus, Edit3, 
  Building2, Calendar 
} from 'lucide-react';
import { 
  ExperiencesComparison, 
  ExperienceComparisonItem, 
  BulletComparison,
  ComparisonViewMode 
} from '../../../types/cvComparison';
import { computeWordLevelDiff } from '../../../lib/cvComparisonEngine';
import WordDiff from './WordDiff';
import DiffStats from './DiffStats';

interface ExperienceDiffProps {
  comparison: ExperiencesComparison;
  viewMode: ComparisonViewMode;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

export default function ExperienceDiff({ 
  comparison, 
  viewMode,
  expandedIds,
  onToggleExpand 
}: ExperienceDiffProps) {
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
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 
                          flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Work Experience
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} position{items.length !== 1 ? 's' : ''} • 
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

      {/* Experience Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <ExperienceItemDiff
            key={item.id}
            item={item}
            index={index}
            viewMode={viewMode}
            isExpanded={expandedIds.has(item.id)}
            onToggle={() => onToggleExpand(item.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface ExperienceItemDiffProps {
  item: ExperienceComparisonItem;
  index: number;
  viewMode: ComparisonViewMode;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExperienceItemDiff({ 
  item, 
  index, 
  viewMode,
  isExpanded, 
  onToggle 
}: ExperienceItemDiffProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border border-gray-200 dark:border-gray-700/50 
                  border-l-4 overflow-hidden ${statusColors[item.status]}`}
    >
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-4 
                   hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {StatusIcon && (
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                            ${item.status === 'added' ? 'bg-[#635BFF]/10 dark:bg-[#5249e6]/40 text-[#5249e6] dark:text-[#a5a0ff]' : ''}
                            ${item.status === 'removed' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : ''}
                            ${item.status === 'modified' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : ''}`}>
              <StatusIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="min-w-0 text-left">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {item.titleDiff && viewMode === 'diff' ? (
                <WordDiff diff={item.titleDiff} showAnimations={false} />
              ) : (
                data?.title
              )}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Building2 className="w-3 h-3" />
              <span className="truncate">
                {item.companyDiff && viewMode === 'diff' ? (
                  <WordDiff diff={item.companyDiff} showAnimations={false} />
                ) : (
                  data?.company
                )}
              </span>
              {data?.startDate && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{data.startDate} - {data.endDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {item.changeStats && (item.changeStats.bulletsAdded > 0 || item.changeStats.bulletsModified > 0 || item.changeStats.bulletsRemoved > 0) && (
            <DiffStats
              added={item.changeStats.bulletsAdded}
              removed={item.changeStats.bulletsRemoved}
              modified={item.changeStats.bulletsModified}
              size="sm"
            />
          )}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 
                       ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700/50"
          >
            <div className="px-4 py-4">
              {viewMode === 'split' ? (
                <BulletsSplitView 
                  original={item.original?.bullets || []} 
                  modified={item.modified?.bullets || []} 
                />
              ) : viewMode === 'before' ? (
                <BulletsBeforeView bullets={item.original?.bullets || []} />
              ) : viewMode === 'after' ? (
                <BulletsAfterView bullets={item.modified?.bullets || []} />
              ) : (
                <BulletsDiffView bulletComparisons={item.bulletComparisons} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BulletsDiffView({ bulletComparisons }: { bulletComparisons: BulletComparison[] }) {
  if (!bulletComparisons || bulletComparisons.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No bullet points</p>
    );
  }

  return (
    <ul className="space-y-2">
      {bulletComparisons.map((bullet, index) => (
        <motion.li
          key={bullet.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          className={`flex items-start gap-2 text-sm ${
            bullet.status === 'added' ? 'text-[#635BFF] dark:text-[#a5a0ff]' :
            bullet.status === 'removed' ? 'text-red-600 dark:text-red-400 line-through opacity-60' :
            bullet.status === 'modified' ? '' :
            'text-gray-600 dark:text-gray-400'
          }`}
        >
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            bullet.status === 'added' ? 'bg-[#635BFF]' :
            bullet.status === 'removed' ? 'bg-red-500' :
            bullet.status === 'modified' ? 'bg-amber-500' :
            'bg-gray-400'
          }`} />
          <span className="flex-1">
            {bullet.status === 'added' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase 
                             text-[#5249e6] dark:text-[#a5a0ff] bg-[#635BFF]/10 dark:bg-[#5249e6]/30 
                             px-1.5 py-0.5 rounded mr-2">
                New
              </span>
            )}
            {bullet.status === 'modified' && bullet.diff ? (
              <WordDiff diff={bullet.diff} />
            ) : (
              bullet.modified || bullet.original
            )}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * Match bullets between original and modified by similarity
 */
function matchBulletsBySimilarity(original: string[], modified: string[]): Array<{
  originalIdx: number | null;
  modifiedIdx: number | null;
  original: string | null;
  modified: string | null;
}> {
  const matches: Array<{
    originalIdx: number | null;
    modifiedIdx: number | null;
    original: string | null;
    modified: string | null;
  }> = [];
  
  const usedOriginal = new Set<number>();
  const usedModified = new Set<number>();
  
  // Simple word overlap similarity
  const getSimilarity = (a: string, b: string): number => {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    let overlap = 0;
    wordsA.forEach(w => { if (wordsB.has(w)) overlap++; });
    return overlap / Math.max(wordsA.size, wordsB.size);
  };
  
  // Match by best similarity (threshold 0.3)
  for (let i = 0; i < original.length; i++) {
    let bestMatch = -1;
    let bestScore = 0.3; // Minimum threshold
    
    for (let j = 0; j < modified.length; j++) {
      if (usedModified.has(j)) continue;
      const score = getSimilarity(original[i], modified[j]);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = j;
      }
    }
    
    if (bestMatch >= 0) {
      matches.push({
        originalIdx: i,
        modifiedIdx: bestMatch,
        original: original[i],
        modified: modified[bestMatch],
      });
      usedOriginal.add(i);
      usedModified.add(bestMatch);
    }
  }
  
  // Add unmatched original (removed)
  for (let i = 0; i < original.length; i++) {
    if (!usedOriginal.has(i)) {
      matches.push({
        originalIdx: i,
        modifiedIdx: null,
        original: original[i],
        modified: null,
      });
    }
  }
  
  // Add unmatched modified (added)
  for (let j = 0; j < modified.length; j++) {
    if (!usedModified.has(j)) {
      matches.push({
        originalIdx: null,
        modifiedIdx: j,
        original: null,
        modified: modified[j],
      });
    }
  }
  
  // Sort: matched first, then removed, then added
  matches.sort((a, b) => {
    if (a.originalIdx !== null && a.modifiedIdx !== null) return -1;
    if (b.originalIdx !== null && b.modifiedIdx !== null) return 1;
    if (a.originalIdx !== null) return -1;
    if (b.originalIdx !== null) return 1;
    return 0;
  });
  
  return matches;
}

/**
 * Render text with highlighted removed words (for Before column)
 */
function BeforeTextWithHighlight({ original, modified }: { original: string; modified: string | null }) {
  if (!modified) {
    // Fully removed - show entire text as removed
    return (
      <span className="bg-red-100/80 dark:bg-red-900/40 text-red-700 dark:text-red-300 
                       line-through decoration-red-500/70 px-1 rounded">
        {original}
      </span>
    );
  }
  
  const diff = computeWordLevelDiff(original, modified);
  
  return (
    <span>
      {diff.segments.map((segment, idx) => {
        if (segment.type === 'unchanged') {
          return <span key={idx} className="text-gray-600 dark:text-gray-400">{segment.value}</span>;
        }
        if (segment.type === 'removed') {
          return (
            <span 
              key={idx} 
              className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 
                         line-through decoration-red-500/70 px-0.5 rounded-sm mx-0.5"
            >
              {segment.value}
            </span>
          );
        }
        // Skip 'added' segments in Before column
        return null;
      })}
    </span>
  );
}

/**
 * Render text with highlighted added words (for After column)
 */
function AfterTextWithHighlight({ original, modified }: { original: string | null; modified: string }) {
  if (!original) {
    // Fully added - show entire text as added
    return (
      <span className="bg-[#635BFF]/10 dark:bg-[#5249e6]/40 text-[#635BFF] dark:text-[#a5a0ff] 
                       font-medium px-1 rounded border-b-2 border-[#7c75ff] dark:border-[#a5a0ff]">
        {modified}
      </span>
    );
  }
  
  const diff = computeWordLevelDiff(original, modified);
  
  return (
    <span>
      {diff.segments.map((segment, idx) => {
        if (segment.type === 'unchanged') {
          return <span key={idx} className="text-gray-700 dark:text-gray-300">{segment.value}</span>;
        }
        if (segment.type === 'added') {
          return (
            <span 
              key={idx} 
              className="bg-[#635BFF]/10 dark:bg-[#5249e6]/50 text-[#635BFF] dark:text-[#a5a0ff] 
                         font-medium px-0.5 rounded-sm mx-0.5 border-b border-[#7c75ff] dark:border-[#a5a0ff]"
            >
              {segment.value}
            </span>
          );
        }
        // Skip 'removed' segments in After column
        return null;
      })}
    </span>
  );
}

function BulletsSplitView({ original, modified }: { original: string[]; modified: string[] }) {
  const matchedBullets = matchBulletsBySimilarity(original, modified);
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Before Column */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Before
          </span>
          <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <ul className="space-y-3">
          {matchedBullets.map((match, i) => (
            <motion.li 
              key={`before-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-2 text-sm"
            >
              {match.original ? (
                <>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    match.modified ? 'bg-gray-400' : 'bg-red-500'
                  }`} />
                  <span className="flex-1 leading-relaxed">
                    <BeforeTextWithHighlight 
                      original={match.original} 
                      modified={match.modified} 
                    />
                  </span>
                </>
              ) : (
                <span className="text-gray-300 dark:text-gray-600 italic text-xs">
                  (new bullet added →)
                </span>
              )}
            </motion.li>
          ))}
          {original.length === 0 && (
            <li className="text-sm text-gray-400 italic">No bullets in original</li>
          )}
        </ul>
      </div>
      
      {/* After Column */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5249e6] dark:text-[#a5a0ff]">
            After
          </span>
          <span className="flex-1 h-px bg-[#635BFF]/20 dark:bg-[#5249e6]/50" />
        </div>
        <ul className="space-y-3">
          {matchedBullets.map((match, i) => (
            <motion.li 
              key={`after-${i}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-2 text-sm"
            >
              {match.modified ? (
                <>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    match.original ? 'bg-[#635BFF]' : 'bg-[#635BFF]'
                  }`} />
                  <span className="flex-1 leading-relaxed">
                    <AfterTextWithHighlight 
                      original={match.original} 
                      modified={match.modified} 
                    />
                  </span>
                </>
              ) : (
                <span className="text-red-300 dark:text-red-600 italic text-xs line-through">
                  (← removed)
                </span>
              )}
            </motion.li>
          ))}
          {modified.length === 0 && (
            <li className="text-sm text-gray-400 italic">No bullets</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function BulletsBeforeView({ bullets }: { bullets: string[] }) {
  return (
    <ul className="space-y-1.5">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          {bullet}
        </li>
      ))}
      {bullets.length === 0 && (
        <li className="text-sm text-gray-400 italic">No bullet points in original</li>
      )}
    </ul>
  );
}

function BulletsAfterView({ bullets }: { bullets: string[] }) {
  return (
    <ul className="space-y-1.5">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#635BFF] flex-shrink-0" />
          {bullet}
        </li>
      ))}
      {bullets.length === 0 && (
        <li className="text-sm text-gray-400 italic">No bullet points</li>
      )}
    </ul>
  );
}

