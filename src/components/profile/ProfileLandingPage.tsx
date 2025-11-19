import { Target, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileLandingPageProps {
  completionPercentage: number;
  onChooseStepMode: () => void;
  onChooseFullProfile: () => void;
}

const ProfileLandingPage = ({
  completionPercentage,
  onChooseStepMode,
  onChooseFullProfile
}: ProfileLandingPageProps) => {
  const isIncomplete = completionPercentage < 80;
  const isRecommended = completionPercentage < 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-indigo-900/10 bg-mesh-gradient-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            Professional Profile
          </h1>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Profile</span>
              <span className="text-3xl font-bold gradient-text">
                {completionPercentage}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">complete</span>
            </div>
            <div className="relative w-40 h-3 bg-gray-200/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden shadow-inner">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
              <div className="absolute inset-0 bg-gradient-shimmer animate-shimmer opacity-50"></div>
            </div>
          </div>
          {isIncomplete && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Complete your profile to get personalized job recommendations
            </motion.p>
          )}
        </motion.div>

        {/* Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step Mode Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ scale: 1.02, y: -8 }}
            className={`group relative glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-400 ${
              isRecommended
                ? 'ring-2 ring-purple-400/50 dark:ring-purple-500/30 shadow-glow'
                : 'hover:shadow-glow-sm'
            }`}
            onClick={onChooseStepMode}
          >
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-400 pointer-events-none"></div>
            
            {/* Animated Border Gradient */}
            {isRecommended && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 opacity-20 animate-gradient-shift bg-[length:200%_200%] pointer-events-none"></div>
            )}

            {/* Recommended Badge */}
            {isRecommended && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-500/30 shimmer-effect">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Recommended
                </div>
              </div>
            )}

            <div className="relative p-8 z-10">
              {/* Icon */}
              <motion.div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative ${
                  isRecommended
                    ? 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 dark:from-purple-500/30 dark:to-indigo-500/30'
                    : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm'
                }`}
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                {isRecommended && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 opacity-20 animate-pulse-glow"></div>}
                <Target className={`w-10 h-10 ${
                  isRecommended
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                Complete Your Profile
              </h2>
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-4 uppercase tracking-wider">
                Guided step-by-step process
              </p>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-[15px]">
                We'll guide you through each section to build a complete professional profile. Perfect for first-time setup or major updates.
              </p>

              {/* Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  isRecommended
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                    : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-600/80'
                }`}
              >
                <span>Start Step Mode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>

          {/* Full Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ scale: 1.02, y: -8 }}
            className={`group relative glass-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-400 ${
              !isRecommended && completionPercentage > 50
                ? 'ring-2 ring-indigo-400/50 dark:ring-indigo-500/30 shadow-glow'
                : 'hover:shadow-glow-sm'
            }`}
            onClick={onChooseFullProfile}
          >
            {/* Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-400 pointer-events-none"></div>

            {/* Quick Edit Badge */}
            {!isRecommended && completionPercentage > 50 && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-500/30 shimmer-effect">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Quick Edit
                </div>
              </div>
            )}

            <div className="relative p-8 z-10">
              {/* Icon */}
              <motion.div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative ${
                  !isRecommended && completionPercentage > 50
                    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30'
                    : 'bg-gray-100/80 dark:bg-gray-700/80 backdrop-blur-sm'
                }`}
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                {!isRecommended && completionPercentage > 50 && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 opacity-20 animate-pulse-glow"></div>}
                <FileText className={`w-10 h-10 ${
                  !isRecommended && completionPercentage > 50
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                Edit Your Profile
              </h2>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-wider">
                Direct access to all sections
              </p>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-[15px]">
                View and edit your complete profile at once. Best if you know what to update.
              </p>

              {/* Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 border-2 ${
                  !isRecommended && completionPercentage > 50
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
                    : 'bg-transparent border-gray-300/50 dark:border-gray-600/50 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:border-purple-400/50 dark:hover:border-purple-500/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>Go to Profile</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Help Text */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            You can switch between modes at any time
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileLandingPage;






