import { motion } from 'framer-motion';
import { Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';

interface ApplicationTimingSectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function ApplicationTimingSection({
  data,
  isLoading,
  error,
  onRefresh
}: ApplicationTimingSectionProps) {
  const timing = data?.timing;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!timing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">No timing data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Application Timing
        </h3>
      </div>

      <div className="space-y-4">
        {/* Best Days */}
        {timing.best_days && timing.best_days.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Best Days:
            </p>
            <div className="flex flex-wrap gap-2">
              {timing.best_days.map((day: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Best Times */}
        {timing.best_times && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Best Times:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{timing.best_times}</p>
          </div>
        )}

        {/* Best Months */}
        {timing.best_months && timing.best_months.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Best Months:
            </p>
            <div className="flex flex-wrap gap-2">
              {timing.best_months.map((month: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Application Window */}
        {timing.application_window && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Application Window:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{timing.application_window}</p>
          </div>
        )}

        {/* Follow-up Timing */}
        {timing.follow_up_timing && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Follow-up Timing:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{timing.follow_up_timing}</p>
          </div>
        )}

        {/* Insights */}
        {timing.insights && timing.insights.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key Insights:
            </p>
            <ul className="space-y-1">
              {timing.insights.slice(0, 3).map((insight: string, index: number) => (
                <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

