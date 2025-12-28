import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Link2, BookOpen, FileText, Users, CheckCircle } from 'lucide-react';

interface ResourceLink {
    id: string;
    title: string;
    url: string;
}

interface ResourcesTabMobileProps {
    companyName: string;
    reviewedTips: string[];
    savedLinks: ResourceLink[];
    onToggleTip: (tipId: string) => void;
    onAddResource?: () => void;
}

const PREP_TIPS = [
    { id: 'research', title: 'Research the company', description: 'Mission, values, products', icon: FileText },
    { id: 'star', title: 'Prepare STAR stories', description: 'Situation, Task, Action, Result', icon: BookOpen },
    { id: 'practice', title: 'Practice responses', description: 'Rehearse common questions', icon: Users },
    { id: 'questions', title: 'Prepare questions to ask', description: 'About role, team, company', icon: FileText },
];

/**
 * Mobile Resources tab
 * - List view instead of grid
 * - Minimal color usage
 * - External links clearly indicated
 */
export default function ResourcesTabMobile({
    companyName,
    reviewedTips,
    savedLinks,
    onToggleTip,
    onAddResource,
}: ResourcesTabMobileProps) {
    // External resources
    const externalResources = [
        {
            id: 'glassdoor',
            title: 'Glassdoor Reviews',
            url: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(companyName)}`,
            description: 'Employee reviews & interview tips'
        },
        {
            id: 'linkedin',
            title: 'LinkedIn Company Page',
            url: `https://www.linkedin.com/company/${encodeURIComponent(companyName)}`,
            description: 'Company updates & employees'
        },
    ];

    return (
        <div className="px-4 pb-32 space-y-6">
            {/* Preparation Checklist */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Preparation Checklist
                </h2>
                <div className="space-y-2">
                    {PREP_TIPS.map((tip) => {
                        const isChecked = reviewedTips.includes(tip.id);
                        const Icon = tip.icon;

                        return (
                            <button
                                key={tip.id}
                                onClick={() => onToggleTip(tip.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${isChecked
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
                                        : 'bg-white dark:bg-[#242325] border-gray-100 dark:border-[#3d3c3e]'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isChecked
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-gray-100 dark:bg-[#3d3c3e]'
                                    }`}>
                                    {isChecked ? (
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <Icon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={`text-[14px] font-medium ${isChecked
                                            ? 'text-green-700 dark:text-green-300 line-through'
                                            : 'text-gray-900 dark:text-white'
                                        }`}>
                                        {tip.title}
                                    </p>
                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                        {tip.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.section>

            {/* External Resources */}
            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Research {companyName}
                </h2>
                <div className="space-y-2">
                    {externalResources.map((resource) => (
                        <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#242325] border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#2b2a2c]"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center flex-shrink-0">
                                <Link2 className="w-5 h-5 text-[#635BFF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-medium text-gray-900 dark:text-white">
                                    {resource.title}
                                </p>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                    {resource.description}
                                </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </a>
                    ))}
                </div>
            </motion.section>

            {/* Saved Resources */}
            {savedLinks.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Your Resources
                    </h2>
                    <div className="space-y-2">
                        {savedLinks.map((link) => (
                            <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-[#242325] border border-gray-100 dark:border-[#3d3c3e] active:bg-gray-50 dark:active:bg-[#2b2a2c]"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center flex-shrink-0">
                                    <Link2 className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-medium text-gray-900 dark:text-white truncate">
                                        {link.title}
                                    </p>
                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                        {link.url}
                                    </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </a>
                        ))}
                    </div>
                </motion.section>
            )}
        </div>
    );
}
