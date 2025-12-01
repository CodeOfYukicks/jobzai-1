import {
  collection,
  query,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MentionEmbedType, MentionEmbedData } from '../components/notion-editor/extensions/MentionEmbed';

// Types for search results
export interface MentionSearchResult {
  type: MentionEmbedType;
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  score?: number;
  date?: string;
  extra?: Record<string, any>;
  rawData?: any;
}

export interface MentionSearchOptions {
  query?: string;
  type?: MentionEmbedType | 'all';
  limit?: number;
}

// Format date helper
const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  try {
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
};

// Fetch job applications
export const fetchJobApplications = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 20
): Promise<MentionSearchResult[]> => {
  try {
    const applicationsRef = collection(db, 'users', userId, 'jobApplications');
    // Try without orderBy to avoid index issues
    const q = query(applicationsRef, limit(maxResults));
    const querySnapshot = await getDocs(q);

    const results: MentionSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Client-side filtering if search query provided
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const companyMatch = data.companyName?.toLowerCase().includes(searchLower);
        const positionMatch = data.position?.toLowerCase().includes(searchLower);
        if (!companyMatch && !positionMatch) return;
      }

      results.push({
        type: 'job-application',
        id: doc.id,
        title: data.companyName || 'Unknown Company',
        subtitle: data.position || 'Unknown Position',
        status: data.status,
        date: formatDate(data.appliedDate || data.createdAt),
        extra: {
          location: data.location,
          salary: data.salary,
          workType: data.workType,
          platform: data.platform,
          url: data.url,
        },
        rawData: data,
      });
    });

    return results;
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return [];
  }
};

// Fetch resumes/CVs
export const fetchResumes = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 20
): Promise<MentionSearchResult[]> => {
  try {
    const resumesRef = collection(db, 'users', userId, 'cvs');
    // Try without orderBy to avoid index issues
    const q = query(resumesRef, limit(maxResults));
    const querySnapshot = await getDocs(q);

    const results: MentionSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      // Skip default document
      if (doc.id === 'default') return;
      
      const data = doc.data();
      
      // Skip if no cvData
      if (!data.cvData) return;

      // Client-side filtering if search query provided
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = data.name?.toLowerCase().includes(searchLower);
        const firstNameMatch = data.cvData?.personalInfo?.firstName?.toLowerCase().includes(searchLower);
        const lastNameMatch = data.cvData?.personalInfo?.lastName?.toLowerCase().includes(searchLower);
        if (!nameMatch && !firstNameMatch && !lastNameMatch) return;
      }

      const personalInfo = data.cvData?.personalInfo || {};

      results.push({
        type: 'resume',
        id: doc.id,
        title: data.name || 'Untitled Resume',
        subtitle: personalInfo.title || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || undefined,
        date: formatDate(data.updatedAt),
        extra: {
          template: data.template,
          tags: data.tags,
          personalInfo,
        },
        rawData: data,
      });
    });

    return results;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return [];
  }
};

// Fetch CV analyses
export const fetchCVAnalyses = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 20
): Promise<MentionSearchResult[]> => {
  try {
    const analysesRef = collection(db, 'users', userId, 'analyses');
    // Try without orderBy first in case index doesn't exist
    const q = query(analysesRef, limit(maxResults));
    const querySnapshot = await getDocs(q);

    const results: MentionSearchResult[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Client-side filtering if search query provided
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const jobTitleMatch = data.jobTitle?.toLowerCase().includes(searchLower);
        const companyMatch = data.company?.toLowerCase().includes(searchLower);
        if (!jobTitleMatch && !companyMatch) return;
      }

      results.push({
        type: 'cv-analysis',
        id: doc.id,
        title: data.jobTitle || 'Unknown Position',
        subtitle: data.company || 'Unknown Company',
        score: data.matchScore,
        date: formatDate(data.date),
        extra: {
          keyFindings: data.keyFindings?.slice(0, 5),
          skillsMatch: data.skillsMatch,
          categoryScores: data.categoryScores,
          executiveSummary: data.executiveSummary,
        },
        rawData: data,
      });
    });

    return results;
  } catch (error) {
    console.error('Error fetching CV analyses:', error);
    return [];
  }
};

// Fetch interviews (from job applications)
export const fetchInterviews = async (
  userId: string,
  searchQuery?: string,
  maxResults: number = 20
): Promise<MentionSearchResult[]> => {
  try {
    const applicationsRef = collection(db, 'users', userId, 'jobApplications');
    // Try without orderBy to avoid index issues
    const q = query(applicationsRef, limit(50)); // Get more to find interviews
    const querySnapshot = await getDocs(q);

    const results: MentionSearchResult[] = [];
    
    querySnapshot.forEach((appDoc) => {
      const appData = appDoc.data();
      const interviews = appData.interviews || [];

      interviews.forEach((interview: any) => {
        // Client-side filtering if search query provided
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const companyMatch = appData.companyName?.toLowerCase().includes(searchLower);
          const positionMatch = appData.position?.toLowerCase().includes(searchLower);
          const typeMatch = interview.type?.toLowerCase().includes(searchLower);
          if (!companyMatch && !positionMatch && !typeMatch) return;
        }

        results.push({
          type: 'interview',
          id: interview.id,
          title: appData.position || 'Interview',
          subtitle: appData.companyName || 'Unknown Company',
          status: interview.status,
          date: formatDate(interview.date),
          extra: {
            applicationId: appDoc.id,
            time: interview.time,
            interviewType: interview.type,
            location: interview.location,
            interviewers: interview.interviewers,
            companyName: appData.companyName,
            position: appData.position,
          },
          rawData: { interview, application: appData },
        });
      });
    });

    // Sort by date descending and limit results
    results.sort((a, b) => {
      const dateA = new Date(a.rawData?.interview?.date || 0).getTime();
      const dateB = new Date(b.rawData?.interview?.date || 0).getTime();
      return dateB - dateA;
    });

    return results.slice(0, maxResults);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return [];
  }
};

// Main search function - fetches all types and filters
export const searchMentionableRecords = async (
  userId: string,
  options: MentionSearchOptions = {}
): Promise<MentionSearchResult[]> => {
  const { query: searchQuery, type = 'all', limit: maxResults = 10 } = options;

  const fetchPromises: Promise<MentionSearchResult[]>[] = [];

  if (type === 'all' || type === 'job-application') {
    fetchPromises.push(fetchJobApplications(userId, searchQuery, maxResults));
  }

  if (type === 'all' || type === 'resume') {
    fetchPromises.push(fetchResumes(userId, searchQuery, maxResults));
  }

  if (type === 'all' || type === 'cv-analysis') {
    fetchPromises.push(fetchCVAnalyses(userId, searchQuery, maxResults));
  }

  if (type === 'all' || type === 'interview') {
    fetchPromises.push(fetchInterviews(userId, searchQuery, maxResults));
  }

  try {
    const results = await Promise.all(fetchPromises);
    const allResults = results.flat();

    // Sort combined results by relevance (if search) or date
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      allResults.sort((a, b) => {
        // Exact title matches first
        const aExact = a.title.toLowerCase() === searchLower;
        const bExact = b.title.toLowerCase() === searchLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Then starts with matches
        const aStarts = a.title.toLowerCase().startsWith(searchLower);
        const bStarts = b.title.toLowerCase().startsWith(searchLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    return allResults.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching mentionable records:', error);
    return [];
  }
};

// Convert search result to MentionEmbedData for insertion
export const searchResultToEmbedData = (result: MentionSearchResult): MentionEmbedData => {
  return {
    type: result.type,
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
    status: result.status,
    score: result.score,
    date: result.date,
    extra: result.extra,
  };
};

// Get type label for display
export const getMentionTypeLabel = (type: MentionEmbedType): string => {
  switch (type) {
    case 'job-application':
      return 'Job Application';
    case 'resume':
      return 'Resume';
    case 'cv-analysis':
      return 'CV Analysis';
    case 'interview':
      return 'Interview';
    default:
      return 'Record';
  }
};

// Get type icon name for display
export const getMentionTypeIcon = (type: MentionEmbedType): string => {
  switch (type) {
    case 'job-application':
      return 'briefcase';
    case 'resume':
      return 'file-text';
    case 'cv-analysis':
      return 'bar-chart-3';
    case 'interview':
      return 'calendar';
    default:
      return 'file';
  }
};

