import {
  collection,
  query,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// TYPES
// ============================================

export type SearchResultType = 
  | 'job-application'
  | 'resume'
  | 'cv-analysis'
  | 'interview'
  | 'campaign'
  | 'note'
  | 'whiteboard'
  | 'document'
  | 'page'
  | 'action';

export interface GlobalSearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  score?: number;
  date?: string;
  icon?: string;
  path?: string;
  extra?: Record<string, any>;
}

export interface SearchOptions {
  query?: string;
  types?: SearchResultType[];
  limit?: number;
}

// ============================================
// QUICK NAVIGATION PAGES
// ============================================

const NAVIGATION_PAGES: GlobalSearchResult[] = [
  { type: 'page', id: 'dashboard', title: 'Dashboard', subtitle: 'Overview of your job search', icon: 'layout-dashboard', path: '/dashboard' },
  { type: 'page', id: 'job-board', title: 'Job Board', subtitle: 'Browse and search jobs', icon: 'briefcase', path: '/jobs' },
  { type: 'page', id: 'applications', title: 'My Applications', subtitle: 'Track your job applications', icon: 'kanban', path: '/applications' },
  { type: 'page', id: 'campaigns', title: 'Campaigns', subtitle: 'Outreach and networking', icon: 'send', path: '/campaigns' },
  { type: 'page', id: 'calendar', title: 'Calendar', subtitle: 'Upcoming interviews and events', icon: 'calendar', path: '/calendar' },
  { type: 'page', id: 'interviews', title: 'Upcoming Interviews', subtitle: 'View and prepare for interviews', icon: 'mic', path: '/upcoming-interviews' },
  { type: 'page', id: 'cv-analysis', title: 'CV Analysis', subtitle: 'Analyze and optimize your CV', icon: 'file-search', path: '/cv-analysis' },
  { type: 'page', id: 'resume-builder', title: 'Document Manager', subtitle: 'Manage resumes and documents', icon: 'file-text', path: '/resume-builder' },
  { type: 'page', id: 'profile', title: 'My Profile', subtitle: 'Professional profile settings', icon: 'user', path: '/professional-profile' },
  { type: 'page', id: 'settings', title: 'Settings', subtitle: 'App preferences', icon: 'settings', path: '/settings' },
  { type: 'page', id: 'billing', title: 'Billing', subtitle: 'Subscription and credits', icon: 'credit-card', path: '/billing' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  try {
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

const matchesQuery = (text: string | undefined, searchQuery: string): boolean => {
  if (!text || !searchQuery) return false;
  return text.toLowerCase().includes(searchQuery.toLowerCase());
};

// ============================================
// FETCH FUNCTIONS
// ============================================

export const fetchJobApplications = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 15
): Promise<GlobalSearchResult[]> => {
  try {
    const applicationsRef = collection(db, 'users', userId, 'jobApplications');
    const q = query(applicationsRef, limit(100));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Skip campaign items
      if (['targets', 'contacted', 'follow_up', 'replied', 'meeting', 'opportunity', 'no_response', 'closed'].includes(data.status)) {
        return;
      }

      if (searchQuery) {
        const matches = 
          matchesQuery(data.companyName, searchQuery) ||
          matchesQuery(data.position, searchQuery) ||
          matchesQuery(data.location, searchQuery) ||
          matchesQuery(data.notes, searchQuery);
        if (!matches) return;
      }

      // Build path with highlight param and optional board param
      let appPath = `/applications?highlight=${doc.id}`;
      if (data.boardId) {
        appPath += `&board=${data.boardId}`;
      }

      results.push({
        type: 'job-application',
        id: doc.id,
        title: data.companyName || 'Unknown Company',
        subtitle: data.position || 'Unknown Position',
        status: data.status,
        date: formatDate(data.appliedDate || data.createdAt),
        icon: 'briefcase',
        path: appPath,
        extra: { location: data.location, salary: data.salary, workType: data.workType, boardId: data.boardId },
      });
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return [];
  }
};

export const fetchResumes = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  try {
    const resumesRef = collection(db, 'users', userId, 'cvs');
    const q = query(resumesRef, limit(50));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      if (doc.id === 'default') return;
      const data = doc.data();
      if (!data.cvData) return;

      if (searchQuery) {
        const matches = 
          matchesQuery(data.name, searchQuery) ||
          matchesQuery(data.cvData?.personalInfo?.firstName, searchQuery) ||
          matchesQuery(data.cvData?.personalInfo?.lastName, searchQuery) ||
          matchesQuery(data.cvData?.personalInfo?.title, searchQuery);
        if (!matches) return;
      }

      const personalInfo = data.cvData?.personalInfo || {};
      results.push({
        type: 'resume',
        id: doc.id,
        title: data.name || 'Untitled Resume',
        subtitle: personalInfo.title || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || undefined,
        date: formatDate(data.updatedAt),
        icon: 'file-text',
        path: `/resume-builder/${doc.id}/cv-editor`,
        extra: { template: data.template },
      });
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }
};

export const fetchCVAnalyses = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  try {
    const analysesRef = collection(db, 'users', userId, 'analyses');
    const q = query(analysesRef, limit(50));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (searchQuery) {
        const matches = 
          matchesQuery(data.jobTitle, searchQuery) ||
          matchesQuery(data.company, searchQuery);
        if (!matches) return;
      }

      results.push({
        type: 'cv-analysis',
        id: doc.id,
        title: data.jobTitle || 'Unknown Position',
        subtitle: data.company || 'Unknown Company',
        score: data.matchScore,
        date: formatDate(data.date),
        icon: 'bar-chart-3',
        path: `/ats-analysis/${doc.id}`,
      });
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching CV analyses:', error);
    return [];
  }
};

export const fetchInterviews = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  try {
    const applicationsRef = collection(db, 'users', userId, 'jobApplications');
    const q = query(applicationsRef, limit(100));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    
    querySnapshot.forEach((appDoc) => {
      const appData = appDoc.data();
      const interviews = appData.interviews || [];

      interviews.forEach((interview: any) => {
        if (searchQuery) {
          const matches = 
            matchesQuery(appData.companyName, searchQuery) ||
            matchesQuery(appData.position, searchQuery) ||
            matchesQuery(interview.type, searchQuery);
          if (!matches) return;
        }

        const typeLabel = interview.type ? 
          interview.type.charAt(0).toUpperCase() + interview.type.slice(1) : 'Interview';

        results.push({
          type: 'interview',
          id: interview.id,
          title: `${typeLabel} Interview`,
          subtitle: `${appData.companyName} - ${appData.position}`,
          status: interview.status,
          date: formatDate(interview.date),
          icon: 'calendar',
          path: `/interview-prep/${appDoc.id}/${interview.id}`,
          extra: { applicationId: appDoc.id, time: interview.time, interviewType: interview.type },
        });
      });
    });

    results.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return [];
  }
};

export const fetchCampaignContacts = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  try {
    const applicationsRef = collection(db, 'users', userId, 'jobApplications');
    const q = query(applicationsRef, limit(100));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      if (!['targets', 'contacted', 'follow_up', 'replied', 'meeting', 'opportunity', 'no_response', 'closed'].includes(data.status)) {
        return;
      }

      if (searchQuery) {
        const matches = 
          matchesQuery(data.companyName, searchQuery) ||
          matchesQuery(data.contactName, searchQuery) ||
          matchesQuery(data.contactRole, searchQuery);
        if (!matches) return;
      }

      // Build path with highlight param and optional board param
      let contactPath = `/applications?highlight=${doc.id}`;
      if (data.boardId) {
        contactPath += `&board=${data.boardId}`;
      }

      results.push({
        type: 'campaign',
        id: doc.id,
        title: data.contactName || data.companyName || 'Unknown Contact',
        subtitle: data.contactRole ? `${data.contactRole} at ${data.companyName}` : data.companyName,
        status: data.status,
        date: formatDate(data.lastContactedAt || data.createdAt),
        icon: 'user-circle',
        path: contactPath,
        extra: { boardId: data.boardId },
      });
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching campaign contacts:', error);
    return [];
  }
};

export const fetchNotes = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  console.log('📝 fetchNotes called:', { userId, searchQuery, maxResults });
  try {
    const notesRef = collection(db, 'users', userId, 'notes');
    const q = query(notesRef, limit(50));
    const querySnapshot = await getDocs(q);
    console.log('📝 Notes found in Firestore:', querySnapshot.size);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📝 Note:', doc.id, data.title);

      if (searchQuery) {
        // Handle content matching - content might be string or structured object
        const contentToSearch = typeof data.content === 'string' 
          ? data.content 
          : (data.plainTextContent || '');
        
        const matches = 
          matchesQuery(data.title, searchQuery) ||
          matchesQuery(contentToSearch, searchQuery);
        if (!matches) return;
      }

      // Handle content - it might be a string or a structured object (Notion blocks)
      let subtitle: string | undefined;
      if (data.content) {
        if (typeof data.content === 'string') {
          subtitle = data.content.substring(0, 60) + '...';
        } else if (data.plainTextContent && typeof data.plainTextContent === 'string') {
          // Some notes store plain text separately
          subtitle = data.plainTextContent.substring(0, 60) + '...';
        }
      }
      
      results.push({
        type: 'note',
        id: doc.id,
        title: data.title || 'Untitled Note',
        subtitle,
        date: formatDate(data.updatedAt || data.createdAt),
        icon: 'sticky-note',
        path: `/notes/${doc.id}`,
        extra: { folderId: data.folderId },
      });
    });

    console.log('📝 fetchNotes returning:', results.length, 'notes');
    return results.slice(0, maxResults);
  } catch (error) {
    console.error('📝 Error fetching notes:', error);
    return [];
  }
};

export const fetchWhiteboards = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  try {
    const whiteboardsRef = collection(db, 'users', userId, 'whiteboards');
    const q = query(whiteboardsRef, limit(50));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (searchQuery) {
        const matches = matchesQuery(data.title, searchQuery);
        if (!matches) return;
      }

      results.push({
        type: 'whiteboard',
        id: doc.id,
        title: data.title || 'Untitled Whiteboard',
        date: formatDate(data.updatedAt || data.createdAt),
        icon: 'palette',
        path: `/whiteboard/${doc.id}`,
        extra: { folderId: data.folderId },
      });
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching whiteboards:', error);
    return [];
  }
};

export const fetchDocuments = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 10
): Promise<GlobalSearchResult[]> => {
  try {
    const documentsRef = collection(db, 'users', userId, 'documents');
    const q = query(documentsRef, limit(50));
    const querySnapshot = await getDocs(q);

    const results: GlobalSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (searchQuery) {
        const matches = matchesQuery(data.name, searchQuery);
        if (!matches) return;
      }

      results.push({
        type: 'document',
        id: doc.id,
        title: data.name || 'Untitled Document',
        subtitle: data.fileSize ? `${(data.fileSize / 1024 / 1024).toFixed(2)} MB` : 'PDF',
        date: formatDate(data.updatedAt || data.createdAt),
        icon: 'file-pdf',
        path: `/resume-builder?doc=${doc.id}`,
        extra: { folderId: data.folderId, fileUrl: data.fileUrl },
      });
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const searchPages = (searchQuery?: string): GlobalSearchResult[] => {
  if (!searchQuery) return NAVIGATION_PAGES.slice(0, 6);
  
  const q = searchQuery.toLowerCase();
  return NAVIGATION_PAGES.filter(page => 
    page.title.toLowerCase().includes(q) ||
    page.subtitle?.toLowerCase().includes(q)
  );
};

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

export const globalSearch = async (
  userId: string,
  options: SearchOptions = {}
): Promise<GlobalSearchResult[]> => {
  const { query: searchQuery, types, limit: maxResults = 20 } = options;
  
  console.log('🔍 globalSearch called:', { userId, searchQuery, types, maxResults });
  
  const shouldSearch = (type: SearchResultType) => !types || types.includes(type);
  const pageResults = searchPages(searchQuery);
  console.log('🔍 Page results:', pageResults.length);

  if (!searchQuery) {
    console.log('🔍 No search query - fetching recent items');
    const fetchPromises: Promise<GlobalSearchResult[]>[] = [];
    
    if (shouldSearch('job-application')) {
      fetchPromises.push(fetchJobApplications(userId, undefined, 5));
    }
    if (shouldSearch('interview')) {
      fetchPromises.push(fetchInterviews(userId, undefined, 3));
    }
    if (shouldSearch('note')) {
      fetchPromises.push(fetchNotes(userId, undefined, 5));
    }
    if (shouldSearch('whiteboard')) {
      fetchPromises.push(fetchWhiteboards(userId, undefined, 3));
    }
    if (shouldSearch('document')) {
      fetchPromises.push(fetchDocuments(userId, undefined, 3));
    }
    if (shouldSearch('resume')) {
      fetchPromises.push(fetchResumes(userId, undefined, 3));
    }
    
    try {
      const results = await Promise.all(fetchPromises);
      console.log('🔍 Fetched results by type:', results.map((r, i) => `[${i}]: ${r.length} items`));
      const allResults = [...pageResults.slice(0, 6), ...results.flat()];
      console.log('🔍 Total results (no query):', allResults.length);
      return allResults.slice(0, maxResults);
    } catch (error) {
      console.error('🔍 Error in globalSearch (no query):', error);
      return pageResults;
    }
  }

  console.log('🔍 Searching with query:', searchQuery);
  const fetchPromises: Promise<GlobalSearchResult[]>[] = [];

  if (shouldSearch('job-application')) {
    fetchPromises.push(fetchJobApplications(userId, searchQuery, 10));
  }
  if (shouldSearch('resume')) {
    fetchPromises.push(fetchResumes(userId, searchQuery, 5));
  }
  if (shouldSearch('cv-analysis')) {
    fetchPromises.push(fetchCVAnalyses(userId, searchQuery, 5));
  }
  if (shouldSearch('interview')) {
    fetchPromises.push(fetchInterviews(userId, searchQuery, 5));
  }
  if (shouldSearch('campaign')) {
    fetchPromises.push(fetchCampaignContacts(userId, searchQuery, 5));
  }
  if (shouldSearch('note')) {
    fetchPromises.push(fetchNotes(userId, searchQuery, 5));
  }
  if (shouldSearch('whiteboard')) {
    fetchPromises.push(fetchWhiteboards(userId, searchQuery, 5));
  }
  if (shouldSearch('document')) {
    fetchPromises.push(fetchDocuments(userId, searchQuery, 5));
  }

  try {
    const results = await Promise.all(fetchPromises);
    console.log('🔍 Fetched results by type (with query):', results.map((r, i) => `[${i}]: ${r.length} items`));
    const allResults = [...pageResults, ...results.flat()];
    console.log('🔍 Total results (with query):', allResults.length, allResults.map(r => `${r.type}:${r.title}`));

    const queryLower = searchQuery.toLowerCase();
    allResults.sort((a, b) => {
      const aExact = a.title.toLowerCase() === queryLower;
      const bExact = b.title.toLowerCase() === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.title.toLowerCase().startsWith(queryLower);
      const bStarts = b.title.toLowerCase().startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      if (a.type === 'page' && b.type !== 'page') return -1;
      if (a.type !== 'page' && b.type === 'page') return 1;

      return 0;
    });

    return allResults.slice(0, maxResults);
  } catch (error) {
    console.error('Error in global search:', error);
    return pageResults;
  }
};

// ============================================
// RECENT SEARCHES (localStorage)
// ============================================

const RECENT_SEARCHES_KEY = 'jobzai_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Handle both string[] and object[] formats
    if (Array.isArray(parsed)) {
      return parsed.map(item => 
        typeof item === 'string' ? item : (item?.query || '')
      ).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
};

export const addRecentSearch = (searchQuery: string): void => {
  if (!searchQuery.trim()) return;
  
  try {
    const recent = getRecentSearches().filter(s => s !== searchQuery);
    recent.unshift(searchQuery);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES)));
  } catch {
    // Silently fail
  }
};

export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently fail
  }
};

// ============================================
// TYPE LABELS & COLORS
// ============================================

export const getTypeLabel = (type: SearchResultType): string => {
  switch (type) {
    case 'job-application': return 'Application';
    case 'resume': return 'Resume';
    case 'cv-analysis': return 'CV Analysis';
    case 'interview': return 'Interview';
    case 'campaign': return 'Contact';
    case 'note': return 'Note';
    case 'whiteboard': return 'Whiteboard';
    case 'document': return 'Document';
    case 'page': return 'Page';
    case 'action': return 'Action';
    default: return 'Item';
  }
};

export const getTypeColor = (type: SearchResultType): string => {
  switch (type) {
    case 'job-application': return 'text-blue-500 bg-blue-500/10';
    case 'resume': return 'text-emerald-500 bg-emerald-500/10';
    case 'cv-analysis': return 'text-purple-500 bg-purple-500/10';
    case 'interview': return 'text-amber-500 bg-amber-500/10';
    case 'campaign': return 'text-pink-500 bg-pink-500/10';
    case 'note': return 'text-yellow-500 bg-yellow-500/10';
    case 'whiteboard': return 'text-cyan-500 bg-cyan-500/10';
    case 'document': return 'text-red-500 bg-red-500/10';
    case 'page': return 'text-gray-500 bg-gray-500/10';
    case 'action': return 'text-indigo-500 bg-indigo-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
  }
};
