import { collection, getDocs, query, where, Timestamp, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createInterviewReminderNotification } from './notificationCenterService';
import { notify } from '../lib/notify';

// Track which interview reminders we've already created notifications for (to avoid duplicates)
const notifiedInterviews = new Set<string>();

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

    // Create notifications based on how soon the interview is
    for (const interview of upcomingInterviews) {
      const interviewTime = new Date(`${interview.date}T${interview.time || '00:00'}`);
      const timeUntilInterview = interviewTime.getTime() - now.getTime();
      const hoursUntilInterview = timeUntilInterview / (1000 * 60 * 60);
      
      // Create a unique key for this notification to avoid duplicates
      const notificationKey = `${interview.applicationId}_${interview.date}_${hoursUntilInterview <= 1.5 ? '1h' : hoursUntilInterview <= 3.5 ? '3h' : '24h'}`;
      
      // Skip if we've already notified for this interview at this time threshold
      if (notifiedInterviews.has(notificationKey)) {
        continue;
      }
      
      // Notification for interview in about 1 hour (high priority - show subtle feedback)
      if (hoursUntilInterview <= 1.5 && hoursUntilInterview > 0.8) {
        notifiedInterviews.add(notificationKey);
        
        // Create persistent notification (no toast, just notification center)
        try {
          await createInterviewReminderNotification(userId!, {
            companyName: interview.companyName || 'Unknown Company',
            position: interview.position,
            interviewType: interview.type as any || 'other',
            interviewDate: interview.date as any,
            interviewTime: interview.time || '00:00',
            applicationId: interview.applicationId,
            interviewId: interview.id,
            hoursUntil: hoursUntilInterview,
          });
          // Show subtle warning for imminent interviews
          notify.warning(`Interview in 1 hour at ${interview.companyName}`);
        } catch (error) {
          console.error('Failed to create interview notification:', error);
        }
      } 
      // Notification for interview in about 3 hours
      else if (hoursUntilInterview <= 3.5 && hoursUntilInterview > 2.8) {
        notifiedInterviews.add(notificationKey);
        
        // Create persistent notification only (silent)
        try {
          await createInterviewReminderNotification(userId!, {
            companyName: interview.companyName || 'Unknown Company',
            position: interview.position,
            interviewType: interview.type as any || 'other',
            interviewDate: interview.date as any,
            interviewTime: interview.time || '00:00',
            applicationId: interview.applicationId,
            interviewId: interview.id,
            hoursUntil: hoursUntilInterview,
          });
        } catch (error) {
          console.error('Failed to create interview notification:', error);
        }
      }
      // Notification for interview tomorrow
      else if (hoursUntilInterview >= 20 && hoursUntilInterview <= 24) {
        notifiedInterviews.add(notificationKey);
        
        // Create persistent notification only (silent)
        try {
          await createInterviewReminderNotification(userId!, {
            companyName: interview.companyName || 'Unknown Company',
            position: interview.position,
            interviewType: interview.type as any || 'other',
            interviewDate: interview.date as any,
            interviewTime: interview.time || '00:00',
            applicationId: interview.applicationId,
            interviewId: interview.id,
            hoursUntil: hoursUntilInterview,
          });
        } catch (error) {
          console.error('Failed to create interview notification:', error);
        }
      }
    }
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