import { motion } from 'framer-motion';
import { 
  Send, 
  Mail, 
  MailOpen, 
  Reply, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Briefcase
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'status_change' | 'email_sent' | 'email_opened' | 'email_replied';
  title: string;
  subtitle: string;
  timestamp: Date;
  status?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

const getActivityIcon = (type: ActivityItem['type'], status?: string) => {
  switch (type) {
    case 'application':
      return <Send className="w-4 h-4" />;
    case 'interview':
      return <Calendar className="w-4 h-4" />;
    case 'status_change':
      if (status === 'offer') return <CheckCircle className="w-4 h-4" />;
      if (status === 'rejected') return <XCircle className="w-4 h-4" />;
      return <Clock className="w-4 h-4" />;
    case 'email_sent':
      return <Mail className="w-4 h-4" />;
    case 'email_opened':
      return <MailOpen className="w-4 h-4" />;
    case 'email_replied':
      return <Reply className="w-4 h-4" />;
    default:
      return <Briefcase className="w-4 h-4" />;
  }
};

const getActivityColor = (type: ActivityItem['type'], status?: string) => {
  switch (type) {
    case 'application':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'interview':
      return 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-600 dark:text-jobzai-400';
    case 'status_change':
      if (status === 'offer') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      if (status === 'rejected') return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'email_sent':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    case 'email_opened':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'email_replied':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export function ActivityFeed({
  activities,
  maxItems = 10,
  className = '',
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  if (displayedActivities.length === 0) {
    return (
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Activity</h3>
      
      <div className="space-y-0">
        {displayedActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {/* Timeline line */}
            {index < displayedActivities.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}
            
            {/* Icon */}
            <div className={`relative z-10 p-2 rounded-lg flex-shrink-0 ${getActivityColor(activity.type, activity.status)}`}>
              {getActivityIcon(activity.type, activity.status)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-foreground truncate">
                {activity.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {activity.subtitle}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;

