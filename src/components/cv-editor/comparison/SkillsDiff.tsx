/**
 * SkillsDiff Component
 * Skills section comparison with badge-style display - Light/dark mode support
 */

import { motion } from 'framer-motion';
import { Code, Plus, Minus } from 'lucide-react';
import { 
  SkillsComparison, 
  SkillComparisonItem,
  ComparisonViewMode 
} from '../../../types/cvComparison';

interface SkillsDiffProps {
  comparison: SkillsComparison;
  viewMode: ComparisonViewMode;
}

export default function SkillsDiff({ comparison, viewMode }: SkillsDiffProps) {
  const { items, changeStats } = comparison;

  // Group skills by status
  const addedSkills = items.filter(s => s.status === 'added');
  const removedSkills = items.filter(s => s.status === 'removed');
  const unchangedSkills = items.filter(s => s.status === 'unchanged');

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
            <Code className="w-4 h-4 text-[#7cb305] dark:text-[#b7e219]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Skills
            </h3>
            <p className="text-xs text-gray-500 dark:text-white/40">
              {items.length} skill{items.length !== 1 ? 's' : ''} • 
              {comparison.hasChanges 
                ? ` ${changeStats.added} new, ${changeStats.removed} removed` 
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
        </div>
      </div>

      {/* Skills Content based on view mode */}
      {viewMode === 'split' ? (
        <SplitView 
          added={addedSkills} 
          removed={removedSkills} 
          unchanged={unchangedSkills} 
        />
      ) : (
        <DiffView 
          added={addedSkills} 
          removed={removedSkills} 
          unchanged={unchangedSkills} 
        />
      )}
    </motion.div>
  );
}

function DiffView({ 
  added, 
  removed, 
  unchanged 
}: { 
  added: SkillComparisonItem[]; 
  removed: SkillComparisonItem[]; 
  unchanged: SkillComparisonItem[];
}) {
  return (
    <div className="space-y-4">
      {/* Added Skills */}
      {added.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              New Skills
            </span>
            <span className="text-[10px] text-gray-400 dark:text-white/30">({added.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {added.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                           text-xs font-medium 
                           text-emerald-700 dark:text-emerald-400
                           bg-emerald-100 dark:bg-emerald-500/10
                           border border-emerald-200 dark:border-emerald-500/20"
              >
                <Plus className="w-2.5 h-2.5" />
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Removed Skills */}
      {removed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Minus className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-red-600 dark:text-red-400">
              Removed Skills
            </span>
            <span className="text-[10px] text-gray-400 dark:text-white/30">({removed.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {removed.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                           text-xs font-medium line-through opacity-70
                           text-red-600 dark:text-red-400
                           bg-red-100 dark:bg-red-500/10
                           border border-red-200 dark:border-red-500/15"
              >
                <Minus className="w-2.5 h-2.5" />
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Unchanged Skills */}
      {unchanged.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-white/30">
            Unchanged ({unchanged.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {unchanged.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2 py-1 rounded-md
                           text-xs font-medium 
                           text-gray-600 dark:text-white/50
                           bg-gray-100 dark:bg-[#1a1a1a]
                           border border-gray-200 dark:border-white/[0.08]"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SplitView({ 
  added, 
  removed, 
  unchanged 
}: { 
  added: SkillComparisonItem[]; 
  removed: SkillComparisonItem[]; 
  unchanged: SkillComparisonItem[];
}) {
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
        <div className="p-4 rounded-lg min-h-[80px]
                        bg-white dark:bg-[#1a1a1a]
                        border border-gray-200 dark:border-white/[0.08]">
          <div className="flex flex-wrap gap-1.5">
            {/* Show removed skills with strikethrough */}
            {removed.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                           text-xs font-medium line-through
                           text-red-600 dark:text-red-400
                           bg-red-100 dark:bg-red-500/10
                           border border-red-200 dark:border-red-500/15"
              >
                <Minus className="w-2.5 h-2.5" />
                {skill.name}
              </span>
            ))}
            {/* Unchanged skills */}
            {unchanged.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2 py-1 rounded-md
                           text-xs font-medium 
                           text-gray-500 dark:text-white/50
                           bg-gray-50 dark:bg-white/[0.03]
                           border border-gray-200 dark:border-white/[0.08]"
              >
                {skill.name}
              </span>
            ))}
            {removed.length === 0 && unchanged.length === 0 && (
              <span className="text-xs text-gray-400 dark:text-white/20 italic">No skills in original</span>
            )}
          </div>
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
        <div className="p-4 rounded-lg min-h-[80px]
                        bg-white dark:bg-[#1a1a1a]
                        border border-emerald-200 dark:border-emerald-500/15">
          <div className="flex flex-wrap gap-1.5">
            {/* Show added skills with highlight */}
            {added.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md
                           text-xs font-medium 
                           text-emerald-700 dark:text-emerald-400
                           bg-emerald-100 dark:bg-emerald-500/10
                           border border-emerald-200 dark:border-emerald-500/20"
              >
                <Plus className="w-2.5 h-2.5" />
                {skill.name}
              </span>
            ))}
            {/* Unchanged skills */}
            {unchanged.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2 py-1 rounded-md
                           text-xs font-medium 
                           text-gray-600 dark:text-white/60
                           bg-gray-50 dark:bg-white/[0.03]
                           border border-gray-200 dark:border-white/[0.08]"
              >
                {skill.name}
              </span>
            ))}
            {added.length === 0 && unchanged.length === 0 && (
              <span className="text-xs text-gray-400 dark:text-white/20 italic">No skills</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
