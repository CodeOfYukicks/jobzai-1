import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, FileText, Briefcase, Users } from 'lucide-react';

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

const ctaConfig: Record<ActionItem['ctaLink'], { icon: typeof FileText; path: string }> = {
    'resume-lab': { icon: FileText, path: '/cv-editor' },
    'job-board': { icon: Briefcase, path: '/job-board' },
    'campaigns': { icon: Users, path: '/campaigns' }
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-6 md:p-8 bg-white dark:bg-[#1a1a1b] border border-gray-200 dark:border-[#2a2a2b]"
            >
                <div className="animate-pulse space-y-6">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-100 dark:bg-[#2a2a2b] rounded-lg" />
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl p-6 md:p-8 bg-white dark:bg-[#1a1a1b] border border-gray-200 dark:border-[#2a2a2b]"
        >
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Action Plan — This Week
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {introText}
                </p>
            </div>

            {/* Actions List */}
            <div className="space-y-4">
                {actions.slice(0, 3).map((action, index) => {
                    const config = ctaConfig[action.ctaLink];
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={action.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[#222223] border border-gray-100 dark:border-[#2a2a2b] group hover:border-gray-200 dark:hover:border-[#3a3a3b] transition-colors"
                        >
                            {/* Number */}
                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
                                <span className="text-xs font-bold text-white dark:text-gray-900">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    {action.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {action.description}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">{action.timeEstimate}</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(config.path)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {action.ctaLabel}
                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
