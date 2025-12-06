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
  Info,
  Search,
  MapPin,
  Building,
} from 'lucide-react';
import moment from 'moment';
import { toast } from '@/contexts/ToastContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { extractJobInfo, BasicJobInfo } from '../../../lib/jobExtractor';

interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onAddEvent: (eventData: any) => Promise<void>;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: string;
  appliedDate: string;
}

export const AddEventModal = ({ selectedDate, onClose, onAddEvent }: AddEventModalProps) => {
  const { currentUser } = useAuth();
  const [eventType, setEventType] = useState<'application' | 'interview' | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    location: '',
    notes: '',
    url: '',
    interviewType: 'technical',
    interviewTime: moment(selectedDate).format('HH:mm'),
    contactName: '',
    contactEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showApplicationDropdown, setShowApplicationDropdown] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<string | null>(null);

  const resetForm = () => {
    setEventType(null);
    setFormData({
      companyName: '',
      position: '',
      location: '',
      notes: '',
      url: '',
      interviewType: 'technical',
      interviewTime: moment(selectedDate).format('HH:mm'),
      contactName: '',
      contactEmail: '',
    });
    setSearchQuery('');
    setSelectedApplication(null);
    setShowApplicationDropdown(false);
    setLinkedApplicationId(null);
  };

  // Load existing applications for interview linking
  useEffect(() => {
    if (eventType === 'interview' && currentUser) {
      const fetchApplications = async () => {
        try {
          const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
          const applicationsSnapshot = await getDocs(query(applicationsRef));
          const apps: JobApplication[] = [];
          applicationsSnapshot.forEach((doc) => {
            apps.push({ id: doc.id, ...doc.data() } as JobApplication);
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

  // AI Job Extraction
  const handleExtractJobInfo = async () => {
    if (!formData.url || !formData.url.trim()) {
      toast.error('Please enter a job URL first');
      return;
    }

    setIsAnalyzingJob(true);
    toast.info('Analyzing job posting...', { duration: 2000 });

    try {
      const jobUrl = formData.url.trim();
      
      // Use shared extraction utility with basic mode (fast and reliable)
      const extractedData = await extractJobInfo(jobUrl, { detailed: false }) as BasicJobInfo;

      console.log('Successfully extracted data:', extractedData);

      // Format notes from summary
      let formattedNotes = extractedData.summary;
      if (formattedNotes) {
        formattedNotes = formattedNotes.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

        if (!formattedNotes.includes('•') && !formattedNotes.includes('-')) {
          const lines = formattedNotes.split('\n').filter((line) => line.trim().length > 0);
          if (lines.length > 0) {
            formattedNotes = lines
              .map((line) => {
                const trimmed = line.trim();
                if (!trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                  return `• ${trimmed}`;
                }
                return trimmed;
              })
              .join('\n');
          }
        }

        if (formData.notes && formData.notes.trim()) {
          formattedNotes = `${formData.notes}\n\n---\n\n${formattedNotes}`;
        }
      }

      setFormData((prev) => ({
        ...prev,
        companyName: extractedData.companyName || prev.companyName,
        position: extractedData.position || prev.position,
        location: extractedData.location || prev.location,
        notes: formattedNotes || prev.notes || '',
      }));

      toast.success('Job information extracted successfully!');
    } catch (error) {
      console.error('Error extracting job info:', error);
      toast.error(
        `Failed to extract job information: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please fill in the fields manually.`
      );
    } finally {
      setIsAnalyzingJob(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!eventType) {
      toast.error('Please select an event type first');
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        eventType,
        linkedApplicationId: linkedApplicationId || undefined,
      };

      await onAddEvent(eventData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: '100%' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: '100%' }}
          onClick={(e) => e.stopPropagation()}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 w-full rounded-t-2xl sm:rounded-2xl max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          {/* Drag handle for mobile */}
          <div className="w-full flex justify-center pt-2 pb-1 sm:hidden">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-xl text-gray-900 dark:text-white tracking-tight">
                  {eventType
                    ? `Add ${eventType === 'application' ? 'Job Application' : 'Interview'}`
                    : 'Add Event'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {moment(selectedDate).format('dddd, MMMM D, YYYY')}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Event Type Selection */}
              {!eventType && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    What would you like to add?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEventType('application')}
                      className="group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all text-left"
                    >
                      <div className="flex flex-col items-start gap-3">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                          <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            Job Application
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Track a new job application
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEventType('interview')}
                      className="group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left"
                    >
                      <div className="flex flex-col items-start gap-3">
                        <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                          <CalIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            Interview
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Schedule an interview
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Event Type Badge */}
              {eventType && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    {eventType === 'application' ? (
                      <>
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            Adding Job Application
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Track a new application
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                          <CalIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            Adding Interview
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Schedule an interview
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEventType(eventType === 'application' ? 'interview' : 'application');
                      setSelectedApplication(null);
                      setLinkedApplicationId(null);
                      setSearchQuery('');
                      setFormData((prev) => ({
                        ...prev,
                        companyName: '',
                        position: '',
                        location: '',
                      }));
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                  >
                    Switch
                  </button>
                </div>
              )}

              {/* Form Fields */}
              {eventType && (
                <>
                  {/* Job URL - For applications */}
                  {eventType === 'application' && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Link className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Job Posting URL
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity" />
                        <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
                          <div className="relative flex rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
                            <input
                              type="url"
                              value={formData.url || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                              className="flex-1 px-4 py-3.5 rounded-l-xl bg-transparent border-0 focus:ring-0 focus:outline-none text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white"
                              placeholder="https://linkedin.com/jobs/view/..."
                              autoFocus
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleExtractJobInfo}
                              disabled={isAnalyzingJob || !formData.url || !formData.url.trim()}
                              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-r-xl bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isAnalyzingJob ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                  <span className="text-sm font-medium whitespace-nowrap">
                                    Extracting...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm font-medium whitespace-nowrap">Extract</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>AI will extract all information automatically</span>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {(formData.companyName || formData.position || formData.location) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t border-gray-200 dark:border-gray-800"
                    >
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        <span>AI extracted information below</span>
                      </p>
                    </motion.div>
                  )}

                  {/* Application Lookup - For interviews */}
                  {eventType === 'interview' && (
                    <div className="space-y-2 application-search-container">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Link className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        Link to Existing Application (Optional)
                      </label>
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowApplicationDropdown(true);
                            }}
                            onFocus={() => setShowApplicationDropdown(true)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Search by company or position..."
                          />
                          {selectedApplication && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApplication(null);
                                setLinkedApplicationId(null);
                                setSearchQuery('');
                                setFormData((prev) => ({
                                  ...prev,
                                  companyName: '',
                                  position: '',
                                  location: '',
                                }));
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                            >
                              {applications
                                .filter(
                                  (app) =>
                                    app.companyName
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()) ||
                                    app.position.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .slice(0, 5)
                                .map((app) => (
                                  <button
                                    key={app.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setLinkedApplicationId(app.id);
                                      setSearchQuery(`${app.companyName} - ${app.position}`);
                                      setFormData((prev) => ({
                                        ...prev,
                                        companyName: app.companyName,
                                        position: app.position,
                                        location: app.location || prev.location,
                                      }));
                                      setShowApplicationDropdown(false);
                                      toast.success('Application linked successfully');
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                                        <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                          {app.companyName}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                          {app.position}
                                        </p>
                                        {app.location && (
                                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {app.location}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              {applications.filter(
                                (app) =>
                                  app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  app.position.toLowerCase().includes(searchQuery.toLowerCase())
                              ).length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                  No applications found
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {selectedApplication && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
                                Linked to: {selectedApplication.companyName} -{' '}
                                {selectedApplication.position}
                              </p>
                              <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                                Fields will be pre-filled
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interview Type - For interviews */}
                  {eventType === 'interview' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Interview Type *
                      </label>
                      <select
                        value={formData.interviewType}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, interviewType: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="technical">Technical</option>
                        <option value="hr">HR</option>
                        <option value="manager">Manager</option>
                        <option value="final">Final</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter company name"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Position *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, position: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter position"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Location {eventType === 'application' ? '*' : ''}
                    </label>
                    <input
                      type="text"
                      required={eventType === 'application'}
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, location: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter location"
                    />
                  </div>

                  {/* Interview Time - For interviews */}
                  {eventType === 'interview' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Time
                      </label>
                      <input
                        type="time"
                        value={formData.interviewTime}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, interviewTime: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  )}

                  {/* Contact Name - For interviews */}
                  {eventType === 'interview' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, contactName: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter contact name"
                      />
                    </div>
                  )}

                  {/* Contact Email - For interviews */}
                  {eventType === 'interview' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter contact email"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      placeholder="Add any relevant notes..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !eventType}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Add Event
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

