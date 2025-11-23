import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, Award, BarChart2,
    Sparkles, AlertTriangle, ThumbsUp, ChevronDown, ChevronUp,
    Target, Zap, BookOpen, RefreshCw, ArrowUpRight, TrendingUp,
    MessageSquare, Clock, Star, AlertCircle, Info
} from 'lucide-react';
import { QuestionEntry, InterviewAnalysis, AnswerAnalysis } from '../../../types/interview';

interface LiveInterviewResultsProps {
    questions: QuestionEntry[];
    answers: Record<number, string>;
    analysis: InterviewAnalysis | null;
    onClose: () => void;
    onRetry: () => void;
}

export const LiveInterviewResults: React.FC<LiveInterviewResultsProps> = ({
    questions,
    answers,
    analysis,
    onClose,
    onRetry,
}) => {
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    // Loading state
    if (!analysis) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center p-6">
                <div className="text-center">
                    <div className="mb-4 inline-flex items-center justify-center rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/30">
                        <Sparkles className="h-8 w-8 animate-pulse text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Analyzing Your Performance</h2>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Our AI expert is reviewing your answers...
                    </p>
                </div>
            </div>
        );
    }

    // Helper functions
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 40) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getScoreBgLight = (score: number) => {
        if (score >= 80) return 'bg-green-50 dark:bg-green-900/10';
        if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/10';
        if (score >= 40) return 'bg-orange-50 dark:bg-orange-900/10';
        return 'bg-red-50 dark:bg-red-900/10';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    // Calculate stats
    const answeredCount = Object.keys(answers).filter(key => answers[parseInt(key)] && answers[parseInt(key)].trim() !== '').length;
    const skippedCount = questions.length - answeredCount;
    const completionRate = Math.round((answeredCount / questions.length) * 100);

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-[#0c0c0e] dark:to-[#1a1a1c]">
            <div className="mx-auto w-full max-w-6xl p-6 pb-24">
                
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="text-center mb-6">
                        {/* Status Badge */}
                    <div className="mb-6 inline-flex items-center justify-center">
                        {analysis.passed ? (
                            <div className="relative">
                                <div className="absolute -inset-4 animate-pulse rounded-full bg-green-500/20 blur-xl" />
                                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl">
                                    <Award className="h-12 w-12 text-white" />
                                </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-700 shadow-lg ring-2 ring-green-500/30 dark:bg-green-900/80 dark:text-green-300">
                                        ✓ Passed
                                    </div>
                            </div>
                        ) : (
                            <div className="relative">
                                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-2xl">
                                    <Target className="h-12 w-12 text-white" />
                                </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 shadow-lg ring-2 ring-amber-500/30 dark:bg-amber-900/80 dark:text-amber-300">
                                    Needs Work
                                </div>
                            </div>
                        )}
                    </div>

                        <h1 className="mb-3 text-4xl font-bold text-neutral-900 dark:text-white">
                            {analysis.passed ? 'Great Performance!' : 'Keep Practicing!'}
                    </h1>
                        <p className="mx-auto max-w-3xl text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {analysis.executiveSummary}
                    </p>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Overall Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Overall Score</h3>
                            <BarChart2 className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                                {analysis.overallScore}
                            <span className="text-lg text-neutral-400">/100</span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-neutral-500">
                            {getScoreLabel(analysis.overallScore)}
                        </div>
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.overallScore}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className={`h-full ${getScoreBg(analysis.overallScore)}`}
                            />
                        </div>
                    </motion.div>

                    {/* Completion Rate */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Completion</h3>
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                            {completionRate}
                            <span className="text-lg text-neutral-400">%</span>
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                            {answeredCount} of {questions.length} answered
                        </div>
                    </motion.div>

                    {/* Strengths */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Strengths</h3>
                            <ThumbsUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                            {analysis.keyStrengths.length}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                            Key strong points
                        </div>
                    </motion.div>

                    {/* Areas to Improve */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Focus Areas</h3>
                            <Target className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                            {analysis.areasForImprovement.length}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                            Areas to improve
                        </div>
                    </motion.div>
                </div>

                {/* Key Insights Grid */}
                <div className="mb-8 grid gap-6 lg:grid-cols-2">
                    {/* Strengths */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg ring-1 ring-green-500/20 dark:from-green-900/10 dark:to-emerald-900/10 dark:ring-green-500/20"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 shadow-lg">
                                <ThumbsUp className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-green-900 dark:text-green-100">What Worked Well</h3>
                        </div>
                        <ul className="space-y-3">
                            {analysis.keyStrengths.length > 0 ? (
                                analysis.keyStrengths.map((strength, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-green-800 dark:text-green-200">
                                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                                        <span className="leading-relaxed">{strength}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="flex items-start gap-3 text-sm text-green-700 dark:text-green-300 italic">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                                    <span>Answer more questions to identify your strengths</span>
                                </li>
                            )}
                        </ul>
                    </motion.div>

                    {/* Areas for Improvement */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                        className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg ring-1 ring-amber-500/20 dark:from-amber-900/10 dark:to-orange-900/10 dark:ring-amber-500/20"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">Focus on These</h3>
                        </div>
                        <ul className="space-y-3">
                            {analysis.areasForImprovement.length > 0 ? (
                                analysis.areasForImprovement.map((area, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-amber-800 dark:text-amber-200">
                                        <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <span className="leading-relaxed">{area}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300 italic">
                                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                                    <span>Great job! Keep up the good work</span>
                                </li>
                            )}
                        </ul>
                    </motion.div>
                </div>

                {/* HR Recommendation */}
                {analysis.recommendation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-lg ring-1 ring-indigo-500/20 dark:from-indigo-900/10 dark:to-purple-900/10 dark:ring-indigo-500/20"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg">
                                <Star className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">HR Recommendation</h3>
                        </div>
                        <p className="text-base leading-relaxed text-indigo-800 dark:text-indigo-200">
                            {analysis.recommendation}
                        </p>
                    </motion.div>
                )}

                {/* Detailed Question Analysis */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Question-by-Question Breakdown</h2>
                        <span className="rounded-full bg-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                            {questions.length} Questions
                        </span>
                    </div>

                    {questions.map((question, idx) => {
                        const answer = answers[question.id];
                        const hasAnswer = answer && answer.trim() !== '';
                        const qAnalysis = analysis.answerAnalyses.find(a => a.questionId === question.id);
                        const isExpanded = expandedQuestion === question.id;

                        // Calculate score - use analysis score if available, otherwise 0 for skipped
                        const score = qAnalysis?.score ?? 0;

                        return (
                            <motion.div
                                key={question.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 + idx * 0.05 }}
                                className={`overflow-hidden rounded-2xl border-2 shadow-lg transition-all ${
                                    hasAnswer
                                        ? 'border-neutral-200 bg-white dark:border-white/10 dark:bg-[#1c1c1e]'
                                        : 'border-neutral-200 bg-neutral-50 dark:border-white/5 dark:bg-neutral-900/50'
                                }`}
                            >
                                {/* Question Header */}
                                <div
                                    className="cursor-pointer p-6 transition-colors hover:bg-neutral-50 dark:hover:bg-white/5"
                                    onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="mb-3 flex items-center gap-2 flex-wrap">
                                                <span className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                    Question {idx + 1}
                                                </span>
                                                {question.tags.map(tag => (
                                                    <span key={tag} className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {!hasAnswer && (
                                                    <span className="rounded-lg bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                                                        Skipped
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold leading-snug text-neutral-900 dark:text-white">
                                                {question.text}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {hasAnswer ? (
                                            <div className="text-right">
                                                    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                                                        {score}
                                                    </div>
                                                    <div className="text-xs font-medium text-neutral-500">
                                                        {getScoreLabel(score)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-neutral-400">
                                                        —
                                                    </div>
                                                    <div className="text-xs font-medium text-neutral-500">
                                                        No answer
                                                    </div>
                                            </div>
                                            )}
                                            {isExpanded ? 
                                                <ChevronUp className="h-6 w-6 text-neutral-400" /> : 
                                                <ChevronDown className="h-6 w-6 text-neutral-400" />
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t-2 border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 px-6 py-6 dark:border-white/10 dark:from-black/20 dark:to-black/30"
                                        >
                                            {hasAnswer && qAnalysis ? (
                                                <div className="space-y-6">
                                                    {/* Your Answer */}
                                                <div>
                                                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                                                            <MessageSquare className="h-4 w-4" />
                                                            Your Answer
                                                        </h4>
                                                        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1c1c1e]">
                                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                                                {answer}
                                                            </p>
                                                    </div>
                                                </div>

                                                    {/* STAR Method Evaluation */}
                                                    {qAnalysis.starEvaluation && (
                                                        <div>
                                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                                                                <Star className="h-4 w-4" />
                                                                STAR Method Analysis
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                                                {(['situation', 'task', 'action', 'result'] as const).map((key) => {
                                                                    const present = qAnalysis.starEvaluation?.[key];
                                                                    return (
                                                                        <div
                                                                            key={key}
                                                                            className={`rounded-xl border-2 p-4 text-center transition-all ${
                                                                                present
                                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                                    : 'border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                                                                            }`}
                                                                        >
                                                                            {present ? (
                                                                                <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
                                                                            ) : (
                                                                                <XCircle className="mx-auto mb-2 h-6 w-6 text-neutral-400" />
                                                                            )}
                                                                            <div className={`text-xs font-bold uppercase tracking-wider ${
                                                                                present ? 'text-green-700 dark:text-green-300' : 'text-neutral-500'
                                                                            }`}>
                                                                                {key}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Highlights */}
                                                    {qAnalysis.highlights && qAnalysis.highlights.length > 0 && (
                                                        <div>
                                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                                                                <Sparkles className="h-4 w-4" />
                                                                Key Points
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {qAnalysis.highlights.map((highlight, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={`rounded-xl border-2 p-4 ${
                                                                            highlight.type === 'strength'
                                                                                ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10'
                                                                                : highlight.type === 'improvement'
                                                                                ? 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10'
                                                                                : 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                                                                        }`}
                                                                    >
                                                                        <div className="mb-2 flex items-center gap-2">
                                                                            {highlight.type === 'strength' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                                                            {highlight.type === 'improvement' && <Zap className="h-5 w-5 text-amber-600" />}
                                                                            {highlight.type === 'weakness' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                                                                            <span className={`font-semibold ${
                                                                                highlight.type === 'strength' ? 'text-green-700 dark:text-green-300' :
                                                                                highlight.type === 'improvement' ? 'text-amber-700 dark:text-amber-300' :
                                                                                'text-red-700 dark:text-red-300'
                                                                            }`}>
                                                                                "{highlight.text}"
                                                                        </span>
                                                                        </div>
                                                                        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 pl-7">
                                                                            {highlight.comment}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Feedback */}
                                                    {qAnalysis.feedback && (
                                                        <div>
                                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                                                                <BookOpen className="h-4 w-4" />
                                                                Detailed Feedback
                                                            </h4>
                                                            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-900/30 dark:bg-indigo-900/10">
                                                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-indigo-900 dark:text-indigo-100">
                                                                    {qAnalysis.feedback}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Suggestions */}
                                                    {qAnalysis.suggestions && qAnalysis.suggestions.length > 0 && (
                                                        <div>
                                                            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
                                                                <TrendingUp className="h-4 w-4" />
                                                                How to Improve
                                                            </h4>
                                                            <ul className="space-y-2">
                                                                {qAnalysis.suggestions.map((suggestion, idx) => (
                                                                    <li key={idx} className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-100">
                                                                        <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
                                                                        <span className="leading-relaxed">{suggestion}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    </div>
                                            ) : (
                                                // No answer provided
                                                <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-100 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
                                                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-neutral-400" />
                                                    <h4 className="mb-2 text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                                                        No Answer Provided
                                                    </h4>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        You skipped this question. Consider answering all questions to get a complete evaluation.
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
                >
                        <button
                            onClick={onRetry}
                        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-xl transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                        >
                            <RefreshCw className="h-5 w-5" />
                        Try Again
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-white px-8 py-4 text-base font-semibold text-neutral-700 shadow-lg transition-all hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus:ring-4 focus:ring-neutral-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-700"
                    >
                        Close
                        </button>
                </motion.div>
            </div>
        </div>
    );
};
