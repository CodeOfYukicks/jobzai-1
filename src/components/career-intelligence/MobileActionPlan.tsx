import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

interface ActionItem {
    id: string;
    title: string;
    description: string;
    timeEstimate: string;
    ctaLabel: string;
    ctaLink: 'resume-lab' | 'job-board' | 'campaigns';
}

interface MobileActionPlanProps {
    actions: ActionItem[];
    isLoading?: boolean;
}

const ctaConfig: Record<ActionItem['ctaLink'], { path: string }> = {
    'resume-lab': { path: '/cv-editor' },
    'job-board': { path: '/jobs' },
    'campaigns': { path: '/campaigns-auto' }
};

export default function MobileActionPlan({
    actions,
    isLoading = false
}: MobileActionPlanProps) {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="px-5 py-6">
                <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-4 animate-pulse" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className="px-5 py-6">
            {/* Section Header */}
            <div className="mb-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    Action Plan — This Week
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                    What will move the needle fastest
                </p>
            </div>

            {/* Action Cards — Full-width, tappable */}
            <div className="space-y-3">
                {actions.slice(0, 3).map((action, index) => {
                    const config = ctaConfig[action.ctaLink];

                    return (
                        <motion.button
                            key={action.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.08 }}
                            onClick={() => navigate(config.path)}
                            className="w-full text-left p-4 bg-white dark:bg-[#222223] rounded-2xl shadow-sm border border-gray-100/80 dark:border-[#2a2a2b] active:scale-[0.98] transition-transform"
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-start gap-3.5">
                                {/* Step Number */}
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center mt-0.5">
                                    {index + 1}
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Title */}
                                    <h4 className="text-[15px] font-medium text-gray-900 dark:text-white leading-snug pr-6">
                                        {action.title}
                                    </h4>

                                    {/* Why this matters — User-specific */}
                                    <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                                        {action.description}
                                    </p>

                                    {/* Footer: Time + CTA */}
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs">{action.timeEstimate}</span>
                                        </div>

                                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                            <span className="text-[13px] font-medium">{action.ctaLabel}</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}
