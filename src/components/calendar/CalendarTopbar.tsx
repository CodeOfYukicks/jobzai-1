import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { CalendarView } from './types';

interface CalendarTopbarProps {
  currentDate: Date;
  selectedView: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarTopbar = ({
  currentDate,
  selectedView,
  onPrevious,
  onNext,
  onToday,
}: CalendarTopbarProps) => {
  const getDateDisplay = () => {
    if (selectedView === 'month') {
      return moment(currentDate).format('MMMM YYYY');
    } else if (selectedView === 'week') {
      const startOfWeek = moment(currentDate).startOf('week');
      const endOfWeek = moment(currentDate).endOf('week');
      if (startOfWeek.month() === endOfWeek.month()) {
        return `${startOfWeek.format('MMMM D')} - ${endOfWeek.format('D, YYYY')}`;
      }
      return `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;
    } else {
      return moment(currentDate).format('dddd, MMMM D, YYYY');
    }
  };

  const getSubtitle = () => {
    const today = moment();
    const current = moment(currentDate);
    
    if (selectedView === 'day') {
      if (current.isSame(today, 'day')) {
        return 'Today';
      } else if (current.isSame(today.clone().add(1, 'day'), 'day')) {
        return 'Tomorrow';
      } else if (current.isSame(today.clone().subtract(1, 'day'), 'day')) {
        return 'Yesterday';
      }
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {getDateDisplay()}
        </h1>
        {getSubtitle() && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getSubtitle()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Today Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToday}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
        >
          Today
        </motion.button>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPrevious}
            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all duration-200"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all duration-200"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

