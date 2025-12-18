import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Download,
  ArrowUpRight
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

const getInterviewTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    technical: 'Technical',
    hr: 'HR',
    manager: 'Manager',
    final: 'Final',
    other: 'Interview',
  };
  return labels[type] || 'Interview';
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
      <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 ${className}`}>
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide mb-5">Upcoming Interviews</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="w-6 h-6 text-gray-300 dark:text-gray-600 stroke-[1.5] mb-3" />
          <p className="text-[13px] text-gray-400 dark:text-gray-500">No upcoming interviews</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Schedule interviews from your applications
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-[#2b2a2c] border border-gray-200/60 dark:border-[#3d3c3e]/60 rounded-2xl p-6 transition-all duration-300 hover:border-gray-300 dark:hover:border-[#4a494b] ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-medium text-gray-500 dark:text-gray-400 tracking-wide">Upcoming Interviews</h3>
        {showViewAll && interviews.length > maxItems && (
          <Link
            to="/applications"
            className="text-[12px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors"
          >
            View all
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      <div className="space-y-2">
        {displayedInterviews.map((interview, index) => {
          const { date, time, isUrgent } = formatInterviewDate(interview.date, interview.time);
          
          return (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              className="group"
            >
              <Link
                to={`/applications?id=${interview.applicationId}`}
                className={`
                  block p-4 -mx-2 rounded-xl transition-all duration-200
                  hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/40
                  ${isUrgent ? 'bg-gray-50/50 dark:bg-[#333234]/50' : ''}
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Company & Type */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {interview.companyName}
                      </h4>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider flex-shrink-0">
                        {getInterviewTypeLabel(interview.type)}
                      </span>
                    </div>
                    
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate mb-2">
                      {interview.position}
                    </p>
                    
                    {/* Date & Time */}
                    <div className="flex items-center gap-4 text-[12px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                        <span className={isUrgent ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}>
                          {date}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                        <span className="text-gray-600 dark:text-gray-300">{time}</span>
                      </div>
                      {interview.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 stroke-[1.5]" />
                          <span className="text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{interview.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDownloadICS && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDownloadICS(interview);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                        title="Download calendar event"
                      >
                        <Download className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    )}
                    <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default InterviewList;
