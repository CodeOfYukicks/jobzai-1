import { format, parseISO, isValid } from 'date-fns';
import {
  Circle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Archive,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { StatusChange } from '../../types/job';
import { motion } from 'framer-motion';

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

const statusConfig = {
  applied: {
    icon: Circle,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-800'
  },
  interview: {
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    border: 'border-purple-200 dark:border-purple-800'
  },
  offer: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-200 dark:border-green-800'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-200 dark:border-red-800'
  },
  archived: {
    icon: Archive,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700'
  },
  pending_decision: {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-800'
  },
};

interface TimelineItemProps {
  change: StatusChange;
  isLast: boolean;
  index: number;
}

export const TimelineItem = ({ change, isLast, index }: TimelineItemProps) => {
  const config = statusConfig[change.status as keyof typeof statusConfig] || statusConfig.applied;
  const Icon = config.icon;
  const date = parseDate(change.date);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="relative flex gap-6"
    >
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-[-16px] w-[2px] bg-gray-100 dark:bg-gray-800" />
      )}

      {/* Icon */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-10 h-10 rounded-full ${config.bg} ${config.border} border flex items-center justify-center shadow-sm`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white capitalize text-base flex items-center gap-2">
              {change.status.replace('_', ' ')}
            </h4>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-700">
              <Calendar className="w-3.5 h-3.5" />
              <time>{format(date, 'MMM d, yyyy')}</time>
            </div>
          </div>

          {change.notes ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
              {change.notes}
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic mt-1">
              No notes recorded
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

