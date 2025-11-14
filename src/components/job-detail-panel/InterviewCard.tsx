import { format, parseISO, isValid } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Circle,
  Video,
  MessageSquare,
} from 'lucide-react';
import { Interview } from '../../types/job';

// Helper function to safely parse dates from Firestore
const parseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  // If it's already a Date object
  if (dateValue instanceof Date) return dateValue;
  
  // If it's a Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // If it's a timestamp number
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  // If it's an ISO string
  if (typeof dateValue === 'string') {
    const parsed = parseISO(dateValue);
    return isValid(parsed) ? parsed : new Date();
  }
  
  return new Date();
};

// Helper function to format dates safely
const formatDate = (dateValue: any, formatString: string): string => {
  try {
    const date = parseDate(dateValue);
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const interviewTypeConfig = {
  technical: { label: 'Technical', color: 'bg-blue-100 text-blue-700' },
  hr: { label: 'HR', color: 'bg-green-100 text-green-700' },
  manager: { label: 'Manager', color: 'bg-purple-100 text-purple-700' },
  final: { label: 'Final', color: 'bg-orange-100 text-orange-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

const statusConfig = {
  scheduled: { icon: Circle, color: 'text-blue-500', label: 'Scheduled' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: 'Cancelled' },
};

interface InterviewCardProps {
  interview: Interview;
}

export const InterviewCard = ({ interview }: InterviewCardProps) => {
  const typeConfig = interviewTypeConfig[interview.type];
  const statusConf = statusConfig[interview.status];
  const StatusIcon = statusConf.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 group-hover:from-blue-100 group-hover:to-purple-100 dark:group-hover:from-blue-900/50 dark:group-hover:to-purple-900/50 transition-colors">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{typeConfig.label} Interview</h4>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`w-3.5 h-3.5 ${statusConf.color} dark:${statusConf.color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{statusConf.label}</span>
            </div>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span>{formatDate(interview.date, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span>{interview.time}</span>
        </div>
        {interview.location && (
          <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            {interview.location.toLowerCase().includes('zoom') ||
            interview.location.toLowerCase().includes('meet') ||
            interview.location.toLowerCase().includes('teams') ? (
              <Video className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            ) : (
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
            <span>{interview.location}</span>
          </div>
        )}
        {interview.interviewers && interview.interviewers.length > 0 && (
          <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              {interview.interviewers.map((interviewer, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium"
                >
                  {interviewer}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {interview.notes && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{interview.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

