import { useEffect, useRef } from 'react';
import { useAssistant } from '../contexts/AssistantContext';

/**
 * Hook for registering page-specific data with the AI Assistant.
 * Data is automatically cleaned up when the component unmounts.
 * 
 * @param key - Unique key for the data (e.g., 'applications', 'currentNote')
 * @param data - The data to make available to the AI Assistant
 * @param enabled - Optional flag to conditionally enable/disable registration
 * 
 * @example
 * // In JobApplicationsPage
 * useAssistantPageData('applications', {
 *   total: applications.length,
 *   byStatus: { applied: 5, interviewing: 2, offered: 1 },
 *   recentApplications: applications.slice(0, 5).map(app => ({
 *     company: app.company,
 *     position: app.position,
 *     status: app.status,
 *   })),
 * });
 * 
 * @example
 * // In NotesPage - only register when a note is selected
 * useAssistantPageData('currentNote', {
 *   title: note.title,
 *   content: note.content,
 * }, !!selectedNote);
 */
export function useAssistantPageData(
  key: string,
  data: any,
  enabled: boolean = true
) {
  const { registerPageData, unregisterPageData } = useAssistant();
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Clean up previous key if it changed
    if (previousKeyRef.current && previousKeyRef.current !== key) {
      unregisterPageData(previousKeyRef.current);
    }

    if (enabled && data !== undefined) {
      registerPageData(key, data);
      previousKeyRef.current = key;
    } else if (previousKeyRef.current === key) {
      unregisterPageData(key);
      previousKeyRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (previousKeyRef.current) {
        unregisterPageData(previousKeyRef.current);
        previousKeyRef.current = null;
      }
    };
  }, [key, data, enabled, registerPageData, unregisterPageData]);
}

/**
 * Helper function to create a summary of job applications for the AI
 */
export function summarizeApplications(applications: any[]) {
  if (!applications || applications.length === 0) {
    return { total: 0, message: 'No applications yet' };
  }

  const byStatus: Record<string, number> = {};
  const byCompany: Record<string, number> = {};
  
  applications.forEach(app => {
    const status = app.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
    
    const company = app.company || 'Unknown';
    byCompany[company] = (byCompany[company] || 0) + 1;
  });

  return {
    total: applications.length,
    byStatus,
    topCompanies: Object.entries(byCompany)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => ({ company, count })),
    recentApplications: applications
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 10)
      .map(app => ({
        company: app.company,
        position: app.position,
        status: app.status,
        appliedDate: app.appliedDate || app.createdAt,
      })),
  };
}

/**
 * Helper function to create a summary of job listings for the AI
 */
export function summarizeJobListings(jobs: any[], selectedJob?: any) {
  const summary: any = {
    totalListings: jobs.length,
  };

  if (selectedJob) {
    summary.selectedJob = {
      title: selectedJob.title,
      company: selectedJob.company,
      location: selectedJob.location,
      salary: selectedJob.salary,
      description: selectedJob.description?.substring(0, 500),
      requirements: selectedJob.requirements,
      type: selectedJob.type,
    };
  }

  if (jobs.length > 0) {
    summary.recentListings = jobs.slice(0, 5).map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
    }));
  }

  return summary;
}

/**
 * Helper function to create a summary of a note for the AI
 */
export function summarizeNote(note: any) {
  if (!note) return null;
  
  return {
    title: note.title,
    content: note.content,
    wordCount: note.content?.split(/\s+/).filter(Boolean).length || 0,
    lastModified: note.updatedAt || note.createdAt,
  };
}

/**
 * Helper function to create a summary of dashboard stats for the AI
 */
export function summarizeDashboard(stats: any) {
  return {
    totalApplications: stats.totalApplications || 0,
    pendingApplications: stats.pending || 0,
    interviewsScheduled: stats.interviews || 0,
    offersReceived: stats.offers || 0,
    responseRate: stats.responseRate || 0,
    weeklyActivity: stats.weeklyActivity || [],
  };
}

export default useAssistantPageData;

