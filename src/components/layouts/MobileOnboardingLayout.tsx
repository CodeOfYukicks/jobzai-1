import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import FirebaseImage from '../FirebaseImage';

interface MobileOnboardingLayoutProps {
    children: ReactNode;
    currentStep: number;
    totalSteps: number;
    contextLabel: string;
    onBack?: () => void;
    onNext: () => void;
    canProceed: boolean;
    nextLabel?: string;
    isSubmitting?: boolean;
    showBackButton?: boolean;
    hideNextButton?: boolean;
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export default function MobileOnboardingLayout({
    children,
    currentStep,
    totalSteps,
    contextLabel,
    onBack,
    onNext,
    canProceed,
    nextLabel = 'Continue',
    isSubmitting = false,
    showBackButton = true,
    hideNextButton = false,
    secondaryAction,
}: MobileOnboardingLayoutProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="fixed inset-0 bg-white dark:bg-[#0a0a0a] flex flex-col safe-top safe-bottom">
            {/* Decorative Grid Background - Light mode */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none dark:hidden" />
            {/* Decorative Grid Background - Dark mode */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none hidden dark:block" />

            {/* Compact Header - 56px */}
            <header className="relative h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/[0.06]">
                {/* Left: Back Arrow + Page Name */}
                <div className="flex items-center gap-2 flex-1">
                    {showBackButton && onBack ? (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                        </button>
                    ) : (
                        <div className="w-9" />
                    )}
                    <span className="text-[13px] font-medium text-gray-500 dark:text-white/50">
                        {contextLabel}
                    </span>
                </div>

                {/* Center: Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <FirebaseImage
                        path="images/logo-only.png"
                        alt="Cubbbe"
                        className="h-7 w-auto"
                    />
                </div>

                {/* Right: Progress Bar */}
                <div className="flex-1 flex items-center justify-end">
                    <div className="w-12 h-[2px] bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#635bff] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </header>

            {/* Scrollable Content - Vertically centered */}
            <main className="flex-1 overflow-y-auto px-5 flex flex-col justify-center">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="py-8"
                >
                    {children}
                </motion.div>
            </main>

            {/* Sticky Bottom CTA - hidden for subscription step */}
            {!hideNextButton && (
                <div className="px-5 pb-8 pt-3 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/[0.06]">
                    {/* Secondary action (text link) */}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="w-full mb-3 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            {secondaryAction.label}
                        </button>
                    )}

                    {/* Primary CTA */}
                    <motion.button
                        onClick={onNext}
                        disabled={!canProceed || isSubmitting}
                        whileTap={{ scale: canProceed && !isSubmitting ? 0.98 : 1 }}
                        className={`
                            w-full h-[52px] rounded-xl font-semibold text-[16px]
                            transition-all duration-200
                            ${canProceed && !isSubmitting
                                ? 'bg-[#635bff] text-white active:bg-[#5147e5]'
                                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 cursor-not-allowed'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.div
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <span>Loading...</span>
                            </span>
                        ) : (
                            nextLabel
                        )}
                    </motion.button>
                </div>
            )}
        </div>
    );
}
