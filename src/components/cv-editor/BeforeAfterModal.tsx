/**
 * BeforeAfterModal Component
 * Premium modal overlay for CV comparison with word-level diffs
 * Design: Minimalist Notion/Vercel-inspired with light/dark mode
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, GitCompare, Columns,
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
}> = {
  summary: { icon: FileText, label: 'Summary' },
  experiences: { icon: Briefcase, label: 'Experience' },
  education: { icon: GraduationCap, label: 'Education' },
  skills: { icon: Code, label: 'Skills' },
  certifications: { icon: FileText, label: 'Certifications' },
  languages: { icon: FileText, label: 'Languages' },
  projects: { icon: FileText, label: 'Projects' },
};

// Animated counter component
function AnimatedCounter({ value, className = '' }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 600;
    const steps = 15;
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

  // Use portal to render at document body level, avoiding parent fixed positioning context
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] bg-black/40 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 sm:inset-6 md:inset-8 lg:inset-12 z-[9999]
                       flex flex-col overflow-hidden rounded-xl
                       bg-white dark:bg-[#0a0a0a]
                       border border-gray-200 dark:border-white/[0.08]
                       shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                {/* Left: Title */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center
                                  bg-[#b7e219]/10 dark:bg-[#b7e219]/15
                                  border border-[#b7e219]/20 dark:border-[#b7e219]/30">
                    <GitCompare className="w-4 h-4 text-[#7cb305] dark:text-[#b7e219]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      CV Changes Review
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-white/40">
                      Compare your original with AI-optimized version
                    </p>
                  </div>
                </div>

                {/* Center: View Mode Toggle */}
                <div className="absolute left-1/2 -translate-x-1/2">
                  <div className="flex items-center p-0.5 rounded-lg
                                  bg-gray-100 dark:bg-[#1a1a1a]
                                  border border-gray-200 dark:border-white/[0.08]">
                    <button
                      onClick={() => onSetViewMode('diff')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${viewMode === 'diff'
                        ? 'bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
                        }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      <span>Unified</span>
                    </button>

                    <button
                      onClick={() => onSetViewMode('split')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${viewMode === 'split'
                        ? 'bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60'
                        }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Side by Side</span>
                    </button>
                  </div>
                </div>

                {/* Right: Close Button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center
                             text-gray-400 dark:text-white/40 
                             hover:text-gray-600 dark:hover:text-white/70 
                             hover:bg-gray-100 dark:hover:bg-white/5 
                             transition-all duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Section Tabs */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                {availableSections.map(({ type, hasChanges, changeCount }) => {
                  const config = sectionConfig[type];
                  const Icon = config.icon;
                  const isActive = effectiveSection === type;

                  return (
                    <button
                      key={type}
                      onClick={() => onSelectSection(type)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
                                  transition-all duration-150 whitespace-nowrap
                                  border ${isActive
                          ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-white/[0.08]'
                          : 'text-gray-500 dark:text-white/40 border-transparent hover:text-gray-700 dark:hover:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{config.label}</span>

                      {/* Change count badge */}
                      {hasChanges && changeCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${isActive
                            ? 'bg-[#b7e219]/20 text-[#7cb305] dark:text-[#b7e219]'
                            : 'bg-gray-200 dark:bg-white/[0.08] text-gray-500 dark:text-white/50'
                            }`}
                        >
                          {changeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={effectiveSection}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {renderSectionContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 
                            bg-gray-50 dark:bg-[#1a1a1a] 
                            border-t border-gray-100 dark:border-white/[0.08]">
              <div className="flex items-center justify-between">
                {/* Stats */}
                <div className="flex items-center gap-5">
                  {/* Added */}
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-xs">
                      <AnimatedCounter value={totalChanges.added} className="font-medium text-emerald-600 dark:text-emerald-400" />
                      <span className="text-gray-500 dark:text-white/40 ml-1">additions</span>
                    </span>
                  </div>

                  {/* Removed */}
                  <div className="flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    <span className="text-xs">
                      <AnimatedCounter value={totalChanges.removed} className="font-medium text-red-600 dark:text-red-400" />
                      <span className="text-gray-500 dark:text-white/40 ml-1">removals</span>
                    </span>
                  </div>

                  {/* Modified */}
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-[#7cb305] dark:text-[#b7e219]" />
                    <span className="text-xs">
                      <AnimatedCounter value={totalChanges.modified} className="font-medium text-[#7cb305] dark:text-[#b7e219]" />
                      <span className="text-gray-500 dark:text-white/40 ml-1">modifications</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {onRevertAll && (
                    <button
                      onClick={onRevertAll}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium 
                                 text-red-600 dark:text-red-400 
                                 hover:bg-red-50 dark:hover:bg-red-500/10 
                                 border border-red-200 dark:border-red-500/20
                                 transition-colors"
                    >
                      Revert All
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold 
                               bg-[#7cb305] dark:bg-[#b7e219] 
                               text-white dark:text-[#0a0a0a]
                               hover:bg-[#6ba104] dark:hover:bg-[#a5cb17]
                               active:scale-[0.98] transition-all"
                  >
                    Done
                  </button>
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
              background: rgba(0,0,0,0.1);
              border-radius: 3px;
            }
            .dark .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.08);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(0,0,0,0.2);
            }
            .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.12);
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

  // Render via portal to escape parent fixed positioning context
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
