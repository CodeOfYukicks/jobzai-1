import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

type ConfidenceLevel = 'high' | 'moderate' | 'monitor';

interface MobileInsightHeaderProps {
    headline: string;
    confidenceLevel?: ConfidenceLevel;
    isLoading?: boolean;
}

const confidenceConfig: Record<ConfidenceLevel, { icon: typeof CheckCircle; label: string; className: string }> = {
    high: {
        icon: CheckCircle,
        label: 'High confidence',
        className: 'text-emerald-500'
    },
    moderate: {
        icon: TrendingUp,
        label: 'On track',
        className: 'text-blue-500'
    },
    monitor: {
        icon: AlertTriangle,
        label: 'Monitor closely',
        className: 'text-amber-500'
    }
};

export default function MobileInsightHeader({
    headline,
    confidenceLevel = 'moderate',
    isLoading = false
}: MobileInsightHeaderProps) {
    const config = confidenceConfig[confidenceLevel];
    const Icon = config.icon;

    if (isLoading) {
        return (
            <div className="sticky top-0 z-20 px-5 py-6 bg-white/90 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-gray-100/50 dark:border-[#2a2a2b]/50">
                <div className="animate-pulse space-y-3">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="space-y-2">
                        <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800/50 rounded" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="sticky top-0 z-20 px-5 py-6 bg-white/90 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-gray-100/50 dark:border-[#2a2a2b]/50"
        >
            {/* Label */}
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 block mb-3">
                Career Signal
            </span>

            {/* Punchy Headline — Max 2 lines */}
            <h2 className="text-[22px] font-semibold text-gray-900 dark:text-white leading-[1.3] tracking-tight line-clamp-2">
                {headline}
            </h2>

            {/* Confidence Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`flex items-center gap-1.5 mt-4 ${config.className}`}
            >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{config.label}</span>
            </motion.div>
        </motion.div>
    );
}
