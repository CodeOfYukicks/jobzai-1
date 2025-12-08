import React, { useState } from 'react';
import { MapPin, Clock, Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Bookmark, X } from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';
import { Job } from '../../types/job-board';
import { motion, AnimatePresence } from 'framer-motion';

interface JobCardProps {
    job: Job;
    isSelected: boolean;
    onClick: () => void;
    showMatchScore?: boolean;
    isSaved?: boolean;
    isDismissed?: boolean;
    onSave?: (jobId: string) => void;
    onDismiss?: (jobId: string) => void;
}

// Helper to get match score color
function getMatchScoreColor(score: number): { bg: string; text: string; ring: string } {
    if (score >= 80) return { 
        bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
        text: 'text-emerald-700 dark:text-emerald-300',
        ring: 'ring-emerald-500/20'
    };
    if (score >= 60) return { 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-700 dark:text-blue-300',
        ring: 'ring-blue-500/20'
    };
    if (score >= 40) return { 
        bg: 'bg-amber-100 dark:bg-amber-900/30', 
        text: 'text-amber-700 dark:text-amber-300',
        ring: 'ring-amber-500/20'
    };
    return { 
        bg: 'bg-gray-100 dark:bg-[#2b2a2c]', 
        text: 'text-gray-600 dark:text-gray-400',
        ring: 'ring-gray-500/20'
    };
}

export function JobCard({ 
    job, 
    isSelected, 
    onClick, 
    showMatchScore = false,
    isSaved = false,
    isDismissed = false,
    onSave,
    onDismiss
}: JobCardProps) {
    const [showReasons, setShowReasons] = useState(false);
    const matchScore = job.matchScore;
    const scoreColors = matchScore ? getMatchScoreColor(matchScore) : null;
    const hasReasons = showMatchScore && ((job.matchReasons && job.matchReasons.length > 0) || (job.excludeReasons && job.excludeReasons.length > 0));

    const handleToggleReasons = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowReasons(!showReasons);
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSave?.(job.id);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDismiss?.(job.id);
    };

    // Don't render dismissed jobs
    if (isDismissed) {
        return null;
    }

    return (
        <div
            onClick={onClick}
            className={`
                group cursor-pointer p-4 rounded-xl transition-all duration-200 relative
                ${isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500 dark:border-indigo-400'
                    : 'bg-white dark:bg-[#242325] border-2 border-transparent hover:border-gray-200 dark:hover:border-[#4a494b] hover:shadow-md'
                }
            `}
        >
            {/* Action Buttons - Top Left (visible on hover or when saved) */}
            <div className={`absolute top-2 left-2 flex items-center gap-1 z-10 transition-opacity duration-200 ${isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {onSave && (
                    <button
                        onClick={handleSave}
                        className={`p-1.5 rounded-lg transition-colors ${
                            isSaved 
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                                : 'bg-white/80 dark:bg-[#2b2a2c]/80 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                        } backdrop-blur-sm shadow-sm`}
                        title={isSaved ? 'Unsave' : 'Save for later'}
                    >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                )}
                {onDismiss && !isSaved && (
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-lg bg-white/80 dark:bg-[#2b2a2c]/80 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 backdrop-blur-sm shadow-sm transition-colors"
                        title="Not interested"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Match Score Badge - Top Right */}
            {showMatchScore && matchScore !== undefined && scoreColors && (
                <div className={`absolute -top-2 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full ${scoreColors.bg} ${scoreColors.text} ring-2 ${scoreColors.ring} shadow-sm`}>
                    <Sparkles className="w-3 h-3" />
                    <span className="text-xs font-bold">{matchScore}%</span>
                </div>
            )}

            <div className="flex gap-4">
                {/* Large Square Logo */}
                <div className="shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] flex items-center justify-center p-1 shadow-sm">
                        <CompanyLogo companyName={job.company} size="xl" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Job Title */}
                    <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {job.title}
                    </h3>

                    {/* Company Name */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                        {job.company}
                    </p>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                        </span>
                        {job.published && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {job.published}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                        {job.type && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300">
                                {job.type}
                            </span>
                        )}
                        {job.remote === 'remote' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Remote
                            </span>
                        )}
                        {job.seniority && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                {job.seniority}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Why This Job? - Expandable Section */}
            {hasReasons && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
                    <button
                        onClick={handleToggleReasons}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        Why this job?
                        {showReasons ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <AnimatePresence>
                        {showReasons && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 space-y-1.5">
                                    {/* Positive reasons */}
                                    {job.matchReasons?.map((reason, idx) => (
                                        <div key={`pos-${idx}`} className="flex items-start gap-1.5 text-xs">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-gray-600 dark:text-gray-400">{reason}</span>
                                        </div>
                                    ))}
                                    {/* Negative reasons / warnings */}
                                    {job.excludeReasons?.map((reason, idx) => (
                                        <div key={`neg-${idx}`} className="flex items-start gap-1.5 text-xs">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                            <span className="text-gray-500 dark:text-gray-500">{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
