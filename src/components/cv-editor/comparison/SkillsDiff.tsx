/**
 * SkillsDiff Component
 * Skills section comparison with badge-style display - Premium dark design
 */

import { motion } from 'framer-motion';
import { Code, Plus, Minus, RefreshCw } from 'lucide-react';
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
                 background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)',
                 border: '1px solid rgba(16,185,129,0.2)',
               }}>
            <Code className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Skills
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
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
    <div className="space-y-5">
      {/* Added Skills */}
      {added.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center"
                 style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Plus className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              New Skills
            </span>
            <span className="text-xs text-white/30">({added.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {added.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-sm font-medium text-emerald-400"
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                }}
              >
                <Plus className="w-3 h-3" />
                {skill.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Removed Skills */}
      {removed.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center"
                 style={{ background: 'rgba(248,113,113,0.15)' }}>
              <Minus className="w-3 h-3 text-red-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
              Removed Skills
            </span>
            <span className="text-xs text-white/30">({removed.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {removed.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.7 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-sm font-medium text-red-400 line-through"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)',
                }}
              >
                <Minus className="w-3 h-3" />
                {skill.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Unchanged Skills */}
      {unchanged.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
            Unchanged ({unchanged.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {unchanged.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="inline-flex items-center px-3 py-1.5 rounded-lg
                           text-sm font-medium text-white/50"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {skill.name}
              </motion.span>
            ))}
          </div>
        </motion.div>
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
    <div className="grid grid-cols-2 gap-4">
      {/* Before */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/20" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Before
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <div className="p-4 rounded-xl min-h-[100px]"
             style={{
               background: 'rgba(255,255,255,0.02)',
               border: '1px solid rgba(255,255,255,0.06)',
             }}>
          <div className="flex flex-wrap gap-2">
            {/* Show removed skills with strikethrough */}
            {removed.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md
                           text-xs font-medium text-red-400 line-through"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <Minus className="w-2.5 h-2.5" />
                {skill.name}
              </motion.span>
            ))}
            {/* Unchanged skills */}
            {unchanged.map((skill, i) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2.5 py-1 rounded-md
                           text-xs font-medium text-white/50"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {skill.name}
              </span>
            ))}
            {removed.length === 0 && unchanged.length === 0 && (
              <span className="text-sm text-white/20 italic">No skills in original</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* After */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            After
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
        </div>
        <div className="p-4 rounded-xl min-h-[100px]"
             style={{
               background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.02) 100%)',
               border: '1px solid rgba(16,185,129,0.15)',
             }}>
          <div className="flex flex-wrap gap-2">
            {/* Show added skills with highlight */}
            {added.map((skill, i) => (
              <motion.span
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md
                           text-xs font-semibold text-emerald-400"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 2px 6px rgba(16,185,129,0.15)',
                }}
              >
                <Plus className="w-2.5 h-2.5" />
                {skill.name}
              </motion.span>
            ))}
            {/* Unchanged skills */}
            {unchanged.map((skill, i) => (
              <span
                key={skill.name}
                className="inline-flex items-center px-2.5 py-1 rounded-md
                           text-xs font-medium text-white/60"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {skill.name}
              </span>
            ))}
            {added.length === 0 && unchanged.length === 0 && (
              <span className="text-sm text-white/20 italic">No skills</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
