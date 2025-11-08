import { motion } from 'framer-motion';
import { Target, Building, GraduationCap, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { CompleteUserData } from '../../lib/userDataFetcher';

interface HeroSectionProps {
  completeUserData: CompleteUserData | null;
  profileCompleteness: number;
  quickStats: {
    matchScore: string | number;
    companiesFound: number;
    skillsGap: number;
    careerPaths: number;
  };
  onRefresh: () => void;
  isLoading: boolean;
}

export default function HeroSection({
  completeUserData,
  profileCompleteness,
  quickStats,
  onRefresh,
  isLoading
}: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-purple-600 dark:text-white mb-2">
            AI Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Personalized insights to accelerate your career growth
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {completeUserData?.cvUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span>CV Analyzed</span>
            </div>
          )}
          
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Match Score</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.matchScore}</p>
          <p className="text-xs text-gray-500 mt-1">Top Company Match</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Companies</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.companiesFound}</p>
          <p className="text-xs text-gray-500 mt-1">Recommended Matches</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Skills Gap</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.skillsGap}</p>
          <p className="text-xs text-gray-500 mt-1">Critical Skills Missing</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Career Paths</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.careerPaths}</p>
          <p className="text-xs text-gray-500 mt-1">Available Paths</p>
        </motion.div>
      </div>

      {/* Profile Completeness Indicator - Only show if >= 70% but < 100% */}
      {profileCompleteness >= 70 && profileCompleteness < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Profile {profileCompleteness}% Complete
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Complete your profile for more accurate recommendations
                </p>
              </div>
            </div>
            <div className="w-32 bg-amber-200 dark:bg-amber-900/50 rounded-full h-2">
              <div
                className="bg-amber-500 dark:bg-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

