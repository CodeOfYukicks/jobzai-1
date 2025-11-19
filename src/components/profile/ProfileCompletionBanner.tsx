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
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="glass-panel rounded-xl p-4 mb-4 relative overflow-hidden shadow-glow-sm"
      >
        {/* Animated Background Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-2xl animate-float-slow"></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-purple-300/10 dark:bg-purple-500/10 rounded-full blur-2xl animate-pulse-glow"></div>
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Circular Progress SVG */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {/* Circular Progress */}
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={226.19}
                  initial={{ strokeDashoffset: 226.19 }}
                  animate={{ strokeDashoffset: 226.19 - (226.19 * completionPercentage) / 100 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="drop-shadow-lg"
                />
                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(147, 51, 234)" />
                    <stop offset="100%" stopColor="rgb(79, 70, 229)" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  Complete your profile
                </h3>
                <span className="text-sm font-bold gradient-text whitespace-nowrap">
                  {completionPercentage}%
                </span>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2.5 leading-relaxed">
                Use <span className="font-semibold text-purple-600 dark:text-purple-400">Step Mode</span> to complete your profile step-by-step with guided questions.
              </p>
              
              {/* Progress Bar */}
              <div className="w-full">
                <div className="h-1.5 bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden relative">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <div className="absolute inset-0 bg-gradient-shimmer animate-shimmer opacity-40"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              onClick={onStartStepMode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-premium flex items-center gap-1.5 whitespace-nowrap animate-pulse-glow text-sm px-4 py-2"
            >
              <span>Start Step Mode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              onClick={() => setIsDismissed(true)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;

