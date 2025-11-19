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
  History,
  TrendingUp,
  Filter
} from 'lucide-react';
import InterviewCard from '../components/interview/InterviewCard';
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
      
      // Show success message
      toast.success(`Interview status updated to ${newStatus}`);
      
      // Refetch to make sure the list is correct
      fetchAllInterviews();
      
    } catch (error) {
      console.error('Error updating interview status:', error);
      toast.error('Failed to update interview status');
    }
  };

  // Delete interview
  const deleteInterview = async (applicationId: string, interviewId: string) => {
    if (!currentUser) return;
    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      const target = allInterviews.find(item => item.application.id === applicationId);
      if (!target) {
        toast.error('Application not found');
        return;
      }
      const updated = (target.application.interviews || []).filter(i => i.id !== interviewId);
      await updateDoc(applicationRef, {
        interviews: updated,
        updatedAt: serverTimestamp()
      });
      setAllInterviews(prev => prev.filter(i => !(i.application.id === applicationId && i.interview.id === interviewId)));
      toast.success('Interview deleted');
    } catch (err) {
      console.error('Error deleting interview:', err);
      toast.error('Failed to delete interview');
    }
  };

  return (
    <AuthLayout>
      <div className="h-full px-4 py-3">
        {/* Compact Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4">
          <div className="flex items-center justify-between mb-3">
            {/* Title left */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Interviews</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Track and manage all your job interviews
              </p>
            </div>
          </div>

          {/* Stats inline horizontal */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 mb-4">
            {[
              { label: 'Total', count: allInterviews.length, color: 'gray', icon: Calendar },
              { label: 'Upcoming', count: getUpcomingInterviews().length, color: 'violet', icon: TrendingUp },
              { label: 'Past', count: getPastInterviews().length, color: 'gray', icon: History }
            ].map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  stat.color === 'violet' 
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <stat.icon className={`w-4 h-4 ${
                  stat.color === 'violet' 
                    ? 'text-violet-600 dark:text-violet-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
                <div className={`text-lg font-bold ${
                  stat.color === 'violet' 
                    ? 'text-violet-600 dark:text-violet-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {stat.count}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Filters - clean horizontal pill layout */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Period Filter */}
              <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 p-0.5 text-xs dark:border-gray-800 dark:bg-gray-900/60">
                <button
                  onClick={() => setFilterPeriod('all')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterPeriod === 'all'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-50 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterPeriod('upcoming')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterPeriod === 'upcoming'
                      ? 'bg-white text-violet-700 shadow-sm dark:bg-gray-50 dark:text-violet-700'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilterPeriod('past')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterPeriod === 'past'
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-50 dark:text-blue-500'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  Past
                </button>
              </div>

              {/* Type Filter */}
              <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 p-0.5 text-xs dark:border-gray-800 dark:bg-gray-900/60">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'all'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-50 dark:text-gray-900'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  All types
                </button>
                <button
                  onClick={() => setFilterType('hr')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'hr'
                      ? 'bg-white text-pink-600 shadow-sm dark:bg-gray-50 dark:text-pink-600'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  HR
                </button>
                <button
                  onClick={() => setFilterType('technical')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'technical'
                      ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-50 dark:text-teal-600'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  Technical
                </button>
                <button
                  onClick={() => setFilterType('manager')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'manager'
                      ? 'bg-white text-amber-600 shadow-sm dark:bg-gray-50 dark:text-amber-600'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  Manager
                </button>
                <button
                  onClick={() => setFilterType('final')}
                  className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'final'
                      ? 'bg-white text-green-600 shadow-sm dark:bg-gray-50 dark:text-green-600'
                      : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-gray-800/80'}`}
                >
                  Final
                </button>
              </div>
            </div>

            {/* Sort Button */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center justify-center self-start rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900/70 dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              <Calendar className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
              <span className="ml-2 hidden sm:inline">
                Sort by date
              </span>
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : getFilteredInterviews().length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? 'No interviews match your filters'
                : 'No interviews yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Track all your interviews in one place and get prepared with AI-powered interview tools.'}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
              <Link
                to="/applications"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                  border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Track Applications</span>
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 
                  text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Schedule Interview</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Show separated sections when viewing all interviews */}
            {filterPeriod === 'all' && getUpcomingInterviews().length > 0 && getPastInterviews().length > 0 ? (
              <>
                {/* Upcoming Interviews Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-transparent dark:via-violet-800"></div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Upcoming Interviews
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        {getUpcomingInterviews().filter(item => filterType === 'all' || item.interview.type === filterType).length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-200 to-transparent dark:via-violet-800"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getUpcomingInterviews()
                      .filter(item => filterType === 'all' || item.interview.type === filterType)
                      .map((item, index) => (
                        <motion.div
                          key={`${item.application.id}-${item.interview.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * index }}
                          className="h-full">
                          <InterviewCard
                            application={item.application}
                            interview={item.interview}
                            isPast={false}
                            linkToPrepare={`/interview-prep/${item.application.id}/${item.interview.id}`}
                            onEdit={() => toast.info('Edit interview not implemented yet')}
                            onDelete={() => deleteInterview(item.application.id, item.interview.id)}
                            onMarkCompleted={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                            onMarkCancelled={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                          />
                        </motion.div>
                      ))}
                  </div>
                </motion.div>

                {/* Past Interviews Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Past Interviews
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {getPastInterviews().filter(item => filterType === 'all' || item.interview.type === filterType).length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPastInterviews()
                      .filter(item => filterType === 'all' || item.interview.type === filterType)
                      .map((item, index) => (
                        <motion.div
                          key={`${item.application.id}-${item.interview.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * index }}
                          className="h-full">
                          <InterviewCard
                            application={item.application}
                            interview={item.interview}
                            isPast={true}
                            linkToPrepare={`/interview-prep/${item.application.id}/${item.interview.id}`}
                            onEdit={() => toast.info('Edit interview not implemented yet')}
                            onDelete={() => deleteInterview(item.application.id, item.interview.id)}
                            onMarkCompleted={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                            onMarkCancelled={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                          />
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              </>
            ) : (
              /* Single list when filtered */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredInterviews().map((item, index) => {
                  const isPast = !isInterviewUpcoming(item.interview);
                  return (
                    <motion.div
                      key={`${item.application.id}-${item.interview.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * index }}
                      className="h-full">
                      <InterviewCard 
                        application={item.application}
                        interview={item.interview}
                        isPast={isPast}
                        linkToPrepare={`/interview-prep/${item.application.id}/${item.interview.id}`}
                        onEdit={() => toast.info('Edit interview not implemented yet')}
                        onDelete={() => deleteInterview(item.application.id, item.interview.id)}
                        onMarkCompleted={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                        onMarkCancelled={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 