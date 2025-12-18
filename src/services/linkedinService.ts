import { parseLinkedInPdf, mapLinkedInToProfile, ParsedLinkedInProfile } from '../lib/linkedinPdfParser';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notify } from '@/lib/notify';

/**
 * LinkedIn Integration Service
 * Handles OAuth flow and PDF import for LinkedIn profile data
 */

// LinkedIn OAuth configuration
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI || `${window.location.origin}/auth/linkedin/callback`;

export interface LinkedInAuthResponse {
  accessToken: string;
  expiresIn: number;
}

export interface LinkedInBasicProfile {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
}

/**
 * Initiate LinkedIn OAuth flow
 * Note: This requires LinkedIn OAuth app setup and API partnership for full profile access
 */
export function initiateLinkedInOAuth() {
  const scope = 'openid profile email';
  const state = generateRandomState();
  
  // Store state for CSRF protection
  sessionStorage.setItem('linkedin_oauth_state', state);
  
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID || '');
  authUrl.searchParams.set('redirect_uri', LINKEDIN_REDIRECT_URI);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scope);
  
  window.location.href = authUrl.toString();
}

/**
 * Handle LinkedIn OAuth callback
 */
export async function handleLinkedInCallback(code: string, state: string): Promise<LinkedInBasicProfile | null> {
  // Verify state for CSRF protection
  const storedState = sessionStorage.getItem('linkedin_oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }
  sessionStorage.removeItem('linkedin_oauth_state');
  
  try {
    // Exchange code for access token via backend
    const response = await fetch('/api/linkedin/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri: LINKEDIN_REDIRECT_URI })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    const { accessToken } = await response.json();
    
    // Fetch basic profile
    const profile = await fetchLinkedInProfile(accessToken);
    return profile;
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    throw error;
  }
}

/**
 * Fetch LinkedIn profile using access token
 * Note: Limited data available without Marketing API partnership
 */
async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInBasicProfile> {
  const response = await fetch('/api/linkedin/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn profile');
  }
  
  return response.json();
}

/**
 * Import profile from LinkedIn PDF export
 * This is the primary method since LinkedIn API access is limited
 */
export async function importFromLinkedInPdf(
  file: File, 
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Parse the PDF
    const linkedInData = await parseLinkedInPdf(file);
    
    // Map to profile format
    const profileData = mapLinkedInToProfile(linkedInData);
    
    // Update user profile in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      linkedinImportedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    
    notify.success('LinkedIn profile imported successfully!');
    
    return {
      success: true,
      data: profileData
    };
  } catch (error: any) {
    console.error('LinkedIn PDF import error:', error);
    notify.error(error.message || 'Failed to import LinkedIn profile');
    
    return {
      success: false,
      error: error.message || 'Failed to import LinkedIn profile'
    };
  }
}

/**
 * Generate random state for OAuth CSRF protection
 */
function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if LinkedIn OAuth is configured
 */
export function isLinkedInOAuthConfigured(): boolean {
  return Boolean(LINKEDIN_CLIENT_ID);
}

/**
 * Format LinkedIn data for display preview
 */
export function formatLinkedInPreview(data: ParsedLinkedInProfile): {
  name: string;
  headline: string;
  positionsCount: number;
  educationCount: number;
  skillsCount: number;
} {
  return {
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
    headline: data.headline || 'No headline',
    positionsCount: data.positions?.length || 0,
    educationCount: data.education?.length || 0,
    skillsCount: data.skills?.length || 0
  };
}















