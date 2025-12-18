import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  Calendar as CalIcon,
  Check,
  Link,
  Sparkles,
  Loader2,
  Search,
  Building,
  AlertTriangle,
  Code,
  Users,
  CheckCircle,
  MoreHorizontal,
  User,
  Clock,
} from 'lucide-react';
import moment from 'moment';
import { notify } from '@/lib/notify';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import {
  extractJobInfo,
  DetailedJobInfo,
  detectUrlType,
  requiresPasteMode,
  getPlatformName,
  extractFromPastedContent,
} from '../../../lib/jobExtractor';
import DatePicker from '../../ui/DatePicker';
import {
  KanbanBoard,
  BoardType,
  RelationshipGoal,
  WarmthLevel,
  OutreachChannel,
  JobApplication,
} from '../../../types/job';
import { ProfileAvatar, generateGenderedAvatarConfigByName } from '../../profile/avatar';

interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAddEvent: (eventData: any) => Promise<void>;
  boards?: KanbanBoard[];
  currentBoardId?: string;
  currentBoardType?: BoardType;
}

interface LocalJobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: string;
  appliedDate: string;
}

// Warmth Indicator Component
const WarmthIndicator = ({ level, size = 'sm' }: { level: WarmthLevel; size?: 'sm' | 'md' }) => {
  const config = {
    cold: { icon: '❄️', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300' },
    warm: { icon: '🌤️', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-300' },
    hot: { icon: '🔥', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300' },
  };
  const { icon, bg, text } = config[level] || config.cold;
  const sizeClasses = size === 'md' ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-sm';
  
  return (
    <div className={`${sizeClasses} ${bg} ${text} rounded-full flex items-center justify-center`}>
      {icon}
    </div>
  );
};

export const AddEventModal = ({
  selectedDate,
  onClose,
  onAddEvent,
  boards = [],
  currentBoardId,
  currentBoardType = 'jobs',
}: AddEventModalProps) => {
  const { currentUser } = useAuth();
  const [eventType, setEventType] = useState<'application' | 'interview' | null>(null);
  const [formData, setFormData] = useState<Partial<JobApplication> & {
    interviewType?: 'technical' | 'hr' | 'manager' | 'final' | 'other';
    interviewTime?: string;
    interviewDate?: string;
  }>({
    companyName: '',
    position: '',
    location: '',
    status: 'applied',
    appliedDate: moment(selectedDate).format('YYYY-MM-DD'),
    url: '',
    description: '',
    fullJobDescription: '',
    notes: '',
    salary: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactRole: '',
    contactLinkedIn: '',
    interviewType: 'technical',
    interviewTime: moment(selectedDate).format('HH:mm'),
    interviewDate: moment(selectedDate).format('YYYY-MM-DD'),
    // Campaign fields
    outreachChannel: 'email',
    relationshipGoal: 'networking',
    warmthLevel: 'cold',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [applications, setApplications] = useState<LocalJobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<LocalJobApplication | null>(null);
  const [showApplicationDropdown, setShowApplicationDropdown] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<string | null>(null);
  
  // Paste mode state for LinkedIn/Indeed
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pastedJobContent, setPastedJobContent] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  
  // Form state
  const [showFullForm, setShowFullForm] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  const resetForm = () => {
    setEventType(null);
    setFormData({
      companyName: '',
      position: '',
      location: '',
      status: 'applied',
      appliedDate: moment(selectedDate).format('YYYY-MM-DD'),
      url: '',
      description: '',
      fullJobDescription: '',
      notes: '',
      salary: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactRole: '',
      contactLinkedIn: '',
      interviewType: 'technical',
      interviewTime: moment(selectedDate).format('HH:mm'),
      interviewDate: moment(selectedDate).format('YYYY-MM-DD'),
      outreachChannel: 'email',
      relationshipGoal: 'networking',
      warmthLevel: 'cold',
    });
    setSearchQuery('');
    setSelectedApplication(null);
    setShowApplicationDropdown(false);
    setLinkedApplicationId(null);
    setShowPasteMode(false);
    setPastedJobContent('');
    setDetectedPlatform(null);
    setShowFullForm(false);
    setWizardStep(1);
  };

  // Load existing applications for interview linking
  useEffect(() => {
    if (eventType === 'interview' && currentUser) {
      const fetchApplications = async () => {
        try {
          const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
          const applicationsSnapshot = await getDocs(query(applicationsRef));
          const apps: LocalJobApplication[] = [];
          applicationsSnapshot.forEach((doc) => {
            apps.push({ id: doc.id, ...doc.data() } as LocalJobApplication);
          });
          setApplications(apps);
        } catch (error) {
          console.error('Error fetching applications:', error);
        }
      };
      fetchApplications();
    }
  }, [eventType, currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.application-search-container')) {
        setShowApplicationDropdown(false);
      }
    };

    if (showApplicationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showApplicationDropdown]);

  // Auto-select application for campaigns board
  useEffect(() => {
    if (currentBoardType === 'campaigns' && !eventType) {
      setEventType('application');
    }
  }, [currentBoardType, eventType]);

  // Apply extracted data to form
  const applyExtractedDataToForm = (extractedData: DetailedJobInfo) => {
    let formattedDescription = extractedData.summary;
    if (formattedDescription) {
      formattedDescription = formattedDescription
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/, "'")
        .trim();

      if (!formattedDescription.includes('•') && !formattedDescription.includes('-')) {
        const lines = formattedDescription.split('\n').filter((line: string) => line.trim().length > 0);
          if (lines.length > 0) {
          formattedDescription = lines.map((line: string) => {
                const trimmed = line.trim();
                if (!trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                  return `• ${trimmed}`;
                }
                return trimmed;
          }).join('\n');
          }
        }

      if (formData.description && formData.description.trim()) {
        formattedDescription = `${formData.description}\n\n---\n\n${formattedDescription}`;
        }
      }

    setFormData(prev => ({
        ...prev,
        companyName: extractedData.companyName || prev.companyName,
        position: extractedData.position || prev.position,
        location: extractedData.location || prev.location,
      description: formattedDescription || prev.description || '',
      fullJobDescription: extractedData.fullJobDescription || prev.fullJobDescription || '',
      jobInsights: extractedData.jobInsights || prev.jobInsights,
      jobTags: extractedData.jobTags || prev.jobTags
    }));

    setShowFullForm(true);
  };

  // AI Job Extraction with paste mode fallback
  const handleExtractJobInfo = async () => {
    if (!formData.url || !formData.url.trim()) {
      notify.error('Please enter a job URL first');
      return;
    }

    const jobUrl = formData.url.trim();
    
    // Detect URL type
    const urlType = detectUrlType(jobUrl);
    const platformName = getPlatformName(urlType);
    setDetectedPlatform(platformName);
    
    console.log(`🔍 [handleExtractJobInfo] Detected URL type: ${urlType} (${platformName})`);
    
    // Check if this platform requires manual paste (LinkedIn, Indeed)
    if (requiresPasteMode(jobUrl)) {
      console.log(`⚠️ [handleExtractJobInfo] ${platformName} requires manual paste mode`);
      setShowPasteMode(true);
      setPastedJobContent('');
      notify.info(`${platformName} requires login. Please paste the job description below.`, { duration: 5000 });
      return;
    }

    // For other URLs, try automatic extraction
    setIsAnalyzingJob(true);
    notify.info(`Analyzing ${platformName} job posting...`, { duration: 2000 });

    try {
      const extractedData = await extractJobInfo(jobUrl, { detailed: true }) as DetailedJobInfo;

      console.log('✅ Successfully extracted data:', extractedData);

      const hasValidData = extractedData.position && extractedData.position.length > 2;
      
      if (!hasValidData) {
        console.warn('⚠️ Extracted data seems incomplete, switching to paste mode');
        setShowPasteMode(true);
        setPastedJobContent('');
        notify.warning('Auto-extraction incomplete. Please paste the job description for better results.', { duration: 5000 });
        setIsAnalyzingJob(false);
        return;
      }

      applyExtractedDataToForm(extractedData);
      
      if (!extractedData.companyName || extractedData.companyName.length <= 2) {
        notify.success('Job extracted! Please verify the company name.', { duration: 3000 });
      } else {
      notify.success('Job information extracted successfully!');
      }
    } catch (error) {
      console.error('❌ Error extracting job info:', error);
      
      setShowPasteMode(true);
      setPastedJobContent('');
      notify.warning('Auto-extraction failed. Please paste the job description below.', { duration: 5000 });
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  // Handle pasted content analysis
  const handleAnalyzePastedContent = async () => {
    if (!pastedJobContent || pastedJobContent.trim().length < 50) {
      notify.error('Please paste the complete job description (at least 50 characters)');
      return;
    }

    setIsAnalyzingJob(true);
    notify.info('Analyzing pasted job description...', { duration: 2000 });

    try {
      const extractedData = await extractFromPastedContent(pastedJobContent, formData.url);
      
      console.log('✅ Successfully extracted from pasted content:', extractedData);
      
      applyExtractedDataToForm(extractedData);
      
      setShowPasteMode(false);
      setPastedJobContent('');
      setDetectedPlatform(null);
      
      notify.success('Job information extracted successfully!');
    } catch (error) {
      console.error('❌ Error analyzing pasted content:', error);
      notify.error(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}. Please fill in the fields manually.`);
      setShowFullForm(true);
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!eventType) {
      notify.error('Please select an event type first');
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        eventType,
        linkedApplicationId: linkedApplicationId || undefined,
        boardId: currentBoardId,
        boardType: currentBoardType,
      };

      await onAddEvent(eventData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      notify.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          resetForm();
          onClose();
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#2b2a2c] w-full sm:rounded-2xl rounded-t-2xl max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-[#3d3c3e] flex items-center justify-between bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-xl z-10 sticky top-0">
              <div>
                <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                {eventType ? (eventType === 'application' 
                  ? (currentBoardType === 'campaigns' ? 'New Outreach' : 'New Application') 
                  : 'Schedule Interview') : 'Add to Tracker'}
                </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {eventType ? (eventType === 'application' 
                  ? (currentBoardType === 'campaigns' ? 'Track a new outreach contact' : 'Track a new job opportunity') 
                  : 'Add an upcoming interview') : `${moment(selectedDate).format('dddd, MMMM D, YYYY')}`}
                </p>
              </div>
            <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#3d3c3e] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selection Cards - Only for Jobs board, Campaigns go directly to form */}
              {!eventType && currentBoardType !== 'campaigns' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setEventType('application');
                      setShowFullForm(false);
                      setWizardStep(1);
                    }}
                    className="group relative p-6 rounded-2xl border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325] hover:bg-white dark:hover:bg-[#3d3c3e] hover:shadow-lg hover:border-transparent transition-all text-left"
                  >
                    <div className="flex flex-col items-start gap-4">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#252525] shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <Briefcase className="w-6 h-6 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            Job Application
                          </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Track a new job application
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setEventType('interview');
                      setShowFullForm(true);
                    }}
                    className="group relative p-6 rounded-2xl border border-gray-200 dark:border-[#3d3c3e] bg-gray-50 dark:bg-[#242325] hover:bg-white dark:hover:bg-[#3d3c3e] hover:shadow-lg hover:border-transparent transition-all text-left"
                  >
                    <div className="flex flex-col items-start gap-4">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#252525] shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <CalIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            Interview
                          </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Schedule an interview
                          </p>
                        </div>
                      </div>
                    </motion.button>
                </div>
              )}


              {/* Form Content */}
              {eventType && (
                <>
                  {/* Switcher - Only for Jobs board */}
                  {currentBoardType !== 'campaigns' && (
                    <div className="relative p-1 bg-gray-100 dark:bg-[#2b2a2c] rounded-xl">
                      <div className="flex items-center relative">
                        {/* Sliding pill indicator */}
                        <motion.div
                          className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-[#3d3c3e] shadow-sm"
                          initial={false}
                          animate={{
                            left: eventType === 'application' ? '4px' : 'calc(50% + 2px)',
                            right: eventType === 'interview' ? '4px' : 'calc(50% + 2px)',
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                        
                  <button
                    type="button"
                    onClick={() => {
                            setEventType('application');
                      setSelectedApplication(null);
                      setLinkedApplicationId(null);
                      setSearchQuery('');
                            setShowApplicationDropdown(false);
                            setShowFullForm(false);
                            setWizardStep(1);
                          }}
                          className="relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                        >
                          <Briefcase className={`w-4 h-4 transition-colors duration-150 ${
                            eventType === 'application' 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={eventType === 'application' 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-500 dark:text-gray-400'
                          }>
                            Application
                          </span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setEventType('interview');
                            setShowFullForm(true);
                          }}
                          className="relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
                        >
                          <CalIcon className={`w-4 h-4 transition-colors duration-150 ${
                            eventType === 'interview' 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={eventType === 'interview' 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-500 dark:text-gray-400'
                          }>
                            Interview
                          </span>
                  </button>
                      </div>
                </div>
              )}

                  {/* Job URL (Application only - Jobs board) */}
                  {eventType === 'application' && currentBoardType === 'jobs' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                        Job Posting URL
                      </label>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Powered
                        </span>
                      </div>
                      <div className="relative flex items-center group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-xl opacity-30 blur-sm group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative flex items-center w-full bg-white dark:bg-[#242325] rounded-xl">
                            <input
                              type="url"
                              value={formData.url || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                            className="w-full pl-4 pr-24 py-3 bg-transparent border-0 focus:ring-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                            placeholder="https://linkedin.com/jobs/..."
                              autoFocus
                            />
                          <div className="absolute right-1.5">
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleExtractJobInfo}
                              disabled={isAnalyzingJob || !formData.url || !formData.url.trim()}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white text-xs font-medium shadow-sm border border-gray-200 dark:border-[#3d3c3e] hover:bg-gray-100 dark:hover:bg-[#303030] disabled:opacity-50 transition-all"
                            >
                              {isAnalyzingJob ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-purple-500" />
                              )}
                              {isAnalyzingJob ? 'Analyzing...' : 'Auto-Fill'}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Paste Mode UI */}
                      {showPasteMode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-3"
                        >
                          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                {detectedPlatform ? `${detectedPlatform} requires manual input` : 'Auto-extraction unavailable'}
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                {detectedPlatform === 'LinkedIn' || detectedPlatform === 'Indeed' 
                                  ? `${detectedPlatform} requires login to view job details. Copy the job description from ${detectedPlatform} and paste it below.`
                                  : 'Please copy the job description from the website and paste it below for AI analysis.'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <textarea
                              value={pastedJobContent}
                              onChange={(e) => setPastedJobContent(e.target.value)}
                              placeholder="Paste the complete job description here...&#10;&#10;Include: job title, company name, location, requirements, responsibilities, etc."
                              className="w-full h-48 p-4 text-sm border border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-white dark:bg-[#1a1919] text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                              {pastedJobContent.length} characters
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPasteMode(false);
                                setPastedJobContent('');
                                setDetectedPlatform(null);
                              }}
                              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={handleAnalyzePastedContent}
                              disabled={isAnalyzingJob || pastedJobContent.trim().length < 50}
                              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white text-sm font-medium border border-gray-200 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-500 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {isAnalyzingJob ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-purple-500 group-hover:text-purple-600 transition-colors" />
                                  <span>Analyze</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                        </div>
                  )}

                  {/* Campaigns: Wizard-based Outreach Form */}
                  {eventType === 'application' && currentBoardType === 'campaigns' && (
                    <div className="space-y-6">
                      {/* Wizard Step Indicator */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                            wizardStep === 1
                              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25'
                              : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            wizardStep === 1 ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#2b2a2c]'
                          }`}>
                            1
                      </div>
                          <span className="font-medium text-sm">Contact</span>
                        </button>
                        
                        <div className="w-8 h-0.5 bg-gray-200 dark:bg-[#3d3c3e]" />
                        
                        <button
                          type="button"
                          onClick={() => formData.contactName && formData.companyName && setWizardStep(2)}
                          disabled={!formData.contactName || !formData.companyName}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                            wizardStep === 2
                              ? 'bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white shadow-lg shadow-[#EC4899]/25'
                              : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#4a494b] disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            wizardStep === 2 ? 'bg-white/20' : 'bg-gray-200 dark:bg-[#2b2a2c]'
                          }`}>
                            2
                      </div>
                          <span className="font-medium text-sm">Strategy</span>
                        </button>
                    </div>

                      {/* Contact Preview Card */}
                      {(formData.contactName || formData.companyName) && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/5 to-[#EC4899]/5 border border-[#8B5CF6]/20 dark:border-[#8B5CF6]/10"
                        >
                          <div className="flex items-center gap-4">
                            <ProfileAvatar
                              config={generateGenderedAvatarConfigByName(formData.contactName || 'Unknown')}
                              size={56}
                              className="rounded-2xl shadow-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg">
                                {formData.contactName || 'Contact Name'}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {formData.contactRole || 'Role'} @ {formData.companyName || 'Company'}
                              </p>
                            </div>
                            {formData.warmthLevel && (
                              <WarmthIndicator level={formData.warmthLevel as WarmthLevel} size="md" />
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Step 1: Contact Information */}
                      <AnimatePresence mode="wait">
                        {wizardStep === 1 && (
                          <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                  Contact Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.contactName || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                  className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                  placeholder="John Doe"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                  Role/Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={formData.contactRole || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, contactRole: e.target.value }))}
                                  className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                  placeholder="Head of Engineering"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Company <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.companyName || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                                className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                placeholder="Google, Spotify..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  value={formData.contactEmail || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                                  className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                  placeholder="john@company.com"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                  LinkedIn
                                </label>
                                <input
                                  type="url"
                                  value={formData.contactLinkedIn || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, contactLinkedIn: e.target.value }))}
                                  className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                                  placeholder="linkedin.com/in/johndoe"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Outreach Strategy */}
                        {wizardStep === 2 && (
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                          >
                            {/* Relationship Goal */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Relationship Goal
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { value: 'networking', label: 'Networking', icon: '🤝', color: 'from-blue-500 to-indigo-500' },
                                  { value: 'prospecting', label: 'Prospecting', icon: '🎯', color: 'from-purple-500 to-pink-500' },
                                  { value: 'referral', label: 'Referral', icon: '⭐', color: 'from-amber-500 to-orange-500' },
                                ].map((goal) => (
                                  <motion.button
                                    key={goal.value}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData(prev => ({ ...prev, relationshipGoal: goal.value as RelationshipGoal }))}
                                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                      formData.relationshipGoal === goal.value
                                        ? `bg-gradient-to-br ${goal.color} border-transparent text-white shadow-lg`
                                        : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                    }`}
                                  >
                                    <span className="text-2xl block mb-1">{goal.icon}</span>
                                    <span className="text-xs font-bold">{goal.label}</span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            {/* Warmth Level */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Relationship Warmth
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { value: 'cold', label: 'Cold', icon: '❄️', color: 'from-slate-400 to-slate-500' },
                                  { value: 'warm', label: 'Warm', icon: '🌤️', color: 'from-amber-400 to-orange-500' },
                                  { value: 'hot', label: 'Hot', icon: '🔥', color: 'from-red-500 to-rose-600' },
                                ].map((warmth) => (
                                  <motion.button
                                    key={warmth.value}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setFormData(prev => ({ ...prev, warmthLevel: warmth.value as WarmthLevel }))}
                                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                                      formData.warmthLevel === warmth.value
                                        ? `bg-gradient-to-br ${warmth.color} border-transparent text-white shadow-lg`
                                        : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                    }`}
                                  >
                                    <span className="text-2xl block mb-1">{warmth.icon}</span>
                                    <span className="text-xs font-bold">{warmth.label}</span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            {/* Outreach Channel */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                Outreach Channel
                              </label>
                              <div className="grid grid-cols-6 gap-2">
                                {[
                                  { value: 'email', icon: '✉️' },
                                  { value: 'linkedin', icon: '💼' },
                                  { value: 'referral', icon: '🤝' },
                                  { value: 'event', icon: '🎤' },
                                  { value: 'cold_call', icon: '📞' },
                                  { value: 'other', icon: '📋' },
                                ].map((channel) => (
                                  <button
                                    key={channel.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, outreachChannel: channel.value as OutreachChannel }))}
                                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                                      formData.outreachChannel === channel.value
                                        ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] shadow-sm'
                                        : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-[#8B5CF6]/50'
                                    }`}
                                  >
                                    <span className="text-xl">{channel.icon}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Contact Date */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Contact Date <span className="text-red-500">*</span>
                              </label>
                              <DatePicker
                                value={formData.appliedDate || ''}
                                onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                                placeholder="Select date"
                                className="w-full"
                              />
                            </div>

                            {/* Notes */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Initial Message (optional)
                              </label>
                              <textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-[#8B5CF6] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all resize-none"
                                placeholder="Notes about the outreach..."
                                rows={3}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Jobs board: Regular form fields */}
                  {eventType === 'application' && currentBoardType === 'jobs' && (showFullForm || formData.companyName || formData.position) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2 border-t border-gray-200 dark:border-[#3d3c3e]"
                    >
                      {(formData.companyName || formData.position || formData.location) && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        <span>AI extracted information below</span>
                      </p>
                      )}

                      {/* Company Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.companyName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-purple-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="Enter company name"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Position <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.position || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-purple-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="Enter position"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.location || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-purple-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="Enter location"
                        />
                      </div>

                      {/* Salary (optional) */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Salary (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.salary || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-purple-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          placeholder="e.g. $80,000 - $100,000"
                        />
                      </div>

                      {/* Application Date */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Application Date <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.appliedDate || ''}
                          onChange={(value) => setFormData(prev => ({ ...prev, appliedDate: value }))}
                          placeholder="Select date"
                          className="w-full"
                        />
                      </div>

                      {/* Notes / Description */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Notes
                        </label>
                        <textarea
                          value={formData.description || formData.notes || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value, notes: e.target.value }))}
                          className="w-full px-4 py-3 bg-white dark:bg-[#242325] border-2 border-gray-200 dark:border-[#3d3c3e] focus:border-purple-500 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                          placeholder="Add any relevant notes..."
                          rows={3}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Interview form fields */}
                  {eventType === 'interview' && (
                    <div className="space-y-5">
                      {/* Application Lookup - Required */}
                      <div className="space-y-3 application-search-container">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Select Application <span className="text-red-500">*</span>
                      </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                          Search and select the job application for this interview
                        </p>
                      <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowApplicationDropdown(true);
                            }}
                            onFocus={() => setShowApplicationDropdown(true)}
                              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                            placeholder="Search by company or position..."
                              autoFocus
                          />
                          {selectedApplication && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplication(null);
                                setLinkedApplicationId(null);
                                setSearchQuery('');
                                  setFormData(prev => ({
                                  ...prev,
                                  companyName: '',
                                  position: '',
                                  location: '',
                                }));
                              }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown */}
                        <AnimatePresence>
                          {showApplicationDropdown && searchQuery && !selectedApplication && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-2 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-xl shadow-lg max-h-60 overflow-y-auto"
                            >
                              {applications
                                .filter(
                                  (app) =>
                                      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    app.position.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .slice(0, 5)
                                  .map((app) => {
                                    // Generate company color
                                    const colors = [
                                      'bg-gradient-to-br from-purple-500 to-indigo-600',
                                      'bg-gradient-to-br from-blue-500 to-cyan-600',
                                      'bg-gradient-to-br from-emerald-500 to-teal-600',
                                      'bg-gradient-to-br from-orange-500 to-red-600',
                                      'bg-gradient-to-br from-pink-500 to-rose-600',
                                    ];
                                    const colorIndex = app.companyName.charCodeAt(0) % colors.length;
                                    
                                    return (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setLinkedApplicationId(app.id);
                                      setSearchQuery(`${app.companyName} - ${app.position}`);
                                          setFormData(prev => ({
                                        ...prev,
                                        companyName: app.companyName,
                                        position: app.position,
                                        location: app.location || prev.location,
                                      }));
                                      setShowApplicationDropdown(false);
                                        }}
                                        className="w-full px-3 py-1.5 text-left hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 transition-all border-b border-gray-100 dark:border-[#3d3c3e] last:border-b-0 flex items-center gap-2"
                                      >
                                        {/* Company Logo/Avatar */}
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-md ${colors[colorIndex]} flex items-center justify-center shadow-sm`}>
                                          <span className="text-white font-semibold text-[11px]">
                                            {app.companyName.charAt(0).toUpperCase()}
                                          </span>
                                      </div>
                                        
                                        {/* Company Info */}
                                      <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-[11px] text-gray-900 dark:text-white truncate leading-tight">
                                          {app.companyName}
                                          </div>
                                          <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate leading-tight mt-0.5">
                                          {app.position}
                                      </div>
                                    </div>
                                  </button>
                                    );
                                  })}
                              {applications.filter(
                                (app) =>
                                  app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  app.position.toLowerCase().includes(searchQuery.toLowerCase())
                              ).length === 0 && (
                                  <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                  No applications found
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                        {/* Selected Application Badges */}
                      {selectedApplication && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200/50 dark:border-purple-800/30"
                          >
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-md border border-purple-200 dark:border-purple-700">
                              <Building className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {selectedApplication.companyName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm rounded-md border border-indigo-200 dark:border-indigo-700">
                              <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {selectedApplication.position}
                              </span>
                            </div>
                          </motion.div>
                      )}
                    </div>

                      {/* Show rest of form only after application is selected */}
                      <AnimatePresence>
                        {selectedApplication && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 overflow-hidden"
                          >
                            {/* Date & Time Grid */}
                            <div className="grid grid-cols-2 gap-5">
                  <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                  Interview Date <span className="text-red-500">*</span>
                    </label>
                                <DatePicker
                                  value={formData.interviewDate || moment(selectedDate).format('YYYY-MM-DD')}
                                  onChange={(value) => setFormData(prev => ({ ...prev, interviewDate: value }))}
                                  placeholder="Select date"
                                  className="w-full"
                    />
                  </div>
                  <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                  Interview Time
                    </label>
                                <div className="relative">
                                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                                    type="time"
                                    value={formData.interviewTime}
                                    onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                              </div>
                  </div>

                            {/* Interview Type - Visual Cards */}
                    <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 text-center">
                                Interview Type
                      </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                  { value: 'technical', label: 'Technical', Icon: Code },
                                  { value: 'hr', label: 'HR', Icon: Users },
                                  { value: 'manager', label: 'Manager', Icon: Briefcase },
                                  { value: 'final', label: 'Final', Icon: CheckCircle },
                                  { value: 'other', label: 'Other', Icon: MoreHorizontal },
                                ].map((type) => {
                                  const Icon = type.Icon;
                                  const isSelected = formData.interviewType === type.value;
                                  return (
                                    <motion.button
                                      key={type.value}
                                      type="button"
                                      whileHover={{ scale: 1.02, y: -2 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setFormData(prev => ({ ...prev, interviewType: type.value as any }))}
                                      className={`relative p-4 rounded-xl border-2 transition-all ${
                                        isSelected
                                          ? 'bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/20'
                                          : 'bg-white dark:bg-[#242325] border-gray-200 dark:border-[#3d3c3e] hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
                                      }`}
                                    >
                                      <div className="flex flex-col items-center gap-2">
                                        <div className={`p-2 rounded-lg transition-colors ${
                                          isSelected
                                            ? 'bg-purple-100 dark:bg-purple-900/50'
                                            : 'bg-gray-100 dark:bg-[#2b2a2c]'
                                        }`}>
                                          <Icon className={`w-5 h-5 ${
                                            isSelected
                                              ? 'text-purple-600 dark:text-purple-400'
                                              : 'text-gray-600 dark:text-gray-400'
                                          }`} />
                    </div>
                                        <span className={`text-sm font-medium ${
                                          isSelected
                                            ? 'text-purple-900 dark:text-purple-200'
                                            : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                          {type.label}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="absolute top-2 right-2"
                                        >
                                          <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Interviewer Name */}
                    <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Interviewer Name
                      </label>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                                  value={formData.contactName || ''}
                                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#242325] border border-gray-200 dark:border-[#3d3c3e] hover:border-purple-400 dark:hover:border-purple-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 shadow-sm hover:shadow-md transition-all"
                                  placeholder="e.g., John Doe, Hiring Manager"
                      />
                    </div>
                    </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
                  )}
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-[#3d3c3e] flex justify-end gap-3 bg-gray-50/50 dark:bg-[#242325]/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-5 py-2.5 bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors font-medium border border-gray-200 dark:border-[#3d3c3e]"
            >
              Cancel
            </motion.button>
            
            {/* Navigation buttons for wizard */}
            {currentBoardType === 'campaigns' && eventType === 'application' && wizardStep === 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setWizardStep(2)}
                disabled={!formData.contactName || !formData.companyName}
                className="px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </motion.button>
            )}
            
            {/* Submit button */}
            {(currentBoardType !== 'campaigns' || wizardStep === 2 || eventType === 'interview') && eventType && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (eventType === 'interview' && (!linkedApplicationId || !formData.interviewDate)) ||
                  (eventType === 'application' && currentBoardType !== 'campaigns' && (!formData.companyName || !formData.position || !formData.location || !formData.appliedDate))
                }
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg shadow-gray-200 dark:shadow-none flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                    {eventType === 'application' 
                      ? (currentBoardType === 'campaigns' ? 'Add Outreach' : 'Create Application')
                      : 'Add Interview'}
                </>
              )}
            </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
