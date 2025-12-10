import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ============================================
// TOUR STEP DEFINITION
// ============================================
export interface TourStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  action?: 'click' | 'wait' | 'input' | 'navigate';
  navigateTo?: string; // For navigation steps
  waitForElement?: string; // Wait for this element to appear before showing step
  highlightPadding?: number;
  onBeforeStep?: () => void;
  onAfterStep?: () => void;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}

// ============================================
// TOUR DEFINITIONS
// ============================================
export const TOURS: Record<string, Tour> = {
  // Tour for creating a CV from scratch in Resume Builder
  'create-cv': {
    id: 'create-cv',
    name: 'Create a Resume from Scratch',
    description: 'Learn how to create a professional resume using Resume Builder',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="resume-builder-link"]',
        title: 'Step 1 of 4',
        content: 'Click on **Resume Builder** in the menu to access the CV creation tool.',
        position: 'right',
        action: 'click',
        navigateTo: '/resume-builder',
      },
      {
        id: 'step-2-create',
        target: '[data-tour="new-resume-button"]',
        title: 'Step 2 of 4',
        content: 'Click **New Resume** to start creating your CV from scratch.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="new-resume-button"]',
        highlightPadding: 8,
      },
      {
        id: 'step-3-name',
        target: '[data-tour="resume-name-input"]',
        title: 'Step 3 of 4',
        content: 'Enter a **name** for your resume (e.g., "Software Engineer Resume").',
        position: 'bottom',
        action: 'input',
        waitForElement: '[data-tour="resume-name-input"]',
        highlightPadding: 8,
      },
      {
        id: 'step-4-template',
        target: '[data-tour="template-selection"]',
        title: 'Done!',
        content: 'Choose a **template** that fits your style, then click **Create** to start editing your resume.',
        position: 'top',
        action: 'click',
        highlightPadding: 12,
      },
    ],
  },

  // Tour for analyzing an existing CV in Resume Lab
  'analyze-cv': {
    id: 'analyze-cv',
    name: 'Analyze Your Resume',
    description: 'Learn how to analyze your CV with Resume Lab',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="resume-lab-link"]',
        title: 'Step 1 of 4',
        content: 'Click on **Resume Lab** in the menu to access the CV analysis tool.',
        position: 'right',
        action: 'click',
        navigateTo: '/cv-analysis',
      },
      {
        id: 'step-2-upload',
        target: '[data-tour="cv-upload"]',
        title: 'Step 2 of 4',
        content: 'Upload your CV here in **PDF format**. Drag & drop or click to browse.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="cv-upload"]',
        highlightPadding: 12,
      },
      {
        id: 'step-3-job-input',
        target: '[data-tour="job-description"]',
        title: 'Step 3 of 4',
        content: 'Paste the **job description** you\'re targeting. Our AI will compare your CV against the requirements.',
        position: 'top',
        action: 'input',
        highlightPadding: 8,
      },
      {
        id: 'step-4-analyze',
        target: '[data-tour="analyze-button"]',
        title: 'Done!',
        content: 'Click **Analyze Resume** to launch the AI analysis. You\'ll get a compatibility score and personalized recommendations.',
        position: 'top',
        action: 'click',
        highlightPadding: 8,
      },
    ],
  },
  
  'track-applications': {
    id: 'track-applications',
    name: 'Track Your Applications',
    description: 'Learn how to use the application tracking board',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="applications-link"]',
        title: 'Step 1 of 4',
        content: 'Click on **Application Tracking** to access your tracking board.',
        position: 'right',
        action: 'click',
        navigateTo: '/applications',
      },
      {
        id: 'step-2-add',
        target: '[data-tour="add-application"]',
        title: 'Step 2 of 4',
        content: 'Click **Add** to create a new job application.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="add-application"]',
      },
      {
        id: 'step-3-form',
        target: '[data-tour="application-form"]',
        title: 'Step 3 of 4',
        content: 'Fill in the details: company, position, date, and job posting link.',
        position: 'left',
        action: 'wait',
      },
      {
        id: 'step-4-kanban',
        target: '[data-tour="kanban-board"]',
        title: 'Done!',
        content: 'Drag and drop your applications between columns to update their status.',
        position: 'top',
        action: 'wait',
      },
    ],
  },

  'prepare-interview': {
    id: 'prepare-interview',
    name: 'Prepare for an Interview',
    description: 'Use Mock Interview to practice',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="mock-interview-link"]',
        title: 'Step 1 of 3',
        content: 'Click on **Mock Interview** to access the AI interview practice.',
        position: 'right',
        action: 'click',
        navigateTo: '/mock-interview',
      },
      {
        id: 'step-2-select',
        target: '[data-tour="interview-type"]',
        title: 'Step 2 of 3',
        content: 'Choose the type of interview: technical, HR, or behavioral.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="interview-type"]',
      },
      {
        id: 'step-3-start',
        target: '[data-tour="start-interview"]',
        title: 'Done!',
        content: 'Click to start your AI-powered mock interview session.',
        position: 'top',
        action: 'click',
      },
    ],
  },
};

// ============================================
// CONTEXT TYPE
// ============================================
interface TourContextType {
  // State
  activeTour: Tour | null;
  currentStepIndex: number;
  isActive: boolean;
  
  // Actions
  startTour: (tourId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  endTour: () => void;
  
  // Helpers
  currentStep: TourStep | null;
  totalSteps: number;
  progress: number;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
export function TourProvider({ children }: { children: ReactNode }) {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = activeTour !== null;
  const currentStep = activeTour?.steps[currentStepIndex] ?? null;
  const totalSteps = activeTour?.steps.length ?? 0;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  // Start a tour by ID
  const startTour = useCallback((tourId: string) => {
    const tour = TOURS[tourId];
    if (!tour) {
      console.error(`Tour "${tourId}" not found`);
      return;
    }
    
    console.log(`🎯 Starting tour: ${tour.name}`);
    setActiveTour(tour);
    setCurrentStepIndex(0);
    
    // If first step requires navigation, do it
    const firstStep = tour.steps[0];
    if (firstStep.navigateTo && location.pathname !== firstStep.navigateTo) {
      navigate(firstStep.navigateTo);
    }
  }, [navigate, location.pathname]);

  // Go to next step
  const nextStep = useCallback(() => {
    if (!activeTour) return;
    
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex >= activeTour.steps.length) {
      // Tour complete
      endTour();
      return;
    }
    
    const nextStepData = activeTour.steps[nextIndex];
    
    // Handle navigation if needed
    if (nextStepData.navigateTo && location.pathname !== nextStepData.navigateTo) {
      navigate(nextStepData.navigateTo);
    }
    
    setCurrentStepIndex(nextIndex);
  }, [activeTour, currentStepIndex, navigate, location.pathname]);

  // Go to previous step
  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  // Skip/end tour
  const skipTour = useCallback(() => {
    console.log('⏭️ Tour skipped');
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, []);

  const endTour = useCallback(() => {
    console.log('✅ Tour completed');
    setActiveTour(null);
    setCurrentStepIndex(0);
  }, []);

  // Note: Auto-advance on click is handled by TourOverlay component
  // to avoid conflicts with the spotlight click handler

  const value: TourContextType = {
    activeTour,
    currentStepIndex,
    isActive,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    endTour,
    currentStep,
    totalSteps,
    progress,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

