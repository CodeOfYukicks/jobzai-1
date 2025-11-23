import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, Award, BarChart2,
    Sparkles, AlertTriangle, ThumbsUp, ChevronDown, ChevronUp,
    Target, Zap, BookOpen, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { QuestionEntry, InterviewAnalysis, AnswerAnalysis } from '../../../types/interview';
import { useAuth } from '../../../contexts/AuthContext';

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
    const { currentUser } = useAuth();
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const renderHighlightedText = (text: string, highlights: AnswerAnalysis['highlights']) => {
        if (!highlights || highlights.length === 0) return <p className="text-neutral-700 dark:text-neutral-300">{text}</p>;

        return (
            <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {text.split('\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className="mb-2">
                        {paragraph}
                    </p>
                ))}

                {/* Highlights Legend/Cards below text */}
                <div className="mt-4 space-y-2">
                    {highlights.map((highlight, idx) => (
                        <div
                            key={idx}
                            className={`rounded-lg border p-3 text-sm ${highlight.type === 'strength'
                                    ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10'
                                    : highlight.type === 'improvement'
                                        ? 'border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10'
                                        : 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                                }`}
                        >
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                {highlight.type === 'strength' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {highlight.type === 'improvement' && <Zap className="h-4 w-4 text-amber-600" />}
                                {highlight.type === 'weakness' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                                <span className={
                                    highlight.type === 'strength' ? 'text-green-700 dark:text-green-400' :
                                        highlight.type === 'improvement' ? 'text-amber-700 dark:text-amber-400' :
                                            'text-red-700 dark:text-red-400'
                                }>
                                    "{highlight.text}"
                                </span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 pl-6">
                                {highlight.comment}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-neutral-50 dark:bg-[#0c0c0e]">
            <div className="mx-auto w-full max-w-5xl p-6 pb-24">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <div className="mb-6 inline-flex items-center justify-center">
                        {analysis.passed ? (
                            <div className="relative">
                                <div className="absolute -inset-4 animate-pulse rounded-full bg-green-500/20 blur-xl" />
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-xl">
                                    <Award className="h-12 w-12 text-white" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-700 shadow-sm ring-1 ring-green-500/20 dark:bg-green-900/80 dark:text-green-300">
                                    Passed
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-600 shadow-xl">
                                    <Target className="h-12 w-12 text-white" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700 shadow-sm ring-1 ring-red-500/20 dark:bg-red-900/80 dark:text-red-300">
                                    Needs Work
                                </div>
                            </div>
                        )}
                    </div>

                    <h1 className="mb-2 text-4xl font-bold text-neutral-900 dark:text-white">
                        {analysis.passed ? 'Excellent Work!' : 'Keep Practicing!'}
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
                        {analysis.executiveSummary}
                    </p>
                </motion.div>

                {/* Score Overview Cards */}
                <div className="mb-12 grid gap-6 md:grid-cols-3">
                    {/* Overall Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">Overall Score</h3>
                            <BarChart2 className="h-5 w-5 text-neutral-400" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                                {analysis.overallScore}
                            </span>
                            <span className="mb-2 text-lg font-medium text-neutral-400">/100</span>
                        </div>
                        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.overallScore}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${getScoreBg(analysis.overallScore)}`}
                            />
                        </div>
                    </motion.div>

                    {/* Key Strengths */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 ring-1 ring-green-100 dark:from-green-900/10 dark:to-emerald-900/10 dark:ring-green-900/20"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <h3 className="font-semibold text-green-900 dark:text-green-100">Top Strengths</h3>
                        </div>
                        <ul className="space-y-2">
                            {analysis.keyStrengths.slice(0, 3).map((strength, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Areas for Improvement */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 ring-1 ring-amber-100 dark:from-amber-900/10 dark:to-orange-900/10 dark:ring-amber-900/20"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Focus Areas</h3>
                        </div>
                        <ul className="space-y-2">
                            {analysis.areasForImprovement.slice(0, 3).map((area, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
                                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    {area}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Detailed Question Analysis */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Detailed Analysis</h2>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {questions.length} Questions
                        </span>
                    </div>

                    {questions.map((question, idx) => {
                        const answer = answers[question.id];
                        const qAnalysis = analysis.answerAnalyses.find(a => a.questionId === question.id);
                        const isExpanded = expandedQuestion === question.id;

                        if (!qAnalysis) return null;

                        return (
                            <motion.div
                                key={question.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#1c1c1e]"
                            >
                                {/* Question Header */}
                                <div
                                    className="cursor-pointer p-6 hover:bg-neutral-50 dark:hover:bg-white/5"
                                    onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-400">
                                                    Question {idx + 1}
                                                </span>
                                                {question.tags.map(tag => (
                                                    <span key={tag} className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                                {question.text}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`text-2xl font-bold ${getScoreColor(qAnalysis.score)}`}>
                                                    {qAnalysis.score}
                                                </div>
                                                <div className="text-xs text-neutral-500">Score</div>
                                            </div>
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-neutral-400" /> : <ChevronDown className="h-5 w-5 text-neutral-400" />}
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
                                            className="border-t border-neutral-200 bg-neutral-50/50 px-6 py-6 dark:border-white/10 dark:bg-black/20"
                                        >
                                            <div className="grid gap-8 lg:grid-cols-2">
                                                {/* Left Column: Answer & Highlights */}
                                                <div>
                                                    <h4 className="mb-4 flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                            <BookOpen className="h-3 w-3" />
                                                        </div>
                                                        Your Answer Analysis
                                                    </h4>
                                                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1c1c1e]">
                                                        {answer ? (
                                                            renderHighlightedText(answer, qAnalysis.highlights)
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-neutral-500 italic">
                                                                <XCircle className="h-4 w-4" />
                                                                No answer recorded for this question.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column: Feedback & STAR */}
                                                <div className="space-y-6">
                                                    {/* STAR Evaluation (if available) */}
                                                    {qAnalysis.starEvaluation && (
                                                        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10">
                                                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                                STAR Method Check
                                                            </h4>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {Object.entries(qAnalysis.starEvaluation).map(([key, value]) => (
                                                                    <div key={key} className="text-center">
                                                                        <div className="mb-2 flex h-full flex-col justify-end">
                                                                            <div className="relative h-24 w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-white/5">
                                                                                <motion.div
                                                                                    initial={{ height: 0 }}
                                                                                    animate={{ height: `${value}%` }}
                                                                                    className={`absolute bottom-0 w-full ${getScoreBg(value)}`}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400">
                                                                            {key.slice(0, 1)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Strengths & Improvements */}
                                                    <div className="grid gap-4">
                                                        <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/10">
                                                            <h5 className="mb-2 flex items-center gap-2 font-medium text-green-900 dark:text-green-100">
                                                                <ThumbsUp className="h-4 w-4" />
                                                                What Worked Well
                                                            </h5>
                                                            <ul className="ml-6 list-disc space-y-1 text-sm text-green-800 dark:text-green-200">
                                                                {qAnalysis.strengths.map((s, i) => (
                                                                    <li key={i}>{s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/10">
                                                            <h5 className="mb-2 flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
                                                                <Zap className="h-4 w-4" />
                                                                Better Next Time
                                                            </h5>
                                                            <ul className="ml-6 list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
                                                                {qAnalysis.suggestions.map((s, i) => (
                                                                    <li key={i}>{s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Action Items & Footer */}
                <div className="mt-12 rounded-2xl bg-indigo-600 p-8 text-white shadow-xl dark:bg-indigo-900/50">
                    <h2 className="mb-6 text-2xl font-bold">Recommended Next Steps</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {analysis.actionItems.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                                    {i + 1}
                                </div>
                                <p className="text-indigo-50">{item}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <button
                            onClick={onClose}
                            className="rounded-full bg-white px-8 py-3 font-semibold text-indigo-600 shadow-lg transition hover:bg-indigo-50"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-3 font-semibold text-white transition hover:bg-white/10"
                        >
                            <RefreshCw className="h-5 w-5" />
                            Practice Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
