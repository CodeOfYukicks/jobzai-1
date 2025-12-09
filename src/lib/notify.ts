/**
 * Smart Notification System
 * 
 * A unified API that intelligently routes notifications:
 * - Important events → Notification Center (persistent, silent)
 * - Quick feedback → Micro-feedback (subtle, brief)
 * - Critical errors → Toast (visible, dismissible)
 * 
 * Usage:
 *   import { notify } from '@/lib/notify';
 *   
 *   // Quick feedback (subtle, 1.5s)
 *   notify.success('Saved');
 *   notify.copied('Email copied');
 *   
 *   // Important events (goes to notification center, no toast)
 *   notify.important({ type: 'task_complete', title: '...', message: '...' });
 *   
 *   // Errors (shows toast)
 *   notify.error('Failed to save');
 */

import { toast } from '@/contexts/ToastContext';
import { 
  createNotification, 
  createTaskCompleteNotification,
  createEmailReplyNotification,
  createStatusChangeNotification,
  createAchievementNotification,
  CreateNotificationInput 
} from '@/services/notificationCenterService';

// ============================================================================
// Types
// ============================================================================

type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'copied';

interface FeedbackOptions {
  duration?: number;
  silent?: boolean; // If true, won't show any visual feedback
}

interface ImportantNotificationOptions extends Omit<CreateNotificationInput, 'type'> {
  type: CreateNotificationInput['type'];
  showToast?: boolean; // If true, also shows a toast (default: false)
}

// ============================================================================
// Micro-feedback state (managed by MicroFeedback component)
// ============================================================================

type MicroFeedbackListener = (feedback: { type: FeedbackType; message: string } | null) => void;

let microFeedbackListener: MicroFeedbackListener | null = null;
let microFeedbackTimeout: NodeJS.Timeout | null = null;

export function setMicroFeedbackListener(listener: MicroFeedbackListener | null) {
  microFeedbackListener = listener;
}

function showMicroFeedback(type: FeedbackType, message: string, duration: number = 1500) {
  if (microFeedbackTimeout) {
    clearTimeout(microFeedbackTimeout);
  }
  
  if (microFeedbackListener) {
    microFeedbackListener({ type, message });
    microFeedbackTimeout = setTimeout(() => {
      microFeedbackListener?.(null);
    }, duration);
  }
}

// ============================================================================
// Current User ID (set by NotificationContext)
// ============================================================================

let currentUserId: string | null = null;

export function setNotifyUserId(userId: string | null) {
  currentUserId = userId;
}

// ============================================================================
// Main API
// ============================================================================

export const notify = {
  /**
   * Quick success feedback - subtle micro-toast
   */
  success: (message: string, options?: FeedbackOptions) => {
    if (options?.silent) return;
    showMicroFeedback('success', message, options?.duration ?? 1500);
  },

  /**
   * Error feedback - shows toast for visibility
   */
  error: (message: string, options?: FeedbackOptions) => {
    if (options?.silent) return;
    // Errors should be more visible, use toast
    toast.error(message, { duration: options?.duration ?? 4000 });
  },

  /**
   * Warning feedback - subtle micro-toast
   */
  warning: (message: string, options?: FeedbackOptions) => {
    if (options?.silent) return;
    showMicroFeedback('warning', message, options?.duration ?? 2000);
  },

  /**
   * Info feedback - subtle micro-toast
   */
  info: (message: string, options?: FeedbackOptions) => {
    if (options?.silent) return;
    showMicroFeedback('info', message, options?.duration ?? 1500);
  },

  /**
   * Copied to clipboard - special icon and message
   */
  copied: (message: string = 'Copied!', options?: FeedbackOptions) => {
    if (options?.silent) return;
    showMicroFeedback('copied', message, options?.duration ?? 1200);
  },

  /**
   * Important notification - goes to Notification Center
   * @param options - Notification data
   * @param options.showToast - If true, also shows a brief toast
   */
  important: async (options: ImportantNotificationOptions) => {
    if (!currentUserId) {
      console.warn('notify.important: No user ID set');
      return;
    }

    const { showToast, ...notificationData } = options;

    // Create persistent notification
    try {
      await createNotification(currentUserId, notificationData);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    // Optionally show a brief toast
    if (showToast) {
      showMicroFeedback('success', options.title, 2000);
    }
  },

  /**
   * Task completed - goes to Notification Center
   */
  taskComplete: async (options: {
    taskType: 'cv_rewrite' | 'ats_analysis' | 'cover_letter';
    taskId: string;
    analysisId?: string;
    jobTitle?: string;
    company?: string;
    showToast?: boolean;
  }) => {
    console.log('🔔 [notify.taskComplete] Called with userId:', currentUserId, 'options:', options);
    
    if (!currentUserId) {
      console.warn('🔔 [notify.taskComplete] No userId set, skipping notification');
      return;
    }

    try {
      console.log('🔔 [notify.taskComplete] Creating notification in Firestore...');
      const notificationId = await createTaskCompleteNotification(currentUserId, options);
      console.log('🔔 [notify.taskComplete] Notification created with ID:', notificationId);
      
      if (options.showToast) {
        showMicroFeedback('success', 'Task completed!', 2000);
      }
    } catch (error) {
      console.error('🔔 [notify.taskComplete] Failed to create notification:', error);
    }
  },

  /**
   * Email reply received - goes to Notification Center
   */
  emailReply: async (options: {
    contactName: string;
    contactEmail?: string;
    companyName?: string;
    campaignId?: string;
    recipientId?: string;
    threadId?: string;
    showToast?: boolean;
  }) => {
    if (!currentUserId) return;

    try {
      await createEmailReplyNotification(currentUserId, options);
      if (options.showToast) {
        showMicroFeedback('success', `Reply from ${options.contactName}`, 2000);
      }
    } catch (error) {
      console.error('Failed to create email reply notification:', error);
    }
  },

  /**
   * Status changed - goes to Notification Center
   */
  statusChange: async (options: {
    companyName: string;
    position: string;
    previousStatus: string;
    newStatus: string;
    applicationId: string;
    showToast?: boolean;
  }) => {
    if (!currentUserId) return;

    try {
      await createStatusChangeNotification(currentUserId, options);
      if (options.showToast) {
        showMicroFeedback('info', `Status updated to ${options.newStatus}`, 2000);
      }
    } catch (error) {
      console.error('Failed to create status change notification:', error);
    }
  },

  /**
   * Achievement unlocked - goes to Notification Center
   */
  achievement: async (options: {
    achievementName?: string;
    achievementId?: string;
    missionName?: string;
    missionId?: string;
    xpEarned?: number;
    showToast?: boolean;
  }) => {
    if (!currentUserId) return;

    try {
      await createAchievementNotification(currentUserId, options);
      if (options.showToast) {
        showMicroFeedback('success', options.achievementName || options.missionName || 'Achievement unlocked!', 2500);
      }
    } catch (error) {
      console.error('Failed to create achievement notification:', error);
    }
  },
};

export default notify;

