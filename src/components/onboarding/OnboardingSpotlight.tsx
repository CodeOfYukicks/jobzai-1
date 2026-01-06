import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
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
// HOOK: Detect mobile
// ============================================

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return isMobile;
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
    const isMobile = useIsMobile();

    const isTourMode = onboarding?.isTourActive ?? false;
    const currentTourStep = onboarding?.currentTourStep ?? 0;
    const isLastStep = currentTourStep === TOUR_STEPS.length - 1;

    // Get current step's video URL if in tour mode
    const currentStepData = isTourMode ? TOUR_STEPS[currentTourStep] : null;
    const videoUrl = currentStepData?.videoUrl;

    // Check if we should show this spotlight
    useEffect(() => {
        if (!onboarding) return;
        if (onboarding.hasSeenPage(pageKey)) return;

        const timer = setTimeout(() => {
            setShouldRender(true);
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [onboarding, pageKey, delay]);

    // Handle dismiss
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

    // Handle swipe down to dismiss (mobile)
    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y > 80 || info.velocity.y > 500) {
            if (isTourMode) {
                handleSkipTour();
            } else {
                handleDismiss();
            }
        }
    };

    if (!shouldRender) return null;

    // ============================================
    // MOBILE: Bottom Sheet Style
    // ============================================
    if (isMobile) {
        return (
            <AnimatePresence>
                {isVisible && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 z-[9998]"
                            onClick={isTourMode ? undefined : handleDismiss}
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{
                                type: 'spring',
                                damping: 30,
                                stiffness: 300
                            }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.6 }}
                            onDragEnd={handleDragEnd}
                            className="fixed bottom-0 left-0 right-0 z-[9999]"
                        >
                            <div className="bg-[#1c1c1e] rounded-t-[20px] pb-8 pt-3 safe-area-pb">
                                {/* Drag Handle */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-9 h-1 rounded-full bg-[#3a3a3c]" />
                                </div>

                                {/* Progress bar (tour mode) */}
                                {isTourMode && (
                                    <div className="mx-5 mb-4">
                                        <div className="h-0.5 bg-[#2c2c2e] rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#636366]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((currentTourStep + 1) / TOUR_STEPS.length) * 100}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[11px] text-[#636366] font-medium">
                                                {currentTourStep + 1} of {TOUR_STEPS.length}
                                            </span>
                                            <button
                                                onClick={handleSkipTour}
                                                className="text-[13px] text-[#636366] font-medium active:opacity-50"
                                            >
                                                Skip
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="px-5">
                                    {/* Video (if available) */}
                                    {videoUrl && (
                                        <div className="mb-4 rounded-xl overflow-hidden bg-black/20">
                                            <video
                                                key={videoUrl}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="w-full h-auto max-h-[200px] object-cover"
                                            >
                                                <source src={videoUrl} type="video/webm" />
                                                <source src={videoUrl.replace('.webm', '.mp4')} type="video/mp4" />
                                            </video>
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h3 className="text-[17px] font-semibold text-white tracking-[-0.02em] mb-2">
                                        {title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-[15px] text-[#98989f] leading-[1.5]">
                                        {description}
                                    </p>

                                    {/* Secondary */}
                                    {secondaryDescription && (
                                        <p className="text-[15px] text-[#636366] leading-[1.5] mt-2">
                                            {secondaryDescription}
                                        </p>
                                    )}

                                    {/* Action Button - Full width, iOS style */}
                                    <button
                                        onClick={isTourMode ? handleNextStep : handleDismiss}
                                        className="mt-6 w-full py-3.5 rounded-xl text-[17px] font-semibold
                      bg-white text-black
                      active:opacity-80 transition-opacity"
                                    >
                                        {isTourMode ? (isLastStep ? 'Done' : 'Continue') : dismissText}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        );
    }

    // ============================================
    // DESKTOP: Centered Modal
    // ============================================
    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/50 z-[9998]"
                        onClick={isTourMode ? undefined : handleDismiss}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                        onClick={isTourMode ? undefined : handleDismiss}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-[400px] bg-[#1a1a1c] border border-[#2a2a2c] rounded-xl shadow-2xl shadow-black/60"
                        >
                            {/* Progress bar */}
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

                            {/* Skip button */}
                            <button
                                onClick={isTourMode ? handleSkipTour : handleDismiss}
                                className="absolute top-3.5 right-3.5 px-2 py-1 rounded-md text-[#505055] hover:text-[#808085] hover:bg-[#252528] text-[12px] font-medium transition-colors duration-150"
                            >
                                {isTourMode ? 'Skip tour' : '✕'}
                            </button>

                            {/* Content */}
                            <div className="px-5 pt-5 pb-5">
                                {isTourMode && (
                                    <div className="mb-3 text-[11px] text-[#505055] font-medium tracking-wide uppercase">
                                        {currentTourStep + 1} of {TOUR_STEPS.length}
                                    </div>
                                )}

                                {/* Video (if available) */}
                                {videoUrl && (
                                    <div className="mb-4 rounded-lg overflow-hidden bg-black/20">
                                        <video
                                            key={videoUrl}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-auto max-h-[180px] object-cover"
                                        >
                                            <source src={videoUrl} type="video/webm" />
                                            <source src={videoUrl.replace('.webm', '.mp4')} type="video/mp4" />
                                        </video>
                                    </div>
                                )}

                                {icon && !isTourMode && (
                                    <div className="mb-3.5 text-[#606065]">
                                        <div className="w-5 h-5 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-[#606065]">
                                            {icon}
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-[15px] font-medium text-[#f5f5f7] tracking-[-0.01em] mb-2 pr-16">
                                    {title}
                                </h3>

                                <p className="text-[13px] text-[#86868b] leading-[1.6]">
                                    {description}
                                </p>

                                {secondaryDescription && (
                                    <p className="text-[13px] text-[#58585d] leading-[1.6] mt-2">
                                        {secondaryDescription}
                                    </p>
                                )}

                                <div className="mt-5 flex items-center justify-end">
                                    <button
                                        onClick={isTourMode ? handleNextStep : handleDismiss}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150
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
