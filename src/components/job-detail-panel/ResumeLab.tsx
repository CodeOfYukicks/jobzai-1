import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Loader2,
    FileText,
    Zap,
    GraduationCap,
    Briefcase,
    Building2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Info,
    ChevronDown,
    Calendar,
    Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, isValid } from 'date-fns';

interface ATSAnalysis {
    id: string;
    jobTitle: string;
    company: string;
    date: string;
    matchScore?: number;
    match_scores?: {
        overall_score: number;
        skills_score: number;
        experience_score: number;
        education_score: number;
        industry_fit_score: number;
    };
    categoryScores?: {
        skills: number;
        experience: number;
        education: number;
        industryFit: number;
    };
    keyFindings?: string[];
    executiveSummary?: string;
    executive_summary?: string;
    skillsMatch?: {
        matching: { name: string; relevance: number }[];
        missing: { name: string; relevance: number }[];
        alternative: { name: string; alternativeTo: string }[];
    };
    top_strengths?: Array<{
        name: string;
        score: number;
        example_from_resume?: string;
        why_it_matters?: string;
    }>;
    top_gaps?: Array<{
        name: string;
        severity?: 'Low' | 'Medium' | 'High';
        why_it_matters?: string;
        how_to_fix?: string;
    }>;
}

interface NormalizedAnalysis {
    id: string;
    jobTitle: string;
    company: string;
    date: string;
    matchScore: number;
    categoryScores: {
        skills: number;
        experience: number;
        education: number;
        industryFit: number;
    };
    executiveSummary: string;
    topStrengths: Array<{
        name: string;
        score: number;
        example_from_resume?: string;
        why_it_matters?: string;
    }>;
    topGaps: Array<{
        name: string;
        severity?: 'Low' | 'Medium' | 'High';
        why_it_matters?: string;
        how_to_fix?: string;
    }>;
    skillsMatch?: {
        matching: { name: string; relevance: number }[];
        missing: { name: string; relevance: number }[];
        alternative: { name: string; alternativeTo: string }[];
    };
    keyFindings: string[];
}

interface JobInfo {
    id: string;
    position: string;
    companyName: string;
    fullJobDescription?: string;
    description?: string;
    url?: string;
}

interface ResumeLabProps {
    cvAnalysisIds?: string[];  // Array of analysis IDs
    cvAnalysisId?: string;     // Backwards compat with single ID
    job?: JobInfo;             // Job info for navigation to CV Analysis page
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

// Normalize analysis data structure
const normalizeAnalysis = (analysis: ATSAnalysis): NormalizedAnalysis => {
    return {
        id: analysis.id,
        jobTitle: analysis.jobTitle || 'Untitled Analysis',
        company: analysis.company || '',
        date: analysis.date || new Date().toISOString(),
        matchScore: analysis.match_scores?.overall_score ?? analysis.matchScore ?? 0,
        categoryScores: {
            skills: analysis.match_scores?.skills_score ?? analysis.categoryScores?.skills ?? 0,
            experience: analysis.match_scores?.experience_score ?? analysis.categoryScores?.experience ?? 0,
            education: analysis.match_scores?.education_score ?? analysis.categoryScores?.education ?? 0,
            industryFit: analysis.match_scores?.industry_fit_score ?? analysis.categoryScores?.industryFit ?? 0,
        },
        executiveSummary: analysis.executive_summary ?? analysis.executiveSummary ?? '',
        topStrengths: analysis.top_strengths ?? (analysis.skillsMatch?.matching 
            ? analysis.skillsMatch.matching
                .sort((a, b) => b.relevance - a.relevance)
                .slice(0, 5)
                .map(skill => ({
                    name: skill.name,
                    score: skill.relevance,
                    example_from_resume: '',
                    why_it_matters: ''
                }))
            : []),
        topGaps: analysis.top_gaps ?? (analysis.skillsMatch?.missing
            ? analysis.skillsMatch.missing
                .sort((a, b) => b.relevance - a.relevance)
                .slice(0, 5)
                .map(skill => ({
                    name: skill.name,
                    severity: skill.relevance < 30 ? 'High' as const : skill.relevance < 60 ? 'Medium' as const : 'Low' as const,
                    why_it_matters: '',
                    how_to_fix: ''
                }))
            : []),
        skillsMatch: analysis.skillsMatch,
        keyFindings: analysis.keyFindings ?? []
    };
};

export const ResumeLab = ({ cvAnalysisIds, cvAnalysisId, job }: ResumeLabProps) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [analyses, setAnalyses] = useState<NormalizedAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Merge IDs from both props for backwards compatibility
    const allAnalysisIds = useCallback(() => {
        const ids = new Set<string>();
        if (cvAnalysisIds) {
            cvAnalysisIds.forEach(id => ids.add(id));
        }
        if (cvAnalysisId && !ids.has(cvAnalysisId)) {
            ids.add(cvAnalysisId);
        }
        return Array.from(ids);
    }, [cvAnalysisIds, cvAnalysisId]);

    useEffect(() => {
        const fetchAnalyses = async () => {
            if (!currentUser) return;
            
            const ids = allAnalysisIds();
            if (ids.length === 0) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const fetchedAnalyses: NormalizedAnalysis[] = [];
                
                for (const id of ids) {
                    try {
                        const analysisRef = doc(db, 'users', currentUser.uid, 'analyses', id);
                        const analysisDoc = await getDoc(analysisRef);

                        if (analysisDoc.exists()) {
                            const data = analysisDoc.data();
                            const analysis: ATSAnalysis = {
                                id: analysisDoc.id,
                                ...data
                            } as ATSAnalysis;
                            fetchedAnalyses.push(normalizeAnalysis(analysis));
                        }
                    } catch (err) {
                        console.error(`Error fetching analysis ${id}:`, err);
                    }
                }

                // Sort by date, most recent first
                fetchedAnalyses.sort((a, b) => {
                    const dateA = parseDate(a.date).getTime();
                    const dateB = parseDate(b.date).getTime();
                    return dateB - dateA;
                });

                setAnalyses(fetchedAnalyses);
                
                if (fetchedAnalyses.length === 0) {
                    setError('No CV analyses found');
                }
            } catch (err) {
                console.error('Error fetching CV analyses:', err);
                setError('Failed to load CV analyses');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalyses();
    }, [currentUser, allAnalysisIds]);

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

    const getSeverityColor = (severity?: string) => {
        if (severity === 'High') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
        if (severity === 'Medium') return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    };

    const formatAnalysisDate = (dateStr: string) => {
        try {
            const date = parseDate(dateStr);
            return format(date, 'MMM d, yyyy');
        } catch {
            return 'Unknown date';
        }
    };

    const categoryConfig = {
        skills: { icon: Zap, label: 'Skills', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        experience: { icon: Briefcase, label: 'Experience', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        education: { icon: GraduationCap, label: 'Education', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        industryFit: { icon: Building2, label: 'Industry Fit', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
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
    if (error || analyses.length === 0) {
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-indigo-100/50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl blur-2xl" />
                        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center border border-purple-100 dark:border-purple-800/30 shadow-sm">
                            <Target className="w-7 h-7 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                        </div>
                    </motion.div>

                    <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight"
                    >
                        No CV Analyses Yet
                    </motion.h3>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed"
                    >
                        Analyze your CV against this job to get detailed insights, 
                        match scores, and actionable recommendations to improve your chances.
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/cv-analysis', {
                            state: job ? {
                                jobTitle: job.position,
                                company: job.companyName,
                                jobDescription: job.fullJobDescription || job.description || '',
                                jobUrl: job.url || '',
                                fromApplication: true,
                                jobId: job.id,
                            } : undefined
                        })}
                        className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium text-sm transition-all duration-300 shadow-md shadow-gray-900/10 dark:shadow-white/10 hover:shadow-lg hover:shadow-gray-900/20 dark:hover:shadow-white/20"
                    >
                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                        <span>Start CV Analysis</span>
                    </motion.button>
                </div>
            </motion.div>
        );
    }

    // Render analysis card content
    const renderAnalysisContent = (analysis: NormalizedAnalysis) => (
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
                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Executive Summary
                            </h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-9">
                        {analysis.executiveSummary}
                    </p>
                </motion.div>
            )}

            {/* Category Scores Grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            >
                {Object.entries(analysis.categoryScores).map(([category, score], index) => {
                    const config = categoryConfig[category as keyof typeof categoryConfig];
                    const Icon = config?.icon || Zap;

                    return (
                        <div
                            key={category}
                            className="group relative overflow-hidden rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4 hover:shadow-sm transition-all"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`p-1.5 rounded-md ${config.bg}`}>
                                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                </div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {config.label}
                                </span>
                                    </div>
                            <div className={`text-xl font-bold ${getScoreColor(score)} mb-2`}>
                                        {Math.round(score)}%
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 0.6, delay: 0.15 + index * 0.05 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(score)}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </motion.div>

            {/* Top Strengths & Gaps */}
            {(analysis.topStrengths.length > 0 || analysis.topGaps.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top Strengths */}
                    {analysis.topStrengths.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Top Strengths
                                    </h4>
                            </div>
                            <div className="space-y-2.5">
                                {analysis.topStrengths.slice(0, 3).map((strength, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2.5 rounded-md bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                                                        {strength.name}
                                        </span>
                                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded">
                                                {strength.score}%
                                        </span>
                                        </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Top Gaps */}
                    {analysis.topGaps.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-lg bg-white dark:bg-[#2b2a2c]/50 border border-gray-100 dark:border-[#3d3c3e]/50 p-4"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Areas to Improve
                                    </h4>
                            </div>
                            <div className="space-y-2.5">
                                {analysis.topGaps.slice(0, 3).map((gap, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2.5 rounded-md bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30"
                                    >
                                        <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                                                        {gap.name}
                                        </span>
                                                    {gap.severity && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getSeverityColor(gap.severity)}`}>
                                                            {gap.severity}
                                                        </span>
                                                    )}
                                                </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Skills Overview Stats */}
            {analysis.skillsMatch && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <div className="rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {analysis.skillsMatch.matching?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Matching
                        </div>
                    </div>

                    <div className="rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {analysis.skillsMatch.missing?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Missing
                        </div>
                    </div>

                    <div className="rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analysis.skillsMatch.alternative?.length || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            Alternatives
                        </div>
                    </div>
                </motion.div>
            )}

            {/* View Full Report Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center pt-2"
            >
                <button
                    onClick={() => navigate(`/ats-analysis/${analysis.id}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-medium text-sm shadow-md shadow-gray-900/10 hover:shadow-lg"
                >
                    <span>View Full Report</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </motion.div>
        </div>
    );

    // Main render - collapsible list
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            CV Analyses
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} for this job
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/cv-analysis', {
                        state: job ? {
                            jobTitle: job.position,
                            company: job.companyName,
                            jobDescription: job.fullJobDescription || job.description || '',
                            jobUrl: job.url || '',
                            fromApplication: true,
                            jobId: job.id,
                        } : undefined
                    })}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg hover:bg-gray-50 dark:hover:bg-[#3d3c3e] transition-all"
                >
                    <Sparkles className="w-4 h-4" />
                    New Analysis
                </button>
            </div>

            {/* Collapsible Analysis Cards */}
            <div className="space-y-3">
                {analyses.map((analysis, index) => {
                    const isExpanded = expandedIds.has(analysis.id);
                    
                    return (
                        <motion.div
                            key={analysis.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`rounded-xl border transition-all duration-300 ${
                                isExpanded 
                                    ? 'border-purple-200 dark:border-purple-800/50 shadow-lg shadow-purple-500/5 dark:shadow-purple-500/10 bg-white dark:bg-[#242325]' 
                                    : 'border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700'
                            }`}
                        >
                            {/* Collapsed Header - Always Visible */}
                            <button
                                onClick={() => toggleExpanded(analysis.id)}
                                className="w-full p-5 flex items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded-xl"
                            >
                                {/* Score Circle */}
                                <div className={`relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ring-4 ${getScoreRingColor(analysis.matchScore)} ${getScoreBgColor(analysis.matchScore)} border`}>
                                    <span className={`text-lg font-bold ${getScoreColor(analysis.matchScore)}`}>
                                        {Math.round(analysis.matchScore)}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#2b2a2c] text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {formatAnalysisDate(analysis.date)}
                                        </span>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {analysis.jobTitle}
                                    </h4>
                                    {analysis.company && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {analysis.company}
                                        </p>
                                    )}
                                    {!isExpanded && analysis.executiveSummary && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                            {analysis.executiveSummary}
                                        </p>
                                    )}
                                </div>

                                {/* Expand/Collapse Icon */}
                                <div className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                                    isExpanded 
                                        ? 'bg-purple-100 dark:bg-purple-900/30' 
                                        : 'bg-gray-100 dark:bg-[#2b2a2c] group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                                }`}>
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className={`w-5 h-5 ${
                                            isExpanded 
                                                ? 'text-purple-600 dark:text-purple-400' 
                                                : 'text-gray-400 dark:text-gray-500'
                                        }`} />
                                    </motion.div>
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
                                            {renderAnalysisContent(analysis)}
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
