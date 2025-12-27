import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, getDocs, addDoc, updateDoc, doc, where, Timestamp, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
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
  Filter,
  Image as ImageIcon,
  Camera,
  Loader2,
  X,
  ArrowUpDown
} from 'lucide-react';
import InterviewCard from '../components/interview/InterviewCard';
import { motion, AnimatePresence } from 'framer-motion';
import CoverPhotoCropper from '../components/profile/CoverPhotoCropper';
import CoverPhotoGallery from '../components/profile/CoverPhotoGallery';
import MobileTopBar from '../components/mobile/MobileTopBar';

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

  // Cover photo states
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [isCoverCropperOpen, setIsCoverCropperOpen] = useState(false);
  const [isCoverGalleryOpen, setIsCoverGalleryOpen] = useState(false);
  const [selectedCoverFile, setSelectedCoverFile] = useState<Blob | File | null>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [isCoverDark, setIsCoverDark] = useState<boolean | null>(null); // null = pas encore détecté, true = sombre, false = claire
  const coverFileInputRef = useRef<HTMLInputElement>(null);

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
      notify.error('Failed to load interviews');
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

  // Load page preferences (cover photo) and detect brightness
  useEffect(() => {
    if (!currentUser) return;

    const loadPagePreferences = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const pagePreferences = userData.pagePreferences || {};
          const upcomingInterviewsPrefs = pagePreferences.upcomingInterviews || {};
          if (upcomingInterviewsPrefs.coverPhoto) {
            setCoverPhoto(upcomingInterviewsPrefs.coverPhoto);
            // Detect brightness
            const isDark = await detectCoverBrightness(upcomingInterviewsPrefs.coverPhoto);
            setIsCoverDark(isDark);
          } else {
            setIsCoverDark(null);
          }
        }
      } catch (error) {
        console.error('Error loading page preferences:', error);
      }
    };

    loadPagePreferences();
  }, [currentUser]);

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
      notify.error("You must be logged in");
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

        notify.success('Created sample job application with an upcoming interview');
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

        notify.success('Added sample upcoming interview to existing application');
      }

      // Refresh the data
      fetchAllInterviews();

    } catch (error) {
      console.error('Error creating sample interview:', error);
      notify.error('Failed to create sample interview');
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
        notify.error('Interview not found');
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
      notify.success(`Interview status updated to ${newStatus}`);

      // Refetch to make sure the list is correct
      fetchAllInterviews();

    } catch (error) {
      console.error('Error updating interview status:', error);
      notify.error('Failed to update interview status');
    }
  };

  // Delete interview
  const deleteInterview = async (applicationId: string, interviewId: string) => {
    if (!currentUser) return;
    try {
      const applicationRef = doc(db, 'users', currentUser.uid, 'jobApplications', applicationId);
      const target = allInterviews.find(item => item.application.id === applicationId);
      if (!target) {
        notify.error('Application not found');
        return;
      }
      const updated = (target.application.interviews || []).filter(i => i.id !== interviewId);
      await updateDoc(applicationRef, {
        interviews: updated,
        updatedAt: serverTimestamp()
      });
      setAllInterviews(prev => prev.filter(i => !(i.application.id === applicationId && i.interview.id === interviewId)));
      notify.success('Interview deleted');
    } catch (err) {
      console.error('Error deleting interview:', err);
      notify.error('Failed to delete interview');
    }
  };

  // Handle file select for cover
  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCoverFile(file);
      setIsCoverCropperOpen(true);
    }
    // Reset input
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = '';
    }
  };

  // Handle cropped cover
  const handleCroppedCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
    setIsCoverCropperOpen(false);
    setSelectedCoverFile(null);
  };

  // Handle direct cover apply from gallery (no cropper)
  const handleDirectApplyCover = async (blob: Blob) => {
    await handleUpdateCover(blob);
  };

  // Function to detect if cover image is dark or light
  const detectCoverBrightness = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(true); // Default to dark if canvas fails
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Sample pixels from the image (sample every 10th pixel for performance)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let totalBrightness = 0;
          let sampleCount = 0;

          for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel (RGBA = 4 bytes)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Calculate luminance using relative luminance formula
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += luminance;
            sampleCount++;
          }

          const averageBrightness = totalBrightness / sampleCount;
          // If average brightness is less than 0.5, consider it dark
          resolve(averageBrightness < 0.5);
        } catch (error) {
          console.error('Error detecting cover brightness:', error);
          resolve(true); // Default to dark on error
        }
      };

      img.onerror = () => {
        resolve(true); // Default to dark on error
      };

      img.src = imageUrl;
    });
  };

  // Handle cover photo update
  const handleUpdateCover = async (blob: Blob) => {
    if (!currentUser) return;

    setIsUpdatingCover(true);
    try {
      const timestamp = Date.now();
      const fileName = `upcoming_interviews_cover_${timestamp}.jpg`;
      const coverRef = ref(storage, `cover-photos/${currentUser.uid}/${fileName}`);

      await uploadBytes(coverRef, blob, { contentType: 'image/jpeg' });
      const coverUrl = await getDownloadURL(coverRef);

      // Delete old cover if exists - extract path from URL
      if (coverPhoto) {
        try {
          // Extract the path from the full URL
          const urlParts = coverPhoto.split('/o/');
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(pathPart);
            const oldCoverRef = ref(storage, decodedPath);
            await deleteObject(oldCoverRef);
          }
        } catch (e) {
          console.warn('Could not delete old cover photo from storage', e);
        }
      }

      // Save to Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentUpcomingInterviewsPrefs = currentPagePreferences.upcomingInterviews || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          upcomingInterviews: {
            ...currentUpcomingInterviewsPrefs,
            coverPhoto: coverUrl
          }
        }
      });

      setCoverPhoto(coverUrl);

      // Detect brightness of new cover
      const isDark = await detectCoverBrightness(coverUrl);
      setIsCoverDark(isDark);

      notify.success('Cover updated');
    } catch (error) {
      console.error('Error updating cover:', error);
      notify.error('Failed to update cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  // Handle cover photo removal
  const handleRemoveCover = async () => {
    if (!currentUser || !coverPhoto) return;

    setIsUpdatingCover(true);
    try {
      // Delete from storage - extract path from URL
      try {
        // Extract the path from the full URL
        const urlParts = coverPhoto.split('/o/');
        if (urlParts.length > 1) {
          const pathPart = urlParts[1].split('?')[0];
          const decodedPath = decodeURIComponent(pathPart);
          const coverRef = ref(storage, decodedPath);
          await deleteObject(coverRef);
        }
      } catch (e) {
        console.warn('Could not delete cover photo from storage', e);
      }

      // Remove from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      const currentPagePreferences = currentData.pagePreferences || {};
      const currentUpcomingInterviewsPrefs = currentPagePreferences.upcomingInterviews || {};

      await updateDoc(userRef, {
        pagePreferences: {
          ...currentPagePreferences,
          upcomingInterviews: {
            ...currentUpcomingInterviewsPrefs,
            coverPhoto: null
          }
        }
      });

      setCoverPhoto(null);
      setIsCoverDark(null);
      notify.success('Cover removed');
    } catch (error) {
      console.error('Error removing cover:', error);
      notify.error('Failed to remove cover');
    } finally {
      setIsUpdatingCover(false);
    }
  };

  return (
    <AuthLayout>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Mobile Top Bar */}
        <MobileTopBar
          title="Interviews"
          subtitle={`${getUpcomingInterviews().length} upcoming`}
        />

        {/* Cover Photo Section with all header elements (Desktop only) */}
        <div
          className="relative group/cover flex-shrink-0 hidden md:block"
          onMouseEnter={() => setIsHoveringCover(true)}
          onMouseLeave={() => setIsHoveringCover(false)}
        >
          {/* Cover Photo Area - Height adjusted to contain all header elements */}
          <div className={`relative w-full transition-all duration-300 ease-in-out ${coverPhoto ? 'h-auto min-h-[160px] sm:min-h-[180px]' : 'h-auto min-h-[120px] sm:min-h-[140px]'}`}>
            {/* Cover Background */}
            {coverPhoto ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  key={coverPhoto}
                  src={coverPhoto}
                  alt="Interviews cover"
                  className="w-full h-full object-cover animate-in fade-in duration-500"
                />
                <div className="absolute inset-0 bg-black/15 dark:bg-black/50 transition-colors duration-300" />
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-purple-900/20 border-b border-white/20 dark:border-[#3d3c3e]/20">
                <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
                  style={{ backgroundImage: 'radial-gradient(#8B5CF6 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />
                {/* Subtle animated gradient orbs */}
                <div className="absolute top-10 right-20 w-64 h-64 bg-purple-200/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-10 left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
              </div>
            )}

            {/* Cover Controls - Visible on hover - Centered */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
              <AnimatePresence>
                {(isHoveringCover || !coverPhoto) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 pointer-events-auto"
                  >
                    {!coverPhoto ? (
                      <button
                        onClick={() => setIsCoverGalleryOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 
                          bg-white/80 dark:bg-[#2b2a2c]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#3d3c3e]
                          border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-sm transition-all duration-200
                          hover:shadow-md group"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                        <span>Add cover</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 p-1 bg-white/90 dark:bg-[#242325]/90 backdrop-blur-md rounded-lg border border-black/5 dark:border-white/10 shadow-lg">
                        <button
                          onClick={() => setIsCoverGalleryOpen(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Change cover
                        </button>

                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />

                        <button
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={isUpdatingCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 
                            hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-md transition-colors"
                        >
                          {isUpdatingCover ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                          Upload
                        </button>

                        <div className="w-px h-3 bg-gray-200 dark:bg-[#3d3c3e] mx-0.5" />

                        <button
                          onClick={handleRemoveCover}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 
                            hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                          title="Remove cover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Header Content - Positioned directly on cover (Desktop Only) */}
            <div className="hidden md:flex relative z-10 px-4 sm:px-6 pt-4 pb-4 flex-col gap-3">


              {/* Title Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="hidden md:flex items-center justify-between mb-2"
              >
                {/* Title left */}
                <div>
                  <h1 className={`text-2xl font-bold ${coverPhoto
                    ? 'text-white drop-shadow-2xl'
                    : 'text-gray-900 dark:text-white'
                    }`}>All Interviews</h1>
                  <p className={`text-sm mt-0.5 ${coverPhoto
                    ? 'text-white/90 drop-shadow-lg'
                    : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    Track and manage all your job interviews
                  </p>
                </div>
              </motion.div>

              {/* Stats inline horizontal */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden md:flex items-center gap-3 mb-2">
                {[
                  { label: 'Total', count: allInterviews.length, color: 'gray', icon: Calendar },
                  { label: 'Upcoming', count: getUpcomingInterviews().length, color: 'blue', icon: TrendingUp },
                  { label: 'Past', count: getPastInterviews().length, color: 'gray', icon: History }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white dark:bg-[#2b2a2c] border-gray-200 dark:border-[#3d3c3e] ${coverPhoto ? 'drop-shadow-lg' : ''}`}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color === 'blue'
                      ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                      : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    <div className={`text-lg font-bold ${stat.color === 'blue'
                      ? 'text-[#635BFF] dark:text-[#a5a0ff]'
                      : 'text-gray-900 dark:text-gray-100'
                      }`}>
                      {stat.count}
                    </div>
                    <div className={`text-xs ${coverPhoto
                      ? (isCoverDark ? 'text-white/90' : 'text-gray-700 dark:text-white/90')
                      : 'text-gray-600 dark:text-gray-400'
                      }`}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Filters - clean horizontal pill layout */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {/* Period Filter */}
                  <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50/80 p-0.5 text-xs dark:border-[#3d3c3e] dark:bg-[#242325]/60">
                    <button
                      onClick={() => setFilterPeriod('all')}
                      className={`px-3 py-2 sm:py-1.5 rounded-full font-medium transition-colors min-h-[36px] sm:min-h-0
                    ${filterPeriod === 'all'
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-50 dark:text-gray-900'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterPeriod('upcoming')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterPeriod === 'upcoming'
                          ? 'bg-white text-[#635BFF] shadow-sm dark:bg-gray-50 dark:text-[#635BFF]'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setFilterPeriod('past')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterPeriod === 'past'
                          ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-50 dark:text-blue-500'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      Past
                    </button>
                  </div>

                  {/* Type Filter */}
                  <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50/80 p-0.5 text-xs dark:border-[#3d3c3e] dark:bg-[#242325]/60">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'all'
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-50 dark:text-gray-900'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      All types
                    </button>
                    <button
                      onClick={() => setFilterType('hr')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'hr'
                          ? 'bg-white text-pink-600 shadow-sm dark:bg-gray-50 dark:text-pink-600'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      HR
                    </button>
                    <button
                      onClick={() => setFilterType('technical')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'technical'
                          ? 'bg-white text-teal-600 shadow-sm dark:bg-gray-50 dark:text-teal-600'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      Technical
                    </button>
                    <button
                      onClick={() => setFilterType('manager')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'manager'
                          ? 'bg-white text-amber-600 shadow-sm dark:bg-gray-50 dark:text-amber-600'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      Manager
                    </button>
                    <button
                      onClick={() => setFilterType('final')}
                      className={`px-3 py-1.5 rounded-full font-medium transition-colors
                    ${filterType === 'final'
                          ? 'bg-white text-green-600 shadow-sm dark:bg-gray-50 dark:text-green-600'
                          : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-[#3d3c3e]/80'}`}
                    >
                      Final
                    </button>
                  </div>
                </div>

                {/* Sort Button */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="inline-flex items-center justify-center self-start rounded-full border border-gray-200 bg-white/80 px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-[#3d3c3e] dark:bg-[#242325]/70 dark:text-gray-200 dark:hover:bg-[#3d3c3e] min-h-[36px] sm:min-h-0"
                  aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
                >
                  <Calendar className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
                  <span className="ml-2 hidden sm:inline">
                    Sort by date
                  </span>
                </button>
              </motion.div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={coverFileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverFileSelect}
            />
          </div>
        </div>

        {/* Mobile Mobile Controls Section (Stats + Filters) - Below Cover */}
        <div className="md:hidden flex flex-col gap-4 px-4 py-4 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#333]">
          {/* Interactive Stats Row -> Acts as Period Filter */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${filterPeriod === 'all'
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-md transform scale-[1.02]'
                : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-[#252525] dark:text-gray-400 dark:border-white/[0.05]'
                }`}
            >
              <div className="text-xl font-bold mb-0.5">{allInterviews.length}</div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Total</div>
            </button>
            <button
              onClick={() => setFilterPeriod('upcoming')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${filterPeriod === 'upcoming'
                ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-md shadow-indigo-500/20 transform scale-[1.02]'
                : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-[#252525] dark:text-gray-400 dark:border-white/[0.05]'
                }`}
            >
              <div className="text-xl font-bold mb-0.5">{getUpcomingInterviews().length}</div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Upcoming</div>
            </button>
            <button
              onClick={() => setFilterPeriod('past')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${filterPeriod === 'past'
                ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-700 dark:border-gray-600 shadow-md transform scale-[1.02]'
                : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-[#252525] dark:text-gray-400 dark:border-white/[0.05]'
                }`}
            >
              <div className="text-xl font-bold mb-0.5">{getPastInterviews().length}</div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Past</div>
            </button>
          </div>

          {/* Filters Row - Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 border border-transparent mr-1"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-[#333] flex-shrink-0 mx-1" />

            {['all', 'technical', 'hr', 'manager', 'final'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${filterType === type
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                  : 'bg-white text-gray-600 border-gray-200 dark:bg-[#252525] dark:text-gray-400 dark:border-[#333]'
                  }`}
              >
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-4 pt-6 pb-6 flex flex-col">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-[#2b2a2c] rounded-xl shadow-sm border border-gray-100 dark:border-[#3d3c3e] overflow-hidden animate-pulse p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-[#3d3c3e] rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 dark:bg-[#3d3c3e] rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-[#3d3c3e] rounded w-40 mb-3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-[#3d3c3e] rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : getFilteredInterviews().length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-[#2b2a2c] rounded-2xl shadow-sm border border-gray-100 dark:border-[#3d3c3e]">
              <div className="w-20 h-20 bg-gradient-to-br from-[#635BFF]/10 to-[#7c75ff]/10 dark:from-[#635BFF]/30 dark:to-[#7c75ff]/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <Calendar className="w-10 h-10 text-[#635BFF] dark:text-[#a5a0ff]" />
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
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-[#2b2a2c] text-gray-700 dark:text-gray-300 
                  border border-gray-200 dark:border-[#3d3c3e] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Track Applications</span>
                </Link>
                <Link
                  to="/calendar"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-[#635BFF] to-[#7c75ff] hover:opacity-90 
                  text-white rounded-lg font-medium transition-all shadow-lg shadow-[#635BFF]/20"
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
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#635BFF]/20 to-transparent dark:via-[#7c75ff]/30"></div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Upcoming Interviews
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#635BFF]/10 text-[#635BFF] dark:bg-[#635BFF]/30 dark:text-[#a5a0ff]">
                          {getUpcomingInterviews().filter(item => filterType === 'all' || item.interview.type === filterType).length}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#635BFF]/20 to-transparent dark:via-[#7c75ff]/30"></div>
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
                              linkToPrepare={['coffee_chat', 'call', 'video_call', 'in_person'].includes(item.interview.type)
                                ? `/meeting-prep/${item.application.id}/${item.interview.id}`
                                : `/interview-prep/${item.application.id}/${item.interview.id}`}
                              onEdit={() => notify.info('Edit interview not implemented yet')}
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
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-[#2b2a2c] dark:text-gray-300">
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
                              linkToPrepare={['coffee_chat', 'call', 'video_call', 'in_person'].includes(item.interview.type)
                                ? `/meeting-prep/${item.application.id}/${item.interview.id}`
                                : `/interview-prep/${item.application.id}/${item.interview.id}`}
                              onEdit={() => notify.info('Edit interview not implemented yet')}
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
                          linkToPrepare={['coffee_chat', 'call', 'video_call', 'in_person'].includes(item.interview.type)
                            ? `/meeting-prep/${item.application.id}/${item.interview.id}`
                            : `/interview-prep/${item.application.id}/${item.interview.id}`}
                          onEdit={() => notify.info('Edit interview not implemented yet')}
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

        {/* Cover Photo Modals */}
        <CoverPhotoCropper
          isOpen={isCoverCropperOpen}
          file={selectedCoverFile}
          onClose={() => {
            setIsCoverCropperOpen(false);
            setSelectedCoverFile(null);
          }}
          onCropped={handleCroppedCover}
          exportWidth={1584}
          exportHeight={396}
        />

        <CoverPhotoGallery
          isOpen={isCoverGalleryOpen}
          onClose={() => setIsCoverGalleryOpen(false)}
          onDirectApply={handleDirectApplyCover}
          onRemove={coverPhoto ? handleRemoveCover : undefined}
          currentCover={coverPhoto || undefined}
        />
      </div>
    </AuthLayout>
  );
} 