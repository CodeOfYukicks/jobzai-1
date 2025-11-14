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
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? 'No interviews match your filters'
                : 'No interviews yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              {filterType !== 'all' || filterPeriod !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Track all your interviews in one place and get prepared with AI-powered interview tools.'}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
              <Link
                to="/applications"
                className="inline-flex items-center justify-center px-5 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                  border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Track Applications</span>
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 
                  text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Schedule Interview</span>
              </Link>
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
                        <InterviewCard
                          key={`${item.application.id}-${item.interview.id}`}
                          application={item.application}
                          interview={item.interview}
                          isPast={false}
                          linkToPrepare={`/interview-prep/${item.application.id}/${item.interview.id}`}
                          onEdit={() => toast.info('Edit interview not implemented yet')}
                          onDelete={() => deleteInterview(item.application.id, item.interview.id)}
                          onMarkCompleted={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                          onMarkCancelled={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                        />
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
                        <InterviewCard
                          key={`${item.application.id}-${item.interview.id}`}
                          application={item.application}
                          interview={item.interview}
                          isPast={true}
                          linkToPrepare={`/interview-prep/${item.application.id}/${item.interview.id}`}
                          onEdit={() => toast.info('Edit interview not implemented yet')}
                          onDelete={() => deleteInterview(item.application.id, item.interview.id)}
                          onMarkCompleted={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                          onMarkCancelled={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                        />
                      ))}
                            </div>
                          </div>
              </>
            ) : (
              /* Single list when filtered */
              <div className="space-y-6">
                {getFilteredInterviews().map((item, index) => {
                  const isPast = !isInterviewUpcoming(item.interview);
                  return (
                  <InterviewCard 
                    key={`${item.application.id}-${item.interview.id}`} 
                      application={item.application}
                      interview={item.interview}
                      isPast={isPast}
                      linkToPrepare={`/interview-prep/${item.application.id}/${item.interview.id}`}
                      onEdit={() => toast.info('Edit interview not implemented yet')}
                      onDelete={() => deleteInterview(item.application.id, item.interview.id)}
                      onMarkCompleted={() => updateInterviewStatus(item.application.id, item.interview.id, 'completed')}
                      onMarkCancelled={() => updateInterviewStatus(item.application.id, item.interview.id, 'cancelled')}
                    />
                  );
                })}
                            </div>
                          )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 