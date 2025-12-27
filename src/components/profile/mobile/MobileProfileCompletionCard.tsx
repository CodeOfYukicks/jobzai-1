import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

interface CompletionStep {
    id: string;
    label: string;
    completed: boolean;
    sectionId: string;
}

interface MobileProfileCompletionCardProps {
    percentage: number;
    steps: CompletionStep[];
    onStepTap: (sectionId: string) => void;
}

/**
 * Profile completion card with progress bar and actionable steps
 * - Shows completion percentage with progress bar
 * - Lists 2-3 next steps to complete profile
 * - Each step is tappable
 */
export default function MobileProfileCompletionCard({
    percentage,
    steps,
    onStepTap,
}: MobileProfileCompletionCardProps) {
    const isComplete = percentage === 100;

    // Show only incomplete steps, max 3
    const incompleteSteps = steps.filter(s => !s.completed).slice(0, 3);

    if (isComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                            Profile Complete
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                            You're ready for AI-powered matching
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 p-4 rounded-2xl bg-white dark:bg-[#2b2a2c] border border-gray-100 dark:border-[#3d3c3e]"
        >
            {/* Header with percentage */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Complete Your Profile
                </p>
                <span className="text-sm font-bold text-[#635BFF]">
                    {percentage}%
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-[#635BFF] rounded-full"
                />
            </div>

            {/* Next steps */}
            {incompleteSteps.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Next steps
                    </p>
                    {incompleteSteps.map((step, index) => (
                        <motion.button
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onStepTap(step.sectionId)}
                            className="w-full flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/50 active:bg-gray-100 dark:active:bg-[#3d3c3e] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">
                                    {step.label}
                                </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </motion.button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
