/**
 * Activity Log Service
 * 
 * Provides functionality to track and retrieve user activity events.
 * Used for the Activity Timeline feature in Settings.
 */

import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where,
  Timestamp,
  DocumentData,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ============================================================================
// Types
// ============================================================================

export type ActivityType = 
  | 'login' 
  | 'logout' 
  | 'password_change' 
  | 'email_change' 
  | 'settings_update' 
  | 'export_data' 
  | 'profile_update' 
  | 'security_change'
  | 'cv_created'
  | 'cv_updated'
  | 'application_sent'
  | 'subscription_changed';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  timestamp: Date;
  device?: string;
  browser?: string;
  location?: string;
  ip?: string;
  details?: Record<string, string>;
}

export interface ActivityLogOptions {
  limit?: number;
  type?: ActivityType;
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
}

// ============================================================================
// Device Detection Utilities
// ============================================================================

/**
 * Detects the user's device type from the user agent string
 */
export function detectDevice(): string {
  const ua = navigator.userAgent;
  
  if (/iPad/.test(ua)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) {
    if (/Mobile/.test(ua)) return 'Android Phone';
    return 'Android Tablet';
  }
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux';
  
  return 'Unknown Device';
}

/**
 * Detects the user's browser from the user agent string
 */
export function detectBrowser(): string {
  const ua = navigator.userAgent;
  
  // Order matters - check more specific patterns first
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  
  return 'Unknown Browser';
}

/**
 * Gets basic location info (would need a geolocation API for real implementation)
 */
export async function getLocationInfo(): Promise<string | undefined> {
  // In a real implementation, you would:
  // 1. Use a geolocation API service
  // 2. Or use the browser's Geolocation API with user permission
  // For now, we return undefined
  return undefined;
}

// ============================================================================
// Activity Logging Functions
// ============================================================================

/**
 * Logs an activity event for a user
 */
export async function logActivity(
  userId: string,
  type: ActivityType,
  details?: Record<string, string>
): Promise<string | null> {
  if (!userId) {
    console.error('Cannot log activity: No user ID provided');
    return null;
  }

  try {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    
    const activityData = {
      type,
      timestamp: Timestamp.now(),
      device: detectDevice(),
      browser: detectBrowser(),
      details: details || null,
      // IP and location would be set server-side in production
    };

    const docRef = await addDoc(activitiesRef, activityData);
    
    console.log(`[Activity] Logged ${type} event for user ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Retrieves activity events for a user with optional filtering and pagination
 */
export async function getActivities(
  userId: string,
  options: ActivityLogOptions = {}
): Promise<{ activities: ActivityEvent[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  if (!userId) {
    console.error('Cannot get activities: No user ID provided');
    return { activities: [], lastDoc: null };
  }

  try {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    
    // Build query constraints
    let constraints: any[] = [orderBy('timestamp', 'desc')];
    
    // Add type filter if specified
    if (options.type) {
      constraints = [where('type', '==', options.type), ...constraints];
    }
    
    // Add limit
    constraints.push(limit(options.limit || 20));
    
    // Add pagination cursor if provided
    if (options.startAfterDoc) {
      constraints.push(startAfter(options.startAfterDoc));
    }
    
    const q = query(activitiesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    const activities: ActivityEvent[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type as ActivityType,
        timestamp: data.timestamp?.toDate() || new Date(),
        device: data.device,
        browser: data.browser,
        location: data.location,
        ip: data.ip,
        details: data.details,
      };
    });
    
    const lastDoc = snapshot.docs.length > 0 
      ? snapshot.docs[snapshot.docs.length - 1] 
      : null;
    
    return { activities, lastDoc };
  } catch (error) {
    console.error('Error getting activities:', error);
    return { activities: [], lastDoc: null };
  }
}

/**
 * Gets activity count for a specific type within a time range
 */
export async function getActivityCount(
  userId: string,
  type: ActivityType,
  since: Date
): Promise<number> {
  if (!userId) return 0;

  try {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const q = query(
      activitiesRef,
      where('type', '==', type),
      where('timestamp', '>=', Timestamp.fromDate(since))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting activity count:', error);
    return 0;
  }
}

// ============================================================================
// Activity Labels & Icons Mapping
// ============================================================================

export const activityLabels: Record<ActivityType, string> = {
  login: 'Signed in',
  logout: 'Signed out',
  password_change: 'Password changed',
  email_change: 'Email updated',
  settings_update: 'Settings updated',
  export_data: 'Data exported',
  profile_update: 'Profile updated',
  security_change: 'Security settings changed',
  cv_created: 'CV created',
  cv_updated: 'CV updated',
  application_sent: 'Application sent',
  subscription_changed: 'Subscription changed',
};

export const activityDescriptions: Record<ActivityType, string> = {
  login: 'You signed in to your account',
  logout: 'You signed out of your account',
  password_change: 'Your password was changed',
  email_change: 'Your email address was updated',
  settings_update: 'Your settings were modified',
  export_data: 'Your data was exported',
  profile_update: 'Your profile information was updated',
  security_change: 'Your security settings were modified',
  cv_created: 'A new CV was created',
  cv_updated: 'A CV was updated',
  application_sent: 'A job application was sent',
  subscription_changed: 'Your subscription was changed',
};

// ============================================================================
// Helper for formatting relative time
// ============================================================================

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// ============================================================================
// Auto-logging hooks for common events
// ============================================================================

/**
 * Call this when a user logs in
 */
export async function logLogin(userId: string) {
  return logActivity(userId, 'login');
}

/**
 * Call this when a user logs out
 */
export async function logLogout(userId: string) {
  return logActivity(userId, 'logout');
}

/**
 * Call this when a user changes their password
 */
export async function logPasswordChange(userId: string) {
  return logActivity(userId, 'password_change');
}

/**
 * Call this when a user updates their email
 */
export async function logEmailChange(userId: string, newEmail: string) {
  return logActivity(userId, 'email_change', { new_email: newEmail });
}

/**
 * Call this when a user updates their settings
 */
export async function logSettingsUpdate(userId: string, setting: string, newValue: string) {
  return logActivity(userId, 'settings_update', { setting, new_value: newValue });
}

/**
 * Call this when a user exports their data
 */
export async function logDataExport(userId: string) {
  return logActivity(userId, 'export_data');
}

/**
 * Call this when a user updates their profile
 */
export async function logProfileUpdate(userId: string, fields?: string[]) {
  return logActivity(userId, 'profile_update', fields ? { updated_fields: fields.join(', ') } : undefined);
}

/**
 * Call this when security settings are changed
 */
export async function logSecurityChange(userId: string, change: string) {
  return logActivity(userId, 'security_change', { change });
}

/**
 * Call this when a CV is created
 */
export async function logCVCreated(userId: string, cvName?: string) {
  return logActivity(userId, 'cv_created', cvName ? { cv_name: cvName } : undefined);
}

/**
 * Call this when a CV is updated
 */
export async function logCVUpdated(userId: string, cvName?: string) {
  return logActivity(userId, 'cv_updated', cvName ? { cv_name: cvName } : undefined);
}

/**
 * Call this when an application is sent
 */
export async function logApplicationSent(userId: string, company?: string, position?: string) {
  const details: Record<string, string> = {};
  if (company) details.company = company;
  if (position) details.position = position;
  return logActivity(userId, 'application_sent', Object.keys(details).length > 0 ? details : undefined);
}

