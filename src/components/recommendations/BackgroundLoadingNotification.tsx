import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';

interface BackgroundLoadingNotificationProps {
  isOpen: boolean;
  progress: number; // 0-100
  message?: string;
  completedCount?: number;
  totalCount?: number;
  completedRecommendations?: string[];
  onMinimize?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
}

export default function BackgroundLoadingNotification({
  isOpen,
  progress,
  message = "Generating your AI recommendations",
  completedCount = 0,
  totalCount = 0,
  completedRecommendations = [],
  onMinimize,
  isMinimized = false,
  onMaximize
}: BackgroundLoadingNotificationProps) {
  if (!isOpen) return null;

  // Minimized version - floating pill at bottom right
  if (isMinimized) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 cursor-pointer"
            onClick={onMaximize}
          >
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="text-purple-600 dark:text-purple-400 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex flex-col min-w-[120px]">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {Math.round(progress)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedCount}/{totalCount} done
              </span>
            </div>
            {onMaximize && (
              <Maximize2 className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full version - modal-like notification
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {message}
              </h3>
            </div>
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-3">
            {/* Circular Progress */}
            <div className="flex items-center justify-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="text-purple-600 dark:text-purple-400 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              />
            </div>

            {/* Status Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {completedCount > 0 && totalCount > 0 ? (
                  <>
                    {completedCount} of {totalCount} recommendations completed
                  </>
                ) : (
                  "Analyzing your profile..."
                )}
              </p>
            </div>
          </div>

          {/* Completed Recommendations List */}
          {completedRecommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Ready:
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {completedRecommendations.map((name, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 dark:text-green-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
            You can continue browsing while we generate your recommendations
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

