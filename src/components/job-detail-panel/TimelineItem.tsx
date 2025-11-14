import { format, parseISO, isValid } from 'date-fns';
import {
  Circle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Archive,
  AlertCircle,
} from 'lucide-react';
import { StatusChange } from '../../types/job';

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

const statusConfig = {
  applied: { 
    icon: Circle, 
    color: 'text-blue-500 dark:text-blue-400', 
    bg: 'bg-blue-50 dark:bg-blue-900/30' 
  },
  interview: { 
    icon: TrendingUp, 
    color: 'text-purple-500 dark:text-purple-400', 
    bg: 'bg-purple-50 dark:bg-purple-900/30' 
  },
  offer: { 
    icon: CheckCircle2, 
    color: 'text-green-500 dark:text-green-400', 
    bg: 'bg-green-50 dark:bg-green-900/30' 
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-500 dark:text-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/30' 
  },
  archived: { 
    icon: Archive, 
    color: 'text-gray-500 dark:text-gray-400', 
    bg: 'bg-gray-50 dark:bg-gray-800/50' 
  },
  pending_decision: { 
    icon: AlertCircle, 
    color: 'text-yellow-500 dark:text-yellow-400', 
    bg: 'bg-yellow-50 dark:bg-yellow-900/30' 
  },
};

interface TimelineItemProps {
  change: StatusChange;
  isLast: boolean;
}

export const TimelineItem = ({ change, isLast }: TimelineItemProps) => {
  const config = statusConfig[change.status as keyof typeof statusConfig];
  const Icon = config?.icon || Circle;

  return (
    <div className="relative flex gap-4">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Icon - z-10 to stay below sticky header (z-50) */}
      <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full ${config?.bg} border-2 border-white dark:border-gray-900 shadow-sm flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config?.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
              {change.status.replace('_', ' ')}
            </h4>
            <time className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(change.date, 'MMM d, yyyy')}
            </time>
          </div>
          {change.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{change.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
};

