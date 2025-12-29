import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Lightbulb, Clock, Target } from 'lucide-react';

interface HeroInsightCardProps {
    headline: string;
    leverage: string;
    risk: string;
    opportunity: string;
    estimatedTimeToOutcome?: string;
    confidenceScore?: number;
    isLoading?: boolean;
}

export default function HeroInsightCard({
    headline,
    leverage,
    risk,
    opportunity,
    estimatedTimeToOutcome,
    confidenceScore,
    isLoading = false
}: HeroInsightCardProps) {
    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl p-8 md:p-10 bg-gray-900 dark:bg-[#141415] border border-gray-800 dark:border-[#2a2a2b]"
            >
                <div className="animate-pulse space-y-6">
                    <div className="h-4 w-24 bg-gray-700 rounded" />
                    <div className="h-8 w-3/4 bg-gray-700 rounded" />
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-gray-700 rounded" />
                        <div className="h-4 w-5/6 bg-gray-700 rounded" />
                        <div className="h-4 w-4/6 bg-gray-700 rounded" />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="relative rounded-2xl p-8 md:p-10 bg-gray-900 dark:bg-[#141415] border border-gray-800 dark:border-[#2a2a2b] shadow-xl"
        >
            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    Career Signal
                </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl md:text-3xl font-semibold text-white leading-snug mb-8 max-w-3xl">
                {headline}
            </h2>

            {/* Insight Breakdown */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {/* Leverage */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400/80">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Your Leverage</span>
                    </div>
                    <p className="text-[15px] text-gray-300 leading-relaxed">
                        {leverage}
                    </p>
                </div>

                {/* Risk */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-400/80">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Main Risk</span>
                    </div>
                    <p className="text-[15px] text-gray-300 leading-relaxed">
                        {risk}
                    </p>
                </div>

                {/* Opportunity */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400/80">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Key Opportunity</span>
                    </div>
                    <p className="text-[15px] text-gray-300 leading-relaxed">
                        {opportunity}
                    </p>
                </div>
            </div>

            {/* Metadata Row */}
            {(estimatedTimeToOutcome || confidenceScore) && (
                <div className="mt-8 pt-6 border-t border-gray-800 dark:border-[#2a2a2b] flex items-center justify-end gap-6">
                    {estimatedTimeToOutcome && (
                        <div className="flex items-center gap-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                                Estimated: <span className="text-white font-medium">{estimatedTimeToOutcome}</span>
                            </span>
                        </div>
                    )}

                    {confidenceScore !== undefined && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">Confidence</span>
                            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidenceScore}%` }}
                                    transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="h-full bg-indigo-500 rounded-full"
                                />
                            </div>
                            <span className="text-sm text-white font-medium">{confidenceScore}%</span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
