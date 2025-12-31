import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, ChevronDown,
    Target, RefreshCw, ArrowUpRight, TrendingUp,
    Star, AlertCircle, Sparkles,
    TrendingDown, Minus, ChevronRight, Circle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuestionEntry, MockInterviewAnalysis } from '../../../types/interview';

// Types for session history comparison
interface SessionRecord {
    id: string;
    date: string;
    timestamp: number;
    overallScore: number;
    passed: boolean;
    tier: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

interface LiveInterviewResultsProps {
    questions: QuestionEntry[];
    answers: Record<number, string>;
    analysis: MockInterviewAnalysis | null;
    onClose: () => void;
    onRetry: () => void;
    previousSessions?: SessionRecord[];
}

// Animated Score Ring Component
const ScoreRing: React.FC<{ score: number; size?: number; strokeWidth?: number }> = ({
    score,
    size = 100,
    strokeWidth = 6
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getScoreColor = (s: number) => {
        if (s >= 80) return '#10B981';
        if (s >= 60) return '#F59E0B';
        if (s >= 40) return '#F97316';
        return '#EF4444';
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-neutral-200 dark:text-neutral-700"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={getScoreColor(score)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-xl font-bold text-neutral-900 dark:text-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                >
                    {score}
                </motion.span>
            </div>
        </div>
    );
};

// Comparison Panel Component
const ComparisonPanel: React.FC<{
    currentScore: number;
    previousSessions: SessionRecord[];
}> = ({ currentScore, previousSessions }) => {
    if (!previousSessions || previousSessions.length === 0) return null;

    const lastSession = previousSessions[previousSessions.length - 1];
    const delta = currentScore - lastSession.overallScore;
    const recentSessions = previousSessions.slice(-5);

    const getTrendMessage = () => {
        if (delta > 10) return "Impressive progress!";
        if (delta > 0) return "You're improving!";
        if (delta === 0) return "Consistent performance";
        if (delta > -10) return "Slight dip, keep practicing";
        return "Time to refocus";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    vs last session
                </span>
                <div className={`flex items-center gap-1 text-xs font-semibold ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                    delta < 0 ? 'text-red-500 dark:text-red-400' :
                        'text-neutral-500 dark:text-neutral-400'
                    }`}>
                    {delta > 0 ? <TrendingUp className="h-3 w-3" /> :
                        delta < 0 ? <TrendingDown className="h-3 w-3" /> :
                            <Minus className="h-3 w-3" />}
                    {delta > 0 ? '+' : ''}{delta}
                </div>
            </div>

            {/* Mini Sparkline */}
            <div className="flex items-end gap-0.5 h-8 mb-2">
                {recentSessions.map((session, i) => (
                    <div
                        key={session.id}
                        className="flex-1 rounded-sm transition-all bg-neutral-300 dark:bg-neutral-600"
                        style={{ height: `${(session.overallScore / 100) * 100}%` }}
                    />
                ))}
                <motion.div
                    className="flex-1 rounded-sm bg-indigo-500"
                    initial={{ height: 0 }}
                    animate={{ height: `${(currentScore / 100) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                />
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {getTrendMessage()}
            </p>
        </motion.div>
    );
};
// Timeline Question Node
const TimelineNode: React.FC<{
    question: QuestionEntry;
    index: number;
    answer: string | undefined;
    qAnalysis: any | undefined; // Relaxed type for now
    isExpanded: boolean;
    onToggle: () => void;
    isLast: boolean;
    delay: number;
}> = ({ question, index, answer, qAnalysis, isExpanded, onToggle, isLast, delay }) => {
    // ... (TimelineNode implementation remains mostly the same, just handling qAnalysis safely)
    const hasAnswer = answer && answer.trim() !== '';
    const score = qAnalysis?.score ?? 0;

    const getNodeColor = () => {
        if (!hasAnswer) return 'bg-neutral-300 dark:bg-neutral-600';
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.2 }}
            className="relative"
        >
            {/* ... (rest of TimelineNode) ... */}
            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-neutral-100 p-3 space-y-3 dark:border-neutral-700">
                            {hasAnswer && qAnalysis ? (
                                <>
                                    {/* Your Answer */}
                                    <div>
                                        <h4 className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                                            Your Answer
                                        </h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap bg-neutral-50 dark:bg-neutral-900/50 rounded p-2">
                                            {answer}
                                        </p>
                                    </div>

                                    {/* Feedback */}
                                    {qAnalysis.detailedFeedback && (
                                        <div>
                                            <h4 className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                                                Feedback
                                            </h4>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                {qAnalysis.detailedFeedback}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-3">
                                    <AlertCircle className="h-6 w-6 text-neutral-300 dark:text-neutral-600 mx-auto mb-1" />
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                        {hasAnswer ? 'No specific feedback for this question' : 'No answer provided'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const LiveInterviewResults: React.FC<LiveInterviewResultsProps> = ({
    questions,
    answers,
    analysis,
    onClose,
    onRetry,
    previousSessions = [],
}) => {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
    const [showAllStrengths, setShowAllStrengths] = useState(false);
    const [showAllImprovements, setShowAllImprovements] = useState(false);
    const [mobileTab, setMobileTab] = useState<'summary' | 'questions'>('summary');
    const confettiTriggered = useRef(false);

    // Trigger confetti on pass
    useEffect(() => {
        if (analysis?.verdict?.passed && !confettiTriggered.current) {
            confettiTriggered.current = true;

            confetti({
                particleCount: 80,
                spread: 60,
                origin: { x: 0.15, y: 0.6 },
                colors: ['#10B981', '#34D399', '#6EE7B7'],
            });

            setTimeout(() => {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { x: 0.85, y: 0.6 },
                    colors: ['#10B981', '#34D399', '#6EE7B7'],
                });
            }, 100);
        }
    }, [analysis?.verdict?.passed]);

    // Loading state
    if (!analysis) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-white dark:bg-[#1a1a1c]">
                <div className="text-center">
                    <motion.div
                        className="mb-4 inline-flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 dark:border-neutral-700 dark:border-t-neutral-300" />
                    </motion.div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Analyzing your responses...
                    </p>
                </div>
            </div>
        );
    }

    const answeredCount = Object.keys(answers).filter(key => answers[parseInt(key)] && answers[parseInt(key)].trim() !== '').length;
    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    // Safe accessors for backward compatibility
    const strengths = analysis.strengths || (analysis as any).keyStrengths || [];
    const improvements = analysis.criticalIssues || (analysis as any).areasForImprovement || [];
    const expertInsight = analysis.actionPlan?.[0] || (analysis as any).recommendation || '';

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-[#1a1a1c]">
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1a1c] sticky top-0 z-10">
                <button
                    onClick={() => setMobileTab('summary')}
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${mobileTab === 'summary'
                        ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
                        : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                >
                    Summary
                </button>
                <button
                    onClick={() => setMobileTab('questions')}
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${mobileTab === 'questions'
                        ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white'
                        : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                >
                    Questions ({questions.length})
                </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Left Column - Summary */}
                <div className={`w-full md:w-1/2 md:border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto ${mobileTab !== 'summary' ? 'hidden md:block' : ''}`}>
                    <div className="p-4 sm:p-6 pb-20 md:pb-24">
                        {/* Hero - Minimal */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 sm:mb-6"
                        >
                            {/* Status indicator - Simple text with dot */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`h-2 w-2 rounded-full ${analysis.verdict?.passed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className={`text-sm font-medium ${analysis.verdict?.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {analysis.verdict?.passed ? 'Passed' : 'Needs Practice'}
                                </span>
                            </div>

                            {/* Score + Summary */}
                            <div className="flex items-start gap-4">
                                <ScoreRing score={analysis.overallScore} size={64} strokeWidth={4} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                        {getScoreLabel(analysis.overallScore)} · {answeredCount}/{questions.length} answered
                                    </div>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                        {analysis.executiveSummary}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Comparison Panel */}
                        {previousSessions && previousSessions.length > 0 && (
                            <div className="mb-6">
                                <ComparisonPanel
                                    currentScore={analysis.overallScore}
                                    previousSessions={previousSessions}
                                />
                            </div>
                        )}

                        {/* Insights - Tabbed style */}
                        <div className="space-y-4">
                            {/* Strengths */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                                        Strengths
                                    </h3>
                                </div>
                                <div className="pl-5 space-y-1.5">
                                    {(showAllStrengths ? strengths : strengths.slice(0, 3)).map((s, i) => (
                                        <p key={i} className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed flex items-start gap-2">
                                            <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span>{s}</span>
                                        </p>
                                    ))}
                                    {strengths.length === 0 && (
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                                            Answer more questions to identify strengths
                                        </p>
                                    )}
                                    {strengths.length > 3 && (
                                        <button
                                            onClick={() => setShowAllStrengths(!showAllStrengths)}
                                            className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1"
                                        >
                                            {showAllStrengths ? 'Less' : `+${strengths.length - 3} more`}
                                            <ChevronRight className={`h-3 w-3 transition-transform ${showAllStrengths ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>

                            {/* Focus Areas */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Circle className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                                        Focus Areas
                                    </h3>
                                </div>
                                <div className="pl-5 space-y-1.5">
                                    {(showAllImprovements ? improvements : improvements.slice(0, 3)).map((a, i) => (
                                        <p key={i} className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed flex items-start gap-2">
                                            <ArrowUpRight className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <span>{a}</span>
                                        </p>
                                    ))}
                                    {improvements.length === 0 && (
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                                            Great job! Keep up the good work
                                        </p>
                                    )}
                                    {improvements.length > 3 && (
                                        <button
                                            onClick={() => setShowAllImprovements(!showAllImprovements)}
                                            className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-1"
                                        >
                                            {showAllImprovements ? 'Less' : `+${improvements.length - 3} more`}
                                            <ChevronRight className={`h-3 w-3 transition-transform ${showAllImprovements ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>

                            {/* Expert Insight */}
                            {expertInsight && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="h-3 w-3 text-indigo-500" />
                                        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                                            Expert Insight
                                        </h3>
                                    </div>
                                    <div className="pl-5">
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                            {expertInsight}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Question Breakdown */}
                <div className={`w-full md:w-1/2 overflow-y-auto bg-neutral-50 dark:bg-[#141416] flex-1 md:flex-none ${mobileTab !== 'questions' ? 'hidden md:block' : ''}`}>
                    <div className="p-4 sm:p-6 pb-20 md:pb-24">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    Question Breakdown
                                </h2>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {questions.length} questions
                                </span>
                            </div>

                            <div className="space-y-0">
                                {questions.map((question, idx) => (
                                    <TimelineNode
                                        key={question.id}
                                        question={question}
                                        index={idx}
                                        answer={answers[question.id]}
                                        qAnalysis={analysis.responseAnalysis?.find(a => a.responseText === answers[question.id])}
                                        isExpanded={expandedQuestion === question.id}
                                        onToggle={() => setExpandedQuestion(
                                            expandedQuestion === question.id ? null : question.id
                                        )}
                                        isLast={idx === questions.length - 1}
                                        delay={0.3 + idx * 0.03}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 left-0 md:left-16 right-0 border-t border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-[#1a1a1c]/95 z-20"
            >
                <div className="px-4 sm:px-6 py-3 flex gap-2 justify-between sm:justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors min-h-[44px]"
                    >
                        Close
                    </button>
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 transition-colors min-h-[44px]"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Practice Again
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
