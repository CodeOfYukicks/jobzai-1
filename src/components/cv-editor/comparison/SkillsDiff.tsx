/**
 * SkillsDiff Component
 * Skills section comparison with badge-style display
 */

import { motion } from 'framer-motion';
import { Code, Plus, Minus } from 'lucide-react';
import { 
  SkillsComparison, 
  SkillComparisonItem,
  ComparisonViewMode 
} from '../../../types/cvComparison';
import DiffStats from './DiffStats';

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 
                          flex items-center justify-center">
            <Code className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Skills
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} skill{items.length !== 1 ? 's' : ''} • 
              {comparison.hasChanges 
                ? ` ${changeStats.added} new, ${changeStats.removed} removed` 
                : ' No changes'}
            </p>
          </div>
        </div>
        <DiffStats
          added={changeStats.added}
          removed={changeStats.removed}
          modified={0}
          size="sm"
        />
      </div>

      {/* Skills Content based on view mode */}
      {viewMode === 'split' ? (
        <SplitView 
          added={addedSkills} 
          removed={removedSkills} 
          unchanged={unchangedSkills} 
        />
      ) : viewMode === 'before' ? (
        <BeforeView removed={removedSkills} unchanged={unchangedSkills} />
      ) : viewMode === 'after' ? (
        <AfterView added={addedSkills} unchanged={unchangedSkills} />
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
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              New Skills ({added.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {added.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-emerald-100 dark:bg-emerald-900/30 
                           text-emerald-700 dark:text-emerald-300
                           text-sm font-medium
                           border border-emerald-200 dark:border-emerald-800/50"
              >
                <Plus className="w-3 h-3" />
                {skill.name}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Removed Skills */}
      {removed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Minus className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Removed Skills ({removed.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {removed.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-red-100 dark:bg-red-900/30 
                           text-red-600 dark:text-red-400
                           text-sm font-medium line-through
                           border border-red-200 dark:border-red-800/50"
              >
                <Minus className="w-3 h-3" />
                {skill.name}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Unchanged Skills */}
      {unchanged.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Unchanged ({unchanged.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {unchanged.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="inline-flex items-center px-3 py-1.5 rounded-full
                           bg-gray-100 dark:bg-gray-800
                           text-gray-700 dark:text-gray-300
                           text-sm font-medium
                           border border-gray-200 dark:border-gray-700"
              >
                {skill.name}
              </motion.span>
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
    <div className="grid grid-cols-2 gap-6">
      {/* Before */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Before
          </span>
          <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="p-4 bg-gray-50/80 dark:bg-gray-800/30 rounded-xl border border-gray-200/80 dark:border-gray-700/50">
          <div className="flex flex-wrap gap-2">
            {/* Show removed skills with strikethrough highlighting */}
            {removed.map((skill) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                           bg-red-100 dark:bg-red-900/40
                           text-red-700 dark:text-red-400
                           text-xs font-medium line-through
                           border border-red-200 dark:border-red-800/50"
              >
                <Minus className="w-2.5 h-2.5" />
                {skill.name}
              </motion.span>
            ))}
            {/* Unchanged skills shown normally */}
            {unchanged.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2.5 py-1 rounded-full
                           bg-gray-100 dark:bg-gray-700
                           text-gray-700 dark:text-gray-300
                           text-xs font-medium"
              >
                {skill.name}
              </span>
            ))}
            {removed.length === 0 && unchanged.length === 0 && (
              <span className="text-sm text-gray-400 italic">No skills in original</span>
            )}
          </div>
        </div>
      </div>

      {/* After */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            After
          </span>
          <span className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800" />
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50">
          <div className="flex flex-wrap gap-2">
            {/* Show added skills with highlight */}
            {added.map((skill) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                           bg-emerald-100 dark:bg-emerald-900/40
                           text-emerald-700 dark:text-emerald-300
                           text-xs font-semibold
                           border border-emerald-300 dark:border-emerald-700
                           shadow-sm shadow-emerald-200 dark:shadow-emerald-900/50"
              >
                <Plus className="w-2.5 h-2.5" />
                {skill.name}
              </motion.span>
            ))}
            {/* Unchanged skills shown normally */}
            {unchanged.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2.5 py-1 rounded-full
                           bg-gray-100 dark:bg-gray-700
                           text-gray-700 dark:text-gray-300
                           text-xs font-medium"
              >
                {skill.name}
              </span>
            ))}
            {added.length === 0 && unchanged.length === 0 && (
              <span className="text-sm text-gray-400 italic">No skills</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BeforeView({ 
  removed, 
  unchanged 
}: { 
  removed: SkillComparisonItem[]; 
  unchanged: SkillComparisonItem[];
}) {
  const allSkills = [...removed, ...unchanged];
  
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700/50">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 block">
        Original Skills
      </span>
      <div className="flex flex-wrap gap-2">
        {allSkills.map((skill) => (
          <span
            key={skill.name}
            className="inline-flex items-center px-3 py-1.5 rounded-full
                       bg-gray-100 dark:bg-gray-700
                       text-gray-700 dark:text-gray-300
                       text-sm font-medium
                       border border-gray-200 dark:border-gray-600"
          >
            {skill.name}
          </span>
        ))}
        {allSkills.length === 0 && (
          <span className="text-sm text-gray-400 italic">No skills in original</span>
        )}
      </div>
    </div>
  );
}

function AfterView({ 
  added, 
  unchanged 
}: { 
  added: SkillComparisonItem[]; 
  unchanged: SkillComparisonItem[];
}) {
  const allSkills = [...added, ...unchanged];
  
  return (
    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 block">
        AI-Optimized Skills
      </span>
      <div className="flex flex-wrap gap-2">
        {allSkills.map((skill) => (
          <span
            key={skill.name}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border
                       ${skill.status === 'added' 
                         ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' 
                         : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
          >
            {skill.name}
          </span>
        ))}
        {allSkills.length === 0 && (
          <span className="text-sm text-gray-400 italic">No skills</span>
        )}
      </div>
    </div>
  );
}

