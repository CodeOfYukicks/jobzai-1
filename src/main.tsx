import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
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
          <App />
        </RecommendationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);