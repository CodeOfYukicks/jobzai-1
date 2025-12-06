import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
import { RecommendationsLoadingProvider } from './contexts/RecommendationsLoadingContext';
import { MissionsProvider } from './contexts/MissionsContext';
import App from './App';
import './index.css';
import { initializeTheme } from './lib/theme';

// Initialize theme from localStorage on startup
initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MissionsProvider>
          <RecommendationsProvider>
            <RecommendationsLoadingProvider>
              <App />
            </RecommendationsLoadingProvider>
          </RecommendationsProvider>
        </MissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);