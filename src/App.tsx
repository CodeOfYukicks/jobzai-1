import { Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRecommendationsLoading } from './contexts/RecommendationsLoadingContext';
import { useAuth } from './contexts/AuthContext';
import { AssistantProvider } from './contexts/AssistantContext';
import BackgroundLoadingNotification from './components/recommendations/BackgroundLoadingNotification';
import LoadingStartModal from './components/recommendations/LoadingStartModal';
import PageLoader from './components/PageLoader';
import { ToastProvider } from './contexts/ToastContext';
import ToastInitializer from './components/ToastInitializer';
import { AIAssistantModal } from './components/assistant';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignsEarlyAccessPage from './pages/CampaignsEarlyAccessPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import CreateTemplatePage from './pages/CreateTemplatePage';
import CampaignEmailsPage from './pages/CampaignEmailsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';
import PlanSelectionPage from './pages/PlanSelectionPage';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import HubPage from './pages/HubPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SmartMatchingPage from './pages/SmartMatchingPage';
import SearchPage from './pages/SearchPage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import CVAnalysisPage from './pages/CVAnalysisPage';
import ATSAnalysisPage from './pages/ATSAnalysisPage';
import ATSAnalysisRouter from './pages/ATSAnalysisRouter';
import CVRewritePage from './pages/CVRewritePage';
import PremiumCVEditor from './pages/PremiumCVEditor';
import JobApplicationsPage from './pages/JobApplicationsPage';
import CalendarView from './pages/CalendarView';
import InterviewPrepPage from './pages/InterviewPrepPage';
import UpcomingInterviewsPage from './pages/UpcomingInterviewsPage';
import InterviewHelpPage from './pages/InterviewHelpPage';
import JobsPage from './pages/JobsPage';
import JobBoardPage from './pages/JobBoardPage';
import MatchesPage from './pages/MatchesPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import CVOptimizerPage from './pages/CVOptimizerPage';
import OptimizedCVEditPage from './pages/OptimizedCVEditPage';
import CVCreatorPage from './pages/CVCreatorPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import NotionEditorPage from './pages/NotionEditorPage';
import WhiteboardEditorPage from './pages/WhiteboardEditorPage';
import MockInterviewPage from './pages/MockInterviewPage';
import MockInterviewResultPage from './pages/MockInterviewResultPage';
import MockIntroScene from './pages/MockIntroScene';
import CareerIntelligencePage from './pages/CareerIntelligencePage';
import CampaignsAutoPage from './pages/CampaignsAutoPage';

import { initNotificationService } from './services/notificationService';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { resumePendingTasks } from './services/cvRewriteWorker';
import { useGmailReplyChecker } from './hooks/useGmailReplyChecker';
import { NotificationProvider } from './contexts/NotificationContext';
import { MicroFeedback } from './components/ui/MicroFeedback';

const queryClient = new QueryClient();

// Declare the window.ENV property for TypeScript
declare global {
  interface Window {
    ENV?: {
      VITE_OPENAI_API_KEY?: string;
      VITE_OPENAI_API_URL?: string;
      [key: string]: string | undefined;
    };
  }
}

// Add inside App component or in a useEffect somewhere
// Inject Vite environment variables into window for client-side access
window.ENV = {
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  VITE_OPENAI_API_URL: import.meta.env.VITE_OPENAI_API_URL,
};

console.log('Environment variables loaded into client side', {
  apiKey: window.ENV.VITE_OPENAI_API_KEY ? 
    `Present (starts with ${window.ENV.VITE_OPENAI_API_KEY.substring(0, 3)}...)` : 
    'Missing',
  apiUrl: window.ENV.VITE_OPENAI_API_URL || 'Using default'
});

function AppContent() {
  const { loadingState, stopLoading, toggleMinimized, setMinimized, closeStartModal } = useRecommendationsLoading();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Initialize interview notification service when user is logged in
    if (currentUser?.uid) {
      initNotificationService(currentUser.uid);
    }
  }, [currentUser]);

  // Resume any pending background tasks when app loads
  useEffect(() => {
    if (currentUser?.uid) {
      console.log('🔄 Checking for pending background tasks...');
      resumePendingTasks(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Initialize background task monitoring
  useBackgroundTasks();
  
  // Global Gmail reply checker - runs in background on all pages
  useGmailReplyChecker();
  
  return (
    <>
      <PageLoader />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <PublicRoute>
            <><Navbar /><HomePage /></>
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />
        <Route path="/verify-email" element={
          <PublicRoute>
            <EmailVerificationPage />
          </PublicRoute>
        } />
        
        {/* Profile completion route */}
        <Route path="/complete-profile" element={
          <PrivateRoute requireProfileCompleted={false}>
            <CompleteProfilePage />
          </PrivateRoute>
        } />
        
        {/* Payment success route - accessible without completed profile */}
        <Route path="/payment/success" element={
          <PrivateRoute requireProfileCompleted={false}>
            <PaymentSuccessPage />
          </PrivateRoute>
        } />
        
        {/* Payment cancel route - accessible without completed profile */}
        <Route path="/payment/cancel" element={
          <PrivateRoute requireProfileCompleted={false}>
            <PaymentCancelPage />
          </PrivateRoute>
        } />
        
        {/* Protected routes requiring completed profile */}
        <Route element={<PrivateRoute requireProfileCompleted={true} />}>
          <Route path="/hub" element={<HubPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/email-templates" element={<EmailTemplatesPage />} />
          <Route path="/email-templates/new" element={<CreateTemplatePage />} />
          <Route 
            path="/campaigns" 
            element={
              import.meta.env.VITE_CAMPAIGNS_ENABLED === 'true' 
                ? <CampaignsPage /> 
                : <CampaignsEarlyAccessPage />
            } 
          />
          <Route path="/campaign-emails" element={<CampaignEmailsPage />} />
          <Route path="/campaigns-auto" element={<CampaignsAutoPage />} />
          <Route path="/recommendations" element={<CareerIntelligencePage />} />
          <Route path="/recommendations-legacy" element={<RecommendationsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/smart-matching" element={<SmartMatchingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/professional-profile" element={<ProfessionalProfilePage />} />
          <Route path="/cv-analysis" element={<CVAnalysisPage />} />
          <Route path="/ats-analysis/:id" element={<ATSAnalysisRouter />} />
          <Route path="/ats-analysis/:id/cv-rewrite" element={<CVRewritePage />} />
          <Route path="/cv-editor" element={<PremiumCVEditor />} />
          <Route path="/ats-analysis/:id/cv-editor" element={<PremiumCVEditor />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          <Route path="/resume-builder/:id/cv-editor" element={<PremiumCVEditor />} />
          <Route path="/notes/:noteId" element={<NotionEditorPage />} />
          <Route path="/whiteboard/:whiteboardId" element={<WhiteboardEditorPage />} />
          <Route path="/cv-optimizer" element={<CVOptimizerPage />} />
          <Route path="/cv-optimizer/:id" element={<OptimizedCVEditPage />} />
          <Route path="/cv-creator" element={<CVCreatorPage />} />
          <Route path="/applications" element={<JobApplicationsPage />} />
          <Route path="/interview-prep/:applicationId/:interviewId" element={<InterviewPrepPage />} />
          <Route path="/upcoming-interviews" element={<UpcomingInterviewsPage />} />
          <Route path="/interview-help" element={<InterviewHelpPage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/mock-interview/:sessionId" element={<MockInterviewResultPage />} />
          <Route path="/mock-intro" element={<MockIntroScene />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/jobs" element={<JobBoardPage />} />
        </Route>

        {/* Public static pages */}
        <Route path="/select-plan" element={<PlanSelectionPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/calendar" element={<CalendarView />} />
      </Routes>
      
      {/* Global Background Loading Notification - visible on all pages */}
      <BackgroundLoadingNotification
        isOpen={loadingState.isGenerating}
        progress={loadingState.progress}
        message={loadingState.message}
        completedCount={loadingState.completedCount}
        totalCount={loadingState.totalCount}
        completedRecommendations={loadingState.completedRecommendations}
        isMinimized={loadingState.isMinimized}
        onMinimize={() => setMinimized(true)}
        onMaximize={() => setMinimized(false)}
      />
      
      
      {/* Custom dark-themed toast system */}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastInitializer />
        <NotificationProvider>
          <AssistantProvider>
            <AppContent />
            <AIAssistantModal />
            <MicroFeedback />
          </AssistantProvider>
        </NotificationProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}