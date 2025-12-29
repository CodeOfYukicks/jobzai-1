import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Zap } from 'lucide-react';

type SignalType = 'market-fit' | 'skill-gap' | 'execution';
type SignalStatus = 'strong' | 'moderate' | 'needs-focus' | 'action-needed';

interface StrategicSignalCardProps {
    type: SignalType;
    title: string;
    description: string;
    status: SignalStatus;
    onClick?: () => void;
}

const typeConfig: Record<SignalType, { icon: typeof TrendingUp; label: string }> = {
    'market-fit': { icon: TrendingUp, label: 'Market Fit' },
    'skill-gap': { icon: AlertCircle, label: 'Skill Gap' },
    'execution': { icon: Zap, label: 'Execution' }
};

const statusLabels: Record<SignalStatus, string> = {
    'strong': 'Strong',
    'moderate': 'Moderate',
    'needs-focus': 'Needs focus',
    'action-needed': 'Action needed'
};

export default function StrategicSignalCard({
    type,
    title,
    description,
    status,
    onClick
}: StrategicSignalCardProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full text-left p-6 rounded-xl bg-white dark:bg-[#1a1a1b] border border-gray-200 dark:border-[#2a2a2b] hover:border-gray-300 dark:hover:border-[#3a3a3b] hover:shadow-lg transition-all duration-200 group"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {config.label}
                    </span>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-[#2a2a2b] rounded">
                    {statusLabels[status]}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 leading-snug">
                {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                {description}
            </p>

            {/* Hover indicator */}
            <div className="mt-4 flex items-center gap-1 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-xs font-medium">View details</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </motion.button>
    );
}
