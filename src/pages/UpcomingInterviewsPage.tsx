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
  ChevronDown
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

interface UpcomingInterview {
  interview: Interview;
  application: JobApplication;
}

export default function UpcomingInterviewsPage() {
  const { currentUser } = useAuth();
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  const fetchUpcomingInterviews = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const applicationsRef = collection(db, 'users', currentUser.uid, 'jobApplications');
      const applicationsSnapshot = await getDocs(query(applicationsRef));
      
      const interviews: UpcomingInterview[] = [];
      
      applicationsSnapshot.forEach((doc) => {
        const application = { id: doc.id, ...doc.data() } as JobApplication;
        
        if (application.interviews && application.interviews.length > 0) {
          application.interviews.forEach(interview => {
            // Only include scheduled interviews, regardless of date
            if (interview.status === 'scheduled') {
              interviews.push({
                interview,
                application
              });
            }
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
      
      setUpcomingInterviews(interviews);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching upcoming interviews:', error);
      toast.error('Failed to load upcoming interviews');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchUpcomingInterviews();
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

  // Function to filter interviews by type
  const getFilteredInterviews = () => {
    if (filterType === 'all') {
      return upcomingInterviews;
    }
    return upcomingInterviews.filter(item => item.interview.type === filterType);
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
      fetchUpcomingInterviews();
      
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
      const interviewToUpdate = upcomingInterviews.find(
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
      setUpcomingInterviews(prev => 
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
      
      // If we're filtering, refetch to make sure the list is correct
      if (filterType !== 'all' || newStatus !== 'scheduled') {
        fetchUpcomingInterviews();
      }
      
    } catch (error) {
      console.error('Error updating interview status:', error);
      toast.error('Failed to update interview status');
    }
  };

  return (
    <AuthLayout>
      <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Upcoming Interviews
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Prepare for your upcoming job interviews
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-l-md border 
                    ${filterType === 'all' 
                      ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300' 
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('hr')}
                  className={`px-3 py-1.5 text-xs font-medium border-t border-b 
                    ${filterType === 'hr' 
                      ? 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-700 dark:text-pink-300' 
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                >
                  HR
                </button>
                <button
                  onClick={() => setFilterType('technical')}
                  className={`px-3 py-1.5 text-xs font-medium border-t border-b 
                    ${filterType === 'technical' 
                      ? 'bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-300' 
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                >
                  Technical
                </button>
                <button
                  onClick={() => setFilterType('manager')}
                  className={`px-3 py-1.5 text-xs font-medium border-t border-b 
                    ${filterType === 'manager' 
                      ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300' 
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                >
                  Manager
                </button>
                <button
                  onClick={() => setFilterType('final')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-r-md border 
                    ${filterType === 'final' 
                      ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' 
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}
                >
                  Final
                </button>
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white 
                  text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 
                  dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Pro Tip:</strong> Click on "Prepare for Interview" to access our AI-powered interview preparation tool. 
              It will analyze the job posting and generate personalized questions and answers to help you succeed.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : getFilteredInterviews().length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto w-24 h-24 text-gray-200 dark:text-gray-700 mb-6">
              <Calendar className="w-full h-full" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
              No upcoming interviews
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              {filterType !== 'all' 
                ? `You don't have any upcoming ${filterType} interviews scheduled.` 
                : "Track all your upcoming interviews in one place and get prepared with AI-powered interview tools."}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
              <Link
                to="/applications"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span>Track Applications</span>
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span>Schedule Interview</span>
              </Link>
            </div>
            
            {/* Section d'aide contextuelle avec icônes et tiles */}
            <div className="mt-12 max-w-3xl mx-auto">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                Get Ready for Success
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-left">
                  <FileText className="w-8 h-8 text-blue-500 mb-2" />
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Mock Interviews
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Practice with AI-generated questions specific to your industry and role.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-4 text-left">
                  <MessageSquare className="w-8 h-8 text-purple-500 mb-2" />
                  <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Answer Coaching
                  </h4>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Get personalized feedback on your interview answers to improve your responses.
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4 text-left">
                  <Building className="w-8 h-8 text-amber-500 mb-2" />
                  <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                    Company Research
                  </h4>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Analyze job listings to understand key requirements and prepare tailored responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {getFilteredInterviews().map((item, index) => (
              <motion.div
                key={`${item.application.id}-${item.interview.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0
                        ${item.interview.type === 'hr' ? 'bg-pink-500' :
                          item.interview.type === 'technical' ? 'bg-teal-500' :
                          item.interview.type === 'manager' ? 'bg-amber-500' :
                          item.interview.type === 'final' ? 'bg-green-500' :
                          'bg-indigo-500'}`}
                    >
                      {item.interview.type === 'hr' && <Briefcase className="w-6 h-6" />}
                      {item.interview.type === 'technical' && <FileText className="w-6 h-6" />}
                      {item.interview.type === 'manager' && <Building className="w-6 h-6" />}
                      {item.interview.type === 'final' && <Calendar className="w-6 h-6" />}
                      {(item.interview.type !== 'hr' && 
                        item.interview.type !== 'technical' && 
                        item.interview.type !== 'manager' && 
                        item.interview.type !== 'final') && <Calendar className="w-6 h-6" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {item.application.companyName}
                        </h2>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            {item.interview.type} Interview
                          </span>
                          
                          {/* Status dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setStatusMenuOpen(statusMenuOpen === `${item.application.id}-${item.interview.id}` 
                                ? null 
                                : `${item.application.id}-${item.interview.id}`)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
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
                                  className="absolute right-0 mt-1 z-10 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                                >
                                  <button
                                    onClick={() => updateInterviewStatus(item.application.id, item.interview.id, 'scheduled')}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${
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
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${
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
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${
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

                      <p className="text-gray-600 dark:text-gray-300 mb-3">
                        {item.application.position}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(item.interview.date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {item.interview.time || 'Time not specified'}
                        </div>
                        {item.interview.location && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {item.interview.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.interview.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.interview.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => downloadICS(item.interview, item.application.companyName, item.application.position)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 py-2 
                        hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                    >
                      <Download className="w-4 h-4" />
                      Add to Calendar
                    </button>
                    
                    <Link
                      to={`/interview-prep/${item.application.id}/${item.interview.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm text-white py-2 
                        bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 
                        rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Prepare for Interview
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 