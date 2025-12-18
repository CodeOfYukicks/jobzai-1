import { motion } from 'framer-motion';
import { 
  Send, 
  Mail, 
  MailOpen, 
  MessageSquare, 
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
  const iconClass = "w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]";
  
  switch (type) {
    case 'application':
      return <Send className={iconClass} />;
    case 'interview':
      return <Calendar className={iconClass} />;
    case 'status_change':
      if (status === 'offer') return <CheckCircle className={`${iconClass} text-emerald-500`} />;
      if (status === 'rejected') return <XCircle className={`${iconClass} text-gray-400`} />;
      return <Clock className={iconClass} />;
    case 'email_sent':
      return <Mail className={iconClass} />;
    case 'email_opened':
      return <MailOpen className={iconClass} />;
    case 'email_replied':
      return <MessageSquare className={`${iconClass} text-emerald-500`} />;
    default:
      return <Briefcase className={iconClass} />;
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  
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
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-6 h-6 text-gray-300 dark:text-gray-600 stroke-[1.5] mb-3" />
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No recent activity</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Recent Activity</h3>
      
      <div className="space-y-0">
        {displayedActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="relative flex gap-3 py-3 first:pt-0 last:pb-0 group"
          >
            {/* Timeline line */}
            {index < displayedActivities.length - 1 && (
              <div className="absolute left-[7px] top-10 bottom-0 w-px bg-gray-100 dark:bg-[#3d3c3e]/40" />
            )}
            
            {/* Icon - minimal style */}
            <div className="relative z-10 flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type, activity.status)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {activity.subtitle}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;
