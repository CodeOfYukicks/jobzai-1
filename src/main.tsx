import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
import { RecommendationsLoadingProvider } from './contexts/RecommendationsLoadingContext';
import App from './App';
import './index.css';
import { forceLightMode } from './lib/theme';

// Force light mode on startup (dark mode only works when logged in)
forceLightMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RecommendationsProvider>
          <RecommendationsLoadingProvider>
            <App />
          </RecommendationsLoadingProvider>
        </RecommendationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);