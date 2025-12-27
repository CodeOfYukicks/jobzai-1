import { motion } from 'framer-motion';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface MobileSectionCardProps {
    title: string;
    icon: LucideIcon;
    summary?: string;
    badge?: string;
    onTap: () => void;
    delay?: number;
}

/**
 * Tappable section card for mobile profile
 * - Icon + Title
 * - Summary text
 * - Chevron →
 * - Tap opens section modal
 */
export default function MobileSectionCard({
    title,
    icon: Icon,
    summary,
    badge,
    onTap,
    delay = 0,
}: MobileSectionCardProps) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={onTap}
            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-[#2b2a2c] rounded-2xl border border-gray-100 dark:border-[#3d3c3e] active:scale-[0.98] active:bg-gray-50 dark:active:bg-[#3d3c3e] transition-all"
        >
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-gray-900 dark:text-white">
                        {title}
                    </span>
                    {badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#635BFF]/10 text-[#635BFF] rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                {summary && (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                        {summary}
                    </p>
                )}
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </motion.button>
    );
}
