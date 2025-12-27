import { motion } from 'framer-motion';

interface MobileTopBarProps {
    /** Main page title */
    title: string;
    /** Optional subtitle (e.g., count, status) */
    subtitle?: string;
    /** Optional right action button */
    rightAction?: {
        icon: React.ElementType;
        onClick: () => void;
        ariaLabel?: string;
    };
}

/**
 * Global mobile top bar component - iOS native style
 * Sticky, minimal, consistent across all pages
 */
export default function MobileTopBar({ title, subtitle, rightAction }: MobileTopBarProps) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden sticky top-0 z-50 bg-white/95 dark:bg-[#242325]/95 backdrop-blur-xl border-b border-gray-100/80 dark:border-[#3d3c3e]/50"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left: Title + optional subtitle */}
                <div className="flex flex-col min-w-0 flex-1">
                    <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                            {subtitle}
                        </span>
                    )}
                </div>

                {/* Right: Single action button */}
                {rightAction && (
                    <button
                        onClick={rightAction.onClick}
                        aria-label={rightAction.ariaLabel || 'Action'}
                        className="flex items-center justify-center w-9 h-9 -mr-1 rounded-full 
              text-[#635BFF] dark:text-[#a5a0ff]
              active:bg-[#635BFF]/10 dark:active:bg-[#635BFF]/20
              transition-colors"
                    >
                        <rightAction.icon className="w-[22px] h-[22px]" strokeWidth={2} />
                    </button>
                )}
            </div>
        </motion.header>
    );
}
