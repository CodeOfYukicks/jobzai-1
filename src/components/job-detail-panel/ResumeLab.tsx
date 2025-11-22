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
    AlertCircle
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

    const getScoreGradient = (score: number) => {
        if (score >= 70) return 'from-green-500 to-emerald-500';
        if (score >= 50) return 'from-yellow-500 to-amber-500';
        return 'from-red-500 to-rose-500';
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

    const categoryConfig = {
        skills: { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500' },
        experience: { icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500' },
        education: { icon: GraduationCap, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500' },
        industryFit: { icon: Building2, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500' },
    };

    return (
        <div className="space-y-8">
            {/* Match Score Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
                <div className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4" />
                                <span>AI Analysis Result</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Match Score Analysis
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                Based on a detailed comparison of your CV against the job description requirements.
                            </p>

                            <button
                                onClick={() => navigate(`/ats-analysis/${cvAnalysisId}`)}
                                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-medium shadow-lg shadow-gray-900/10"
                            >
                                <span>View Full Report</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="relative">
                            {/* Circular Progress */}
                            <div className="w-40 h-40 relative flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-gray-100 dark:text-gray-800"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * analysis.matchScore) / 100}
                                        className={`${getScoreColor(analysis.matchScore)} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-4xl font-bold ${getScoreColor(analysis.matchScore)}`}>
                                        {Math.round(analysis.matchScore)}%
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-1">
                                        Match
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Category Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.categoryScores).map(([category, score], index) => {
                    const config = categoryConfig[category as keyof typeof categoryConfig];
                    const Icon = config?.icon || Zap;

                    return (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white dark:bg-gray-900 rounded-xl border-t-4 ${config?.border || 'border-gray-500'} border-x border-b border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${config?.bg || 'bg-gray-100'} ${config?.color || 'text-gray-500'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                        {category === 'industryFit' ? 'Industry Fit' : category}
                                    </h4>
                                </div>
                                <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                                    {Math.round(score)}%
                                </span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(score)}`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Key Findings */}
            {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Key Findings</h4>
                    </div>
                    <div className="space-y-4">
                        {analysis.keyFindings.slice(0, 5).map((finding, index) => (
                            <div key={index} className="flex items-start gap-4 group">
                                <div className="mt-1 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                    {finding}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Skills Overview */}
            {analysis.skillsMatch && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30 p-5">
                        <div className="flex items-center gap-2 mb-2 text-green-700 dark:text-green-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Matching Skills</span>
                        </div>
                        <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                            {analysis.skillsMatch.matching?.length || 0}
                        </div>
                        <div className="text-xs text-green-600/80 dark:text-green-400/80">
                            Skills found in your CV
                        </div>
                    </div>

                    <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30 p-5">
                        <div className="flex items-center gap-2 mb-2 text-red-700 dark:text-red-400 font-semibold">
                            <XCircle className="w-4 h-4" />
                            <span>Missing Skills</span>
                        </div>
                        <div className="text-3xl font-bold text-red-700 dark:text-red-400 mb-1">
                            {analysis.skillsMatch.missing?.length || 0}
                        </div>
                        <div className="text-xs text-red-600/80 dark:text-red-400/80">
                            Critical skills to add
                        </div>
                    </div>

                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 p-5">
                        <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            <span>Alternatives</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-1">
                            {analysis.skillsMatch.alternative?.length || 0}
                        </div>
                        <div className="text-xs text-blue-600/80 dark:text-blue-400/80">
                            Similar skills found
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
