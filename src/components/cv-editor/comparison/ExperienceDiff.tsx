/**
 * ExperienceDiff Component
 * Work experience comparison with expandable entries - Premium dark design
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, ChevronDown, Plus, Minus, RefreshCw, 
  Building2, Calendar, MapPin
} from 'lucide-react';
import { 
  ExperiencesComparison, 
  ExperienceComparisonItem, 
  BulletComparison,
  ComparisonViewMode 
} from '../../../types/cvComparison';
import { computeWordLevelDiff } from '../../../lib/cvComparisonEngine';
import WordDiff from './WordDiff';

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
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                 border: '1px solid rgba(168,85,247,0.2)',
               }}>
            <Briefcase className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Work Experience
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              {items.length} position{items.length !== 1 ? 's' : ''} • 
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden"
      style={{ border: styles.border, background: styles.background }}
    >
      {/* Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between gap-4 
                   hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Status indicator */}
          <div className={`w-1 h-10 rounded-full ${styles.indicator}`} />
          
          {StatusIcon && (
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                            ${item.status === 'added' ? 'bg-emerald-500/15 text-emerald-400' : ''}
                            ${item.status === 'removed' ? 'bg-red-500/15 text-red-400' : ''}
                            ${item.status === 'modified' ? 'bg-amber-500/15 text-amber-400' : ''}`}>
              <StatusIcon className="w-3.5 h-3.5" />
            </div>
          )}
          
          <div className="min-w-0 text-left">
            <h4 className="text-sm font-semibold text-white truncate">
              {item.titleDiff && viewMode === 'diff' ? (
                <WordDiff diff={item.titleDiff} showAnimations={false} />
              ) : (
                data?.title
              )}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
              <span className="flex items-center gap-1 truncate">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                {item.companyDiff && viewMode === 'diff' ? (
                  <WordDiff diff={item.companyDiff} showAnimations={false} />
                ) : (
                  data?.company
                )}
              </span>
              {data?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {data.location}
                </span>
              )}
              {data?.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {data.startDate} — {data.endDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {item.changeStats && (item.changeStats.bulletsAdded > 0 || item.changeStats.bulletsModified > 0 || item.changeStats.bulletsRemoved > 0) && (
            <div className="flex items-center gap-2 text-[10px]">
              {item.changeStats.bulletsAdded > 0 && (
                <span className="text-emerald-400">+{item.changeStats.bulletsAdded}</span>
              )}
              {item.changeStats.bulletsModified > 0 && (
                <span className="text-amber-400">~{item.changeStats.bulletsModified}</span>
              )}
              {item.changeStats.bulletsRemoved > 0 && (
                <span className="text-red-400">-{item.changeStats.bulletsRemoved}</span>
              )}
            </div>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-white/5"
          >
            <ChevronDown className="w-4 h-4 text-white/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4">
              {viewMode === 'split' ? (
                <BulletsSplitView 
                  original={item.original?.bullets || []} 
                  modified={item.modified?.bullets || []} 
                />
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
      <p className="text-sm text-white/30 italic">No bullet points</p>
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
          className={`flex items-start gap-3 text-sm font-mono ${
            bullet.status === 'added' ? 'text-emerald-400' :
            bullet.status === 'removed' ? 'text-red-400 line-through opacity-60' :
            bullet.status === 'modified' ? '' :
            'text-white/50'
          }`}
        >
          {/* Status indicator */}
          <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            bullet.status === 'added' ? 'bg-emerald-500' :
            bullet.status === 'removed' ? 'bg-red-500' :
            bullet.status === 'modified' ? 'bg-amber-500' :
            'bg-white/30'
          }`} />
          
          <span className="flex-1 leading-relaxed">
            {bullet.status === 'added' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase 
                             text-emerald-400 bg-emerald-500/15 
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
    let bestScore = 0.3;
    
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
  const diff = useMemo(() => {
    if (!modified) return null;
    return computeWordLevelDiff(original, modified);
  }, [original, modified]);

  if (!modified) {
    return (
      <span className="text-red-400 line-through">
        {original}
      </span>
    );
  }
  
  if (!diff) return <span className="text-white/50">{original}</span>;
  
  return (
    <span>
      {diff.segments.map((segment, idx) => {
        if (segment.type === 'unchanged') {
          return <span key={idx} className="text-white/50">{segment.value}</span>;
        }
        if (segment.type === 'removed') {
          return (
            <span 
              key={idx} 
              className="bg-red-500/15 text-red-400 line-through px-0.5 mx-0.5 rounded"
            >
              {segment.value}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

/**
 * Render text with highlighted added words (for After column)
 */
function AfterTextWithHighlight({ original, modified }: { original: string | null; modified: string }) {
  const diff = useMemo(() => {
    if (!original) return null;
    return computeWordLevelDiff(original, modified);
  }, [original, modified]);

  if (!original) {
    return (
      <span className="bg-emerald-500/15 text-emerald-400 px-1 rounded border-b border-emerald-500/50">
        {modified}
      </span>
    );
  }
  
  if (!diff) return <span className="text-white/70">{modified}</span>;
  
  return (
    <span>
      {diff.segments.map((segment, idx) => {
        if (segment.type === 'unchanged') {
          return <span key={idx} className="text-white/70">{segment.value}</span>;
        }
        if (segment.type === 'added') {
          return (
            <span 
              key={idx} 
              className="bg-emerald-500/15 text-emerald-400 font-medium px-0.5 mx-0.5 rounded
                         border-b border-emerald-500/50"
            >
              {segment.value}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}

function BulletsSplitView({ original, modified }: { original: string[]; modified: string[] }) {
  const matchedBullets = useMemo(() => matchBulletsBySimilarity(original, modified), [original, modified]);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Before Column */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Before
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <ul className="space-y-3">
          {matchedBullets.map((match, i) => (
            <motion.li 
              key={`before-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-2 text-sm font-mono"
            >
              {match.original ? (
                <>
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    match.modified ? 'bg-white/30' : 'bg-red-500'
                  }`} />
                  <span className="flex-1 leading-relaxed">
                    <BeforeTextWithHighlight 
                      original={match.original} 
                      modified={match.modified} 
                    />
                  </span>
                </>
              ) : (
                <span className="text-white/20 italic text-xs pl-4">
                  (new bullet →)
                </span>
              )}
            </motion.li>
          ))}
          {original.length === 0 && (
            <li className="text-sm text-white/30 italic">No bullets in original</li>
          )}
        </ul>
      </div>
      
      {/* After Column */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            After
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
        </div>
        <ul className="space-y-3">
          {matchedBullets.map((match, i) => (
            <motion.li 
              key={`after-${i}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-2 text-sm font-mono"
            >
              {match.modified ? (
                <>
                  <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    match.original ? 'bg-emerald-500' : 'bg-emerald-500'
                  }`} />
                  <span className="flex-1 leading-relaxed">
                    <AfterTextWithHighlight 
                      original={match.original} 
                      modified={match.modified} 
                    />
                  </span>
                </>
              ) : (
                <span className="text-red-400/50 italic text-xs line-through pl-4">
                  (← removed)
                </span>
              )}
            </motion.li>
          ))}
          {modified.length === 0 && (
            <li className="text-sm text-white/30 italic">No bullets</li>
          )}
        </ul>
      </div>
    </div>
  );
}
