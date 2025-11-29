/**
 * BeforeAfterModal Component
 * Premium modal overlay for CV comparison with word-level diffs
 */

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, GitCompare, Eye, EyeOff, Columns, Sparkles,
  FileText, Briefcase, GraduationCap, Code,
  ArrowLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import {
  CVComparisonResult,
  ComparisonSectionType,
  ComparisonViewMode,
  ComparisonModalState,
} from '../../types/cvComparison';
import { SummaryDiff, ExperienceDiff, EducationDiff, SkillsDiff, DiffStats } from './comparison';

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
  color: string;
  bgColor: string;
}> = {
  summary: { 
    icon: FileText, 
    label: 'Summary', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  experiences: { 
    icon: Briefcase, 
    label: 'Experience', 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  education: { 
    icon: GraduationCap, 
    label: 'Education', 
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  skills: { 
    icon: Code, 
    label: 'Skills', 
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
  },
  certifications: { 
    icon: FileText, 
    label: 'Certifications', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  languages: { 
    icon: FileText, 
    label: 'Languages', 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  projects: { 
    icon: FileText, 
    label: 'Projects', 
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30'
  },
};

const viewModeConfig: Record<ComparisonViewMode, { icon: typeof GitCompare; label: string }> = {
  diff: { icon: GitCompare, label: 'Diff' },
  before: { icon: EyeOff, label: 'Before' },
  after: { icon: Eye, label: 'After' },
  split: { icon: Columns, label: 'Split' },
};

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
    
    const sections: { type: ComparisonSectionType; hasChanges: boolean; stats: any }[] = [];
    
    if (comparison.summary) {
      sections.push({ 
        type: 'summary', 
        hasChanges: comparison.summary.hasChanges,
        stats: comparison.summary.changeStats
      });
    }
    if (comparison.experiences) {
      sections.push({ 
        type: 'experiences', 
        hasChanges: comparison.experiences.hasChanges,
        stats: comparison.experiences.changeStats
      });
    }
    if (comparison.education) {
      sections.push({ 
        type: 'education', 
        hasChanges: comparison.education.hasChanges,
        stats: comparison.education.changeStats
      });
    }
    if (comparison.skills) {
      sections.push({ 
        type: 'skills', 
        hasChanges: comparison.skills.hasChanges,
        stats: comparison.skills.changeStats
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 xl:inset-16 
                       bg-white dark:bg-[#1a1a1d] rounded-3xl shadow-2xl z-50
                       flex flex-col overflow-hidden
                       border border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800
                            bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-[#1a1a1d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 
                                  flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      AI Changes Overview
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Compare your original CV with AI-optimized version
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Global Stats */}
                  {comparison && (
                    <DiffStats
                      added={comparison.totalStats.totalAdded}
                      removed={comparison.totalStats.totalRemoved}
                      modified={comparison.totalStats.totalModified}
                      size="md"
                    />
                  )}
                  
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                               text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  {(Object.keys(viewModeConfig) as ComparisonViewMode[]).map((mode) => {
                    const config = viewModeConfig[mode];
                    const Icon = config.icon;
                    return (
                      <button
                        key={mode}
                        onClick={() => onSetViewMode(mode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                                    transition-all duration-200 ${
                          viewMode === mode
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                {viewMode === 'diff' && (
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700" />
                      <span className="text-gray-500 dark:text-gray-400">Added</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700" />
                      <span className="text-gray-500 dark:text-gray-400">Removed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700" />
                      <span className="text-gray-500 dark:text-gray-400">Modified</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Section Sidebar */}
              <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800
                              bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto">
                <div className="p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 px-2">
                    Sections
                  </p>
                  {availableSections.map(({ type, hasChanges, stats }) => {
                    const config = sectionConfig[type];
                    const Icon = config.icon;
                    const isActive = effectiveSection === type;

                    return (
                      <button
                        key={type}
                        onClick={() => onSelectSection(type)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl
                                    transition-all duration-200 group ${
                          isActive
                            ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
                            : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                                        ${isActive ? config.bgColor : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <Icon className={`w-4.5 h-4.5 ${isActive ? config.color : 'text-gray-400 dark:text-gray-500'}`} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {config.label}
                            </span>
                            {hasChanges && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                          </div>
                          {hasChanges && stats && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                              {stats.added > 0 && `+${stats.added}`}
                              {stats.modified > 0 && ` ~${stats.modified}`}
                              {stats.removed > 0 && ` -${stats.removed}`}
                            </p>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          isActive 
                            ? 'text-gray-400 translate-x-0' 
                            : 'text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={effectiveSection}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderSectionContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800
                            bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {onRevertSection && (
                    <button
                      onClick={() => onRevertSection(effectiveSection)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl
                                 text-sm font-medium text-gray-600 dark:text-gray-400
                                 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Revert This Section
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {onRevertAll && (
                    <button
                      onClick={onRevertAll}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                 text-sm font-medium text-red-600 dark:text-red-400
                                 border border-red-200 dark:border-red-800/50
                                 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Revert All Changes
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                               text-sm font-semibold text-white
                               bg-gradient-to-r from-emerald-500 to-teal-600
                               hover:from-emerald-600 hover:to-teal-700
                               shadow-lg shadow-emerald-500/20
                               transition-all duration-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

