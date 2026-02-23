// Suppress tldraw license warnings in production (temporary until license key is added)
import './lib/suppressTldrawLicense';

import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
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

const rootElement = document.getElementById('root')!;

const app = (
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

// If react-snap has pre-rendered content, hydrate instead of creating new root
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}