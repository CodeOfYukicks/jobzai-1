import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, FileText, Activity, StickyNote } from 'lucide-react';
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
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${
              sidebarTab === 'progress'
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
            className={`relative flex-1 px-4 py-4 text-xs font-semibold transition-all ${
              sidebarTab === 'notes'
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
                {/* Compact Progress Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Preparation Progress
                    </h3>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {preparationProgress}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {milestones.filter((m) => m.completed).length}/{milestones.length} done
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${preparationProgress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600"
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Key Milestones
                  </div>
                  {milestones.map((milestone) => (
                    <button
                      key={milestone.id}
                      type="button"
                      onClick={milestone.action}
                      className={[
                        'group/milestone w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                        milestone.completed
                          ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50'
                          : 'bg-gray-50/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 hover:bg-gray-100/90 dark:hover:bg-white/10 hover:border-purple-200/50 dark:hover:border-purple-800/50',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-transform mt-0.5',
                          milestone.completed 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-gray-100 dark:bg-white/10 text-purple-600 dark:text-purple-400',
                        ].join(' ')}
                      >
                        <div className="h-3.5 w-3.5">{milestone.icon}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={[
                            'text-xs font-medium leading-tight',
                            milestone.completed
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-gray-900 dark:text-white',
                          ].join(' ')}
                        >
                          {milestone.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                          {milestone.description}
                        </div>
                      </div>
                      {milestone.completed ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-1" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover/milestone:text-purple-500 dark:group-hover/milestone:text-purple-400 group-hover/milestone:translate-x-0.5 transition-all mt-1" />
                      )}
                    </button>
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

