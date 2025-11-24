import { memo, useState } from 'react';
import { History, Calendar, Award, TrendingUp, MessageSquare, ChevronRight, Clock, Target, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveInterviewResults } from '../live/LiveInterviewResults';
import { QuestionEntry } from '../../../types/interview';

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
}

interface HistoryTabProps {
  liveSessionHistory: LiveSessionRecord[];
  questionEntries: QuestionEntry[];
}

const HistoryTab = memo(function HistoryTab({
  liveSessionHistory,
  questionEntries,
}: HistoryTabProps) {
  const [selectedSession, setSelectedSession] = useState<LiveSessionRecord | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
    return 'bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700';
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      'excellent': { label: 'Excellent', color: 'bg-green-500', ring: 'ring-green-500/20' },
      'good': { label: 'Good', color: 'bg-blue-500', ring: 'ring-blue-500/20' },
      'needs-improvement': { label: 'Needs Work', color: 'bg-amber-500', ring: 'ring-amber-500/20' },
      'poor': { label: 'Poor', color: 'bg-red-500', ring: 'ring-red-500/20' }
    };
    return badges[tier as keyof typeof badges] || badges['needs-improvement'];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedHistory = [...liveSessionHistory].sort((a, b) => b.timestamp - a.timestamp);

  if (selectedSession) {
    return (
      <div className="relative">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="relative h-[90vh] w-[95vw] max-w-7xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0c0c0e]">
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-white/10">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                      Practice Session Results
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDate(selectedSession.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <LiveInterviewResults
                    questions={questionEntries.slice(0, selectedSession.questionsCount)}
                    answers={selectedSession.answers}
                    analysis={selectedSession.analysis}
                    onClose={() => setSelectedSession(null)}
                    onRetry={() => setSelectedSession(null)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Interview Practice History
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Track your progress and review past practice sessions
          </p>
        </div>
        <div className="rounded-full bg-indigo-100 px-4 py-2 dark:bg-indigo-900/30">
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {sortedHistory.length} {sortedHistory.length === 1 ? 'Session' : 'Sessions'}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {sortedHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 py-16 dark:border-neutral-700 dark:bg-neutral-900/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800">
            <History className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
            No Practice Sessions Yet
          </h3>
          <p className="max-w-md text-center text-sm text-neutral-600 dark:text-neutral-400">
            Start a live practice session from the Questions tab to begin tracking your interview performance
          </p>
        </div>
      )}

      {/* Sessions List */}
      {sortedHistory.length > 0 && (
        <div className="space-y-4">
          {sortedHistory.map((session, index) => {
            const completionRate = Math.round((session.answeredCount / session.questionsCount) * 100);
            const tierBadge = getTierBadge(session.tier);
            
            return (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSession(session)}
                className="group w-full rounded-2xl border-2 border-neutral-200 bg-white p-6 text-left transition-all hover:border-indigo-300 hover:shadow-xl dark:border-white/10 dark:bg-[#1c1c1e] dark:hover:border-indigo-500/50"
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left Side - Main Info */}
                  <div className="flex-1 space-y-4">
                    {/* Date & Badge */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                        <Calendar className="h-5 w-5" />
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white">
                            {formatRelativeDate(session.date)}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-500">
                            {new Date(session.date).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ring-4 ${tierBadge.color} ${tierBadge.ring}`}>
                        {tierBadge.label}
                      </div>
                      {session.passed && (
                        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Award className="h-3.5 w-3.5" />
                          Passed
                        </div>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900/50">
                        <MessageSquare className="h-4 w-4 text-neutral-400" />
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {session.answeredCount}/{session.questionsCount}
                          </div>
                          <div className="text-xs text-neutral-500">Answered</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900/50">
                        <TrendingUp className="h-4 w-4 text-neutral-400" />
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {completionRate}%
                          </div>
                          <div className="text-xs text-neutral-500">Complete</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900/50">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                            ~{session.questionsCount * 2}m
                          </div>
                          <div className="text-xs text-neutral-500">Duration</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Score */}
                  <div className="flex items-center gap-4">
                    <div className={`flex flex-col items-center rounded-2xl border-2 px-6 py-4 ${getScoreBg(session.overallScore)}`}>
                      <BarChart2 className={`mb-1 h-5 w-5 ${getScoreColor(session.overallScore)}`} />
                      <div className={`text-3xl font-bold ${getScoreColor(session.overallScore)}`}>
                        {session.overallScore}
                      </div>
                      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Overall Score
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-neutral-400 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default HistoryTab;


