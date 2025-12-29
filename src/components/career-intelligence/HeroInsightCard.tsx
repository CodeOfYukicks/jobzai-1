import { motion } from 'framer-motion';

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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12"
            >
                <div className="animate-pulse space-y-8">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="space-y-3">
                        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-8 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-8 pt-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-3">
                                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
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
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="py-10 md:py-12"
        >
            {/* Label */}
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400 mb-6 block">
                Career Signal
            </span>

            {/* Main Headline - Assertive, decisive */}
            <h2 className="text-2xl md:text-[28px] lg:text-[32px] font-semibold text-gray-900 dark:text-white leading-[1.25] tracking-tight max-w-2xl mb-12">
                {headline}
            </h2>

            {/* Strategic Breakdown - 3 inline columns, no cards */}
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 pt-8 border-t border-gray-200 dark:border-[#2a2a2b]">
                {/* Leverage */}
                <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-3">
                        Leverage
                    </span>
                    <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed">
                        {leverage}
                    </p>
                </div>

                {/* Risk */}
                <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-3">
                        Risk
                    </span>
                    <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed">
                        {risk}
                    </p>
                </div>

                {/* Opportunity */}
                <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-3">
                        Opportunity
                    </span>
                    <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed">
                        {opportunity}
                    </p>
                </div>
            </div>

            {/* Metadata - Subtle, right-aligned */}
            {(estimatedTimeToOutcome || confidenceScore !== undefined) && (
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-[#222223] flex items-center justify-end gap-8 text-[13px] text-gray-400 dark:text-gray-500">
                    {estimatedTimeToOutcome && (
                        <span>
                            Timeline: <span className="text-gray-600 dark:text-gray-400">{estimatedTimeToOutcome}</span>
                        </span>
                    )}
                    {confidenceScore !== undefined && (
                        <span>
                            Confidence: <span className="text-gray-600 dark:text-gray-400">{confidenceScore}%</span>
                        </span>
                    )}
                </div>
            )}
        </motion.section>
    );
}
