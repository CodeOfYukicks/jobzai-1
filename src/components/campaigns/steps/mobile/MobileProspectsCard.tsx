import { Users, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface MobileProspectsCardProps {
    count: number | null;
    isLoading: boolean;
    showExplanation?: boolean;
    showLowCountWarning?: boolean;
}

export default function MobileProspectsCard({
    count,
    isLoading,
    showExplanation = false,
    showLowCountWarning = false
}: MobileProspectsCardProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="mt-auto pt-4 pb-2">
            <div
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-black shadow-lg transition-all active:scale-[0.99]"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium opacity-80 uppercase tracking-wide flex items-center gap-2">
                        Estimated Prospects
                        {showExplanation && <Info className="w-3.5 h-3.5 opacity-60" />}
                    </span>
                    <Users className="w-4 h-4 opacity-80" />
                </div>

                <div className="flex items-baseline gap-2">
                    {isLoading ? (
                        <div className="flex items-center gap-2 h-8">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-[15px] opacity-80">Calculating...</span>
                        </div>
                    ) : (
                        <span className="text-[32px] font-bold tracking-tight">
                            {count?.toLocaleString() || '0'}
                        </span>
                    )}
                </div>

                <p className="text-[13px] opacity-60 mt-1">
                    Based on your current filters
                </p>

                <AnimatePresence>
                    {showTooltip && showExplanation && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 mt-3 border-t border-white/10 dark:border-black/10">
                                <p className="text-[13px] leading-relaxed opacity-90">
                                    Don't worry if this number seems high or low right now.
                                    It will become more accurate as you add more details in the next steps.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {!isLoading && count !== null && count < 100 && showLowCountWarning && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 mt-3 border-t border-white/10 dark:border-black/10">
                                <p className="text-[13px] leading-relaxed text-amber-300 dark:text-amber-600 font-medium flex items-start gap-2">
                                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>
                                        Your audience is quite narrow. Try broadening your settings (e.g. more locations or titles) to reach more people.
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
