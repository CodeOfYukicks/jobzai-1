import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  progress: number; // 0-100
  message?: string;
}

export default function LoadingModal({ isOpen, progress, message = "Generating your AI recommendations" }: LoadingModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 pointer-events-auto border border-gray-200 dark:border-gray-800"
            >
              {/* Spinner with Progress */}
              <div className="flex flex-col items-center justify-center mb-6">
                {/* Circular Progress Ring */}
                <div className="relative w-24 h-24 mb-6">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-800"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                      strokeLinecap="round"
                      className="text-purple-600 dark:text-purple-400 transition-all duration-300 ease-out"
                    />
                  </svg>
                  
                  {/* Percentage in Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {message}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please wait while we analyze your profile...
                  </p>
                </div>
              </div>

              {/* Progress Bar (Optional - for visual feedback) */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

