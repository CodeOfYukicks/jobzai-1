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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Professional Profile
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Profile</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {completionPercentage}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">complete</span>
            </div>
            <div className="w-32 h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          {isIncomplete && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Complete your profile to get personalized job recommendations
            </p>
          )}
        </div>

        {/* Two Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step Mode Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
              isRecommended
                ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-200 dark:ring-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
            }`}
            onClick={onChooseStepMode}
          >
            {/* Recommended Badge */}
            {isRecommended && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold shadow-lg">
                  <CheckCircle className="w-3 h-3" />
                  Recommended
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                isRecommended
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Target className={`w-8 h-8 ${
                  isRecommended
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Complete Your Profile
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Guided step-by-step process
              </p>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                We'll guide you through each section to build a complete professional profile. Perfect for first-time setup or major updates.
              </p>

              {/* Button */}
              <button
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  isRecommended
                    ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>Start Step Mode</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Full Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
              !isRecommended && completionPercentage > 50
                ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-200 dark:ring-purple-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
            }`}
            onClick={onChooseFullProfile}
          >
            {/* Quick Edit Badge */}
            {!isRecommended && completionPercentage > 50 && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold shadow-lg">
                  <CheckCircle className="w-3 h-3" />
                  Quick Edit
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                !isRecommended && completionPercentage > 50
                  ? 'bg-indigo-100 dark:bg-indigo-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <FileText className={`w-8 h-8 ${
                  !isRecommended && completionPercentage > 50
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Edit Your Profile
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Direct access to all sections
              </p>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                View and edit your complete profile at once. Best if you know what to update.
              </p>

              {/* Button */}
              <button
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border-2 ${
                  !isRecommended && completionPercentage > 50
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl border-indigo-600'
                    : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>Go to Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can switch between modes at any time
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileLandingPage;




