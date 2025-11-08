import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, updateDoc, doc, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { 
  Calendar, 
  Clock, 
  Briefcase, 
  Building, 
  MapPin, 
  FileText, 
  ChevronRight,
  Download,
  Plus,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  MoreHorizontal,
  ChevronDown,
  History,
  TrendingUp,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface for the job application data
interface Interview {
  id: string;
  date: string;
  time: string;
  type: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewers?: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  feedback?: string;
  location?: string;
}

interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  location: string;
  status: string;
  appliedDate: string;
  url?: string;
  notes?: string;
  interviews?: Interview[];
}

interface InterviewItem {
  interview: Interview;
  application: JobApplication;
}

export default function UpcomingInterviewsPage() {
  const { currentUser } = useAuth();
  const [allInterviews, setAllInterviews] = useState<InterviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'upcoming' | 'past'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  const fetchAllInterviews = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsSnapshot = await getDocs(query(applicationsRef));
      
      const interviews: InterviewItem[] = [];
      const now = new Date();
      
      applicationsSnapshot.forEach((doc) => {
        const application = { id: doc.id, ...doc.data() } as JobApplication;
        
        if (application.interviews && application.interviews.length > 0) {
          application.interviews.forEach(interview => {
            // Include all interviews regardless of status
              interviews.push({
                interview,
                application
              });
          });
        }
      });
      
      // Sort interviews by date
      interviews.sort((a, b) => {
        const dateA = new Date(`${a.interview.date}T${a.interview.time || '00:00'}`);
        const dateB = new Date(`${b.interview.date}T${b.interview.time || '00:00'}`);
        return sortOrder === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      });
      
      setAllInterviews(interviews);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews');
      setIsLoading(false);
    }
  };

  // Helper function to check if interview is upcoming or past
  const isInterviewUpcoming = (interview: Interview): boolean => {
    const interviewDate = new Date(`${interview.date}T${interview.time || '00:00'}`);
    const now = new Date();
    return interviewDate >= now && interview.status === 'scheduled';
  };

  // Get upcoming interviews
  const getUpcomingInterviews = (): InterviewItem[] => {
    return allInterviews.filter(item => isInterviewUpcoming(item.interview));
  };

  // Get past interviews
  const getPastInterviews = (): InterviewItem[] => {
    return allInterviews.filter(item => !isInterviewUpcoming(item.interview));
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchAllInterviews();
  }, [currentUser, sortOrder]);

  // Helper function to generate .ics file for calendar integration
  const generateICSFile = (interview: Interview, company: string, position: string) => {
    // Create a timestamp in the format: YYYYMMDDTHHmmssZ
    const formatDate = (dateStr: string, timeStr: string) => {
      const date = new Date(`${dateStr}T${timeStr}`);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const startTime = formatDate(interview.date, interview.time || '09:00');
    
    // Calculate end time (default to 1 hour later)
    const endDate = new Date(`${interview.date}T${interview.time || '09:00'}`);
    endDate.setHours(endDate.getHours() + 1);
    const endTime = formatDate(interview.date, endDate.toTimeString().split(' ')[0].substring(0, 5));
    
    // Create the .ics content
    const icsContent = 
  `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview with ${company}
DTSTART:${startTime}
DTEND:${endTime}
DESCRIPTION:Interview for ${position} position.${interview.notes ? '\\n\\n' + interview.notes : ''}
LOCATION:${interview.location || 'Remote/TBD'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  };

  // Helper function to download the .ics file
  const downloadICS = (interview: Interview, company: string, position: string) => {
    const icsContent = generateICSFile(interview, company, position);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create a download link and trigger it
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `interview-${company}-${interview.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to filter interviews by type and period
  const getFilteredInterviews = (): InterviewItem[] => {
    let interviews: InterviewItem[] = [];
    
    // Filter by period
    if (filterPeriod === 'upcoming') {
      interviews = getUpcomingInterviews();
    } else if (filterPeriod === 'past') {
      interviews = getPastInterviews();
    } else {
      interviews = allInterviews;
    }
    
    // Filter by type
    if (filterType !== 'all') {
      interviews = interviews.filter(item => item.interview.type === filterType);
    }
    
    return interviews;
  };

  // Function to format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to create a sample interview for debugging
  const createSampleInterview = async () => {
    if (!currentUser) {
      toast.error("You must be logged in");
      return;
    }

    try {
      // First, check if we have any job applications
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsSnapshot = await getDocs(query(applicationsRef));
      
      if (applicationsSnapshot.empty) {
        // If no applications exist, create one
        const newApp = {
          companyName: 'Sample Company',
          position: 'Sample Position',
          location: 'Remote',
          status: 'interview',
          appliedDate: new Date().toISOString().split('T')[0],
          notes: 'This is a sample application for testing',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          interviews: []
        };
        
        const docRef = await addDoc(applicationsRef, newApp);
        
        // Add a sample interview to the new application
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', docRef.id);
        
        // Create a date for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Create a sample interview
        const sampleInterview = {
          id: crypto.randomUUID(),
          date: tomorrow.toISOString().split('T')[0],
          time: '10:00',
          type: 'technical',
          status: 'scheduled',
          location: 'Zoom Meeting',
          notes: 'Prepare for technical questions about React and TypeScript'
        };
        
        await updateDoc(applicationRef, {
          interviews: [sampleInterview],
          updatedAt: serverTimestamp()
        });
        
        toast.success('Created sample job application with an upcoming interview');
      } else {
        // Use the first application to add a sample interview
        const application = applicationsSnapshot.docs[0];
        const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', application.id);
        const applicationData = application.data();
        
        // Create a date for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Create a sample interview
        const sampleInterview = {
          id: crypto.randomUUID(),
          date: tomorrow.toISOString().split('T')[0],
          time: '10:00',
          type: 'technical',
          status: 'scheduled',
          location: 'Zoom Meeting',
          notes: 'Prepare for technical questions about React and TypeScript'
        };
        
        // Update the application with the new interview
        await updateDoc(applicationRef, {
          interviews: [...(applicationData.interviews || []), sampleInterview],
          updatedAt: serverTimestamp()
        });
        
        toast.success('Added sample upcoming interview to existing application');
      }
      
      // Refresh the data
      fetchAllInterviews();
      
    } catch (error) {
      console.error('Error creating sample interview:', error);
      toast.error('Failed to create sample interview');
    }
  };

  // Add a function to update interview status
  const updateInterviewStatus = async (applicationId: string, interviewId: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    if (!currentUser) return;
    
    try {
      // Get the application reference
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      
      // Find the interview in our local state
      const interviewToUpdate = allInterviews.find(
        item => item.application.id === applicationId && item.interview.id === interviewId
      );
      
      if (!interviewToUpdate) {
        toast.error('Interview not found');
        return;
      }
      
      // Create updated interviews array
      const updatedInterviews = interviewToUpdate.application.interviews?.map(interview => {
        if (interview.id === interviewId) {
          return { ...interview, status: newStatus };
        }
        return interview;
      });
      
      // Update in Firestore
      await updateDoc(applicationRef, {
        interviews: updatedInterviews,
        updatedAt: serverTimestamp()
      });
      
      // Optimistic UI update
      setAllInterviews(prev => 
        prev.map(item => {
          if (item.application.id === applicationId && item.interview.id === interviewId) {
            return {
              ...item,
              interview: {
                ...item.interview,
                status: newStatus
              }
            };
          }
          return item;
        })
      );
      
      // Close status menu
      setStatusMenuOpen(null);
      
      // Show success message
      toast.success(`Interview status updated to ${newStatus}`);
      
      // Refetch to make sure the list is correct
      fetchAllInterviews();
      
    } catch (error) {
      console.error('Error updating interview status:', error);
      toast.error('Failed to update interview status');
    }
  };

  // Interview Card Component
  function InterviewCard({ item, index, isPast }: { item: InterviewItem; index: number; isPast: boolean }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border overflow-hidden hover:shadow-lg transition-all
          ${isPast 
            ? 'border-gray-200 dark:border-gray-700 opacity-75' 
            : 'border-gray-100 dark:border-gray-700'}`}
      >
        <div className="relative">
          <div className={`absolute inset-0 h-1.5 
            ${item.interview.type === 'hr' ? 'bg-pink-500' :
              item.interview.type === 'technical' ? 'bg-teal-500' :
              item.interview.type === 'manager' ? 'bg-amber-500' :
              item.interview.type === 'final' ? 'bg-green-500' :
              'bg-indigo-500'}`}
          />
          
          <div className="p-6 pt-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
              <div 
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md
                  ${item.interview.type === 'hr' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                    item.interview.type === 'technical' ? 'bg-gradient-to-br from-teal-400 to-teal-600' :
                    item.interview.type === 'manager' ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                    item.interview.type === 'final' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    'bg-gradient-to-br from-indigo-400 to-indigo-600'}`}
              >
                {item.interview.type === 'hr' && <Briefcase className="w-7 h-7" />}
                {item.interview.type === 'technical' && <FileText className="w-7 h-7" />}
                {item.interview.type === 'manager' && <Building className="w-7 h-7" />}
                {item.interview.type === 'final' && <Calendar className="w-7 h-7" />}
                {(item.interview.type !== 'hr' && 
                  item.interview.type !== 'technical' && 
                  item.interview.type !== 'manager' && 
                  item.interview.type !== 'final') && <Calendar className="w-7 h-7" />}
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isPast && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          <History className="w-3 h-3 mr-1" />
                          Past
                        </span>
                      )}
                      {!isPast && item.interview.status === 'scheduled' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Upcoming
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {item.application.companyName}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                      {item.application.position}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize shadow-sm
                      ${item.interview.type === 'hr' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' :
                        item.interview.type === 'technical' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                        item.interview.type === 'manager' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                        item.interview.type === 'final' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}
                    >
                      {item.interview.type} Interview
                    </span>
                    
                    {/* Status dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusMenuOpen(statusMenuOpen === `${item.application.id}-${item.interview.id}` 
                          ? null 
                          : `${item.application.id}-${item.interview.id}`)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-sm
                          ${item.interview.status === 'scheduled' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                            : item.interview.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
                      >
                        {item.interview.status === 'scheduled' && <ClockIcon className="w-3 h-3" />}
                        {item.interview.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {item.interview.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{item.interview.status}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      
                      {/* Dropdown menu */}
                      <AnimatePresence>
                        {statusMenuOpen === `${item.application.id}-${item.interview.id}` && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 mt-2 z-10 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 overflow-hidden"
                          >
                            <button
                              onClick={() => updateInterviewStatus(item.application.id, item.interview.id, 'scheduled')}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-xs ${
                                item.interview.status === 'scheduled' 
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                              }`}
                            >
                              <ClockIcon className="w-3.5 h-3.5" />
                              Scheduled
                            </button>
                            <button
                              onClick={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-xs ${
                                item.interview.status === 'completed' 
                                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Completed
                            </button>
                            <button
                              onClick={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                              className={`flex w-full items-center gap-2 px-4 py-2 text-xs ${
                                item.interview.status === 'cancelled' 
                                  ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancelled
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-700/30 p-3 shadow-sm">
                    <Calendar className="w-5 h-5 mr-3 text-indigo-500 dark:text-indigo-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(item.interview.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-700/30 p-3 shadow-sm">
                    <Clock className="w-5 h-5 mr-3 text-indigo-500 dark:text-indigo-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.interview.time || 'Time not specified'}
                      </p>
                    </div>
                  </div>
                  {item.interview.location && (
                    <div className="flex items-center rounded-lg bg-gray-50 dark:bg-gray-700/30 p-3 shadow-sm">
                      <MapPin className="w-5 h-5 mr-3 text-indigo-500 dark:text-indigo-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.interview.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {item.interview.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
                  Notes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                  {item.interview.notes}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
              {!isPast && (
                <button
                  onClick={() => downloadICS(item.interview, item.application.companyName, item.application.position)}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 py-2.5 
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Add to Calendar
                </button>
              )}
              
              <Link
                to={`/interview-prep/${item.application.id}/${item.interview.id}`}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg
                  ${isPast 
                    ? 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600' 
                    : 'text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'}`}
              >
                <FileText className="w-4 h-4" />
                {isPast ? 'View Details' : 'Prepare for Interview'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AuthLayout>
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex flex-col gap-6 mb-8">
            {/* Title Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-white">
                  All Interviews
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Track and manage all your job interviews in one place
              </p>
            </div>

              {/* Stats Cards */}
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 
                  border border-violet-200 dark:border-violet-800 rounded-xl px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Upcoming</p>
                      <p className="text-lg font-semibold text-violet-700 dark:text-violet-300">
                        {getUpcomingInterviews().length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 
                  border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Past</p>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {getPastInterviews().length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Period Filter */}
              <div className="inline-flex rounded-lg shadow-md bg-white/90 dark:bg-gray-800/90 p-1 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFilterPeriod('all')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2
                    ${filterPeriod === 'all' 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  All
                </button>
                <button
                  onClick={() => setFilterPeriod('upcoming')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2
                    ${filterPeriod === 'upcoming' 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Upcoming
                </button>
                <button
                  onClick={() => setFilterPeriod('past')}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2
                    ${filterPeriod === 'past' 
                      ? 'bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  <History className="w-3.5 h-3.5" />
                  Past
                </button>
              </div>

              {/* Type Filter */}
              <div className="inline-flex rounded-lg shadow-md bg-white/90 dark:bg-gray-800/90 p-1 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all
                    ${filterType === 'all' 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setFilterType('hr')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all
                    ${filterType === 'hr' 
                      ? 'bg-pink-500 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  HR
                </button>
                <button
                  onClick={() => setFilterType('technical')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all
                    ${filterType === 'technical' 
                      ? 'bg-teal-500 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  Technical
                </button>
                <button
                  onClick={() => setFilterType('manager')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all
                    ${filterType === 'manager' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  Manager
                </button>
                <button
                  onClick={() => setFilterType('final')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-all
                    ${filterType === 'final' 
                      ? 'bg-green-500 text-white shadow-sm' 
                      : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'}`}
                >
                  Final
                </button>
              </div>

              {/* Sort Button */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 text-xs font-medium rounded-lg border border-gray-200 bg-white/90 
                  text-gray-700 hover:bg-gray-50 dark:bg-gray-800/90 dark:border-gray-700 
                  dark:text-gray-300 dark:hover:bg-gray-700/50 shadow-md backdrop-blur-sm transition-all"
                aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
              >
                <Calendar className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-blue-50 border border-purple-200 rounded-xl p-5 
            dark:from-purple-900/20 dark:to-blue-900/20 dark:border-purple-800 shadow-sm">
            <div className="flex items-start md:items-center gap-4">
              <div className="bg-white/90 p-2 rounded-full shadow-sm dark:bg-gray-800/90">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-1">Pro Tip</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Click on "Prepare for Interview" to access our AI-powered interview preparation tool. 
                  It will analyze the job posting and generate personalized questions and answers to help you succeed.
                </p>
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="relative">
                  <div className="absolute inset-0 h-1.5 bg-gray-200 dark:bg-gray-700" />
                  
                  <div className="p-6 pt-8">
                    <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl shadow-sm"></div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                          <div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-28"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
                          </div>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : getFilteredInterviews().length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-28 h-28 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 
              rounded-full flex items-center justify-center mb-8 shadow-md">
              <Calendar className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-4">
              No interviews found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-10">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? `No interviews match your current filters. Try adjusting your filters to see more results.` 
                : "Track all your interviews in one place and get prepared with AI-powered interview tools."}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5 max-w-md mx-auto">
              <Link
                to="/applications"
                className="inline-flex items-center justify-center px-5 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                  border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 hover:shadow-md dark:hover:bg-gray-700/70 transition-all"
              >
                <Briefcase className="w-5 h-5 mr-2 text-indigo-500" />
                <span className="font-medium">Track Applications</span>
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700
                  text-white rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-medium">Schedule Interview</span>
              </Link>
            </div>
            
            {/* Features section with cards */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
                Get Ready for Success with JobZAI
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800/90 
                    border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-5 text-left shadow-sm group hover:shadow-md transition-all"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 w-12 h-12 rounded-lg flex items-center justify-center 
                    text-indigo-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Mock Interviews
                  </h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    Practice with AI-generated questions specific to your industry and role.
                  </p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800/90 
                    border border-purple-100 dark:border-purple-800/30 rounded-xl p-5 text-left shadow-sm group hover:shadow-md transition-all"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 w-12 h-12 rounded-lg flex items-center justify-center 
                    text-purple-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                    Answer Coaching
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    Get personalized feedback on your interview answers to improve your responses.
                  </p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800/90 
                    border border-amber-100 dark:border-amber-800/30 rounded-xl p-5 text-left shadow-sm group hover:shadow-md transition-all"
                >
                  <div className="bg-white/80 dark:bg-gray-800/80 w-12 h-12 rounded-lg flex items-center justify-center 
                    text-amber-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <Building className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                    Company Research
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Analyze job listings to understand key requirements and prepare tailored responses.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Show separated sections when viewing all interviews */}
            {filterPeriod === 'all' && getUpcomingInterviews().length > 0 && getPastInterviews().length > 0 ? (
              <>
                {/* Upcoming Interviews Section */}
                          <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700"></div>
                          <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Upcoming Interviews
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        {getUpcomingInterviews().filter(item => filterType === 'all' || item.interview.type === filterType).length}
                            </span>
                            </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700"></div>
                  </div>
                  <div className="space-y-6">
                    {getUpcomingInterviews()
                      .filter(item => filterType === 'all' || item.interview.type === filterType)
                      .map((item, index) => (
                        <InterviewCard key={`${item.application.id}-${item.interview.id}`} item={item} index={index} isPast={false} />
                      ))}
                          </div>
                        </div>

                {/* Past Interviews Section */}
                            <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"></div>
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Past Interviews
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {getPastInterviews().filter(item => filterType === 'all' || item.interview.type === filterType).length}
                      </span>
                            </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"></div>
                          </div>
                  <div className="space-y-6">
                    {getPastInterviews()
                      .filter(item => filterType === 'all' || item.interview.type === filterType)
                      .map((item, index) => (
                        <InterviewCard key={`${item.application.id}-${item.interview.id}`} item={item} index={index} isPast={true} />
                      ))}
                            </div>
                          </div>
              </>
            ) : (
              /* Single list when filtered */
              <div className="space-y-6">
                {getFilteredInterviews().map((item, index) => (
                  <InterviewCard 
                    key={`${item.application.id}-${item.interview.id}`} 
                    item={item} 
                    index={index} 
                    isPast={!isInterviewUpcoming(item.interview)} 
                  />
                ))}
                            </div>
                          )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 