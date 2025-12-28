import { motion } from 'framer-motion';
import { History, Calendar, ArrowRight, PlayCircle } from 'lucide-react';

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

interface HistoryTabMobileProps {
    liveSessionHistory: LiveSessionRecord[];
    onViewHistorySession: (session: LiveSessionRecord) => void;
    onStartPractice: () => void;
}

function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
    if (score >= 60) return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
    return 'bg-gradient-to-r from-rose-500 to-rose-600 text-white';
}

/**
 * Mobile History tab
 * - Shows past interview practice sessions
 * - Tap to view session details
 * - Similar to desktop right panel history
 */
export default function HistoryTabMobile({
    liveSessionHistory,
    onViewHistorySession,
    onStartPractice,
}: HistoryTabMobileProps) {
    const sortedHistory = [...liveSessionHistory].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="px-4 pb-8 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#635BFF]" />
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                        Session History
                    </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3d3c3e] text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {sortedHistory.length}
                </span>
            </div>

            {/* Empty State */}
            {sortedHistory.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-16 text-center"
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center mb-4">
                        <History className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
                        No sessions yet
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 max-w-[220px] mx-auto">
                        Start a practice session to track your interview progress
                    </p>
                    <button
                        onClick={onStartPractice}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-[#635BFF] hover:bg-[#5850E6] active:scale-[0.98]
              text-white font-semibold text-[14px]
              transition-all duration-200"
                    >
                        <PlayCircle className="w-4 h-4" />
                        Start Practice
                    </button>
                </motion.div>
            ) : (
                /* Sessions List */
                <div className="space-y-3">
                    {sortedHistory.map((session, index) => (
                        <motion.button
                            key={session.id}
                            onClick={() => onViewHistorySession(session)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="w-full bg-white dark:bg-[#242325] rounded-xl border border-gray-100 dark:border-[#3d3c3e] p-4 text-left active:scale-[0.98] transition-transform"
                        >
                            {/* Top Row: Date + Score */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                                            {formatRelativeDate(session.date)}
                                        </span>
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 dark:text-white">
                                        Practice Session
                                    </div>
                                </div>

                                {/* Score Badge */}
                                <span className={`px-2.5 py-1 rounded-lg text-[12px] font-bold ${getScoreColor(session.overallScore)}`}>
                                    {session.overallScore}%
                                </span>
                            </div>

                            {/* Bottom Row: Questions answered + Arrow */}
                            <div className="flex items-center justify-between text-[12px] text-gray-500 dark:text-gray-400">
                                <span>{session.answeredCount}/{session.questionsCount} questions answered</span>
                                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </div>
                        </motion.button>
                    ))}

                    {/* Start New Session CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="pt-4 pb-4"
                    >
                        <button
                            onClick={onStartPractice}
                            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl
                bg-[#635BFF] hover:bg-[#5850E6] active:scale-[0.98]
                text-white font-semibold text-[16px]
                shadow-lg shadow-[#635BFF]/20
                transition-all duration-200"
                        >
                            <PlayCircle className="w-5 h-5" />
                            Start New Session
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
