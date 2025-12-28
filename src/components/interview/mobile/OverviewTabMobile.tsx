import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Building2, Briefcase, PlayCircle, MapPin, Globe, ExternalLink, ChevronDown, MessageSquare, FileText } from 'lucide-react';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../../utils/logo';

interface OverviewTabMobileProps {
    companyName: string;
    position: string;
    location?: string;
    companyInfo?: string;
    roleOverview?: string;
    keyPoints?: string[];
    positionDetails?: string;
    preparationProgress: number;
    interviewDate?: string | null;
    companyUrl?: string;
    onStartPractice: () => void;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mobile Overview tab - Full version with all desktop information
 * - Readiness indicator (circular progress)
 * - Company profile with logo
 * - Key talking points
 * - Position details/responsibilities
 * - Primary CTA: "Start Practice"
 */
export default function OverviewTabMobile({
    companyName,
    position,
    location,
    companyInfo,
    roleOverview,
    keyPoints = [],
    positionDetails,
    preparationProgress,
    interviewDate,
    companyUrl,
    onStartPractice,
}: OverviewTabMobileProps) {
    const [showAllKeyPoints, setShowAllKeyPoints] = useState(false);
    const [showAllResponsibilities, setShowAllResponsibilities] = useState(false);

    // Logo handling
    const companyDomain = getCompanyDomain(companyName);
    const initialLogo = companyDomain ? getClearbitUrl(companyDomain) : null;
    const [logoSrc, setLogoSrc] = useState<string | null>(initialLogo);
    const [triedGoogle, setTriedGoogle] = useState(false);

    function handleLogoError() {
        if (companyDomain && !triedGoogle) {
            setTriedGoogle(true);
            setLogoSrc(getGoogleFaviconUrl(companyDomain));
        } else {
            setLogoSrc(null);
        }
    }

    // Format date for display
    const formattedDate = interviewDate ? new Date(interviewDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    }) : null;

    // Extract company headline
    const companyHeadline = companyInfo?.split('.')[0] || `${companyName} is a leading company in its industry`;
    const companyDetails = companyInfo?.split('.').slice(1, 3).join('. ').trim();

    // Extract position responsibilities
    const responsibilities = positionDetails
        ?.split('.')
        .slice(1)
        .filter(s => s.trim().length > 10)
        .slice(0, 4) || [];

    // Key points display
    const visibleKeyPoints = showAllKeyPoints ? keyPoints : keyPoints.slice(0, 3);
    const hasMoreKeyPoints = keyPoints.length > 3;

    // Responsibilities display
    const visibleResponsibilities = showAllResponsibilities ? responsibilities : responsibilities.slice(0, 3);
    const hasMoreResponsibilities = responsibilities.length > 3;

    // Company website URL
    const companyWebsiteUrl = companyUrl || (companyDomain ? `https://${companyDomain}` : null);

    return (
        <div className="px-4 pb-32 space-y-4">
            {/* Readiness Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#242325] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]"
            >
                <div className="flex items-center gap-4">
                    {/* Circular Progress */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                        <svg className="w-16 h-16 -rotate-90 transform">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-gray-100 dark:text-[#3d3c3e]"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="url(#progressGradientMobile)"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={176}
                                strokeDashoffset={176 - (176 * preparationProgress) / 100}
                                className="transition-all duration-500"
                            />
                            <defs>
                                <linearGradient id="progressGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#635BFF" />
                                    <stop offset="100%" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {preparationProgress}%
                            </span>
                        </div>
                    </div>

                    {/* Status Text */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                            {preparationProgress >= 80 ? 'Ready to interview!' :
                                preparationProgress >= 50 ? 'Almost there' : 'Getting started'}
                        </h3>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {preparationProgress >= 80 ? 'Great preparation so far' :
                                preparationProgress >= 50 ? 'Keep building confidence' : 'Complete key milestones'}
                        </p>
                        {formattedDate && (
                            <div className="flex items-center gap-1 mt-2 text-[12px] text-[#635BFF] dark:text-[#a5a0ff]">
                                <Clock className="w-3 h-3" />
                                <span>{formattedDate}</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Company Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-[#242325] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]"
            >
                {/* Company Header */}
                <div className="flex items-start gap-3 mb-3">
                    {/* Logo */}
                    <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-[#3d3c3e] flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200/50 dark:ring-[#4d4c4e]/50">
                        {logoSrc ? (
                            <img
                                src={logoSrc}
                                alt={`${companyName} logo`}
                                onError={handleLogoError}
                                className="h-7 w-7 object-contain"
                            />
                        ) : (
                            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                                {getInitials(companyName)}
                            </span>
                        )}
                    </div>

                    {/* Company Name & Meta */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[16px] font-bold text-gray-900 dark:text-white truncate">
                                {companyName}
                            </h2>
                            {companyWebsiteUrl && (
                                <a
                                    href={companyWebsiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-0.5 text-[11px] font-medium text-[#635BFF] dark:text-[#a5a0ff]"
                                >
                                    <Globe className="w-3 h-3" />
                                    <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            )}
                        </div>
                        {location && (
                            <div className="flex items-center gap-1 mt-1 text-[12px] text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3 text-[#635BFF]" />
                                <span>{location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company Info */}
                {companyInfo && (
                    <div className="pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
                        <p className="text-[14px] font-medium text-gray-900 dark:text-white leading-snug">
                            {companyHeadline}.
                        </p>
                        {companyDetails && (
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-3">
                                {companyDetails}.
                            </p>
                        )}
                    </div>
                )}

                {/* Position Badge */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20">
                            <Briefcase className="w-3.5 h-3.5 text-[#635BFF]" />
                        </div>
                        <span className="text-[13px] text-gray-600 dark:text-gray-400">
                            Position: <span className="font-semibold text-gray-900 dark:text-white">{position}</span>
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Key Talking Points */}
            {keyPoints.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-[#242325] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#635BFF]" />
                            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                                Key Talking Points
                            </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#635BFF]/10 text-[11px] font-bold text-[#635BFF]">
                            {keyPoints.length}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence>
                            {visibleKeyPoints.map((point, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex items-start gap-2.5"
                                >
                                    <span className="flex-shrink-0 w-5 h-5 rounded-md bg-[#635BFF] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                                        {index + 1}
                                    </span>
                                    <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {point}
                                    </p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {hasMoreKeyPoints && (
                        <button
                            onClick={() => setShowAllKeyPoints(!showAllKeyPoints)}
                            className="w-full mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e] flex items-center justify-center gap-1 text-[12px] font-semibold text-[#635BFF]"
                        >
                            {showAllKeyPoints ? 'Show less' : `+${keyPoints.length - 3} more`}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllKeyPoints ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </motion.div>
            )}

            {/* Position Details / Responsibilities */}
            {responsibilities.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white dark:bg-[#242325] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#635BFF]" />
                            <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                                Role Responsibilities
                            </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#635BFF]/10 text-[11px] font-bold text-[#635BFF]">
                            {responsibilities.length}
                        </span>
                    </div>

                    <div className="space-y-2">
                        {visibleResponsibilities.map((resp, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex items-start gap-2.5"
                            >
                                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-gray-100 dark:bg-[#3d3c3e] text-gray-500 text-[10px] font-semibold flex items-center justify-center mt-0.5">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {resp.trim()}.
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {hasMoreResponsibilities && (
                        <button
                            onClick={() => setShowAllResponsibilities(!showAllResponsibilities)}
                            className="w-full mt-3 pt-3 border-t border-gray-100 dark:border-[#3d3c3e] flex items-center justify-center gap-1 text-[12px] font-semibold text-[#635BFF]"
                        >
                            {showAllResponsibilities ? 'Show less' : `+${responsibilities.length - 3} more`}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllResponsibilities ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </motion.div>
            )}

            {/* Empty State */}
            {!companyInfo && !roleOverview && keyPoints.length === 0 && responsibilities.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-[#242325] rounded-xl p-6 border border-gray-100 dark:border-[#3d3c3e] text-center"
                >
                    <div className="w-12 h-12 rounded-full bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center mx-auto mb-3">
                        <Briefcase className="w-6 h-6 text-[#635BFF]" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
                        Analyze your job posting
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                        Enter a job URL to get tailored interview preparation
                    </p>
                </motion.div>
            )}

            {/* Primary CTA - Integrated into page flow */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="pt-2 pb-6"
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
                    Start Practice
                </button>
                <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                    Practice interview questions with AI feedback
                </p>
            </motion.div>
        </div>
    );
}
