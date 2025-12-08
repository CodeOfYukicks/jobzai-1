/**
 * BeforeAfterModal Component
 * Premium modal overlay for CV comparison with word-level diffs
 * Design: "Glassmorphism meets Code Editor"
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  X, GitCompare, Columns, Sparkles,
  FileText, Briefcase, GraduationCap, Code,
  Plus, Minus, RefreshCw
} from 'lucide-react';
import {
  CVComparisonResult,
  ComparisonSectionType,
  ComparisonViewMode,
  ComparisonModalState,
} from '../../types/cvComparison';
import { SummaryDiff, ExperienceDiff, EducationDiff, SkillsDiff } from './comparison';

interface BeforeAfterModalProps {
  isOpen: boolean;
  comparison: CVComparisonResult | null;
  modalState: ComparisonModalState;
  onClose: () => void;
  onSelectSection: (section: ComparisonSectionType) => void;
  onSetViewMode: (mode: ComparisonViewMode) => void;
  onToggleExperienceExpanded: (id: string) => void;
  onToggleEducationExpanded: (id: string) => void;
  onRevertSection?: (section: ComparisonSectionType) => void;
  onRevertAll?: () => void;
}

const sectionConfig: Record<ComparisonSectionType, { 
  icon: typeof FileText; 
  label: string; 
  gradient: string;
}> = {
  summary: { 
    icon: FileText, 
    label: 'Summary', 
    gradient: 'from-blue-500 to-cyan-500'
  },
  experiences: { 
    icon: Briefcase, 
    label: 'Experience', 
    gradient: 'from-purple-500 to-pink-500'
  },
  education: { 
    icon: GraduationCap, 
    label: 'Education', 
    gradient: 'from-indigo-500 to-purple-500'
  },
  skills: { 
    icon: Code, 
    label: 'Skills', 
    gradient: 'from-emerald-500 to-teal-500'
  },
  certifications: { 
    icon: FileText, 
    label: 'Certifications', 
    gradient: 'from-amber-500 to-orange-500'
  },
  languages: { 
    icon: FileText, 
    label: 'Languages', 
    gradient: 'from-rose-500 to-pink-500'
  },
  projects: { 
    icon: FileText, 
    label: 'Projects', 
    gradient: 'from-violet-500 to-purple-500'
  },
};

// Animated counter component
function AnimatedCounter({ value, className = '' }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 800;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span className={className}>{displayValue}</span>;
}

export default function BeforeAfterModal({
  isOpen,
  comparison,
  modalState,
  onClose,
  onSelectSection,
  onSetViewMode,
  onToggleExperienceExpanded,
  onToggleEducationExpanded,
  onRevertSection,
  onRevertAll,
}: BeforeAfterModalProps) {
  const { selectedSection, viewMode, expandedExperienceIds, expandedEducationIds } = modalState;

  // Get available sections with changes
  const availableSections = useMemo(() => {
    if (!comparison) return [];
    
    const sections: { type: ComparisonSectionType; hasChanges: boolean; changeCount: number }[] = [];
    
    if (comparison.summary) {
      const stats = comparison.summary.changeStats;
      sections.push({ 
        type: 'summary', 
        hasChanges: comparison.summary.hasChanges,
        changeCount: stats.added + stats.removed + stats.modified
      });
    }
    if (comparison.experiences) {
      const stats = comparison.experiences.changeStats;
      sections.push({ 
        type: 'experiences', 
        hasChanges: comparison.experiences.hasChanges,
        changeCount: stats.added + stats.removed + stats.modified
      });
    }
    if (comparison.education) {
      const stats = comparison.education.changeStats;
      sections.push({ 
        type: 'education', 
        hasChanges: comparison.education.hasChanges,
        changeCount: stats.added + stats.removed + stats.modified
      });
    }
    if (comparison.skills) {
      const stats = comparison.skills.changeStats;
      sections.push({ 
        type: 'skills', 
        hasChanges: comparison.skills.hasChanges,
        changeCount: stats.added + stats.removed + stats.modified
      });
    }
    
    return sections;
  }, [comparison]);

  // Auto-select first section with changes if none selected
  const effectiveSection = selectedSection || 
    availableSections.find(s => s.hasChanges)?.type || 
    availableSections[0]?.type ||
    'summary';

  const renderSectionContent = useCallback(() => {
    if (!comparison) return null;

    switch (effectiveSection) {
      case 'summary':
        return comparison.summary ? (
          <SummaryDiff comparison={comparison.summary} viewMode={viewMode} />
        ) : null;
      
      case 'experiences':
        return comparison.experiences ? (
          <ExperienceDiff 
            comparison={comparison.experiences} 
            viewMode={viewMode}
            expandedIds={expandedExperienceIds}
            onToggleExpand={onToggleExperienceExpanded}
          />
        ) : null;
      
      case 'education':
        return comparison.education ? (
          <EducationDiff comparison={comparison.education} viewMode={viewMode} />
        ) : null;
      
      case 'skills':
        return comparison.skills ? (
          <SkillsDiff comparison={comparison.skills} viewMode={viewMode} />
        ) : null;
      
      default:
        return null;
    }
  }, [comparison, effectiveSection, viewMode, expandedExperienceIds, onToggleExperienceExpanded]);

  // Calculate total changes for the summary
  const totalChanges = useMemo(() => {
    if (!comparison) return { added: 0, removed: 0, modified: 0 };
    return {
      added: comparison.totalStats.totalAdded,
      removed: comparison.totalStats.totalRemoved,
      modified: comparison.totalStats.totalModified,
    };
  }, [comparison]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with noise texture */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: 'linear-gradient(135deg, rgba(10,10,11,0.97) 0%, rgba(20,20,25,0.98) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 400,
              duration: 0.4 
            }}
            className="fixed inset-3 sm:inset-4 md:inset-6 lg:inset-8 z-50
                       flex flex-col overflow-hidden rounded-2xl
                       border border-white/10"
            style={{
              background: 'linear-gradient(180deg, rgba(25,25,30,0.95) 0%, rgba(15,15,18,0.98) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%)',
                      border: '1px solid rgba(251,191,36,0.3)',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      CV Changes Review
                    </h2>
                    <p className="text-xs text-white/40 mt-0.5">
                      Compare your original with AI-optimized version
                    </p>
                  </div>
                </div>

                {/* Center: View Mode Toggle */}
                <div className="absolute left-1/2 -translate-x-1/2">
                  <LayoutGroup>
                    <div className="relative flex items-center p-1 rounded-xl"
                         style={{
                           background: 'rgba(255,255,255,0.05)',
                           border: '1px solid rgba(255,255,255,0.08)',
                         }}>
                      <button
                        onClick={() => onSetViewMode('diff')}
                        className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                                    transition-colors duration-200"
                      >
                        {viewMode === 'diff' && (
                          <motion.div
                            layoutId="viewModeIndicator"
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.1) 100%)',
                              border: '1px solid rgba(251,191,36,0.3)',
                            }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          />
                        )}
                        <GitCompare className={`relative z-10 w-4 h-4 ${viewMode === 'diff' ? 'text-amber-400' : 'text-white/50'}`} />
                        <span className={`relative z-10 ${viewMode === 'diff' ? 'text-amber-400' : 'text-white/50 hover:text-white/70'}`}>Unified</span>
                      </button>
                      
                      <button
                        onClick={() => onSetViewMode('split')}
                        className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                                    transition-colors duration-200"
                      >
                        {viewMode === 'split' && (
                          <motion.div
                            layoutId="viewModeIndicator"
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.1) 100%)',
                              border: '1px solid rgba(251,191,36,0.3)',
                            }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          />
                        )}
                        <Columns className={`relative z-10 w-4 h-4 ${viewMode === 'split' ? 'text-amber-400' : 'text-white/50'}`} />
                        <span className={`relative z-10 ${viewMode === 'split' ? 'text-amber-400' : 'text-white/50 hover:text-white/70'}`}>Side by Side</span>
                      </button>
                    </div>
                  </LayoutGroup>
                </div>

                {/* Right: Close Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg flex items-center justify-center
                             text-white/40 hover:text-white/70 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Section Pills */}
              <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-hide">
                {availableSections.map(({ type, hasChanges, changeCount }, index) => {
                  const config = sectionConfig[type];
                  const Icon = config.icon;
                  const isActive = effectiveSection === type;

                  return (
                    <motion.button
                      key={type}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      onClick={() => onSelectSection(type)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
                                  transition-all duration-300 whitespace-nowrap ${
                        isActive
                          ? 'text-white'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                      style={{
                        background: isActive 
                          ? 'rgba(255,255,255,0.08)' 
                          : 'transparent',
                        border: isActive 
                          ? '1px solid rgba(255,255,255,0.12)' 
                          : '1px solid transparent',
                        boxShadow: isActive 
                          ? '0 0 20px rgba(251,191,36,0.1)' 
                          : 'none',
                      }}
                    >
                      {/* Active indicator dot */}
                      {isActive && (
                        <motion.span
                          layoutId="activeSectionDot"
                          className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
                          style={{
                            background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                          }}
                        />
                      )}
                      
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
                      <span>{config.label}</span>
                      
                      {/* Change count badge */}
                      {hasChanges && changeCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md"
                          style={{
                            background: isActive 
                              ? 'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(245,158,11,0.2) 100%)'
                              : 'rgba(255,255,255,0.1)',
                            color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {changeCount}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={effectiveSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {renderSectionContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer - Stats Summary */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                {/* Stats */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-6"
                >
                  {/* Added */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                         style={{ background: 'rgba(16,185,129,0.15)' }}>
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm">
                      <AnimatedCounter value={totalChanges.added} className="font-semibold text-emerald-400" />
                      <span className="text-white/40 ml-1.5">additions</span>
                    </span>
                  </div>

                  {/* Removed */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                         style={{ background: 'rgba(248,113,113,0.15)' }}>
                      <Minus className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-sm">
                      <AnimatedCounter value={totalChanges.removed} className="font-semibold text-red-400" />
                      <span className="text-white/40 ml-1.5">removals</span>
                    </span>
                  </div>

                  {/* Modified */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center"
                         style={{ background: 'rgba(251,191,36,0.15)' }}>
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-sm">
                      <AnimatedCounter value={totalChanges.modified} className="font-semibold text-amber-400" />
                      <span className="text-white/40 ml-1.5">modifications</span>
                    </span>
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {onRevertAll && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onRevertAll}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg
                                 text-sm font-medium text-red-400 transition-colors"
                      style={{
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.2)',
                      }}
                    >
                      Revert All
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg
                               text-sm font-semibold text-black transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      boxShadow: '0 4px 14px rgba(251,191,36,0.3)',
                    }}
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Custom scrollbar styles */}
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.1);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.2);
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
