import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface SalaryInsightsSectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function SalaryInsightsSection({
  data,
  isLoading,
  error,
  onRefresh
}: SalaryInsightsSectionProps) {
  const salary = data?.salary;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
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

  if (!salary) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">No salary data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Salary Insights
        </h3>
      </div>

      <div className="space-y-4">
        {/* Salary Range */}
        {salary.range && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Salary Range:
            </p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {salary.range}
            </p>
          </div>
        )}

        {/* Average */}
        {salary.average && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Market Average:
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{salary.average}</p>
          </div>
        )}

        {/* Salary Breakdown */}
        {(salary.entry_level || salary.mid_level || salary.senior_level) && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              By Experience Level:
            </p>
            <div className="space-y-1 text-xs">
              {salary.entry_level && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Entry:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{salary.entry_level}</span>
                </div>
              )}
              {salary.mid_level && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mid:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{salary.mid_level}</span>
                </div>
              )}
              {salary.senior_level && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Senior:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{salary.senior_level}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Growth */}
        {salary.growth && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Expected Growth:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{salary.growth}</p>
            </div>
          </div>
        )}

        {/* Negotiation Tips */}
        {salary.negotiation_tips && salary.negotiation_tips.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Top Negotiation Tips:
            </p>
            <ul className="space-y-1">
              {salary.negotiation_tips.slice(0, 3).map((tip: string, index: number) => (
                <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}





