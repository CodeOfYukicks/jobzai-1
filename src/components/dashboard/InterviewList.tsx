import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  User, 
  Building2,
  Download,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpcomingInterview {
  id: string;
  applicationId: string;
  companyName: string;
  position: string;
  date: string;
  time: string;
  type: string;
  location?: string;
}

interface InterviewListProps {
  interviews: UpcomingInterview[];
  maxItems?: number;
  onDownloadICS?: (interview: UpcomingInterview) => void;
  className?: string;
  showViewAll?: boolean;
}

const getInterviewTypeIcon = (type: string) => {
  switch (type) {
    case 'technical':
      return <User className="w-4 h-4" />;
    case 'hr':
      return <User className="w-4 h-4" />;
    case 'manager':
      return <User className="w-4 h-4" />;
    case 'final':
      return <Building2 className="w-4 h-4" />;
    default:
      return <Video className="w-4 h-4" />;
  }
};

const getInterviewTypeBadge = (type: string) => {
  const labels: Record<string, string> = {
    technical: 'Technical',
    hr: 'HR',
    manager: 'Manager',
    final: 'Final',
    other: 'Interview',
  };
  
  const colors: Record<string, string> = {
    technical: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    hr: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    manager: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    final: 'bg-jobzai-100 dark:bg-jobzai-900/30 text-jobzai-700 dark:text-jobzai-400',
    other: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
  };
  
  return {
    label: labels[type] || 'Interview',
    color: colors[type] || colors.other,
  };
};

const formatInterviewDate = (dateStr: string, timeStr: string) => {
  const date = new Date(`${dateStr}T${timeStr || '00:00'}`);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const timeFormatted = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (isToday) {
    return { date: 'Today', time: timeFormatted, isUrgent: true };
  }
  if (isTomorrow) {
    return { date: 'Tomorrow', time: timeFormatted, isUrgent: true };
  }
  
  return {
    date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: timeFormatted,
    isUrgent: false,
  };
};

export function InterviewList({
  interviews,
  maxItems = 5,
  onDownloadICS,
  className = '',
  showViewAll = true,
}: InterviewListProps) {
  const displayedInterviews = interviews.slice(0, maxItems);
  
  if (displayedInterviews.length === 0) {
    return (
      <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Upcoming Interviews</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
            <Calendar className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">No upcoming interviews</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Schedule interviews from your applications
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.06] rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Upcoming Interviews</h3>
        {showViewAll && interviews.length > maxItems && (
          <Link
            to="/applications"
            className="text-xs font-medium text-jobzai-600 dark:text-jobzai-400 hover:text-jobzai-700 dark:hover:text-jobzai-300 flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      <div className="space-y-3">
        {displayedInterviews.map((interview, index) => {
          const { date, time, isUrgent } = formatInterviewDate(interview.date, interview.time);
          const typeBadge = getInterviewTypeBadge(interview.type);
          
          return (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`
                relative p-4 rounded-xl border transition-all duration-200
                ${isUrgent 
                  ? 'bg-jobzai-50/50 dark:bg-jobzai-950/20 border-jobzai-200 dark:border-jobzai-800/50' 
                  : 'bg-muted/30 border-border hover:border-jobzai-200 dark:hover:border-jobzai-800'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Company & Position */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {interview.companyName}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge.color}`}>
                      {typeBadge.label}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {interview.position}
                  </p>
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={isUrgent ? 'font-semibold text-jobzai-600 dark:text-jobzai-400' : ''}>
                        {date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{time}</span>
                    </div>
                    {interview.location && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{interview.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {onDownloadICS && (
                    <button
                      onClick={() => onDownloadICS(interview)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Download calendar event"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <Link
                    to={`/applications?id=${interview.applicationId}`}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="View application"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default InterviewList;

