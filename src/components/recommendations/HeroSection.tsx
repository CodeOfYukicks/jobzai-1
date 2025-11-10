import { motion, AnimatePresence } from 'framer-motion';
import { Target, Building, GraduationCap, TrendingUp, Sparkles, Brain, Info } from 'lucide-react';
import { useState } from 'react';
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

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  description: string;
  color: 'purple' | 'blue' | 'green' | 'orange';
  delay: number;
}

function MetricCard({ icon, title, value, subtitle, description, color, delay }: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    purple: {
      bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      textColor: 'text-purple-600 dark:text-purple-400',
      tooltipBg: 'bg-purple-900 dark:bg-purple-800',
      tooltipBorder: 'border-purple-700 dark:border-purple-600'
    },
    blue: {
      bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-600 dark:text-blue-400',
      tooltipBg: 'bg-blue-900 dark:bg-blue-800',
      tooltipBorder: 'border-blue-700 dark:border-blue-600'
    },
    green: {
      bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
      border: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-600 dark:text-green-400',
      tooltipBg: 'bg-green-900 dark:bg-green-800',
      tooltipBorder: 'border-green-700 dark:border-green-600'
    },
    orange: {
      bg: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      border: 'border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      textColor: 'text-orange-600 dark:text-orange-400',
      tooltipBg: 'bg-orange-900 dark:bg-orange-800',
      tooltipBorder: 'border-orange-700 dark:border-orange-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`bg-gradient-to-br ${colors.bg} rounded-xl p-6 border ${colors.border} shadow-sm hover:shadow-md transition-shadow relative`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5 relative">
          <span className={`text-xs font-medium ${colors.textColor}`}>{title}</span>
          <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Info 
              className={`h-3.5 w-3.5 ${colors.iconColor} opacity-60 hover:opacity-100 transition-opacity duration-200 cursor-help`}
            />
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute right-0 top-6 z-50 w-64 p-3 ${colors.tooltipBg} border ${colors.tooltipBorder} rounded-lg shadow-xl pointer-events-none`}
                  style={{ 
                    transformOrigin: 'top right',
                  }}
                >
                  <p className="text-xs text-white leading-relaxed font-medium">
                    {description}
                  </p>
                  <div 
                    className={`absolute -top-1.5 right-3 w-3 h-3 ${colors.tooltipBg} border-l ${colors.tooltipBorder} border-t rotate-45`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </motion.div>
  );
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-purple-600 dark:text-white mb-2">
            AI Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Personalized insights to accelerate your career growth
          </p>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>Regenerate AI</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          title="Match Score"
          value={quickStats.matchScore}
          subtitle="Top Company Match"
          description="This score represents how well your profile matches the top recommended company. It's calculated based on your skills, experience, and preferences compared to the company's requirements and culture."
          color="purple"
          delay={0.1}
        />

        <MetricCard
          icon={<Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          title="Companies"
          value={quickStats.companiesFound}
          subtitle="Recommended Matches"
          description="The number of companies that align with your profile, skills, and career goals. These companies have been carefully selected based on your preferences and market opportunities."
          color="blue"
          delay={0.2}
        />

        <MetricCard
          icon={<GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />}
          title="Skills Gap"
          value={quickStats.skillsGap}
          subtitle="Critical Skills Missing"
          description="The number of essential skills you need to develop to be competitive in your target roles. These are skills that are highly valued by employers in your field."
          color="green"
          delay={0.3}
        />

        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          title="Career Paths"
          value={quickStats.careerPaths}
          subtitle="Available Paths"
          description="The number of potential career progression paths available to you based on your current skills and experience. Each path represents a strategic direction for your career growth."
          color="orange"
          delay={0.4}
        />
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

