import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

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

interface ResumeLabProps {
    cvAnalysisId: string;
}

export const ResumeLab = ({ cvAnalysisId }: ResumeLabProps) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!currentUser || !cvAnalysisId) return;

            setIsLoading(true);
            setError(null);

            try {
                const analysisRef = doc(db, 'users', currentUser.uid, 'analyses', cvAnalysisId);
                const analysisDoc = await getDoc(analysisRef);

                if (analysisDoc.exists()) {
                    const data = analysisDoc.data();
                    setAnalysis({
                        id: analysisDoc.id,
                        ...data
                    } as ATSAnalysis);
                } else {
                    setError('CV analysis not found');
                }
            } catch (err) {
                console.error('Error fetching CV analysis:', err);
                setError('Failed to load CV analysis');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [currentUser, cvAnalysisId]);

    // Normalize data structure
    const normalizedData = analysis ? {
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
    } : null;

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error || !analysis || !normalizedData) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{error || 'No CV analysis found'}</p>
            </div>
        );
    }

    const categoryConfig = {
        skills: { icon: Zap, label: 'Skills', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        experience: { icon: Briefcase, label: 'Experience', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        education: { icon: GraduationCap, label: 'Education', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
        industryFit: { icon: Building2, label: 'Industry Fit', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    };

    return (
        <div className="space-y-6">
            {/* Hero Score Section - Notion Style */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
            >
                <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4" />
                                <span>AI Analysis Result</span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                Match Score Analysis
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-lg">
                                Based on a detailed comparison of your CV against the job description requirements.
                            </p>
                        </div>

                        {/* Large Score Badge */}
                        <div className={`relative px-8 py-6 rounded-2xl ${getScoreBgColor(normalizedData.matchScore)} border-2 transition-all`}>
                            <div className="text-center">
                                <div className={`text-5xl font-bold ${getScoreColor(normalizedData.matchScore)} mb-1`}>
                                    {Math.round(normalizedData.matchScore)}%
                                </div>
                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Match Score
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Executive Summary - Prominent Card */}
            {normalizedData.executiveSummary && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                Executive Summary
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                AI-generated overview of your fit
                            </p>
                        </div>
                    </div>
                    <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-14">
                        {normalizedData.executiveSummary}
                    </p>
                </motion.div>
            )}

            {/* Category Scores Grid - Notion Style Property Blocks */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {Object.entries(normalizedData.categoryScores).map(([category, score], index) => {
                    const config = categoryConfig[category as keyof typeof categoryConfig];
                    const Icon = config?.icon || Zap;

                    return (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${config.bg}`}>
                                    <Icon className={`w-5 h-5 ${config.color}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {config.label}
                                    </div>
                                    <div className={`text-2xl font-bold ${getScoreColor(score)} mt-1`}>
                                        {Math.round(score)}%
                                    </div>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(score)}`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Top Strengths & Gaps - Two Column Layout */}
            {(normalizedData.topStrengths.length > 0 || normalizedData.topGaps.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Strengths */}
                    {normalizedData.topStrengths.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Top Strengths
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Your strongest assets for this role
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {normalizedData.topStrengths.slice(0, 5).map((strength, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + index * 0.05 }}
                                        className="p-4 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="mt-0.5 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                                        {strength.name}
                                                    </h5>
                                                    {strength.example_from_resume && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">
                                                            "{strength.example_from_resume}"
                                                        </p>
                                                    )}
                                                    {strength.why_it_matters && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                            {strength.why_it_matters}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold flex-shrink-0`}>
                                                {strength.score}%
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Top Gaps */}
                    {normalizedData.topGaps.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Areas to Improve
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Gaps to address for better fit
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {normalizedData.topGaps.slice(0, 5).map((gap, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + index * 0.05 }}
                                        className="p-4 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                    >
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="mt-0.5 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                                                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {gap.name}
                                                    </h5>
                                                    {gap.severity && (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityColor(gap.severity)}`}>
                                                            {gap.severity}
                                                        </span>
                                                    )}
                                                </div>
                                                {gap.why_it_matters && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                                                        {gap.why_it_matters}
                                                    </p>
                                                )}
                                                {gap.how_to_fix && (
                                                    <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            How to fix:
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                            {gap.how_to_fix}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Skills Overview - Clean Stat Cards */}
            {normalizedData.skillsMatch && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Matching Skills
                                </div>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                                    {normalizedData.skillsMatch.matching?.length || 0}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Skills found in your CV
                        </div>
                    </div>

                    <div className="rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Missing Skills
                                </div>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                                    {normalizedData.skillsMatch.missing?.length || 0}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Critical skills to add
                        </div>
                    </div>

                    <div className="rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Alternatives
                                </div>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    {normalizedData.skillsMatch.alternative?.length || 0}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            Similar skills found
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Key Findings (Fallback if no top strengths/gaps) */}
            {normalizedData.keyFindings.length > 0 && normalizedData.topStrengths.length === 0 && normalizedData.topGaps.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Key Findings</h4>
                    </div>
                    <div className="space-y-3">
                        {normalizedData.keyFindings.slice(0, 5).map((finding, index) => (
                            <div key={index} className="flex items-start gap-3 group">
                                <div className="mt-1 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                                    {finding}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* View Full Report Button */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center pt-4"
            >
                <button
                    onClick={() => navigate(`/ats-analysis/${cvAnalysisId}`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-medium shadow-lg shadow-gray-900/10 hover:shadow-xl"
                >
                    <span>View Full Report</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </motion.div>
        </div>
    );
};
