import { Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, lazy, Suspense } from 'react';
import { useRecommendationsLoading } from './contexts/RecommendationsLoadingContext';
import { useAuth } from './contexts/AuthContext';
import { AssistantProvider } from './contexts/AssistantContext';
import { TourProvider } from './contexts/TourContext';
import BackgroundLoadingNotification from './components/recommendations/BackgroundLoadingNotification';
import LoadingStartModal from './components/recommendations/LoadingStartModal';
import PageLoader from './components/PageLoader';
import { ToastProvider } from './contexts/ToastContext';
import ToastInitializer from './components/ToastInitializer';
import { AIAssistantModal } from './components/assistant';
import { TourOverlay } from './components/tour';

import Navbar from './components/Navbar';
import AdminGuard from './components/admin/AdminGuard';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

// Lazy-loaded pages - only load when navigated to
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampaignsEarlyAccessPage = lazy(() => import('./pages/CampaignsEarlyAccessPage'));
const EmailTemplatesPage = lazy(() => import('./pages/EmailTemplatesPage'));
const CreateTemplatePage = lazy(() => import('./pages/CreateTemplatePage'));
const CampaignEmailsPage = lazy(() => import('./pages/CampaignEmailsPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CookiesPage = lazy(() => import('./pages/CookiesPage'));
const PlanSelectionPage = lazy(() => import('./pages/PlanSelectionPage'));
const HubPage = lazy(() => import('./pages/HubPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const SmartMatchingPage = lazy(() => import('./pages/SmartMatchingPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfessionalProfilePage = lazy(() => import('./pages/ProfessionalProfilePage'));
const CVAnalysisPage = lazy(() => import('./pages/CVAnalysisPage'));
const ATSAnalysisRouter = lazy(() => import('./pages/ATSAnalysisRouter'));
const CVRewritePage = lazy(() => import('./pages/CVRewritePage'));
const PremiumCVEditor = lazy(() => import('./pages/PremiumCVEditor'));
const JobApplicationsPage = lazy(() => import('./pages/JobApplicationsPage'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const InterviewPrepPage = lazy(() => import('./pages/InterviewPrepPage'));
const ProspectMeetingPrepPage = lazy(() => import('./pages/ProspectMeetingPrepPage'));
const UpcomingInterviewsPage = lazy(() => import('./pages/UpcomingInterviewsPage'));
const InterviewHelpPage = lazy(() => import('./pages/InterviewHelpPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobBoardPage = lazy(() => import('./pages/JobBoardPage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const CVOptimizerPage = lazy(() => import('./pages/CVOptimizerPage'));
const OptimizedCVEditPage = lazy(() => import('./pages/OptimizedCVEditPage'));
const CVCreatorPage = lazy(() => import('./pages/CVCreatorPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const NotionEditorPage = lazy(() => import('./pages/NotionEditorPage'));
const WhiteboardEditorPage = lazy(() => import('./pages/WhiteboardEditorPage'));
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'));
const MockIntroScene = lazy(() => import('./pages/MockIntroScene'));
const CareerIntelligencePage = lazy(() => import('./pages/CareerIntelligencePage'));
const CampaignsAutoPage = lazy(() => import('./pages/CampaignsAutoPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const AdminBlogPage = lazy(() => import('./pages/admin/AdminBlogPage'));
const BlogEditorPage = lazy(() => import('./pages/admin/BlogEditorPage'));

import { initNotificationService } from './services/notificationService';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { resumePendingTasks } from './services/cvRewriteWorker';
import { useGmailReplyChecker } from './hooks/useGmailReplyChecker';
import { NotificationProvider } from './contexts/NotificationContext';
import { MicroFeedback } from './components/ui/MicroFeedback';
import CookieConsent from './components/CookieConsent';

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <PublicRoute>
              <><Navbar /><HomePage /></>
            </PublicRoute>
          } />
          <Route path="/blog" element={
            <PublicRoute>
              <BlogPage />
            </PublicRoute>
          } />
          <Route path="/blog/:slug" element={
            <PublicRoute>
              <BlogPostPage />
            </PublicRoute>
          } />

          {/* Admin Blog Routes - Protected */}
          <Route path="/admin/blog" element={
            <PrivateRoute requireProfileCompleted={false}>
              <AdminGuard>
                <AdminBlogPage />
              </AdminGuard>
            </PrivateRoute>
          } />
          <Route path="/admin/blog/new" element={
            <PrivateRoute requireProfileCompleted={false}>
              <AdminGuard>
                <BlogEditorPage />
              </AdminGuard>
            </PrivateRoute>
          } />
          <Route path="/admin/blog/edit/:id" element={
            <PrivateRoute requireProfileCompleted={false}>
              <AdminGuard>
                <BlogEditorPage />
              </AdminGuard>
            </PrivateRoute>
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
            <Route path="/meeting-prep/:applicationId/:meetingId" element={<ProspectMeetingPrepPage />} />
            <Route path="/upcoming-interviews" element={<UpcomingInterviewsPage />} />
            <Route path="/interview-help" element={<InterviewHelpPage />} />
            <Route path="/mock-interview" element={<MockInterviewPage />} />
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
      </Suspense>

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
            <TourProvider>
              <AppContent />
              <AIAssistantModal />
              <TourOverlay />
              <MicroFeedback />
              <CookieConsent />
            </TourProvider>
          </AssistantProvider>
        </NotificationProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}