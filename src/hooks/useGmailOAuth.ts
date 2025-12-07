import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// Gmail API scopes needed for sending emails
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

interface GmailTokens {
  accessToken: string;
  refreshToken?: string;
  email: string;
  expiresAt: number;
  connectedAt: any;
}

interface GmailSettings {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
}

interface UseGmailOAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  email: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: string;
            callback: (response: { code?: string; error?: string }) => void;
            error_callback?: (error: { type: string; message: string }) => void;
          }) => {
            requestCode: () => void;
          };
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void;
            error_callback?: (error: { type: string; message: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export function useGmailOAuth(): UseGmailOAuthReturn {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gmailSettings, setGmailSettings] = useState<GmailSettings | null>(null);

  // Load Gmail settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'gmail'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as GmailSettings;
          setGmailSettings(data);
        } else {
          console.warn('Gmail settings not found in Firestore');
        }
      } catch (err) {
        console.error('Error loading Gmail settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Load Google Identity Services script
  const loadGoogleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }, []);

  // Check existing connection on mount
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!currentUser) {
      setIsConnected(false);
      setIsLoading(false);
      return false;
    }

    try {
      const tokenDoc = await getDoc(doc(db, 'gmailTokens', currentUser.uid));
      
      if (tokenDoc.exists()) {
        const data = tokenDoc.data() as GmailTokens;
        
        // Check if token is still valid (with 5 min buffer)
        const isValid = data.expiresAt > Date.now() + 5 * 60 * 1000;
        
        if (isValid || data.refreshToken) {
          setIsConnected(true);
          setEmail(data.email);
          return true;
        } else {
          // Token expired and no refresh token
          setIsConnected(false);
          setEmail(null);
          return false;
        }
      }
      
      setIsConnected(false);
      setEmail(null);
      return false;
    } catch (err) {
      console.error('Error checking Gmail connection:', err);
      setError('Failed to check connection status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Connect Gmail account using implicit grant flow (for client-side)
  const connect = useCallback(async () => {
    if (!currentUser) {
      setError('Please sign in first');
      return;
    }

    if (!gmailSettings?.CLIENT_ID) {
      setError('Gmail OAuth is not configured. Please check Firestore settings/gmail.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadGoogleScript();

      // Use implicit grant flow (access token directly)
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: gmailSettings.CLIENT_ID,
        scope: GMAIL_SCOPES,
        callback: async (response) => {
          if (response.error) {
            setError(response.error);
            setIsLoading(false);
            return;
          }

          if (response.access_token) {
            try {
              // Get user email from Google
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                  Authorization: `Bearer ${response.access_token}`
                }
              });
              
              const userInfo = await userInfoResponse.json();
              const userEmail = userInfo.email;

              // Store tokens in Firestore
              await setDoc(doc(db, 'gmailTokens', currentUser.uid), {
                accessToken: response.access_token,
                email: userEmail,
                expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
                connectedAt: serverTimestamp(),
                userId: currentUser.uid
              });

              setIsConnected(true);
              setEmail(userEmail);
            } catch (err) {
              console.error('Error saving tokens:', err);
              setError('Failed to complete Gmail connection');
            }
          }
          setIsLoading(false);
        },
        error_callback: (err) => {
          console.error('OAuth error:', err);
          setError(err.message || 'OAuth failed');
          setIsLoading(false);
        }
      });

      // Trigger the OAuth flow
      client.requestAccessToken();
    } catch (err) {
      console.error('Error initiating Gmail OAuth:', err);
      setError('Failed to start Gmail connection');
      setIsLoading(false);
    }
  }, [currentUser, gmailSettings, loadGoogleScript]);

  // Disconnect Gmail account
  const disconnect = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'gmailTokens', currentUser.uid));
      setIsConnected(false);
      setEmail(null);
    } catch (err) {
      console.error('Error disconnecting Gmail:', err);
      setError('Failed to disconnect Gmail');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Check connection on mount and when user changes
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isLoading,
    email,
    error,
    connect,
    disconnect,
    checkConnection
  };
}

export default useGmailOAuth;
