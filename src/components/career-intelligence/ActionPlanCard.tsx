import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ActionItem {
    id: string;
    title: string;
    description: string;
    timeEstimate: string;
    ctaLabel: string;
    ctaLink: 'resume-lab' | 'job-board' | 'campaigns';
}

interface ActionPlanCardProps {
    introText: string;
    actions: ActionItem[];
    isLoading?: boolean;
}

const ctaConfig: Record<ActionItem['ctaLink'], { path: string }> = {
    'resume-lab': { path: '/cv-editor' },
    'job-board': { path: '/jobs' },
    'campaigns': { path: '/campaigns-auto' }
};

export default function ActionPlanCard({
    introText,
    actions,
    isLoading = false
}: ActionPlanCardProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8"
            >
                <div className="animate-pulse space-y-6">
                    <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800/50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="py-8"
        >
            {/* Header */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    Action Plan — This Week
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {introText}
                </p>
            </div>

            {/* Actions */}
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-[#222223]">
                {actions.slice(0, 3).map((action, index) => {
                    const config = ctaConfig[action.ctaLink];

                    return (
                        <motion.div
                            key={action.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.05 + index * 0.08 }}
                            className="flex items-start gap-5 py-5 first:pt-0 group"
                        >
                            {/* Number */}
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center mt-0.5">
                                {index + 1}
                            </span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h4 className="text-[15px] font-medium text-gray-900 dark:text-white leading-snug">
                                            {action.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                                            {action.description}
                                        </p>
                                    </div>

                                    {/* CTA */}
                                    <button
                                        onClick={() => navigate(config.path)}
                                        className="flex-shrink-0 flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mt-0.5"
                                    >
                                        <span>{action.ctaLabel}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Time estimate */}
                                <span className="inline-block mt-3 text-xs text-gray-400 dark:text-gray-500">
                                    ⏱ {action.timeEstimate}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.section>
    );
}
