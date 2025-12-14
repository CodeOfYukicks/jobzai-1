import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from 'firebase/auth';

// Google Calendar API scopes
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
  colorId?: string;
}

interface CalendarTokens {
  accessToken: string;
  refreshToken?: string;
  email: string;
  expiresAt: number;
  connectedAt: any;
}

interface CalendarSettings {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
}

interface CreateEventParams {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
}

interface UseGoogleCalendarReturn {
  isConnected: boolean;
  isLoading: boolean;
  isFetching: boolean;
  email: string | null;
  error: string | null;
  events: GoogleCalendarEvent[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<GoogleCalendarEvent[]>;
  createEvent: (params: CreateEventParams) => Promise<GoogleCalendarEvent | null>;
  updateEvent: (eventId: string, params: Partial<CreateEventParams>) => Promise<GoogleCalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
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
        };
      };
    };
  }
}

// Local storage keys for persistence
const STORAGE_KEY_CONNECTED = 'googleCalendar_connected';
const STORAGE_KEY_EMAIL = 'googleCalendar_email';

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const { currentUser } = useAuth();
  
  // Initialize state from localStorage for instant UI feedback
  const [isConnected, setIsConnected] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_CONNECTED) === 'true';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [email, setEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_EMAIL);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [hasCheckedConnection, setHasCheckedConnection] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  
  // Persist connection state to localStorage
  const persistConnectionState = useCallback((connected: boolean, userEmail: string | null) => {
    try {
      if (connected && userEmail) {
        localStorage.setItem(STORAGE_KEY_CONNECTED, 'true');
        localStorage.setItem(STORAGE_KEY_EMAIL, userEmail);
      } else {
        localStorage.removeItem(STORAGE_KEY_CONNECTED);
        localStorage.removeItem(STORAGE_KEY_EMAIL);
      }
    } catch (e) {
      console.warn('Failed to persist calendar connection state:', e);
    }
  }, []);

  // Load Calendar settings from Firestore (reuse gmail settings)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try calendar-specific settings first, fall back to gmail
        let settingsDoc = await getDoc(doc(db, 'settings', 'calendar'));
        if (!settingsDoc.exists()) {
          settingsDoc = await getDoc(doc(db, 'settings', 'gmail'));
        }
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as CalendarSettings;
          setCalendarSettings(data);
        } else {
          console.warn('Calendar/Gmail settings not found in Firestore');
        }
      } catch (err) {
        console.error('Error loading Calendar settings:', err);
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

  // Get Firebase ID token
  const getIdToken = useCallback(async (): Promise<string | null> => {
    const auth = getAuth();
    return auth.currentUser?.getIdToken() || null;
  }, []);

  // Check existing connection on mount
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!currentUser) {
      // Don't clear connection state immediately - user might still be loading
      setIsLoading(false);
      return false;
    }

    try {
      const tokenDoc = await getDoc(doc(db, 'calendarTokens', currentUser.uid));
      
      if (tokenDoc.exists()) {
        const data = tokenDoc.data() as CalendarTokens;
        
        // Check if token is still valid (with 5 min buffer) or has refresh token
        const isValid = data.expiresAt > Date.now() + 5 * 60 * 1000;
        
        if (isValid || data.refreshToken) {
          setIsConnected(true);
          setEmail(data.email);
          persistConnectionState(true, data.email);
          setHasCheckedConnection(true);
          return true;
        } else {
          setIsConnected(false);
          setEmail(null);
          persistConnectionState(false, null);
          setHasCheckedConnection(true);
          return false;
        }
      }
      
      setIsConnected(false);
      setEmail(null);
      persistConnectionState(false, null);
      setHasCheckedConnection(true);
      return false;
    } catch (err) {
      console.error('Error checking Calendar connection:', err);
      setError('Failed to check connection status');
      // Don't clear connection state on error - might be temporary
      setHasCheckedConnection(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, persistConnectionState]);

  // Connect Google Calendar using Authorization Code flow
  const connect = useCallback(async () => {
    if (!currentUser) {
      setError('Please sign in first');
      return;
    }

    if (!calendarSettings?.CLIENT_ID) {
      setError('Google Calendar OAuth is not configured. Please check Firestore settings.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadGoogleScript();

      const client = window.google!.accounts.oauth2.initCodeClient({
        client_id: calendarSettings.CLIENT_ID,
        scope: CALENDAR_SCOPES,
        ux_mode: 'popup',
        callback: async (response) => {
          if (response.error) {
            setError(response.error);
            setIsLoading(false);
            return;
          }

          if (response.code) {
            try {
              const idToken = await getIdToken();

              const exchangeResponse = await fetch(`${BACKEND_URL}/api/calendar/exchange-code`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ code: response.code })
              });

              const data = await exchangeResponse.json();

              if (data.success) {
                setIsConnected(true);
                setEmail(data.email);
                persistConnectionState(true, data.email);
              } else {
                setError(data.error || 'Failed to exchange code');
              }
            } catch (err) {
              console.error('Error exchanging code:', err);
              setError('Failed to complete Calendar connection');
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

      client.requestCode();
    } catch (err) {
      console.error('Error initiating Calendar OAuth:', err);
      setError('Failed to start Calendar connection');
      setIsLoading(false);
    }
  }, [currentUser, calendarSettings, loadGoogleScript, getIdToken, BACKEND_URL, persistConnectionState]);

  // Disconnect Google Calendar
  const disconnect = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'calendarTokens', currentUser.uid));
      setIsConnected(false);
      setEmail(null);
      setEvents([]);
      persistConnectionState(false, null);
    } catch (err) {
      console.error('Error disconnecting Calendar:', err);
      setError('Failed to disconnect Calendar');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, persistConnectionState]);

  // Fetch events from Google Calendar
  const fetchEvents = useCallback(async (startDate: Date, endDate: Date): Promise<GoogleCalendarEvent[]> => {
    if (!currentUser || !isConnected) {
      return [];
    }

    setIsFetching(true);
    setError(null);

    try {
      const idToken = await getIdToken();

      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString()
      });

      const response = await fetch(`${BACKEND_URL}/api/calendar/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        const fetchedEvents: GoogleCalendarEvent[] = data.events.map((event: any) => ({
          id: event.id,
          summary: event.summary || 'Untitled Event',
          description: event.description,
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
          allDay: !event.start.dateTime,
          location: event.location,
          htmlLink: event.htmlLink,
          colorId: event.colorId
        }));
        setEvents(fetchedEvents);
        return fetchedEvents;
      } else {
        if (data.needsReconnect) {
          setIsConnected(false);
          setEmail(null);
          persistConnectionState(false, null);
        }
        setError(data.error || 'Failed to fetch events');
        return [];
      }
    } catch (err) {
      console.error('Error fetching Calendar events:', err);
      setError('Failed to fetch events');
      return [];
    } finally {
      setIsFetching(false);
    }
  }, [currentUser, isConnected, getIdToken, BACKEND_URL, persistConnectionState]);

  // Create event in Google Calendar
  const createEvent = useCallback(async (params: CreateEventParams): Promise<GoogleCalendarEvent | null> => {
    if (!currentUser || !isConnected) {
      setError('Not connected to Google Calendar');
      return null;
    }

    try {
      const idToken = await getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();

      if (data.success) {
        const newEvent: GoogleCalendarEvent = {
          id: data.event.id,
          summary: data.event.summary || params.summary,
          description: data.event.description,
          start: new Date(data.event.start.dateTime || data.event.start.date),
          end: new Date(data.event.end.dateTime || data.event.end.date),
          allDay: !data.event.start.dateTime,
          location: data.event.location,
          htmlLink: data.event.htmlLink
        };
        setEvents(prev => [...prev, newEvent]);
        return newEvent;
      } else {
        if (data.needsReconnect) {
          setIsConnected(false);
          setEmail(null);
          persistConnectionState(false, null);
        }
        setError(data.error || 'Failed to create event');
        return null;
      }
    } catch (err) {
      console.error('Error creating Calendar event:', err);
      setError('Failed to create event');
      return null;
    }
  }, [currentUser, isConnected, getIdToken, BACKEND_URL, persistConnectionState]);

  // Update event in Google Calendar
  const updateEvent = useCallback(async (eventId: string, params: Partial<CreateEventParams>): Promise<GoogleCalendarEvent | null> => {
    if (!currentUser || !isConnected) {
      setError('Not connected to Google Calendar');
      return null;
    }

    try {
      const idToken = await getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();

      if (data.success) {
        const updatedEvent: GoogleCalendarEvent = {
          id: data.event.id,
          summary: data.event.summary,
          description: data.event.description,
          start: new Date(data.event.start.dateTime || data.event.start.date),
          end: new Date(data.event.end.dateTime || data.event.end.date),
          allDay: !data.event.start.dateTime,
          location: data.event.location,
          htmlLink: data.event.htmlLink
        };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        return updatedEvent;
      } else {
        if (data.needsReconnect) {
          setIsConnected(false);
          setEmail(null);
          persistConnectionState(false, null);
        }
        setError(data.error || 'Failed to update event');
        return null;
      }
    } catch (err) {
      console.error('Error updating Calendar event:', err);
      setError('Failed to update event');
      return null;
    }
  }, [currentUser, isConnected, getIdToken, BACKEND_URL, persistConnectionState]);

  // Delete event from Google Calendar
  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!currentUser || !isConnected) {
      setError('Not connected to Google Calendar');
      return false;
    }

    try {
      const idToken = await getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        return true;
      } else {
        if (data.needsReconnect) {
          setIsConnected(false);
          setEmail(null);
          persistConnectionState(false, null);
        }
        setError(data.error || 'Failed to delete event');
        return false;
      }
    } catch (err) {
      console.error('Error deleting Calendar event:', err);
      setError('Failed to delete event');
      return false;
    }
  }, [currentUser, isConnected, getIdToken, BACKEND_URL, persistConnectionState]);

  // Check connection on mount and when user changes
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isLoading,
    isFetching,
    email,
    error,
    events,
    connect,
    disconnect,
    checkConnection,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}

export default useGoogleCalendar;

