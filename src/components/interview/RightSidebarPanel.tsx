import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Activity, StickyNote } from 'lucide-react';
import NotesDocumentManager from './NotesDocumentManager';
import { NoteDocument } from './DocumentsLibrary';

interface Milestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action: () => void;
}

interface RightSidebarPanelProps {
  preparationProgress: number;
  milestones: Milestone[];
  sidebarTab: 'progress' | 'notes';
  setSidebarTab: (tab: 'progress' | 'notes') => void;
  noteDocuments: NoteDocument[];
  activeNoteDocumentId: string | null;
  onDocumentsChange: (documents: NoteDocument[], activeDocumentId: string | null) => void;
}

export default function RightSidebarPanel({
  preparationProgress,
  milestones,
  sidebarTab,
  setSidebarTab,
  noteDocuments,
  activeNoteDocumentId,
  onDocumentsChange,
}: RightSidebarPanelProps) {

  return (
    <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-[#1E1F22] border-l border-gray-200 dark:border-[#2A2A2E] shadow-2xl z-30">
      <div className="h-full flex flex-col">
        {/* Tab Headers */}
        <div className="relative flex border-b border-gray-200 dark:border-[#2A2A2E] flex-shrink-0">
          <button
            onClick={() => setSidebarTab('progress')}
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${sidebarTab === 'progress'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Progress
            </div>
            {sidebarTab === 'progress' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
          <button
            onClick={() => setSidebarTab('notes')}
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${sidebarTab === 'notes'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <StickyNote className="w-3.5 h-3.5" />
              Notes
            </div>
            {sidebarTab === 'notes' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {sidebarTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6 space-y-6"
              >
                {/* Progress Header with Circular Indicator */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white mb-1.5">
                      Preparation Progress
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      {milestones.filter((m) => m.completed).length === milestones.length
                        ? "You're fully prepared! 🎉"
                        : "Complete key milestones"}
                    </p>
                  </div>

                  {/* Circular Progress Indicator */}
                  <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
                    {/* Background circle */}
                    <svg className="absolute inset-0 h-14 w-14 -rotate-90 transform">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        fill="none"
                        className="text-gray-100 dark:text-gray-800"
                      />
                      {/* Progress circle */}
                      <motion.circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="url(#progressGradient)"
                        strokeWidth="3.5"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 150.8 }}
                        animate={{
                          strokeDashoffset: 150.8 - (150.8 * preparationProgress) / 100
                        }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                        style={{
                          strokeDasharray: 150.8,
                        }}
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Percentage text */}
                    <div className="relative flex flex-col items-center">
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {preparationProgress}
                      </span>
                      <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${preparationProgress}%` }}
                    transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  />
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Milestones
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {milestones.filter((m) => m.completed).length} of {milestones.length}
                    </span>
                  </div>

                  {milestones.map((milestone, index) => (
                    <motion.button
                      key={milestone.id}
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={milestone.action}
                      className={[
                        'group/milestone relative w-full overflow-hidden rounded-lg transition-all duration-200',
                        milestone.completed
                          ? 'bg-emerald-50/80 ring-1 ring-emerald-200/60 dark:bg-emerald-950/30 dark:ring-emerald-800/40'
                          : 'bg-gray-50/50 ring-1 ring-gray-200/40 hover:bg-gray-50 hover:ring-purple-200/50 dark:bg-white/[0.02] dark:ring-white/[0.05] dark:hover:bg-white/[0.04] dark:hover:ring-purple-500/30',
                      ].join(' ')}
                    >
                      {/* Hover gradient effect */}
                      {!milestone.completed && (
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/milestone:opacity-100">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5" />
                        </div>
                      )}

                      <div className="relative flex items-center gap-3 px-3 py-2.5">
                        {/* Icon */}
                        <div
                          className={[
                            'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                            milestone.completed
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : 'bg-white text-purple-600 ring-1 ring-gray-200/50 group-hover/milestone:bg-purple-50 group-hover/milestone:ring-purple-200/50 dark:bg-gray-800 dark:text-purple-400 dark:ring-white/[0.08] dark:group-hover/milestone:bg-purple-950/50',
                          ].join(' ')}
                        >
                          <div className="h-3.5 w-3.5">{milestone.icon}</div>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 text-left">
                          <div
                            className={[
                              'text-xs font-medium leading-tight',
                              milestone.completed
                                ? 'text-emerald-900 dark:text-emerald-200'
                                : 'text-gray-900 dark:text-gray-100',
                            ].join(' ')}
                          >
                            {milestone.label}
                          </div>
                          <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">
                            {milestone.description}
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="flex-shrink-0">
                          {milestone.completed ? (
                            <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600">
                              <CheckCircle className="h-3 w-3 text-white" strokeWidth={2.5} />
                            </div>
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5 text-gray-400 transition-all duration-200 group-hover/milestone:translate-x-0.5 group-hover/milestone:text-purple-500 dark:text-gray-500 dark:group-hover/milestone:text-purple-400" />
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {sidebarTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <NotesDocumentManager
                  documents={noteDocuments}
                  activeDocumentId={activeNoteDocumentId}
                  onDocumentsChange={onDocumentsChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.5);
        }
      `}</style>
    </div>
  );
}

