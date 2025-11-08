import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletenessGateProps {
  profileCompleteness: number;
}

export default function ProfileCompletenessGate({ profileCompleteness }: ProfileCompletenessGateProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-12 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 
        border-2 border-purple-200 dark:border-purple-800 rounded-xl shadow-lg"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2">
            Complete your profile to access AI recommendations
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            Your profile is currently <span className="font-bold">{profileCompleteness}%</span> complete. 
            To get precise and personalized AI recommendations, you must complete at least <span className="font-bold">70%</span> of your profile.
          </p>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Progress</span>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{profileCompleteness}% / 70%</span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-900/50 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1" 
                style={{ width: `${Math.min(profileCompleteness, 100)}%` }}
              >
                {profileCompleteness >= 70 && (
                  <Sparkles className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-2">
              Once your profile is complete, you will get:
            </p>
            <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-purple-500" />
                Personalized company recommendations
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-purple-500" />
                Career paths adapted to your profile
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-purple-500" />
                An analysis of your skills and gaps
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-purple-500" />
                Optimized job search strategies
              </li>
            </ul>
          </div>
        </div>
        <button 
          onClick={() => navigate('/professional-profile')}
          className="w-full md:w-auto px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 
            hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg
            flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Complete my profile
        </button>
      </div>
    </motion.div>
  );
}

