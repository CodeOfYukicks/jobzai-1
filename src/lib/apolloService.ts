import { auth } from './firebase';

// Types
export interface ApolloTargeting {
  personTitles: string[];
  personLocations: string[];
  seniorities: string[];
  companySizes: string[];
  industries: string[];
  excludedCompanies: string[];
}

export interface ApolloContactPreview {
  fullName: string;
  title: string;
  company: string | null;
  hasEmail: boolean;
}

export interface SearchApolloResult {
  success: boolean;
  contactsFound: number;
  totalAvailable: number;
  contacts: ApolloContactPreview[];
}

export interface ApolloRecipient {
  id: string;
  apolloId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  email: string | null;
  linkedinUrl: string | null;
  company: string | null;
  companyWebsite: string | null;
  companyIndustry: string | null;
  companySize: number | null;
  location: string | null;
  status: 'pending' | 'email_generated' | 'sent' | 'opened' | 'replied';
  emailGenerated: boolean;
  emailContent: string | null;
  emailSubject: string | null;
}

// Backend URL - use environment variable or default to localhost for dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '');

/**
 * Get auth token for API calls
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
}

/**
 * Search Apollo for contacts matching the campaign targeting criteria
 * Calls the Express backend endpoint
 */
export async function searchApolloContacts(
  campaignId: string,
  targeting: ApolloTargeting,
  maxResults: number = 50
): Promise<SearchApolloResult> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BACKEND_URL}/api/apollo/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ campaignId, targeting, maxResults })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Enrich a single Apollo contact to get their email
 */
export async function enrichApolloContact(apolloId: string): Promise<{
  success: boolean;
  email: string | null;
  linkedinUrl: string | null;
}> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BACKEND_URL}/api/apollo/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ apolloId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Build a preview query description from targeting
 */
export function buildTargetingDescription(targeting: ApolloTargeting): string {
  const parts: string[] = [];

  if (targeting.personTitles.length > 0) {
    parts.push(targeting.personTitles.slice(0, 2).join(', '));
  }

  if (targeting.personLocations.length > 0) {
    parts.push(`in ${targeting.personLocations.slice(0, 2).join(', ')}`);
  }

  if (targeting.seniorities.length > 0) {
    const seniorityLabels: Record<string, string> = {
      'entry': 'Entry Level',
      'senior': 'Senior',
      'manager': 'Manager',
      'director': 'Director',
      'vp': 'VP',
      'c_suite': 'C-Suite'
    };
    const labels = targeting.seniorities.map(s => seniorityLabels[s] || s);
    parts.push(`(${labels.slice(0, 2).join(', ')})`);
  }

  if (targeting.industries.length > 0) {
    parts.push(`· ${targeting.industries.slice(0, 2).join(', ')}`);
  }

  return parts.join(' ') || 'No targeting defined';
}

/**
 * Estimate the number of contacts that will be found
 * This is a rough estimate based on targeting breadth
 */
export function estimateContactCount(targeting: ApolloTargeting): {
  estimate: string;
  confidence: 'low' | 'medium' | 'high';
} {
  let score = 0;

  // More titles = more contacts
  score += targeting.personTitles.length * 2;

  // More locations = more contacts
  score += targeting.personLocations.length * 3;
  if (targeting.personLocations.includes('Remote')) {
    score += 5; // Remote dramatically increases pool
  }

  // More seniorities = more contacts
  score += targeting.seniorities.length * 2;

  // More industries = more contacts
  score += targeting.industries.length * 2;

  // Company size filters
  score += targeting.companySizes.length;

  // Exclusions reduce contacts
  score -= targeting.excludedCompanies.length * 2;

  // Convert to estimate
  if (score < 5) {
    return { estimate: '10-50', confidence: 'low' };
  } else if (score < 10) {
    return { estimate: '50-200', confidence: 'medium' };
  } else if (score < 20) {
    return { estimate: '200-500', confidence: 'medium' };
  } else {
    return { estimate: '500+', confidence: 'high' };
  }
}
