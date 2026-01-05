import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ChevronRight } from 'lucide-react';
import { useOnboardingOptional, TOUR_STEPS } from '../../contexts/OnboardingContext';

// ============================================
// TYPES
// ============================================

export interface OnboardingSpotlightProps {
    /** Unique key for this page/feature */
    pageKey: string;
    /** Icon to display (small, understated) */
    icon?: React.ReactNode;
    /** Main title */
    title: string;
    /** Description text */
    description: string;
    /** Optional secondary description line */
    secondaryDescription?: string;
    /** Position on screen - deprecated, always centered */
    position?: 'top-center' | 'center' | 'bottom-center';
    /** Delay before showing (ms) */
    delay?: number;
    /** Custom dismiss button text */
    dismissText?: string;
    /** Callback when dismissed */
    onDismiss?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function OnboardingSpotlight({
    pageKey,
    icon,
    title,
    description,
    secondaryDescription,
    delay = 600,
    dismissText = 'Got it',
    onDismiss,
}: OnboardingSpotlightProps) {
    const navigate = useNavigate();
    const onboarding = useOnboardingOptional();
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const isTourMode = onboarding?.isTourActive ?? false;
    const currentTourStep = onboarding?.currentTourStep ?? 0;
    const isLastStep = currentTourStep === TOUR_STEPS.length - 1;

    // Check if we should show this spotlight
    useEffect(() => {
        // If no context (not wrapped in provider), don't show
        if (!onboarding) return;

        // If already seen (and not in tour mode), don't show
        if (onboarding.hasSeenPage(pageKey)) return;

        // Show after delay
        const timer = setTimeout(() => {
            setShouldRender(true);
            // Small delay to trigger animation
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [onboarding, pageKey, delay]);

    // Handle dismiss (non-tour mode)
    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);
            onboarding?.markPageAsSeen(pageKey);
            onDismiss?.();
        }, 200);
    };

    // Handle next step (tour mode)
    const handleNextStep = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);

            if (isTourMode) {
                onboarding?.nextTourStep();

                // Navigate to next page if not last step
                if (!isLastStep) {
                    const nextStep = TOUR_STEPS[currentTourStep + 1];
                    if (nextStep) {
                        navigate(nextStep.path);
                    }
                }
            } else {
                onboarding?.markPageAsSeen(pageKey);
            }

            onDismiss?.();
        }, 200);
    };

    // Handle skip tour
    const handleSkipTour = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);
            onboarding?.skipTour();
        }, 200);
    };

    // Don't render if not needed
    if (!shouldRender) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop - subtle, no blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/50 z-[9998]"
                        onClick={isTourMode ? undefined : handleDismiss}
                    />

                    {/* Modal - true center using flexbox */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{
                            duration: 0.15,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                        onClick={isTourMode ? undefined : handleDismiss}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-[400px]
                bg-[#1a1a1c] 
                border border-[#2a2a2c]
                rounded-xl
                shadow-2xl shadow-black/60"
                        >
                            {/* Tour progress indicator */}
                            {isTourMode && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#2a2a2c] rounded-t-xl overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#505055]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentTourStep + 1) / TOUR_STEPS.length) * 100}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            )}

                            {/* Skip/Close button - top right */}
                            <button
                                onClick={isTourMode ? handleSkipTour : handleDismiss}
                                className="absolute top-3.5 right-3.5 px-2 py-1 rounded-md 
                  text-[#505055] hover:text-[#808085] 
                  hover:bg-[#252528]
                  text-[12px] font-medium
                  transition-colors duration-150"
                            >
                                {isTourMode ? 'Skip tour' : <X className="w-4 h-4" />}
                            </button>

                            {/* Content */}
                            <div className="px-5 pt-5 pb-5">
                                {/* Step indicator for tour */}
                                {isTourMode && (
                                    <div className="mb-3 text-[11px] text-[#505055] font-medium tracking-wide uppercase">
                                        {currentTourStep + 1} of {TOUR_STEPS.length}
                                    </div>
                                )}

                                {/* Icon - small, muted, understated */}
                                {icon && !isTourMode && (
                                    <div className="mb-3.5 text-[#606065]">
                                        <div className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-[#606065]">
                                            {icon}
                                        </div>
                                    </div>
                                )}

                                {/* Title - clean, confident, no hype */}
                                <h3 className="text-[15px] font-medium text-[#f5f5f7] tracking-[-0.01em] mb-2 pr-16">
                                    {title}
                                </h3>

                                {/* Description - subdued, calm */}
                                <p className="text-[13px] text-[#86868b] leading-[1.6]">
                                    {description}
                                </p>

                                {/* Secondary description - even more subtle */}
                                {secondaryDescription && (
                                    <p className="text-[13px] text-[#58585d] leading-[1.6] mt-2">
                                        {secondaryDescription}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="mt-5 flex items-center justify-between">
                                    {/* Left side - empty or skip in tour mode */}
                                    <div />

                                    {/* Right side - action button */}
                                    <button
                                        onClick={isTourMode ? handleNextStep : handleDismiss}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium
                      transition-colors duration-150
                      ${isTourMode
                                                ? 'bg-[#f5f5f7] hover:bg-white text-[#1a1a1c]'
                                                : 'bg-[#2a2a2c] hover:bg-[#323235] text-[#f5f5f7] border border-[#3a3a3c]'
                                            }`}
                                    >
                                        {isTourMode ? (
                                            <>
                                                {isLastStep ? 'Finish' : 'Next'}
                                                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
                                            </>
                                        ) : (
                                            dismissText
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default OnboardingSpotlight;
