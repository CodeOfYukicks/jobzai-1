import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Navbar /><HomePage /></>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/select-plan" element={<PlanSelectionPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/email-templates" element={<EmailTemplatesPage />} />
            <Route path="/email-templates/new" element={<CreateTemplatePage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaign-emails" element={<CampaignEmailsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </div>
    </QueryClientProvider>
  );
}