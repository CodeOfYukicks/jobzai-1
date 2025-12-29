import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, MapPin, Users, Building2, Mail,
    Sparkles, Check, Target, Zap, Star, Eye, FileText, X
} from 'lucide-react';
import type { CampaignData, Seniority, CompanySize } from '../NewCampaignModal';

// Job title synonyms for client-side preview
const JOB_TITLE_SYNONYMS: Record<string, string[]> = {
    'Software Engineer': ['Software Developer', 'Developer', 'SWE'],
    'Product Manager': ['PM', 'Product Owner', 'Product Lead'],
    'Product Owner': ['PO', 'Product Manager'],
    'Data Scientist': ['Data Science', 'ML Engineer'],
    'Frontend Developer': ['Front-End Developer', 'UI Developer'],
    'Backend Developer': ['Back-End Developer', 'Server Developer'],
    'Full Stack Developer': ['Fullstack Developer', 'Software Engineer'],
    'DevOps Engineer': ['SRE', 'Platform Engineer'],
    'UX Designer': ['Product Designer', 'UX/UI Designer'],
    'Marketing Manager': ['Marketing Lead', 'Growth Manager'],
    'Sales Manager': ['Account Executive', 'Sales Lead'],
    'Engineering Manager': ['Tech Lead', 'Engineering Lead'],
};

// Expand titles with synonyms
function expandTitles(titles: string[], enabled: boolean): { original: string[]; expanded: string[] } {
    if (!enabled) return { original: titles, expanded: [] };

    const expanded = new Set<string>();

    for (const title of titles) {
        const titleLower = title.toLowerCase();
        for (const [key, synonyms] of Object.entries(JOB_TITLE_SYNONYMS)) {
            if (key.toLowerCase() === titleLower || title.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
                synonyms.forEach(syn => {
                    if (!titles.some(t => t.toLowerCase() === syn.toLowerCase())) {
                        expanded.add(syn);
                    }
                });
            }
        }
    }

    return { original: titles, expanded: Array.from(expanded).slice(0, 5) };
}

interface ReviewStepProps {
    data: CampaignData;
    estimatedProspects?: number;
    onUpdate?: (updates: Partial<CampaignData>) => void;
}

const SENIORITY_LABELS: Record<Seniority, string> = {
    'entry': 'Entry Level',
    'senior': 'Senior',
    'manager': 'Manager',
    'director': 'Director',
    'vp': 'VP',
    'c_suite': 'C-Suite'
};

const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
    '1-10': '1-10',
    '11-50': '11-50',
    '51-200': '51-200',
    '201-500': '201-500',
    '501-1000': '501-1K',
    '1001-5000': '1K-5K',
    '5001+': '5K+'
};

import { useIsMobile } from '../../../hooks/useIsMobile';
import MobileReviewStep from './mobile/MobileReviewStep';

export default function ReviewStep(props: ReviewStepProps & { onBack?: () => void; onLaunch?: () => void }) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileReviewStep {...props} onUpdate={props.onUpdate!} onBack={props.onBack!} onLaunch={props.onLaunch!} />;
    }

    return <DesktopReviewStep {...props} />;
}

function DesktopReviewStep({ data, estimatedProspects = 0 }: ReviewStepProps) {
    const { original, expanded } = expandTitles(data.personTitles, data.expandTitles);
    const [showCVPreview, setShowCVPreview] = useState(false);

    const goalLabels = {
        job: 'Job Search',
        internship: 'Internship',
        networking: 'Networking'
    };

    const toneLabels = {
        casual: 'Casual',
        professional: 'Professional',
        bold: 'Bold'
    };

    const lengthLabels = {
        short: 'Short',
        medium: 'Medium',
        detailed: 'Detailed'
    };

    const modeLabels = {
        template: 'Single Template',
        abtest: 'A/B Testing',
        auto: 'AI Generated'
    };

    return (
        <div className="space-y-5">
            {/* Header - Clean, no icon */}
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ready to Launch
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-white/50 mt-1">
                    Review your campaign settings below
                </p>
            </div>

            {/* Estimated Reach Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200/50 dark:border-emerald-500/20"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-medium">
                            Estimated Reach
                        </p>
                        <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                            {estimatedProspects.toLocaleString()}
                            <span className="text-base font-normal text-emerald-600 dark:text-emerald-400 ml-2">prospects</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                        <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
                            {Math.min(100, estimatedProspects)} will be contacted
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Targeting Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-4 h-4 text-gray-500 dark:text-white/40" />
                    <span className="text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
                        Targeting
                    </span>
                    {data.outreachGoal && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                            {goalLabels[data.outreachGoal]}
                        </span>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Job Titles */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] text-gray-400 dark:text-white/30 uppercase">Job Titles</span>
                            {data.expandTitles && expanded.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-violet-500 dark:text-violet-400">
                                    <Sparkles className="w-3 h-3" />
                                    +{expanded.length} auto-generated
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {/* Original titles - solid dark style */}
                            {original.map(title => (
                                <span
                                    key={title}
                                    className="px-2.5 py-1 rounded-full bg-gray-900 dark:bg-white text-[12px] font-medium text-white dark:text-gray-900"
                                >
                                    {title}
                                </span>
                            ))}
                            {/* Generated synonyms - italic, dashed border, lighter style */}
                            {expanded.map(title => (
                                <span
                                    key={title}
                                    className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-[12px] italic text-violet-600 dark:text-violet-300 border border-dashed border-violet-300 dark:border-violet-500/40"
                                >
                                    <Sparkles className="w-2.5 h-2.5 inline mr-1 opacity-60" />
                                    {title}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[13px] text-gray-700 dark:text-white/70">
                            {data.personLocations.join(', ')}
                        </span>
                    </div>

                    {/* Seniority + Company Size */}
                    <div className="flex flex-wrap gap-4 text-[13px] text-gray-600 dark:text-white/60">
                        {data.seniorities.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                {data.seniorities.map(s => SENIORITY_LABELS[s]).join(', ')}
                            </div>
                        )}
                        {data.companySizes.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                {data.companySizes.map(s => COMPANY_SIZE_LABELS[s]).join(', ')} employees
                            </div>
                        )}
                    </div>

                    {/* Priority Companies */}
                    {data.targetCompanies.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                            <Star className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[12px] text-gray-500 dark:text-white/50">Priority:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {data.targetCompanies.map(company => (
                                    <span
                                        key={company}
                                        className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[11px] font-medium text-blue-700 dark:text-blue-300"
                                    >
                                        {company}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Email Template Preview */}
            {data.selectedTemplate && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-4 h-4 text-gray-500 dark:text-white/40" />
                        <span className="text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
                            Email Template
                        </span>
                    </div>
                    <div className="bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-gray-100 dark:border-white/[0.08]">
                        <p className="text-[12px] font-medium text-gray-800 dark:text-white mb-2">
                            Subject: {data.selectedTemplate.subject}
                        </p>
                        <p className="text-[12px] text-gray-600 dark:text-white/60 whitespace-pre-wrap line-clamp-4">
                            {data.selectedTemplate.body}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Email Settings */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-4 h-4 text-gray-500 dark:text-white/40" />
                    <span className="text-[12px] text-gray-500 dark:text-white/40 uppercase tracking-wider font-medium">
                        Email Settings
                    </span>
                </div>

                <div className="space-y-3">
                    {/* From */}
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500 dark:text-white/50">From</span>
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                            {data.gmailEmail || 'Not connected'}
                        </span>
                    </div>

                    {/* Style */}
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500 dark:text-white/50">Style</span>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] font-medium text-gray-600 dark:text-white/60">
                                {toneLabels[data.emailTone]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] font-medium text-gray-600 dark:text-white/60">
                                {lengthLabels[data.emailLength]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[11px] font-medium text-gray-600 dark:text-white/60">
                                {data.language === 'en' ? 'English' : 'Français'}
                            </span>
                        </div>
                    </div>

                    {/* Generation Mode */}
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500 dark:text-white/50">Generation</span>
                        <span className="text-[13px] font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            {data.emailGenerationMode ? modeLabels[data.emailGenerationMode] : 'Not set'}
                        </span>
                    </div>

                    {/* CV */}
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-500 dark:text-white/50">CV Attached</span>
                        {data.attachCV && data.cvAttachment ? (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                                    <Check className="w-3.5 h-3.5" />
                                    {data.cvAttachment.name}
                                </span>
                                <button
                                    onClick={() => setShowCVPreview(true)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-[11px] font-medium text-gray-600 dark:text-white/60 transition-colors"
                                >
                                    <Eye className="w-3 h-3" />
                                    Preview
                                </button>
                            </div>
                        ) : (
                            <span className="text-[13px] font-medium text-gray-400 dark:text-white/30">
                                No
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* CV Preview Modal */}
            <AnimatePresence>
                {showCVPreview && data.cvAttachment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowCVPreview(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.08]">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-500" />
                                    <span className="text-[14px] font-medium text-gray-900 dark:text-white">
                                        {data.cvAttachment.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowCVPreview(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            {/* CV iframe viewer */}
                            <div className="h-[75vh]">
                                <iframe
                                    src={data.cvAttachment.url}
                                    className="w-full h-full"
                                    title="CV Preview"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ready message */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20"
            >
                <p className="text-[12px] text-amber-800 dark:text-amber-300 text-center">
                    <span className="font-medium">Ready to go!</span> Click Launch Campaign to start finding prospects and generating personalized emails.
                </p>
            </motion.div>
        </div>
    );
}
