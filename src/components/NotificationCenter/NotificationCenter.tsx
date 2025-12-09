/**
 * NotificationCenter Component
 * Premium notification dropdown with real-time updates
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Settings, Inbox, Sparkles } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { AppNotification } from '../../services/notificationCenterService';

// ============================================================================
// Types
// ============================================================================

type FilterTab = 'all' | 'unread';

// ============================================================================
// Helper Functions
// ============================================================================

const groupNotificationsByDate = (notifications: AppNotification[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisWeek = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; notifications: AppNotification[] }[] = [
    { label: 'Today', notifications: [] },
    { label: 'Yesterday', notifications: [] },
    { label: 'This Week', notifications: [] },
    { label: 'Earlier', notifications: [] },
  ];

  notifications.forEach((notification) => {
    const date = notification.createdAt?.toDate
      ? notification.createdAt.toDate()
      : new Date(notification.createdAt as any);

    if (date >= today) {
      groups[0].notifications.push(notification);
    } else if (date >= yesterday) {
      groups[1].notifications.push(notification);
    } else if (date >= thisWeek) {
      groups[2].notifications.push(notification);
    } else {
      groups[3].notifications.push(notification);
    }
  });

  return groups.filter((g) => g.notifications.length > 0);
};

// ============================================================================
// Component
// ============================================================================

export function NotificationCenter() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Group notifications by date
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  const handleClose = () => setIsOpen(false);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-8 w-8 rounded-lg
          text-gray-500 dark:text-gray-400
          hover:bg-gray-100 dark:hover:bg-[#3d3c3e]/50
          hover:text-gray-700 dark:hover:text-gray-200
          transition-all duration-200"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-[18px] w-[18px]" />
        
        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#635BFF] opacity-75"></span>
            <span className="relative inline-flex items-center justify-center h-4 min-w-[16px] px-1 
              rounded-full bg-[#635BFF] text-[10px] font-bold text-white tabular-nums">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-[380px] max-h-[70vh] flex flex-col
              bg-white dark:bg-[#1f1e20] 
              rounded-2xl shadow-2xl 
              border border-gray-200/80 dark:border-[#3d3c3e]/80
              overflow-hidden z-50
              backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3.5 border-b border-gray-100 dark:border-[#3d3c3e]/60
              bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/[0.02] dark:to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#635BFF]/10 dark:bg-[#635BFF]/20 
                      text-[11px] font-semibold text-[#635BFF] dark:text-[#a5a0ff]">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[12px] font-medium text-[#635BFF] dark:text-[#a5a0ff] 
                      hover:text-[#7c75ff] dark:hover:text-[#bdb9ff] transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/80 dark:bg-white/[0.05]">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-medium transition-all duration-200
                    ${activeTab === 'all'
                      ? 'bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-[12px] font-medium transition-all duration-200
                    ${activeTab === 'unread'
                      ? 'bg-white dark:bg-[#2b2a2c] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#635BFF]/20 text-[10px] text-[#635BFF] dark:text-[#a5a0ff]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300/50 
              dark:scrollbar-thumb-white/[0.1] scrollbar-track-transparent">
              {isLoading ? (
                /* Loading Skeleton */
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-white/[0.08]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-white/[0.08] rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-white/[0.08] rounded w-full" />
                        <div className="h-2.5 bg-gray-200 dark:bg-white/[0.08] rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 
                    dark:from-white/[0.06] dark:to-white/[0.02] 
                    flex items-center justify-center mb-4 shadow-inner">
                    {activeTab === 'unread' ? (
                      <Sparkles className="w-6 h-6 text-[#635BFF] dark:text-[#a5a0ff]" />
                    ) : (
                      <Inbox className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <h4 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">
                    {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                  </h4>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
                    {activeTab === 'unread'
                      ? "You've read all your notifications"
                      : "We'll notify you when something important happens"}
                  </p>
                </div>
              ) : (
                /* Notification List */
                <div className="py-2">
                  {groupedNotifications.map((group) => (
                    <div key={group.label}>
                      <div className="px-4 py-2 sticky top-0 bg-white/95 dark:bg-[#1f1e20]/95 backdrop-blur-sm">
                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          {group.label}
                        </span>
                      </div>
                      <AnimatePresence mode="popLayout">
                        {group.notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            onClose={handleClose}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 dark:border-[#3d3c3e]/60
              bg-gray-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Could navigate to a full notifications page if needed
                }}
                className="w-full text-[12px] font-medium text-gray-500 dark:text-gray-400 
                  hover:text-[#635BFF] dark:hover:text-[#a5a0ff] 
                  transition-colors text-center py-1"
              >
                {filteredNotifications.length > 0
                  ? `Showing ${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`
                  : 'Notification settings'
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;

