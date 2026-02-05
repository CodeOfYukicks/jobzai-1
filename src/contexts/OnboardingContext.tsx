import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

// ============================================
// TYPES
// ============================================

export interface TourStep {
    pageKey: string;
    path: string;
    title: string;
    description: string;
    secondaryDescription?: string;
    icon?: string;
    /** Optional video URL for animated demo (WebM or MP4) */
    videoUrl?: string;
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
    canShowTourButton: boolean; // True if within 24h of first completion or never completed
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
        videoUrl: '/videos/onboarding/dashboard.mp4',
    },
    {
        pageKey: 'job-board',
        path: '/jobs',
        title: 'Discover opportunities',
        description: 'Browse job listings matched to your profile. Save jobs to track them in your applications.',
        videoUrl: '/videos/onboarding/job-board.mp4',
    },
    {
        pageKey: 'job-applications',
        path: '/applications',
        title: 'Track your applications',
        description: 'Manage all your opportunities in one place — both job applications and outreach campaigns.',
        videoUrl: '/videos/onboarding/applications.mp4',
    },
    {
        pageKey: 'campaigns',
        path: '/campaigns-auto',
        title: 'Reach companies directly',
        description: 'Create personalized cold outreach campaigns. AI generates tailored emails for each prospect.',
        videoUrl: '/videos/onboarding/campaigns.mp4',
    },
    {
        pageKey: 'cv-analysis',
        path: '/cv-analysis',
        title: 'Optimize your resume',
        description: 'Upload your CV and paste a job listing. Get your ATS compatibility score and recommendations.',
        videoUrl: '/videos/onboarding/cv-analysis.mp4',
    },
    {
        pageKey: 'resume-builder',
        path: '/resume-builder',
        title: 'Your documents',
        description: 'Create tailored resumes, notes, and whiteboards — all organized in one place.',
        videoUrl: '/videos/onboarding/resume-builder.mp4',
    },
    {
        pageKey: 'mock-interview',
        path: '/mock-interview',
        title: 'Practice interviews',
        description: 'AI plays the role of the interviewer. Get detailed feedback on your performance.',
        videoUrl: '/videos/onboarding/mock-interview.mp4',
    },
];

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY_BASE = 'cubbbe_onboarding_seen';
const DISABLED_KEY_BASE = 'cubbbe_onboarding_disabled';
const TOUR_COMPLETED_KEY_BASE = 'cubbbe_tour_completed_at'; // Stores timestamp

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ============================================
// CONTEXT
// ============================================

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid;

    const [seenPages, setSeenPages] = useState<Set<string>>(new Set());
    const [isOnboardingDisabled, setIsOnboardingDisabled] = useState<boolean>(false);
    const [tourCompletedAt, setTourCompletedAt] = useState<number | null>(null);

    // Initial load when userId changes
    useEffect(() => {
        if (!userId) {
            setSeenPages(new Set());
            setIsOnboardingDisabled(false);
            setTourCompletedAt(null);
            return;
        }

        try {
            const seen = localStorage.getItem(`${STORAGE_KEY_BASE}_${userId}`);
            const disabled = localStorage.getItem(`${DISABLED_KEY_BASE}_${userId}`);
            const completedAt = localStorage.getItem(`${TOUR_COMPLETED_KEY_BASE}_${userId}`);

            if (seen) setSeenPages(new Set(JSON.parse(seen)));
            if (disabled) setIsOnboardingDisabled(disabled === 'true');
            if (completedAt) setTourCompletedAt(parseInt(completedAt, 10));
        } catch (e) {
            console.error('Error loading onboarding state:', e);
        }
    }, [userId]);

    // Derived state
    const hasCompletedTour = tourCompletedAt !== null;
    const canShowTourButton = !tourCompletedAt || (Date.now() - tourCompletedAt < TWENTY_FOUR_HOURS);

    // Tour state
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentTourStep, setCurrentTourStep] = useState(0);

    // Sync to localStorage when seenPages changes
    useEffect(() => {
        if (!userId) return;
        try {
            localStorage.setItem(`${STORAGE_KEY_BASE}_${userId}`, JSON.stringify([...seenPages]));
        } catch {
            // Ignore storage errors
        }
    }, [seenPages, userId]);

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
        if (!userId) return;
        try {
            localStorage.setItem(`${DISABLED_KEY_BASE}_${userId}`, 'true');
        } catch {
            // Ignore storage errors
        }
    }, [userId]);

    // Reset all onboarding (dev utility)
    const resetOnboarding = useCallback(() => {
        setSeenPages(new Set());
        setIsOnboardingDisabled(false);
        setTourCompletedAt(null);
        setIsTourActive(false);
        setCurrentTourStep(0);
        if (!userId) return;
        try {
            localStorage.removeItem(`${STORAGE_KEY_BASE}_${userId}`);
            localStorage.removeItem(`${DISABLED_KEY_BASE}_${userId}`);
            localStorage.removeItem(`${TOUR_COMPLETED_KEY_BASE}_${userId}`);
        } catch {
            // Ignore storage errors
        }
    }, [userId]);

    // Start the guided tour
    const startTour = useCallback(() => {
        setIsTourActive(true);
        setCurrentTourStep(0);
        // Reset seen pages for fresh tour experience
        setSeenPages(new Set());
        // Do NOT create the key yet, so if they refresh mid-tour, it's not "completed"
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
            // Tour complete - store timestamp
            setIsTourActive(false);
            const now = Date.now();
            setTourCompletedAt(now);
            if (!userId) return;
            try {
                localStorage.setItem(`${TOUR_COMPLETED_KEY_BASE}_${userId}`, now.toString());
            } catch {
                // Ignore
            }
        }
    }, [currentTourStep, userId]);

    // Skip the entire tour
    const skipTour = useCallback(() => {
        setIsTourActive(false);
        const now = Date.now();
        setTourCompletedAt(now);
        // Mark all tour pages as seen
        setSeenPages(prev => {
            const newSet = new Set(prev);
            TOUR_STEPS.forEach(step => newSet.add(step.pageKey));
            return newSet;
        });
        if (!userId) return;
        try {
            localStorage.setItem(`${TOUR_COMPLETED_KEY_BASE}_${userId}`, now.toString());
        } catch {
            // Ignore
        }
    }, [userId]);

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
                canShowTourButton,
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
