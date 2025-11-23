import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Activity, StickyNote, History, Calendar, Award, TrendingUp, ChevronRight } from 'lucide-react';
import NotesDocumentManager from './NotesDocumentManager';
import { NoteDocument } from './DocumentsLibrary';

interface LiveSessionRecord {
  id: string;
  date: string;
  timestamp: number;
  questionsCount: number;
  answeredCount: number;
  overallScore: number;
  passed: boolean;
  tier: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  analysis: any;
  answers: Record<number, string>;
  questions?: any[];
}

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
  sidebarTab: 'progress' | 'notes' | 'history';
  setSidebarTab: (tab: 'progress' | 'notes' | 'history') => void;
  noteDocuments: NoteDocument[];
  activeNoteDocumentId: string | null;
  onDocumentsChange: (documents: NoteDocument[], activeDocumentId: string | null) => void;
  liveSessionHistory?: LiveSessionRecord[];
  onViewHistorySession?: (session: LiveSessionRecord) => void;
}

export default function RightSidebarPanel({
  preparationProgress,
  milestones,
  sidebarTab,
  setSidebarTab,
  noteDocuments,
  activeNoteDocumentId,
  onDocumentsChange,
  liveSessionHistory = [],
  onViewHistorySession,
}: RightSidebarPanelProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-900/20';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      'excellent': { label: 'Excellent', color: 'bg-emerald-500', text: 'text-white' },
      'good': { label: 'Good', color: 'bg-blue-500', text: 'text-white' },
      'needs-improvement': { label: 'Needs Work', color: 'bg-amber-500', text: 'text-white' },
      'poor': { label: 'Poor', color: 'bg-red-500', text: 'text-white' }
    };
    return badges[tier as keyof typeof badges] || badges['needs-improvement'];
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sortedHistory = [...liveSessionHistory].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-[400px] bg-white dark:bg-[#1E1F22] border-l border-gray-200 dark:border-[#2A2A2E] shadow-[0_0_40px_rgba(0,0,0,0.05)] z-30 flex flex-col">
        {/* Tab Headers */}
        <div className="flex items-center justify-around px-2 pt-4 pb-2 border-b border-gray-100 dark:border-[#2A2A2E]">
          {['progress', 'notes', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab as any)}
              className="relative flex-1 pb-3 group"
            >
              <div className={`flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 ${
                sidebarTab === tab 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
              }`}>
                {tab === 'progress' && <Activity className="w-4 h-4" />}
                {tab === 'notes' && <StickyNote className="w-4 h-4" />}
                {tab === 'history' && <History className="w-4 h-4" />}
                <span className="capitalize">{tab}</span>
              </div>
              {sidebarTab === tab && (
                <motion.div
                  layoutId="activeTabSidebar"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900 dark:bg-white rounded-full mx-4"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {sidebarTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-8"
              >
                {/* Progress Header with Circular Indicator */}
                <div className="bg-gray-50 dark:bg-[#1A1A1D] rounded-2xl p-6 flex items-center gap-6 border border-gray-100 dark:border-[#2A2A2E]">
                  <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
                    {/* Background circle */}
                    <svg className="absolute inset-0 h-20 w-20 -rotate-90 transform">
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      {/* Progress circle */}
                      <motion.circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        className="text-indigo-600 dark:text-indigo-500"
                        initial={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 }}
                        animate={{
                          strokeDashoffset: 213.6 - (213.6 * preparationProgress) / 100
                        }}
                        transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {preparationProgress}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Your Progress
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {milestones.filter((m) => m.completed).length === milestones.length
                        ? "All set! Good luck! 🚀"
                        : `${milestones.length - milestones.filter(m => m.completed).length} steps remaining`}
                    </p>
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Milestones
                    </span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {milestones.filter((m) => m.completed).length}/{milestones.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <motion.button
                        key={milestone.id}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={milestone.action}
                        className={`
                          group relative w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200 border
                          ${milestone.completed
                            ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-white dark:bg-[#1A1A1D] border-gray-100 dark:border-[#2A2A2E] hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className={`
                          flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors
                          ${milestone.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }
                        `}>
                          {milestone.completed ? (
                            <CheckCircle className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold mb-0.5 ${
                            milestone.completed ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-900 dark:text-white'
                          }`}>
                            {milestone.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {milestone.description}
                          </div>
                        </div>

                        {!milestone.completed && (
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-500 transition-colors self-center" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {sidebarTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <NotesDocumentManager
                  documents={noteDocuments}
                  activeDocumentId={activeNoteDocumentId}
                  onDocumentsChange={onDocumentsChange}
                />
              </motion.div>
            )}

            {sidebarTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Session History
                  </h3>
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                    {sortedHistory.length} Total
                  </span>
                </div>

                {/* Empty State */}
                {sortedHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 dark:border-gray-700 dark:bg-gray-900/20">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                        <History className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No sessions yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Start a "Prepare Live" session to see history
                    </p>
                  </div>
                )}

                {/* Sessions List */}
                <div className="space-y-4">
                  {sortedHistory.map((session, index) => {
                    const tierBadge = getTierBadge(session.tier);
                    
                    return (
                      <motion.button
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onViewHistorySession?.(session)}
                        className="group w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:shadow-md dark:border-gray-700 dark:bg-[#1A1A1D] dark:hover:border-gray-600"
                      >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {formatRelativeDate(session.date)}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Interview Session
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${tierBadge.color} ${tierBadge.text}`}>
                                {tierBadge.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`rounded-lg p-2.5 flex flex-col items-center justify-center ${getScoreBg(session.overallScore)}`}>
                                <span className={`text-xs font-semibold mb-0.5 ${getScoreColor(session.overallScore)}`}>Score</span>
                                <span className={`text-lg font-bold ${getScoreColor(session.overallScore)}`}>{session.overallScore}</span>
                            </div>
                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5 flex flex-col items-center justify-center">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Answered</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {session.answeredCount}<span className="text-gray-400 text-sm font-normal">/{session.questionsCount}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-xs text-gray-500 dark:text-gray-400">View detailed analysis</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.4);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.3);
        }
      `}</style>
    </div>
  );
}
