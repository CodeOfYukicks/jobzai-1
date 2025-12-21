import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
        title: 'Step 1 of 5',
        content: 'Click on **Resume Lab** in the menu to access the CV analysis tool.',
        position: 'right',
        action: 'click',
        navigateTo: '/cv-analysis',
      },
      {
        id: 'step-2-start-analysis',
        target: '[data-tour="start-analysis-button"]',
        title: 'Step 2 of 5',
        content: 'Click **New Analysis** to start. A modal will open to guide you through the process.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="start-analysis-button"]',
        highlightPadding: 12,
      },
      {
        id: 'step-3-cv-upload',
        target: '[data-tour="analysis-modal"]',
        title: 'Step 3 of 5',
        content: '**Step 1 - Upload your CV**: Use your saved CV from your profile, choose from Resume Builder, or upload a new PDF.',
        position: 'left',
        action: 'wait',
        highlightPadding: 16,
      },
      {
        id: 'step-4-job-details',
        target: '[data-tour="analysis-modal"]',
        title: 'Step 4 of 5',
        content: '**Step 2 - Add job details**: Use AI Extraction (paste URL), Manual Entry (type details), or Saved Jobs (reuse previous).',
        position: 'left',
        action: 'wait',
        highlightPadding: 16,
      },
      {
        id: 'step-5-analyze',
        target: '[data-tour="analysis-modal"]',
        title: 'Done! 🎉',
        content: 'Click **Analyze Resume** to get your ATS score, skills analysis, and personalized recommendations!',
        position: 'left',
        action: 'wait',
        highlightPadding: 16,
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

  // Tour for optimizing a CV for a specific job
  'optimize-cv': {
    id: 'optimize-cv',
    name: 'Optimize Your Resume',
    description: 'Learn how to optimize your CV for a specific job',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="cv-optimizer-link"]',
        title: 'Step 1 of 6',
        content: 'Click on **CV Optimizer** in the menu to access the optimization tool.',
        position: 'right',
        action: 'click',
        navigateTo: '/cv-optimizer',
      },
      {
        id: 'step-2-upload',
        target: '[data-tour="cv-upload-optimizer"]',
        title: 'Step 2 of 6',
        content: 'Upload the CV you want to optimize or select one from your saved CVs.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="cv-upload-optimizer"]',
        highlightPadding: 12,
      },
      {
        id: 'step-3-job-url',
        target: '[data-tour="job-url-input"]',
        title: 'Step 3 of 6',
        content: 'Paste the **job posting URL**. Our AI will extract all the details automatically!',
        position: 'top',
        action: 'input',
        highlightPadding: 8,
      },
      {
        id: 'step-4-job-details',
        target: '[data-tour="job-details-manual"]',
        title: 'Step 4 of 6',
        content: 'Alternatively, you can enter the job details **manually** if you prefer.',
        position: 'top',
        action: 'wait',
        highlightPadding: 8,
      },
      {
        id: 'step-5-optimize',
        target: '[data-tour="optimize-button"]',
        title: 'Step 5 of 6',
        content: 'Click **Optimize Resume** to start the optimization process.',
        position: 'top',
        action: 'click',
        highlightPadding: 8,
      },
      {
        id: 'step-6-results',
        target: '[data-tour="optimization-results"]',
        title: 'Done!',
        content: 'Review your **optimized CV** with improved keywords, better formatting, and tailored content. You can **download** it or **save** it to Resume Builder!',
        position: 'top',
        action: 'wait',
        highlightPadding: 12,
      },
    ],
  },

  // Tour for comparing multiple CVs
  'compare-cvs': {
    id: 'compare-cvs',
    name: 'Compare Multiple Resumes',
    description: 'Learn how to compare different versions of your CV',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="resume-lab-link"]',
        title: 'Step 1 of 5',
        content: 'Go to **Resume Lab** to access the comparison feature.',
        position: 'right',
        action: 'click',
        navigateTo: '/cv-analysis',
      },
      {
        id: 'step-2-select-first',
        target: '[data-tour="compare-mode-toggle"]',
        title: 'Step 2 of 5',
        content: 'Enable **Compare Mode** to compare multiple analyses side by side.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="compare-mode-toggle"]',
        highlightPadding: 8,
      },
      {
        id: 'step-3-select-analyses',
        target: '[data-tour="analysis-selector"]',
        title: 'Step 3 of 5',
        content: 'Select **2 or more analyses** from your history to compare.',
        position: 'top',
        action: 'click',
        highlightPadding: 8,
      },
      {
        id: 'step-4-compare',
        target: '[data-tour="compare-button"]',
        title: 'Step 4 of 5',
        content: 'Click **Compare** to view the side-by-side comparison.',
        position: 'top',
        action: 'click',
        highlightPadding: 8,
      },
      {
        id: 'step-5-view-results',
        target: '[data-tour="comparison-view"]',
        title: 'Done!',
        content: 'Review the **comparison dashboard** showing scores, skills, and recommendations for each CV version!',
        position: 'top',
        action: 'wait',
        highlightPadding: 12,
      },
    ],
  },

  // Tour for searching and finding jobs on the Job Board
  'search-jobs': {
    id: 'search-jobs',
    name: 'Find a Job on Job Board',
    description: 'Learn how to search for and apply to jobs',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="job-board-link"]',
        title: 'Step 1 of 5',
        content: 'Click on **Job Board** to access thousands of job listings.',
        position: 'right',
        action: 'click',
        navigateTo: '/jobs',
      },
      {
        id: 'step-2-search',
        target: '[data-tour="search-bar"]',
        title: 'Step 2 of 5',
        content: 'Use the **search bar** to search by keyword, company, or position.',
        position: 'bottom',
        action: 'wait',
        waitForElement: '[data-tour="search-bar"]',
        highlightPadding: 8,
      },
      {
        id: 'step-3-filters',
        target: '[data-tour="job-filters"]',
        title: 'Step 3 of 5',
        content: 'Apply **filters** to refine your search: Remote, Full-time, Location, Level, Salary.',
        position: 'left',
        action: 'wait',
        waitForElement: '[data-tour="job-filters"]',
        highlightPadding: 12,
      },
      {
        id: 'step-4-for-you',
        target: '[data-tour="for-you-toggle"]',
        title: 'Step 4 of 5',
        content: 'Click **For You** to see jobs that match your profile automatically!',
        position: 'bottom',
        action: 'click',
        highlightPadding: 8,
      },
      {
        id: 'step-5-apply',
        target: '[data-tour="job-card"]',
        title: 'Done!',
        content: 'Click on a job to see details. Use **Save** to bookmark or **Apply** to apply directly!',
        position: 'top',
        action: 'wait',
        highlightPadding: 12,
      },
    ],
  },

  // Tour for creating outreach campaigns
  'create-campaign': {
    id: 'create-campaign',
    name: 'Create an Outreach Campaign',
    description: 'Learn how to create automated outreach campaigns',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="campaigns-link"]',
        title: 'Step 1 of 5',
        content: 'Click on **AutoPilot** or **Campaigns** to access the outreach tool.',
        position: 'right',
        action: 'click',
        navigateTo: '/campaigns-auto',
      },
      {
        id: 'step-2-create',
        target: '[data-tour="new-campaign-button"]',
        title: 'Step 2 of 5',
        content: 'Click **New Campaign** to start creating your outreach sequence.',
        position: 'bottom',
        action: 'click',
        waitForElement: '[data-tour="new-campaign-button"]',
        highlightPadding: 8,
      },
      {
        id: 'step-3-target',
        target: '[data-tour="campaign-target"]',
        title: 'Step 3 of 5',
        content: 'Define your **target**: industries, job types, company size, location.',
        position: 'left',
        action: 'wait',
        highlightPadding: 12,
      },
      {
        id: 'step-4-emails',
        target: '[data-tour="email-sequence"]',
        title: 'Step 4 of 5',
        content: 'Create your **email sequence**: first contact + follow-ups.',
        position: 'top',
        action: 'wait',
        highlightPadding: 12,
      },
      {
        id: 'step-5-launch',
        target: '[data-tour="launch-campaign"]',
        title: 'Done!',
        content: 'Add contacts and click **Launch** to start your automated outreach!',
        position: 'top',
        action: 'wait',
        highlightPadding: 8,
      },
    ],
  },

  // Tour for using AI recommendations
  'use-recommendations': {
    id: 'use-recommendations',
    name: 'Use AI Recommendations',
    description: 'Learn how to use personalized AI recommendations',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="recommendations-link"]',
        title: 'Step 1 of 4',
        content: 'Click on **Recommendations** to access AI-powered advice.',
        position: 'right',
        action: 'click',
        navigateTo: '/recommendations',
      },
      {
        id: 'step-2-view',
        target: '[data-tour="recommendations-list"]',
        title: 'Step 2 of 4',
        content: 'View your **personalized recommendations** sorted by priority and impact.',
        position: 'top',
        action: 'wait',
        waitForElement: '[data-tour="recommendations-list"]',
        highlightPadding: 12,
      },
      {
        id: 'step-3-details',
        target: '[data-tour="recommendation-card"]',
        title: 'Step 3 of 4',
        content: 'Click a recommendation to see **details and concrete actions** to take.',
        position: 'left',
        action: 'click',
        highlightPadding: 8,
      },
      {
        id: 'step-4-complete',
        target: '[data-tour="complete-action"]',
        title: 'Done!',
        content: 'Mark actions as **completed** to track your progress. Recommendations update based on your activity!',
        position: 'top',
        action: 'wait',
        highlightPadding: 8,
      },
    ],
  },

  // Tour for understanding the dashboard
  'understand-dashboard': {
    id: 'understand-dashboard',
    name: 'Understand Your Dashboard',
    description: 'Learn how to read and use your dashboard metrics',
    steps: [
      {
        id: 'step-1-menu',
        target: '[data-tour="dashboard-link"]',
        title: 'Step 1 of 4',
        content: 'Click on **Dashboard** to access your overview.',
        position: 'right',
        action: 'click',
        navigateTo: '/dashboard',
      },
      {
        id: 'step-2-metrics',
        target: '[data-tour="main-metrics"]',
        title: 'Step 2 of 4',
        content: 'These are your **key metrics**: total applications, response rate, interviews scheduled, offers received.',
        position: 'bottom',
        action: 'wait',
        waitForElement: '[data-tour="main-metrics"]',
        highlightPadding: 12,
      },
      {
        id: 'step-3-activity',
        target: '[data-tour="recent-activity"]',
        title: 'Step 3 of 4',
        content: 'Check your **recent activity**: latest actions and status changes.',
        position: 'left',
        action: 'wait',
        highlightPadding: 12,
      },
      {
        id: 'step-4-interviews',
        target: '[data-tour="upcoming-interviews"]',
        title: 'Done!',
        content: 'View your **upcoming interviews** here. Click to go directly to preparation!',
        position: 'top',
        action: 'wait',
        highlightPadding: 8,
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

    // Dispatch custom event to expand sidebar
    window.dispatchEvent(new CustomEvent('tourstart', { detail: { tourId } }));

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

