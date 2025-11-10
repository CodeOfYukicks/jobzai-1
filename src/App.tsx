import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

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
import JobApplicationsPage from './pages/JobApplicationsPage';
import CalendarView from './pages/CalendarView';
import InterviewPrepPage from './pages/InterviewPrepPage';
import UpcomingInterviewsPage from './pages/UpcomingInterviewsPage';
import InterviewHelpPage from './pages/InterviewHelpPage';
import EmailVerificationPage from './pages/EmailVerificationPage';

import { initNotificationService } from './services/notificationService';

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

export default function App() {
  useEffect(() => {
    // Initialize interview notification service
    initNotificationService();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/smart-matching" element={<SmartMatchingPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/professional-profile" element={<ProfessionalProfilePage />} />
          <Route path="/cv-analysis" element={<CVAnalysisPage />} />
          <Route path="/applications" element={<JobApplicationsPage />} />
          <Route path="/interview-prep/:applicationId/:interviewId" element={<InterviewPrepPage />} />
          <Route path="/upcoming-interviews" element={<UpcomingInterviewsPage />} />
          <Route path="/interview-help" element={<InterviewHelpPage />} />
        </Route>

        {/* Public static pages */}
        <Route path="/select-plan" element={<PlanSelectionPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/calendar" element={<CalendarView />} />
      </Routes>
      <Toaster
        position="top-right"
        expand={false}
        richColors={false}
        theme="light"
        className="!font-sans"
        toastOptions={{
          style: {
            background: 'white',
            border: 'none',
            color: '#1a1a1a',
            fontSize: '14px',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            padding: '12px 16px',
          },
          className: 'toast-custom',
          success: {
            style: {
              background: '#f0fdf4',
              borderLeft: '4px solid #22c55e',
            },
            icon: '✓',
          },
          error: {
            style: {
              background: '#fef2f2',
              borderLeft: '4px solid #ef4444',
            },
            icon: '✕',
          },
          warning: {
            style: {
              background: '#fffbeb',
              borderLeft: '4px solid #f59e0b',
            },
            icon: '⚠',
          },
        }}
      />
    </QueryClientProvider>
  );
}