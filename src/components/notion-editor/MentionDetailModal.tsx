import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink,
  Briefcase,
  FileText,
  BarChart3,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Globe,
  Users,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { MentionEmbedType, MentionEmbedData } from './extensions/MentionEmbed';
import type { JobApplication, Interview } from '../../types/job';
import type { Resume } from '../../pages/ResumeBuilderPage';

interface MentionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MentionEmbedData | null;
}

interface LiveData {
  summary?: string;
  updatedTitle?: string;
  updatedSubtitle?: string;
  updatedStatus?: string;
  updatedDate?: string;
  metadata?: Record<string, any>;
}

const typeConfig: Record<MentionEmbedType, { 
  icon: React.ReactNode; 
  label: string;
  route: (id: string, extra?: any) => string;
}> = {
  'job-application': {
    icon: <Briefcase className="w-4 h-4" />,
    label: 'Job Application',
    route: (id) => `/applications?highlight=${id}`,
  },
  'resume': {
    icon: <FileText className="w-4 h-4" />,
    label: 'Resume',
    route: (id) => `/resume-builder/${id}/cv-editor`,
  },
  'cv-analysis': {
    icon: <BarChart3 className="w-4 h-4" />,
    label: 'CV Analysis',
    route: (id) => `/ats-analysis/${id}`,
  },
  'interview': {
    icon: <Calendar className="w-4 h-4" />,
    label: 'Interview',
    route: (id, extra) => {
      const applicationId = extra?.applicationId || '';
      if (!applicationId) {
        console.error('Missing applicationId for interview navigation');
        return '/applications'; // Fallback to applications page
      }
      return `/interview-prep/${applicationId}/${id}`;
    },
  },
};

// Status styling - minimaliste
const getStatusStyles = (status?: string, type?: MentionEmbedType) => {
  if (!status) return { bg: '', text: '' };
  
  const statusLower = status.toLowerCase();
  
  if (type === 'job-application') {
    switch (statusLower) {
      case 'applied': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'interview': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'offer': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'rejected': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'archived': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'wishlist': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
    }
  }
  
  if (type === 'interview') {
    switch (statusLower) {
      case 'scheduled': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'completed': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      case 'cancelled': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
    }
  }
  
  return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
};

// Format date helper
const formatDate = (dateInput: any): string => {
  if (!dateInput) return '';
  
  try {
    let date: Date;
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

// Fetch functions
const fetchJobApplicationData = async (userId: string, id: string): Promise<LiveData | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'jobApplications', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data() as JobApplication;
    
    return {
      updatedTitle: data.companyName,
      updatedSubtitle: data.position,
      updatedStatus: data.status,
      updatedDate: formatDate(data.appliedDate || data.createdAt),
      metadata: {
        location: data.location,
        salary: data.salary,
        workType: data.workType,
        platform: data.platform,
      },
    };
  } catch (error) {
    console.error('Error fetching job application:', error);
    return null;
  }
};

const fetchResumeData = async (userId: string, id: string): Promise<LiveData | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'cvs', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data() as Resume;
    
    return {
      updatedTitle: data.name,
      updatedSubtitle: data.cvData?.personalInfo?.title || '',
      updatedDate: formatDate(data.updatedAt || data.createdAt),
      metadata: {
        template: data.template,
        tags: data.tags,
      },
    };
  } catch (error) {
    console.error('Error fetching resume:', error);
    return null;
  }
};

const fetchCVAnalysisData = async (userId: string, id: string): Promise<LiveData | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'analyses', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data() as any;
    const matchScore = data.match_scores?.overall_score ?? data.matchScore ?? 0;
    
    return {
      updatedTitle: data.jobTitle || '',
      updatedSubtitle: data.company || '',
      updatedDate: formatDate(data.date || data.createdAt),
      metadata: {
        matchScore,
        keyFindings: data.keyFindings || [],
        categoryScores: data.categoryScores || {},
      },
    };
  } catch (error) {
    console.error('Error fetching CV analysis:', error);
    return null;
  }
};

const fetchInterviewData = async (userId: string, applicationId: string, interviewId: string): Promise<LiveData | null> => {
  try {
    const docRef = doc(db, 'users', userId, 'jobApplications', applicationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    const appData = docSnap.data() as JobApplication;
    const interview = appData.interviews?.find((i: Interview) => i.id === interviewId);
    
    if (!interview) return null;
    
    return {
      updatedTitle: appData.position || '',
      updatedSubtitle: appData.companyName || '',
      updatedStatus: interview.status,
      updatedDate: formatDate(interview.date),
      metadata: {
        applicationId: applicationId, // CRITICAL: Store applicationId for navigation
        time: interview.time,
        type: interview.type,
        location: interview.location,
        interviewers: interview.interviewers,
      },
    };
  } catch (error) {
    console.error('Error fetching interview:', error);
    return null;
  }
};

// Summary generation functions
const generateJobApplicationSummary = (data: JobApplication, liveData?: LiveData): string => {
  if (data.description) {
    return data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description;
  }
  
  if (data.fullJobDescription) {
    const preview = data.fullJobDescription.substring(0, 200);
    return preview + (data.fullJobDescription.length > 200 ? '...' : '');
  }
  
  const parts: string[] = [];
  if (data.position) parts.push(`Position: ${data.position}`);
  if (data.location) parts.push(`Location: ${data.location}`);
  if (data.workType) parts.push(`Type: ${data.workType}`);
  
  return parts.length > 0 ? parts.join(' • ') : 'No description available.';
};

const generateResumeSummary = (data: Resume, liveData?: LiveData): string => {
  const parts: string[] = [];
  
  if (data.cvData?.summary) {
    const summary = data.cvData.summary;
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
  }
  
  if (data.cvData?.experiences && data.cvData.experiences.length > 0) {
    const firstExp = data.cvData.experiences[0];
    parts.push(`${firstExp.title} at ${firstExp.company}`);
  }
  
  if (data.cvData?.skills && data.cvData.skills.length > 0) {
    const topSkills = data.cvData.skills.slice(0, 5).map(s => s.name).join(', ');
    parts.push(`Skills: ${topSkills}`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Resume with no summary available.';
};

const generateCVAnalysisSummary = (data: any, liveData?: LiveData): string => {
  const parts: string[] = [];
  
  if (liveData?.metadata?.matchScore !== undefined) {
    parts.push(`Match Score: ${liveData.metadata.matchScore}%`);
  }
  
  if (liveData?.metadata?.keyFindings && Array.isArray(liveData.metadata.keyFindings)) {
    const topFindings = liveData.metadata.keyFindings.slice(0, 3);
    if (topFindings.length > 0) {
      parts.push(`Key findings: ${topFindings.join('; ')}`);
    }
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'CV analysis details available.';
};

const generateInterviewSummary = (data: any, liveData?: LiveData): string => {
  const parts: string[] = [];
  
  if (liveData?.metadata?.type) {
    parts.push(`${liveData.metadata.type.charAt(0).toUpperCase() + liveData.metadata.type.slice(1)} interview`);
  }
  
  if (liveData?.updatedDate) {
    parts.push(`Scheduled for ${liveData.updatedDate}`);
  }
  
  if (liveData?.metadata?.location) {
    parts.push(`Location: ${liveData.metadata.location}`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Interview details available.';
};

export default function MentionDetailModal({ isOpen, onClose, data }: MentionDetailModalProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [summary, setSummary] = useState<string>('');

  // Fetch live data when modal opens
  useEffect(() => {
    if (!isOpen || !data || !currentUser) {
      setLiveData(null);
      setSummary('');
      setError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let fetchedData: LiveData | null = null;
        let generatedSummary = '';

        switch (data.type) {
          case 'job-application': {
            fetchedData = await fetchJobApplicationData(currentUser.uid, data.id);
            if (fetchedData) {
              const appDoc = await getDoc(doc(db, 'users', currentUser.uid, 'jobApplications', data.id));
              if (appDoc.exists()) {
                generatedSummary = generateJobApplicationSummary(appDoc.data() as JobApplication, fetchedData);
              }
            }
            break;
          }
          case 'resume': {
            fetchedData = await fetchResumeData(currentUser.uid, data.id);
            if (fetchedData) {
              const resumeDoc = await getDoc(doc(db, 'users', currentUser.uid, 'cvs', data.id));
              if (resumeDoc.exists()) {
                const resumeData = { id: resumeDoc.id, ...resumeDoc.data() } as Resume;
                generatedSummary = generateResumeSummary(resumeData, fetchedData);
              }
            }
            break;
          }
          case 'cv-analysis': {
            fetchedData = await fetchCVAnalysisData(currentUser.uid, data.id);
            if (fetchedData) {
              const analysisDoc = await getDoc(doc(db, 'users', currentUser.uid, 'analyses', data.id));
              if (analysisDoc.exists()) {
                generatedSummary = generateCVAnalysisSummary(analysisDoc.data(), fetchedData);
              }
            }
            break;
          }
          case 'interview': {
            // CRITICAL: applicationId is required for interviews
            const applicationId = data.extra?.applicationId;
            if (applicationId) {
              fetchedData = await fetchInterviewData(currentUser.uid, applicationId, data.id);
              if (fetchedData) {
                generatedSummary = generateInterviewSummary({}, fetchedData);
              }
            } else {
              // If no applicationId in extra, we can't fetch live data but can still navigate
              // The navigation will use data.extra which should have applicationId
              console.warn('Interview mention missing applicationId in extra data');
            }
            break;
          }
        }

        setLiveData(fetchedData);
        setSummary(generatedSummary || 'No summary available.');
      } catch (err) {
        console.error('Error fetching live data:', err);
        setError('Failed to load details');
        // Fallback to snapshot data
        setLiveData(null);
        setSummary('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, data, currentUser]);

  const handleNavigate = useCallback(() => {
    if (!data) return;
    const config = typeConfig[data.type];
    
    // For interviews, ensure we have the applicationId from live data or fallback to extra
    let extraData = { ...data.extra };
    if (data.type === 'interview') {
      // Try to get applicationId from liveData metadata first (from fetchInterviewData)
      // If not available, use the one from data.extra
      const applicationId = liveData?.metadata?.applicationId || data.extra?.applicationId;
      if (!applicationId) {
        console.error('Cannot navigate to interview: missing applicationId');
        return; // Don't navigate if we don't have the required applicationId
      }
      extraData.applicationId = applicationId;
    }
    
    // Always use the original data.id (the mention embed ID) for navigation
    // This ensures we navigate to the correct record
    const route = config.route(data.id, extraData);
    
    // Validate route is not empty before navigating
    if (!route || route.trim() === '') {
      console.error('Invalid route generated for navigation');
      return;
    }
    
    navigate(route);
    onClose();
  }, [data, liveData, navigate, onClose]);

  if (!data) return null;

  const config = typeConfig[data.type];
  const displayTitle = liveData?.updatedTitle || data.title;
  const displaySubtitle = liveData?.updatedSubtitle || data.subtitle;
  const displayStatus = liveData?.updatedStatus || data.status;
  const displayDate = liveData?.updatedDate || data.date;
  const statusStyles = getStatusStyles(displayStatus, data.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            {/* Minimalist Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <div className="text-gray-500 dark:text-gray-400">
                  {config.icon}
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {config.label}
                </span>
                {displayStatus && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                    {displayStatus}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="py-4 text-sm text-gray-500 dark:text-gray-400">
                  {error}
                </div>
              )}

              {/* Content */}
              {!isLoading && !error && (
                <>
              {/* Title */}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {displayTitle}
              </h2>

              {/* Subtitle */}
                  {displaySubtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {displaySubtitle}
                </p>
              )}

                  {/* Summary Section */}
                  {summary && (
                    <div className="mb-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {summary}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    {displayDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{displayDate}</span>
                </div>
              )}

                    {/* Job Application metadata */}
                    {data.type === 'job-application' && liveData?.metadata && (
                      <>
                        {liveData.metadata.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{liveData.metadata.location}</span>
                        </div>
                      )}
                        {liveData.metadata.salary && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{liveData.metadata.salary}</span>
                        </div>
                      )}
                        {liveData.metadata.workType && (
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                            {liveData.metadata.workType}
                        </span>
                      )}
                      </>
                    )}

                    {/* CV Analysis metadata */}
                    {data.type === 'cv-analysis' && liveData?.metadata?.matchScore !== undefined && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Match Score</span>
                          <span className={`text-xl font-semibold ${
                            liveData.metadata.matchScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                            liveData.metadata.matchScore >= 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {liveData.metadata.matchScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Interview metadata */}
                    {data.type === 'interview' && liveData?.metadata && (
                      <>
                        {liveData.metadata.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{liveData.metadata.time}</span>
                          </div>
                        )}
                        {liveData.metadata.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{liveData.metadata.location}</span>
                        </div>
                      )}
                        {liveData.metadata.type && (
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs capitalize">
                            {liveData.metadata.type} interview
                          </span>
                        )}
                      </>
                    )}

                    {/* Resume metadata */}
                    {data.type === 'resume' && liveData?.metadata?.template && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-xs">Template: {liveData.metadata.template.replace(/-/g, ' ')}</span>
                    </div>
                  )}
                </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleNavigate}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <span>Open {config.label}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


