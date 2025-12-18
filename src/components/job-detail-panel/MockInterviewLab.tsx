import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic,
    Play,
    Clock,
    Calendar,
    ChevronDown,
    Loader2,
    BarChart3,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isValid } from 'date-fns';
import { notify } from '@/lib/notify';
import type { MockInterviewAnalysis } from '../../types/interview';

// Interface for saved mock interview sessions (matching MockInterviewPage.tsx)
interface MockInterviewSession {
    id: string;
    date: string;
    applicationId: string;
    companyName: string;
    position: string;
    elapsedTime: number;
    transcript: any[];
    analysis: MockInterviewAnalysis | null;
    createdAt?: any;
}

interface MockInterviewLabProps {
    job: {
        id: string;
        position: string;
        companyName: string;
    };
}

// Helper function to parse dates safely
const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    if (dateValue instanceof Date) return dateValue;
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate();
    }
    if (typeof dateValue === 'number') {
        return new Date(dateValue);
    }
    if (typeof dateValue === 'string') {
        const parsed = parseISO(dateValue);
        return isValid(parsed) ? parsed : new Date();
    }
    return new Date();
};

// Format elapsed time as MM:SS
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const MockInterviewLab = ({ job }: MockInterviewLabProps) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchSessions = async () => {
            if (!currentUser || !job?.id) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const sessionsRef = collection(db, 'users', currentUser.uid, 'mockInterviewSessions');
                
                // Try with orderBy first, fallback to simple query if index doesn't exist
                let snapshot;
                try {
                    const q = query(
                        sessionsRef,
                        where('applicationId', '==', job.id),
                        orderBy('createdAt', 'desc')
                    );
                    snapshot = await getDocs(q);
                } catch (indexError) {
                    console.warn('Firestore index not ready, using unordered query:', indexError);
                    const q = query(
                        sessionsRef,
                        where('applicationId', '==', job.id)
                    );
                    snapshot = await getDocs(q);
                }

                const fetchedSessions: MockInterviewSession[] = [];
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    fetchedSessions.push({
                        id: docSnap.id,
                        date: data.date,
                        applicationId: data.applicationId,
                        companyName: data.companyName,
                        position: data.position,
                        elapsedTime: data.elapsedTime,
                        transcript: data.transcript || [],
                        analysis: data.analysis,
                        createdAt: data.createdAt,
                    });
                });

                // Sort by date, most recent first
                fetchedSessions.sort((a, b) => {
                    const dateA = parseDate(a.date).getTime();
                    const dateB = parseDate(b.date).getTime();
                    return dateB - dateA;
                });

                setSessions(fetchedSessions);
            } catch (err) {
                console.error('Error fetching mock interview sessions:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessions();
    }, [currentUser, job?.id]);

    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'mockInterviewSessions', sessionId));
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            notify.success('Session deleted');
        } catch (error) {
            console.error('Error deleting session:', error);
            notify.error('Failed to delete session');
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600 dark:text-green-400';
        if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 70) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        if (score >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    };

    const getScoreRingColor = (score: number) => {
        if (score >= 70) return 'ring-green-500/20 dark:ring-green-400/20';
        if (score >= 50) return 'ring-yellow-500/20 dark:ring-yellow-400/20';
        return 'ring-red-500/20 dark:ring-red-400/20';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 70) return 'from-green-500 to-emerald-500';
        if (score >= 50) return 'from-yellow-500 to-amber-500';
        return 'from-red-500 to-rose-500';
    };

    const getVerdictColor = (verdict: string) => {
        if (verdict === 'yes') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
        if (verdict === 'maybe') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    };

    const formatSessionDate = (dateStr: string) => {
        try {
            const date = parseDate(dateStr);
            return format(date, 'MMM d, yyyy');
        } catch {
            return 'Unknown date';
        }
    };

    const handleStartInterview = () => {
        // Navigate to mock interview page with job pre-selected
        navigate('/mock-interview', { state: { selectedJobId: job.id } });
    };

    const handleViewResults = (sessionId: string) => {
        // Navigate to mock interview page with the session to view
        navigate('/mock-interview', { state: { viewSessionId: sessionId } });
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="rounded-xl border border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#3d3c3e]" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-[#3d3c3e] rounded w-1/3" />
                                    <div className="h-3 bg-gray-200 dark:bg-[#3d3c3e] rounded w-1/2" />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#3d3c3e]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty state
    if (sessions.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative overflow-hidden rounded-xl bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e]"
            >
                <div className="px-8 py-10 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative inline-flex items-center justify-center mb-5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-100/50 to-cyan-100/50 dark:from-violet-900/20 dark:to-cyan-900/20 rounded-xl blur-2xl" />
                        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-900/30 dark:to-cyan-900/30 flex items-center justify-center border border-violet-100 dark:border-violet-800/30 shadow-sm">
                            <Mic className="w-7 h-7 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
                        </div>
                    </motion.div>

                    <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight"
                    >
                        No Mock Interviews Yet
                    </motion.h3>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed"
                    >
                        Practice for your interview at {job.companyName} with our AI interviewer. 
                        Get detailed feedback on your answers and improve your performance.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartInterview}
                        className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium text-sm transition-all duration-300 shadow-md shadow-gray-900/10 dark:shadow-white/10 hover:shadow-lg hover:shadow-gray-900/20 dark:hover:shadow-white/20"
                    >
                        <Play className="w-4 h-4" strokeWidth={2} />
                        <span>Start Mock Interview</span>
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // Render session analysis content
    const renderSessionContent = (session: MockInterviewSession) => {
        const analysis = session.analysis;
        
        if (!analysis) {
            return (
                <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Analysis in progress...
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-6 pt-2">
                {/* Executive Summary */}
                {analysis.executiveSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30 border border-gray-100 dark:border-[#3d3c3e]/50 p-5"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Performance Summary
                            </h4>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-9">
                            {analysis.executiveSummary}
                        </p>
                    </motion.div>
                )}

                {/* Verdict */}
                {analysis.verdict && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-3"
                    >
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${getVerdictColor(analysis.verdict.hireDecision)}`}>
                            {analysis.verdict.hireDecision === 'yes' && <CheckCircle2 className="w-4 h-4" />}
                            {analysis.verdict.hireDecision === 'maybe' && <AlertCircle className="w-4 h-4" />}
                            {analysis.verdict.hireDecision === 'no' && <XCircle className="w-4 h-4" />}
                            {analysis.verdict.hireDecision === 'yes' ? 'Likely to Pass' : 
                             analysis.verdict.hireDecision === 'maybe' ? 'Needs Improvement' : 'Not Ready Yet'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Confidence: {analysis.verdict.confidence}
                        </span>
                    </motion.div>
                )}

                {/* Category Scores */}
                {(analysis.contentAnalysis || analysis.expressionAnalysis || analysis.jobFitAnalysis) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="grid grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                        {analysis.contentAnalysis && (
                            <div className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Content</span>
                                <div className={`text-xl font-bold ${getScoreColor(analysis.contentAnalysis.relevanceScore)} mt-1`}>
                                    {Math.round(analysis.contentAnalysis.relevanceScore)}%
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden mt-2">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(analysis.contentAnalysis.relevanceScore)}`}
                                        style={{ width: `${analysis.contentAnalysis.relevanceScore}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {analysis.expressionAnalysis && (
                            <div className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Expression</span>
                                <div className={`text-xl font-bold ${getScoreColor(analysis.expressionAnalysis.clarityScore)} mt-1`}>
                                    {Math.round(analysis.expressionAnalysis.clarityScore)}%
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden mt-2">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(analysis.expressionAnalysis.clarityScore)}`}
                                        style={{ width: `${analysis.expressionAnalysis.clarityScore}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        {analysis.jobFitAnalysis && (
                            <div className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Job Fit</span>
                                <div className={`text-xl font-bold ${getScoreColor(analysis.jobFitAnalysis.fitScore)} mt-1`}>
                                    {Math.round(analysis.jobFitAnalysis.fitScore)}%
                                </div>
                                <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden mt-2">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(analysis.jobFitAnalysis.fitScore)}`}
                                        style={{ width: `${analysis.jobFitAnalysis.fitScore}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Strengths & Issues */}
                {(analysis.strengths?.length > 0 || analysis.criticalIssues?.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Strengths */}
                        {analysis.strengths && analysis.strengths.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Strengths
                                    </h4>
                                </div>
                                <ul className="space-y-2">
                                    {analysis.strengths.slice(0, 3).map((strength, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}

                        {/* Critical Issues */}
                        {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/30">
                                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Areas to Improve
                                    </h4>
                                </div>
                                <ul className="space-y-2">
                                    {analysis.criticalIssues.slice(0, 3).map((issue, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* View Full Results Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center pt-2"
                >
                    <button
                        onClick={() => handleViewResults(session.id)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-medium text-sm shadow-md shadow-gray-900/10 hover:shadow-lg"
                    >
                        <span>View Full Results</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>
        );
    };

    // Main render - collapsible list
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <Mic className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Mock Interviews
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} for this job
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleStartInterview}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-all"
                >
                    <Play className="w-4 h-4" />
                    New Interview
                </button>
            </div>

            {/* Collapsible Session Cards */}
            <div className="space-y-3">
                {sessions.map((session, index) => {
                    const isExpanded = expandedIds.has(session.id);
                    const score = session.analysis?.overallScore ?? null;
                    const isAnalyzing = !session.analysis;

                    return (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-xl border transition-all duration-300 ${
                                isExpanded
                                    ? 'border-violet-200 dark:border-violet-800/50 shadow-lg shadow-violet-500/5 dark:shadow-violet-500/10 bg-white dark:bg-[#242325]'
                                    : 'border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                        >
                            {/* Collapsed Header - Always Visible */}
                            <button
                                onClick={() => toggleExpanded(session.id)}
                                className="w-full p-5 flex items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-xl"
                            >
                                {/* Score Circle or Loader */}
                                {isAnalyzing ? (
                                    <div className="relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                                    </div>
                                ) : score !== null ? (
                                    <div className={`relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ring-4 ${getScoreRingColor(score)} ${getScoreBgColor(score)} border`}>
                                        <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                                            {Math.round(score)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e]">
                                        <Mic className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {formatSessionDate(session.date)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(session.elapsedTime)}
                                        </span>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-xs font-semibold text-violet-600 dark:text-violet-400">
                                                Latest
                                            </span>
                                        )}
                                        {isAnalyzing && (
                                            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                Analyzing...
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {session.position}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {session.companyName}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleDeleteSession(session.id, e)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                                        isExpanded
                                            ? 'bg-violet-100 dark:bg-violet-900/30'
                                            : 'bg-gray-100 dark:bg-[#2b2a2c]'
                                    }`}>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className={`w-5 h-5 ${
                                                isExpanded
                                                    ? 'text-violet-600 dark:text-violet-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        </motion.div>
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 border-t border-gray-100 dark:border-[#3d3c3e]">
                                            {renderSessionContent(session)}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};



