import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes'

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import CreateTemplatePage from './pages/CreateTemplatePage';
import CampaignEmailsPage from './pages/CampaignEmailsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';
import BillingPage from './pages/BillingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PaymentPage from './pages/PaymentPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import CookiesPage from './pages/CookiesPage';
import PlanSelectionPage from './pages/PlanSelectionPage';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import { ThemeToggle } from './components/ui/theme-toggle';
import HubPage from './pages/HubPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import SmartMatchingPage from './pages/SmartMatchingPage';
import SearchPage from './pages/SearchPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaign-emails" element={<CampaignEmailsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/smart-matching" element={<SmartMatchingPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>

          {/* Public static pages */}
          <Route path="/select-plan" element={<PlanSelectionPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
        </Routes>
        <Toaster position="top-right" />
        <ThemeToggle />
      </ThemeProvider>
    </QueryClientProvider>
  );
}