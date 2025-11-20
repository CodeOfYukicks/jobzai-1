import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Zap,
  TrendingUp,
  DollarSign,
  Heart,
  Rocket,
  Sparkles,
  ArrowRight,
  Target,
} from 'lucide-react';
import { JobApplication } from '../../types/job';

interface EnhancedJobSummaryProps {
  job: JobApplication;
}

interface InsightCard {
  id: string;
  title: string;
  icon: typeof Briefcase;
  gradient: string;
  content?: string;
}

export const EnhancedJobSummary = ({ job }: EnhancedJobSummaryProps) => {
  const navigate = useNavigate();

  // Check if we have enhanced insights
  const hasInsights = job.jobInsights && Object.values(job.jobInsights).some(v => v && v.trim());

  // Handle navigation to CV Analysis
  const handleAnalyzeMatch = () => {
    navigate('/cv-analysis', {
      state: {
        jobTitle: job.position,
        company: job.companyName,
        jobDescription: job.fullJobDescription || job.description || '',
        jobUrl: job.url,
        fromApplication: true
      }
    });
  };

  // If no insights, show the old 3-bullet format with upgrade message
  if (!hasInsights) {
    return (
      <div className="space-y-4">
        {/* Old Format Display */}
        {job.description && (
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>
        )}

        {/* Upgrade Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-700 dark:text-purple-300">
              <p className="font-medium mb-1">Get Enhanced AI Analysis</p>
              <p>
                Re-extract job information to get a more detailed, categorized analysis with insights on 
                responsibilities, skills, culture, and more.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA for CV Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]"
        >
          <div className="bg-white dark:bg-gray-900 rounded-[10px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Get Personalized Match Analysis
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Compare your CV against this job to see your match score, identify missing skills, 
                  and get personalized recommendations to improve your application.
                </p>
                <button
                  onClick={handleAnalyzeMatch}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <span>Analyze My Match</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <Sparkles className="w-12 h-12 text-blue-200 dark:text-blue-800 opacity-50" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Insight cards configuration
  const insights: InsightCard[] = [
    {
      id: 'responsibilities',
      title: 'Key Responsibilities',
      icon: Briefcase,
      gradient: 'from-blue-500 to-cyan-500',
      content: job.jobInsights?.keyResponsibilities
    },
    {
      id: 'skills',
      title: 'Required Skills',
      icon: Zap,
      gradient: 'from-purple-500 to-pink-500',
      content: job.jobInsights?.requiredSkills
    },
    {
      id: 'experience',
      title: 'Experience Level',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      content: job.jobInsights?.experienceLevel
    },
    {
      id: 'compensation',
      title: 'Compensation & Benefits',
      icon: DollarSign,
      gradient: 'from-yellow-500 to-orange-500',
      content: job.jobInsights?.compensationBenefits
    },
    {
      id: 'culture',
      title: 'Company Culture',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-500',
      content: job.jobInsights?.companyCulture
    },
    {
      id: 'growth',
      title: 'Growth Opportunities',
      icon: Rocket,
      gradient: 'from-indigo-500 to-purple-500',
      content: job.jobInsights?.growthOpportunities
    }
  ].filter(insight => insight.content && insight.content.trim());

  return (
    <div className="space-y-6">
      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            >
              {/* Gradient header */}
              <div className={`h-2 bg-gradient-to-r ${insight.gradient}`} />
              
              {/* Content */}
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${insight.gradient} shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white flex-1 mt-1">
                    {insight.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {insight.content}
                </p>
              </div>

              {/* Hover effect background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${insight.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
            </motion.div>
          );
        })}
      </div>

      {/* CTA Section for Personalized Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: insights.length * 0.1 + 0.2 }}
        className="relative overflow-hidden rounded-xl"
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm" />
        <div className="relative bg-white dark:bg-gray-900 m-[2px] rounded-[10px]">
          <div className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Want to Know Your Match Score?
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
                  Upload your CV to get a personalized analysis comparing your qualifications against this job. 
                  Get your ATS match score, see which skills you're missing, and receive tailored recommendations 
                  to improve your application success rate.
                </p>
                <button
                  onClick={handleAnalyzeMatch}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Analyze My Match Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* Decorative element */}
              <div className="hidden lg:block">
                <div className="relative w-24 h-24">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl opacity-20"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


