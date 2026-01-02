import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

// Consent preferences type
interface ConsentPreferences {
    essential: boolean; // Always true
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
}

const CONSENT_KEY = 'cubbbe_cookie_consent';

// Get saved consent from localStorage
const getSavedConsent = (): ConsentPreferences | null => {
    try {
        const saved = localStorage.getItem(CONSENT_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error reading cookie consent:', e);
    }
    return null;
};

// Save consent to localStorage
const saveConsent = (preferences: ConsentPreferences): void => {
    try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences));
    } catch (e) {
        console.error('Error saving cookie consent:', e);
    }
};

// Cookie toggle component
interface ToggleProps {
    enabled: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}

function Toggle({ enabled, onChange, disabled = false }: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(!enabled)}
            className={`
        relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
        ${enabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
        >
            <span
                className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow ring-0 
          transition duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
            />
        </button>
    );
}

// Cookie category row
interface CategoryRowProps {
    title: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
    required?: boolean;
}

function CategoryRow({ title, description, enabled, onChange, required = false }: CategoryRowProps) {
    return (
        <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
                    {required && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                            Required
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
            </div>
            <Toggle enabled={enabled} onChange={onChange} disabled={required} />
        </div>
    );
}

// Main Cookie Consent Banner
export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    // Consent state
    const [analytics, setAnalytics] = useState(true);
    const [marketing, setMarketing] = useState(false);

    // Check if consent already given
    useEffect(() => {
        const savedConsent = getSavedConsent();
        if (!savedConsent) {
            // Small delay to avoid banner showing during page load animation
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Handle accept all
    const handleAcceptAll = useCallback(() => {
        const preferences: ConsentPreferences = {
            essential: true,
            analytics: true,
            marketing: true,
            timestamp: Date.now(),
        };
        saveConsent(preferences);
        setIsExiting(true);
        setTimeout(() => setIsVisible(false), 300);
    }, []);

    // Handle save preferences
    const handleSavePreferences = useCallback(() => {
        const preferences: ConsentPreferences = {
            essential: true,
            analytics,
            marketing,
            timestamp: Date.now(),
        };
        saveConsent(preferences);
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            setShowCustomize(false);
        }, 300);
    }, [analytics, marketing]);

    // Handle reject all (only in customize view)
    const handleRejectAll = useCallback(() => {
        const preferences: ConsentPreferences = {
            essential: true,
            analytics: false,
            marketing: false,
            timestamp: Date.now(),
        };
        saveConsent(preferences);
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            setShowCustomize(false);
        }, 300);
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop for customize modal */}
            <AnimatePresence>
                {showCustomize && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[9998]"
                        onClick={() => setShowCustomize(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Banner - Horizontal bar on desktop, card on mobile */}
            <AnimatePresence>
                {!showCustomize && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 8 : 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed bottom-0 left-0 right-0 z-[9999]"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cookie-consent-title"
                    >
                        {/* Desktop: Full-width horizontal bar */}
                        <div className="hidden lg:block bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
                            <div className="max-w-7xl mx-auto px-6 py-4">
                                <div className="flex items-center justify-between gap-8">
                                    {/* Left: Icon + Text */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                            <Cookie className="w-5 h-5 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                <span className="font-medium text-gray-900 dark:text-white">We respect your privacy.</span>
                                                {' '}We use cookies to improve your experience and understand how the product is used.{' '}
                                                <Link
                                                    to="/cookies"
                                                    className="text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                >
                                                    Learn more
                                                </Link>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Buttons */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => setShowCustomize(true)}
                                            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-full"
                                        >
                                            Customize
                                        </button>
                                        <button
                                            onClick={handleAcceptAll}
                                            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                        >
                                            Accept all
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile: Compact card */}
                        <div className="lg:hidden p-4">
                            <div className="relative bg-white/90 dark:bg-[#141416]/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] border border-gray-100/50 dark:border-gray-800/50 p-5">
                                {/* Cookie icon - subtle */}
                                <div className="absolute top-5 right-5 opacity-[0.08] dark:opacity-[0.12] pointer-events-none">
                                    <Cookie className="w-14 h-14 text-gray-900 dark:text-white" strokeWidth={1} />
                                </div>

                                {/* Content */}
                                <div className="relative">
                                    <h2
                                        id="cookie-consent-title"
                                        className="text-[15px] font-medium text-gray-900 dark:text-white mb-1.5"
                                    >
                                        We respect your privacy
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 max-w-[320px]">
                                        We use cookies to improve your experience.{' '}
                                        <Link
                                            to="/cookies"
                                            className="text-gray-600 dark:text-gray-300 underline underline-offset-2"
                                        >
                                            Learn more
                                        </Link>
                                    </p>

                                    {/* Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleAcceptAll}
                                            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
                                        >
                                            Accept all
                                        </button>
                                        <button
                                            onClick={() => setShowCustomize(true)}
                                            className="px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                                        >
                                            Customize
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Customize Modal - Same for both desktop and mobile */}
            <AnimatePresence>
                {showCustomize && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 20 : 0, scale: isExiting ? 0.98 : 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[9999] sm:max-w-[480px]"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cookie-customize-title"
                    >
                        <div className="bg-white dark:bg-[#141416] backdrop-blur-xl rounded-2xl shadow-[0_12px_48px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.6)] border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                                <h2
                                    id="cookie-customize-title"
                                    className="text-base font-semibold text-gray-900 dark:text-white"
                                >
                                    Cookie preferences
                                </h2>
                                <button
                                    onClick={() => setShowCustomize(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Categories */}
                            <div className="px-5">
                                <CategoryRow
                                    title="Essential"
                                    description="Required for the site to function properly"
                                    enabled={true}
                                    onChange={() => { }}
                                    required
                                />
                                <CategoryRow
                                    title="Analytics"
                                    description="Help us understand how you use Cubbbe"
                                    enabled={analytics}
                                    onChange={setAnalytics}
                                />
                                <CategoryRow
                                    title="Marketing"
                                    description="Personalized ads and retargeting"
                                    enabled={marketing}
                                    onChange={setMarketing}
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between gap-3 p-5 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={handleRejectAll}
                                    className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded-lg"
                                >
                                    Reject all
                                </button>
                                <button
                                    onClick={handleSavePreferences}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Save preferences
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Hook to check consent status
export function useCookieConsent(): ConsentPreferences | null {
    const [consent, setConsent] = useState<ConsentPreferences | null>(null);

    useEffect(() => {
        setConsent(getSavedConsent());

        // Listen for storage changes
        const handleStorage = () => {
            setConsent(getSavedConsent());
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    return consent;
}

// Utility to check specific consent
export function hasAnalyticsConsent(): boolean {
    const consent = getSavedConsent();
    return consent?.analytics ?? false;
}

export function hasMarketingConsent(): boolean {
    const consent = getSavedConsent();
    return consent?.marketing ?? false;
}
