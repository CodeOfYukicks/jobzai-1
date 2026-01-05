import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================
// TYPES
// ============================================

export interface TourStep {
    pageKey: string;
    path: string;
    title: string;
    description: string;
    secondaryDescription?: string;
    icon?: string; // Icon name to use
}

interface OnboardingContextType {
    // Page-level onboarding
    hasSeenPage: (pageKey: string) => boolean;
    markPageAsSeen: (pageKey: string) => void;
    isOnboardingDisabled: boolean;
    disableAllOnboarding: () => void;
    resetOnboarding: () => void;

    // Guided tour
    isTourActive: boolean;
    currentTourStep: number;
    tourSteps: TourStep[];
    startTour: () => void;
    nextTourStep: () => void;
    skipTour: () => void;
    hasCompletedTour: boolean;
}

// ============================================
// TOUR STEPS DEFINITION
// ============================================

export const TOUR_STEPS: TourStep[] = [
    {
        pageKey: 'dashboard',
        path: '/dashboard',
        title: 'Your command center',
        description: 'See your active applications, upcoming interviews, and campaign performance at a glance.',
    },
    {
        pageKey: 'job-board',
        path: '/jobs',
        title: 'Discover opportunities',
        description: 'Browse job listings matched to your profile. Save jobs to track them in your applications.',
    },
    {
        pageKey: 'job-applications',
        path: '/applications',
        title: 'Track your applications',
        description: 'Manage all your opportunities in one place — both job applications and outreach campaigns.',
    },
    {
        pageKey: 'campaigns',
        path: '/campaigns-auto',
        title: 'Reach companies directly',
        description: 'Create personalized cold outreach campaigns. AI generates tailored emails for each prospect.',
    },
    {
        pageKey: 'cv-analysis',
        path: '/cv-analysis',
        title: 'Optimize your resume',
        description: 'Upload your CV and paste a job listing. Get your ATS compatibility score and recommendations.',
    },
    {
        pageKey: 'resume-builder',
        path: '/resume-builder',
        title: 'Your documents',
        description: 'Create tailored resumes, notes, and whiteboards — all organized in one place.',
    },
    {
        pageKey: 'mock-interview',
        path: '/mock-interview',
        title: 'Practice interviews',
        description: 'AI plays the role of the interviewer. Get detailed feedback on your performance.',
    },
];

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'cubbbe_onboarding_seen';
const DISABLED_KEY = 'cubbbe_onboarding_disabled';
const TOUR_COMPLETED_KEY = 'cubbbe_tour_completed';

// ============================================
// CONTEXT
// ============================================

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [seenPages, setSeenPages] = useState<Set<string>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    const [isOnboardingDisabled, setIsOnboardingDisabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem(DISABLED_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
        } catch {
            return false;
        }
    });

    // Tour state
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentTourStep, setCurrentTourStep] = useState(0);

    // Sync to localStorage when seenPages changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...seenPages]));
        } catch {
            // Ignore storage errors
        }
    }, [seenPages]);

    // Check if a page has been seen
    const hasSeenPage = useCallback((pageKey: string): boolean => {
        // During tour, always show the spotlight for the current step
        if (isTourActive) {
            const currentStep = TOUR_STEPS[currentTourStep];
            if (currentStep && currentStep.pageKey === pageKey) {
                return false; // Force show during tour
            }
            return true; // Hide non-current steps
        }
        if (isOnboardingDisabled) return true;
        return seenPages.has(pageKey);
    }, [seenPages, isOnboardingDisabled, isTourActive, currentTourStep]);

    // Mark a page as seen
    const markPageAsSeen = useCallback((pageKey: string) => {
        setSeenPages(prev => {
            const newSet = new Set(prev);
            newSet.add(pageKey);
            return newSet;
        });
    }, []);

    // Disable all onboarding globally
    const disableAllOnboarding = useCallback(() => {
        setIsOnboardingDisabled(true);
        try {
            localStorage.setItem(DISABLED_KEY, 'true');
        } catch {
            // Ignore storage errors
        }
    }, []);

    // Reset all onboarding (dev utility)
    const resetOnboarding = useCallback(() => {
        setSeenPages(new Set());
        setIsOnboardingDisabled(false);
        setHasCompletedTour(false);
        setIsTourActive(false);
        setCurrentTourStep(0);
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(DISABLED_KEY);
            localStorage.removeItem(TOUR_COMPLETED_KEY);
        } catch {
            // Ignore storage errors
        }
    }, []);

    // Start the guided tour
    const startTour = useCallback(() => {
        setIsTourActive(true);
        setCurrentTourStep(0);
    }, []);

    // Move to next tour step (called by OnboardingSpotlight)
    const nextTourStep = useCallback(() => {
        const currentStep = TOUR_STEPS[currentTourStep];
        if (currentStep) {
            // Mark current page as seen
            setSeenPages(prev => {
                const newSet = new Set(prev);
                newSet.add(currentStep.pageKey);
                return newSet;
            });
        }

        if (currentTourStep < TOUR_STEPS.length - 1) {
            setCurrentTourStep(prev => prev + 1);
        } else {
            // Tour complete
            setIsTourActive(false);
            setHasCompletedTour(true);
            try {
                localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
            } catch {
                // Ignore
            }
        }
    }, [currentTourStep]);

    // Skip the entire tour
    const skipTour = useCallback(() => {
        setIsTourActive(false);
        setHasCompletedTour(true);
        // Mark all tour pages as seen
        setSeenPages(prev => {
            const newSet = new Set(prev);
            TOUR_STEPS.forEach(step => newSet.add(step.pageKey));
            return newSet;
        });
        try {
            localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
        } catch {
            // Ignore
        }
    }, []);

    return (
        <OnboardingContext.Provider
            value={{
                hasSeenPage,
                markPageAsSeen,
                isOnboardingDisabled,
                disableAllOnboarding,
                resetOnboarding,
                isTourActive,
                currentTourStep,
                tourSteps: TOUR_STEPS,
                startTour,
                nextTourStep,
                skipTour,
                hasCompletedTour,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}

// ============================================
// OPTIONAL HOOK (doesn't throw if outside provider)
// ============================================

export function useOnboardingOptional() {
    return useContext(OnboardingContext);
}
