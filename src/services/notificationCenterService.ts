/**
 * Notification Center Service
 * Handles persistent notifications stored in Firestore with real-time updates
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | 'task_complete'
  | 'email_reply'
  | 'interview_reminder'
  | 'status_change'
  | 'achievement';

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface NotificationMetadata {
  // Task completion
  taskId?: string;
  taskType?: 'cv_rewrite' | 'ats_analysis' | 'cover_letter';
  analysisId?: string;
  
  // Email reply
  campaignId?: string;
  recipientId?: string;
  contactName?: string;
  contactEmail?: string;
  companyName?: string;
  threadId?: string;
  
  // Interview reminder
  interviewId?: string;
  applicationId?: string;
  interviewType?: 'technical' | 'hr' | 'manager' | 'final' | 'other';
  interviewDate?: string;
  interviewTime?: string;
  
  // Status change
  previousStatus?: string;
  newStatus?: string;
  
  // Achievement
  achievementId?: string;
  achievementName?: string;
  missionId?: string;
  missionName?: string;
  xpEarned?: number;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata: NotificationMetadata;
  read: boolean;
  priority: NotificationPriority;
  createdAt: Timestamp | Date;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: NotificationMetadata;
  priority?: NotificationPriority;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get priority based on notification type
 */
function getDefaultPriority(type: NotificationType): NotificationPriority {
  switch (type) {
    case 'task_complete':
    case 'email_reply':
      return 'high';
    case 'interview_reminder':
      return 'medium';
    case 'status_change':
    case 'achievement':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Get icon based on notification type
 */
function getDefaultIcon(type: NotificationType): string {
  switch (type) {
    case 'task_complete':
      return 'check-circle';
    case 'email_reply':
      return 'mail';
    case 'interview_reminder':
      return 'calendar';
    case 'status_change':
      return 'refresh-cw';
    case 'achievement':
      return 'trophy';
    default:
      return 'bell';
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  input: CreateNotificationInput
): Promise<string> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  
  const notification = {
    type: input.type,
    title: input.title,
    message: input.message,
    icon: input.icon || getDefaultIcon(input.type),
    actionUrl: input.actionUrl || null,
    actionLabel: input.actionLabel || null,
    metadata: input.metadata || {},
    read: false,
    priority: input.priority || getDefaultPriority(input.type),
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(notificationsRef, notification);
  console.log(`🔔 Notification created: ${docRef.id}`);
  return docRef.id;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, where('read', '==', false));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return;
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });
  
  await batch.commit();
  console.log(`🔔 Marked ${snapshot.size} notifications as read`);
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
  await deleteDoc(notificationRef);
}

/**
 * Delete all read notifications older than 7 days (cleanup)
 */
export async function cleanupOldNotifications(userId: string): Promise<void> {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const q = query(
    notificationsRef,
    where('read', '==', true),
    where('createdAt', '<', Timestamp.fromDate(sevenDaysAgo))
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return;
  
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  
  await batch.commit();
  console.log(`🧹 Cleaned up ${snapshot.size} old notifications`);
}

// ============================================================================
// Real-time Subscription
// ============================================================================

/**
 * Subscribe to notifications for a user (real-time)
 * Returns unsubscribe function
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void,
  maxNotifications: number = 50
): Unsubscribe {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(
    notificationsRef,
    orderBy('createdAt', 'desc'),
    limit(maxNotifications)
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notifications.push({
          id: docSnap.id,
          type: data.type,
          title: data.title,
          message: data.message,
          icon: data.icon,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          metadata: data.metadata || {},
          read: data.read,
          priority: data.priority,
          createdAt: data.createdAt,
        });
      });
      callback(notifications);
    },
    (error) => {
      // Handle permission errors gracefully
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        console.warn('⚠️ Permission denied for notifications. This may be expected if Firestore rules restrict access.');
        callback([]);
        return;
      }
      console.error('❌ Error subscribing to notifications:', error);
      callback([]);
    }
  );
}

// ============================================================================
// Convenience Functions for Creating Specific Notification Types
// ============================================================================

/**
 * Create a task completion notification
 */
export async function createTaskCompleteNotification(
  userId: string,
  options: {
    taskType: 'cv_rewrite' | 'ats_analysis' | 'cover_letter';
    taskId: string;
    analysisId?: string;
    jobTitle?: string;
    company?: string;
  }
): Promise<string> {
  const titles: Record<string, string> = {
    cv_rewrite: 'CV Optimized Successfully',
    ats_analysis: 'ATS Analysis Complete',
    cover_letter: 'Cover Letter Generated',
  };
  
  const messages: Record<string, string> = {
    cv_rewrite: options.jobTitle && options.company
      ? `Your CV for ${options.jobTitle} at ${options.company} is ready`
      : 'Your optimized CV is ready to download',
    ats_analysis: options.jobTitle && options.company
      ? `Analysis for ${options.jobTitle} at ${options.company} is complete`
      : 'Your ATS analysis results are ready',
    cover_letter: options.jobTitle && options.company
      ? `Cover letter for ${options.jobTitle} at ${options.company} is ready`
      : 'Your cover letter has been generated',
  };
  
  return createNotification(userId, {
    type: 'task_complete',
    title: titles[options.taskType] || 'Task Complete',
    message: messages[options.taskType] || 'Your task has been completed',
    actionUrl: options.analysisId ? `/ats-analysis/${options.analysisId}` : undefined,
    actionLabel: 'View Result',
    metadata: {
      taskId: options.taskId,
      taskType: options.taskType,
      analysisId: options.analysisId,
    },
  });
}

/**
 * Create an email reply notification
 */
export async function createEmailReplyNotification(
  userId: string,
  options: {
    contactName: string;
    contactEmail?: string;
    companyName?: string;
    campaignId?: string;
    recipientId?: string;
    threadId?: string;
  }
): Promise<string> {
  return createNotification(userId, {
    type: 'email_reply',
    title: 'New Reply Received',
    message: `${options.contactName}${options.companyName ? ` from ${options.companyName}` : ''} replied to your email`,
    actionUrl: options.campaignId ? `/campaigns-auto` : '/applications',
    actionLabel: 'View Reply',
    metadata: {
      contactName: options.contactName,
      contactEmail: options.contactEmail,
      companyName: options.companyName,
      campaignId: options.campaignId,
      recipientId: options.recipientId,
      threadId: options.threadId,
    },
  });
}

/**
 * Create an interview reminder notification
 */
export async function createInterviewReminderNotification(
  userId: string,
  options: {
    companyName: string;
    position?: string;
    interviewType: 'technical' | 'hr' | 'manager' | 'final' | 'other';
    interviewDate: string;
    interviewTime: string;
    applicationId: string;
    interviewId?: string;
    hoursUntil: number;
  }
): Promise<string> {
  let title = '';
  let message = '';
  
  if (options.hoursUntil <= 1.5) {
    title = 'Interview Starting Soon';
    message = `Your ${options.interviewType} interview at ${options.companyName} starts in about 1 hour`;
  } else if (options.hoursUntil <= 3.5) {
    title = 'Interview Today';
    message = `Your ${options.interviewType} interview at ${options.companyName} is in about 3 hours`;
  } else {
    title = 'Interview Tomorrow';
    message = `Don't forget your ${options.interviewType} interview at ${options.companyName} tomorrow at ${options.interviewTime}`;
  }
  
  return createNotification(userId, {
    type: 'interview_reminder',
    title,
    message,
    actionUrl: '/upcoming-interviews',
    actionLabel: 'Prepare Now',
    priority: options.hoursUntil <= 1.5 ? 'high' : 'medium',
    metadata: {
      interviewId: options.interviewId,
      applicationId: options.applicationId,
      interviewType: options.interviewType,
      interviewDate: options.interviewDate,
      interviewTime: options.interviewTime,
      companyName: options.companyName,
    },
  });
}

/**
 * Create a status change notification
 */
export async function createStatusChangeNotification(
  userId: string,
  options: {
    companyName: string;
    position: string;
    previousStatus: string;
    newStatus: string;
    applicationId: string;
  }
): Promise<string> {
  const statusLabels: Record<string, string> = {
    applied: 'Applied',
    screening: 'In Screening',
    interviewing: 'Interviewing',
    offer: 'Offer Received',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    contacted: 'Contacted',
    replied: 'Replied',
  };
  
  const newStatusLabel = statusLabels[options.newStatus] || options.newStatus;
  
  return createNotification(userId, {
    type: 'status_change',
    title: 'Application Updated',
    message: `${options.position} at ${options.companyName} moved to "${newStatusLabel}"`,
    actionUrl: '/applications',
    actionLabel: 'View Application',
    metadata: {
      applicationId: options.applicationId,
      companyName: options.companyName,
      previousStatus: options.previousStatus,
      newStatus: options.newStatus,
    },
  });
}

/**
 * Create an achievement notification
 */
export async function createAchievementNotification(
  userId: string,
  options: {
    achievementName?: string;
    achievementId?: string;
    missionName?: string;
    missionId?: string;
    xpEarned?: number;
  }
): Promise<string> {
  const isAchievement = !!options.achievementName;
  
  return createNotification(userId, {
    type: 'achievement',
    title: isAchievement ? 'Achievement Unlocked' : 'Mission Complete',
    message: isAchievement
      ? `You've earned the "${options.achievementName}" achievement${options.xpEarned ? ` (+${options.xpEarned} XP)` : ''}`
      : `You've completed "${options.missionName}"${options.xpEarned ? ` and earned ${options.xpEarned} XP` : ''}`,
    actionUrl: '/dashboard',
    actionLabel: 'View Progress',
    metadata: {
      achievementId: options.achievementId,
      achievementName: options.achievementName,
      missionId: options.missionId,
      missionName: options.missionName,
      xpEarned: options.xpEarned,
    },
  });
}

