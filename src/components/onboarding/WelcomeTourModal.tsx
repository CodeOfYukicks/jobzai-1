import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useOnboarding, TOUR_STEPS } from '../../contexts/OnboardingContext';

/**
 * WelcomeTourModal
 * 
 * Premium, minimal welcome modal for new users.
 * Appears once after signup to offer a guided tour.
 */

const WELCOME_SHOWN_KEY = 'cubbbe_welcome_shown';

export function WelcomeTourModal() {
    console.log('[WelcomeTourModal] Component rendering');
    const navigate = useNavigate();
    const { startTour, isTourActive, hasCompletedTour } = useOnboarding();
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        console.log('[WelcomeTourModal] Checking conditions:', { isTourActive, hasCompletedTour });

        // Don't show if in tour or already completed
        if (isTourActive || hasCompletedTour) {
            console.log('[WelcomeTourModal] Skipping: tour active or completed');
            return;
        }

        // Check localStorage - if already shown ever, don't show again
        const alreadyShown = localStorage.getItem(WELCOME_SHOWN_KEY);
        console.log('[WelcomeTourModal] alreadyShown:', alreadyShown);
        if (alreadyShown) return;

        console.log('[WelcomeTourModal] Will show modal in 1s');
        // Show after delay
        const timer = setTimeout(() => {
            console.log('[WelcomeTourModal] Showing modal now');
            setShouldRender(true);
            requestAnimationFrame(() => setIsVisible(true));
        }, 1000);

        return () => clearTimeout(timer);
    }, [isTourActive, hasCompletedTour]);

    const handleStartTour = () => {
        localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);
            startTour();
            if (TOUR_STEPS.length > 0) {
                navigate(TOUR_STEPS[0].path);
            }
        }, 200);
    };

    const handleSkip = () => {
        localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
        setIsVisible(false);
        setTimeout(() => setShouldRender(false), 200);
    };

    if (!shouldRender) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
                    >
                        <div className="relative w-full max-w-[360px] bg-[#0a0a0a] rounded-2xl overflow-hidden">
                            {/* Subtle top accent */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            {/* Content */}
                            <div className="px-8 pt-10 pb-8 text-center">
                                <div className="mb-6 text-4xl">👋</div>

                                <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em] mb-3">
                                    Welcome to Cubbbe
                                </h2>

                                <p className="text-[15px] text-[#888] leading-relaxed mb-8">
                                    Take a quick tour to discover how to land your next opportunity faster.
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={handleStartTour}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl
                      bg-white text-black text-[15px] font-semibold
                      hover:bg-gray-100 active:scale-[0.98]
                      transition-all duration-150"
                                    >
                                        Take a tour
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={handleSkip}
                                        className="w-full py-2.5 px-5 rounded-xl
                      text-[14px] font-medium text-[#666]
                      hover:text-[#999] active:opacity-70
                      transition-colors duration-150"
                                    >
                                        I'll explore on my own
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

export default WelcomeTourModal;
