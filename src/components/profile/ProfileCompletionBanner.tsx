import { Target, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileCompletionBannerProps {
  completionPercentage: number;
  onStartStepMode: () => void;
}

const ProfileCompletionBanner = ({
  completionPercentage,
  onStartStepMode
}: ProfileCompletionBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show if profile is incomplete (< 80%)
  if (completionPercentage >= 80 || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6 mb-6 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600 rounded-full blur-2xl"></div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left Content */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex-shrink-0">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Complete your profile
                </h3>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                  {completionPercentage}%
                </span>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Use <span className="font-medium text-purple-600 dark:text-purple-400">Step Mode</span> to complete your profile step-by-step with guided questions.
              </p>
              
              {/* Progress Bar */}
              <div className="w-full">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onStartStepMode}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-semibold text-sm whitespace-nowrap"
            >
              <span>Start Step Mode</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;

