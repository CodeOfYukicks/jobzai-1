import { toast } from 'sonner';
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
export const checkUpcomingInterviews = async () => {
  try {
    // Get current time and calculate times for different notification thresholds
    const now = Timestamp.now();
    const oneDayFromNow = new Timestamp(now.seconds + 86400, 0); // 24 hours
    const threeHoursFromNow = new Timestamp(now.seconds + 10800, 0); // 3 hours
    const oneHourFromNow = new Timestamp(now.seconds + 3600, 0); // 1 hour

    // Query interviews happening in the next 24 hours
    const interviewsRef = collection(db, 'interviews');
    const q = query(
      interviewsRef,
      where('date', '>', now),
      where('date', '<', oneDayFromNow)
    );

    const querySnapshot = await getDocs(q);
    const upcomingInterviews: Interview[] = [];

    // Process interviews and gather additional data
    for (const docSnapshot of querySnapshot.docs) {
      const interviewData = docSnapshot.data() as Interview;
      interviewData.id = docSnapshot.id;

      // If we have an applicationId, get the company and position
      if (interviewData.applicationId) {
        try {
          const applicationRef = doc(db, 'applications', interviewData.applicationId);
          const applicationSnap = await getDoc(applicationRef);
          if (applicationSnap.exists()) {
            const applicationData = applicationSnap.data() as ApplicationData;
            interviewData.companyName = applicationData.companyName;
            interviewData.position = applicationData.position;
          }
        } catch (error) {
          console.error('Error fetching application data:', error);
        }
      }

      upcomingInterviews.push(interviewData);
    }

    // Show notifications based on how soon the interview is
    upcomingInterviews.forEach(interview => {
      const interviewTime = interview.date.toDate();
      const timeUntilInterview = interviewTime.getTime() - now.toDate().getTime();
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
            onClick: () => window.location.href = `/interview-prep/${interview.applicationId}/${interview.id}`
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
            onClick: () => window.location.href = `/interview-prep/${interview.applicationId}/${interview.id}`
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
            onClick: () => window.location.href = `/interview-prep/${interview.applicationId}/${interview.id}`
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
export const initNotificationService = () => {
  // Check on initial load
  checkUpcomingInterviews();
  
  // Check every 30 minutes
  setInterval(checkUpcomingInterviews, 30 * 60 * 1000);
}; 