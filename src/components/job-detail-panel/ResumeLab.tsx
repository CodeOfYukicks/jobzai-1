import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    TrendingUp,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Loader2,
    FileText,
    Target,
    Zap,
    ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SectionCard } from './SectionCard';

interface ATSAnalysis {
    id: string;
    jobTitle: string;
    company: string;
    date: string;
    matchScore: number;
    keyFindings: string[];
    skillsMatch: {
        matching: { name: string; relevance: number }[];
        missing: { name: string; relevance: number }[];
        alternative: { name: string; alternativeTo: string }[];
    };
    categoryScores: {
        skills: number;
        experience: number;
        education: number;
        industryFit: number;
    };
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

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600 dark:text-green-400';
        if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'bg-green-100 dark:bg-green-900/20';
        if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
        return 'bg-red-100 dark:bg-red-900/20';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{error || 'No CV analysis found'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Match Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <SectionCard
                    title={
                        <div className="flex items-center gap-2">
                            <span>CV Match Analysis</span>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-medium">
                                <Sparkles className="w-3 h-3" />
                                <span>AI</span>
                            </div>
                        </div>
                    }
                    icon={Target}
                >
                    <div className="space-y-4">
                        {/* Match Score */}
                        <div className={`p-6 rounded-2xl ${getScoreBg(analysis.matchScore)} border border-gray-200 dark:border-gray-700`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Overall Match Score
                                    </div>
                                    <div className={`text-4xl font-bold ${getScoreColor(analysis.matchScore)}`}>
                                        {Math.round(analysis.matchScore)}%
                                    </div>
                                </div>
                                <div className={`w-20 h-20 rounded-full border-4 ${analysis.matchScore >= 70
                                        ? 'border-green-500'
                                        : analysis.matchScore >= 50
                                            ? 'border-yellow-500'
                                            : 'border-red-500'
                                    } flex items-center justify-center`}>
                                    {analysis.matchScore >= 70 ? (
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    ) : analysis.matchScore >= 50 ? (
                                        <TrendingUp className="w-10 h-10 text-yellow-500" />
                                    ) : (
                                        <XCircle className="w-10 h-10 text-red-500" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* View Full Analysis Button */}
                        <button
                            onClick={() => navigate(`/cv-analysis/${cvAnalysisId}`)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 group"
                        >
                            <span>View Full Analysis</span>
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </SectionCard>
            </motion.div>

            {/* Category Scores */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <SectionCard title="Category Breakdown" icon={Zap}>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(analysis.categoryScores).map(([category, score], index) => (
                            <div key={category} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                                        {category === 'industryFit' ? 'Industry Fit' : category}
                                    </span>
                                    <span className={`font-semibold ${getScoreColor(score)}`}>
                                        {Math.round(score)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${score}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${score >= 70
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : score >= 50
                                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                                            }`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </motion.div>

            {/* Key Findings */}
            {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <SectionCard title="Key Findings" icon={FileText}>
                        <ul className="space-y-3">
                            {analysis.keyFindings.slice(0, 5).map((finding, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                                    className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                    <span>{finding}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </SectionCard>
                </motion.div>
            )}

            {/* Skills Match Summary */}
            {analysis.skillsMatch && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <SectionCard title="Skills Overview" icon={CheckCircle2}>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {analysis.skillsMatch.matching?.length || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Matching
                                </div>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {analysis.skillsMatch.missing?.length || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Missing
                                </div>
                            </div>
                            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {analysis.skillsMatch.alternative?.length || 0}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Alternatives
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </motion.div>
            )}
        </div>
    );
};
