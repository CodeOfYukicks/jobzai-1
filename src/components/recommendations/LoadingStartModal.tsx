import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoadingStartModal({ 
  isOpen, 
  onClose, 
  message = "Your AI recommendations are being generated in the background. You can continue browsing, we'll notify you when they're ready!" 
}: LoadingStartModalProps) {
  // Don't auto-close - keep modal visible during loading
  // User can close manually if needed

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - transparent, doesn't block sidebar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 pointer-events-none md:pl-72 lg:pl-80"
          />
          
          {/* Modal - centered in content area (not including sidebar) */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4 md:pl-72 lg:pl-80">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full pointer-events-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-100 dark:bg-purple-900/30 rounded-full animate-ping opacity-75" />
                    <div className="relative bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full p-2.5">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Generating AI Recommendations
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {message}
              </p>

              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ 
                      duration: 5,
                      ease: "linear",
                      repeat: Infinity
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Processing...
                </span>
              </div>

              {/* Footer hint */}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                Check the notification in the bottom right corner for progress
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

