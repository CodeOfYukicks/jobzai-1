import { toast } from '@/contexts/ToastContext';
import { collection, getDocs, query, where, Timestamp, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Interview {
  id: string;
  type: string;
  date: Timestamp;
  applicationId: string;
  companyName?: string;
  position?: string;
}

interface ApplicationData {
  companyName: string;
  position: string;
  [key: string]: any;
}

/**
 * Check for upcoming interviews and show notifications for interviews happening soon
 */
export const checkUpcomingInterviews = async (userId?: string) => {
  try {
    // Need user ID to access their job applications
    if (!userId) {
      console.warn('No user ID provided for checking upcoming interviews');
      return;
    }

    // Get current time and calculate times for different notification thresholds
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 86400000); // 24 hours

    // Query user's job applications
    const applicationsRef = collection(db, 'users', userId, 'jobApplications');
    const applicationsSnapshot = await getDocs(applicationsRef);
    
    const upcomingInterviews: (Interview & { companyName?: string; position?: string })[] = [];

    // Process each application and check for upcoming interviews
    applicationsSnapshot.forEach((docSnapshot) => {
      const applicationData = docSnapshot.data() as ApplicationData;
      
      // Check if application has interviews
      if (applicationData.interviews && Array.isArray(applicationData.interviews)) {
        applicationData.interviews.forEach((interview: Interview) => {
          // Check if interview is scheduled and upcoming
          if (interview.status === 'scheduled' && interview.date) {
            const interviewDateTime = new Date(`${interview.date}T${interview.time || '00:00'}`);
            
            // Only include interviews in the next 24 hours
            if (interviewDateTime > now && interviewDateTime < oneDayFromNow) {
              upcomingInterviews.push({
                ...interview,
                companyName: applicationData.companyName,
                position: applicationData.position
              });
            }
          }
        });
      }
    });

    // Show notifications based on how soon the interview is
    upcomingInterviews.forEach(interview => {
      const interviewTime = new Date(`${interview.date}T${interview.time || '00:00'}`);
      const timeUntilInterview = interviewTime.getTime() - now.getTime();
      const hoursUntilInterview = timeUntilInterview / (1000 * 60 * 60);
      
      const companyInfo = interview.companyName 
        ? `${interview.companyName}${interview.position ? ` - ${interview.position}` : ''}`
        : 'Upcoming interview';
      
      // Notification for interview in about 1 hour
      if (hoursUntilInterview <= 1.5 && hoursUntilInterview > 0.8) {
        toast.warning(`${companyInfo} interview in about 1 hour!`, {
          description: `Your ${interview.type} interview is coming up soon. Click to prepare.`,
          duration: 10000,
          action: {
            label: 'Prepare',
            onClick: () => window.location.href = `/upcoming-interviews`
          }
        });
      } 
      // Notification for interview in about 3 hours
      else if (hoursUntilInterview <= 3.5 && hoursUntilInterview > 2.8) {
        toast.info(`${companyInfo} interview in about 3 hours`, {
          description: `Don't forget your ${interview.type} interview today. Click to prepare.`,
          duration: 8000,
          action: {
            label: 'Prepare',
            onClick: () => window.location.href = `/upcoming-interviews`
          }
        });
      }
      // Notification for interview tomorrow
      else if (hoursUntilInterview >= 20 && hoursUntilInterview <= 24) {
        toast.info(`${companyInfo} interview tomorrow`, {
          description: `You have a ${interview.type} interview scheduled for tomorrow at ${interviewTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          duration: 6000,
          action: {
            label: 'Prepare',
            onClick: () => window.location.href = `/upcoming-interviews`
          }
        });
      }
    });
  } catch (error) {
    console.error('Error checking upcoming interviews:', error);
  }
};

/**
 * Initialize notification service
 * Checks for upcoming interviews on application load and sets up regular checks
 */
export const initNotificationService = (userId?: string) => {
  if (!userId) {
    console.warn('Cannot initialize notification service without user ID');
    return;
  }
  
  // Check on initial load
  checkUpcomingInterviews(userId);
  
  // Check every 30 minutes
  setInterval(() => checkUpcomingInterviews(userId), 30 * 60 * 1000);
}; 