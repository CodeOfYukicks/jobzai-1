/**
 * Notification Context
 * Global state management for the notification center
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  AppNotification,
  subscribeToNotifications,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService,
  cleanupOldNotifications,
} from '../services/notificationCenterService';
import { setNotifyUserId } from '../lib/notify';

// ============================================================================
// Types
// ============================================================================

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  getUnreadByType: (type: AppNotification['type']) => AppNotification[];
}

interface NotificationProviderProps {
  children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasCleanedUp = useRef(false);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Subscribe to notifications when user is authenticated
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setIsLoading(false);
      setNotifyUserId(null);
      return;
    }

    // Set user ID for the notify system
    setNotifyUserId(currentUser.uid);
    setIsLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(currentUser.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setIsLoading(false);
    });

    // Cleanup old notifications once per session
    if (!hasCleanedUp.current) {
      hasCleanedUp.current = true;
      cleanupOldNotifications(currentUser.uid).catch((error) => {
        console.warn('Failed to cleanup old notifications:', error);
      });
    }

    return () => {
      unsubscribe();
      setNotifyUserId(null);
    };
  }, [currentUser?.uid]);

  // Mark a single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!currentUser?.uid) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      try {
        await markAsReadService(currentUser.uid, notificationId);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Revert optimistic update on error (subscription will handle it)
      }
    },
    [currentUser?.uid]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markAllAsReadService(currentUser.uid);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [currentUser?.uid]);

  // Delete a notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!currentUser?.uid) return;

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      try {
        await deleteNotificationService(currentUser.uid, notificationId);
      } catch (error) {
        console.error('Failed to delete notification:', error);
        // Subscription will handle revert if needed
      }
    },
    [currentUser?.uid]
  );

  // Get unread notifications by type
  const getUnreadByType = useCallback(
    (type: AppNotification['type']) => {
      return notifications.filter((n) => !n.read && n.type === type);
    },
    [notifications]
  );

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadByType,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

