/**
 * NotificationItem Component
 * Individual notification item with category-specific styling and actions
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Mail,
  Calendar,
  RefreshCw,
  Trophy,
  Bell,
  X,
  ChevronRight,
  Clock,
  SquareKanban,
} from 'lucide-react';
import { AppNotification } from '../../services/notificationCenterService';

// ============================================================================
// Types
// ============================================================================

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const getIconAndColor = (type: AppNotification['type']) => {
  switch (type) {
    case 'task_complete':
      return {
        icon: CheckCircle2,
        bgColor: 'bg-purple-100 dark:bg-purple-500/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
        accentColor: 'border-l-purple-500',
      };
    case 'email_reply':
      return {
        icon: Mail,
        bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        accentColor: 'border-l-emerald-500',
      };
    case 'campaign_reply':
      return {
        icon: Mail,
        bgColor: 'bg-cyan-100 dark:bg-cyan-500/20',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        accentColor: 'border-l-cyan-500',
      };
    case 'interview_reminder':
      return {
        icon: Calendar,
        bgColor: 'bg-blue-100 dark:bg-blue-500/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        accentColor: 'border-l-blue-500',
      };
    case 'status_change':
      return {
        icon: RefreshCw,
        bgColor: 'bg-amber-100 dark:bg-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        accentColor: 'border-l-amber-500',
      };
    case 'achievement':
      return {
        icon: Trophy,
        bgColor: 'bg-rose-100 dark:bg-rose-500/20',
        iconColor: 'text-rose-600 dark:text-rose-400',
        accentColor: 'border-l-rose-500',
      };
    case 'card_added':
      return {
        icon: SquareKanban,
        bgColor: 'bg-indigo-100 dark:bg-indigo-500/20',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        accentColor: 'border-l-indigo-500',
      };
    default:
      return {
        icon: Bell,
        bgColor: 'bg-gray-100 dark:bg-gray-500/20',
        iconColor: 'text-gray-600 dark:text-gray-400',
        accentColor: 'border-l-gray-500',
      };
  }
};

const formatTimeAgo = (date: Date | { toDate: () => Date } | any): string => {
  try {
    const now = new Date();
    const notificationDate = date?.toDate ? date.toDate() : new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  } catch {
    return '';
  }
};

// ============================================================================
// Component
// ============================================================================

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const { icon: Icon, bgColor, iconColor, accentColor } = getIconAndColor(notification.type);

  const handleClick = () => {
    // Mark as read
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`group relative flex items-start gap-3 p-3.5 cursor-pointer
        border-l-[3px] ${accentColor}
        ${notification.read
          ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'
          : 'bg-[#635BFF]/[0.04] dark:bg-[#635BFF]/[0.06] hover:bg-[#635BFF]/[0.07] dark:hover:bg-[#635BFF]/[0.09]'
        }
        transition-all duration-200`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-[13px] font-semibold leading-tight ${
            notification.read
              ? 'text-gray-700 dark:text-gray-300'
              : 'text-gray-900 dark:text-white'
          }`}>
            {notification.title}
          </h4>
          
          {/* Unread indicator */}
          {!notification.read && (
            <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[#635BFF] animate-pulse" />
          )}
        </div>

        <p className={`mt-0.5 text-[12px] leading-relaxed line-clamp-2 ${
          notification.read
            ? 'text-gray-500 dark:text-gray-500'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {notification.message}
        </p>

        {/* Footer: Time + Action */}
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(notification.createdAt)}
          </span>

          {notification.actionUrl && notification.actionLabel && (
            <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#635BFF] dark:text-[#a5a0ff] 
              opacity-0 group-hover:opacity-100 transition-opacity">
              {notification.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100
          text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
          hover:bg-gray-100 dark:hover:bg-white/[0.08]
          transition-all duration-150"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default NotificationItem;

