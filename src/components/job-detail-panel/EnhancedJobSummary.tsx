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
  color: string;
  bgColor: string;
  borderColor: string;
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
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500',
      content: job.jobInsights?.keyResponsibilities
    },
    {
      id: 'skills',
      title: 'Required Skills',
      icon: Zap,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500',
      content: job.jobInsights?.requiredSkills
    },
    {
      id: 'experience',
      title: 'Experience Level',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500',
      content: job.jobInsights?.experienceLevel
    },
    {
      id: 'compensation',
      title: 'Compensation & Benefits',
      icon: DollarSign,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500',
      content: job.jobInsights?.compensationBenefits
    },
    {
      id: 'culture',
      title: 'Company Culture',
      icon: Heart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500',
      content: job.jobInsights?.companyCulture
    },
    {
      id: 'growth',
      title: 'Growth Opportunities',
      icon: Rocket,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500',
      content: job.jobInsights?.growthOpportunities
    }
  ].filter(insight => insight.content && insight.content.trim());

  return (
    <div className="space-y-6">
      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border-t-4 ${insight.borderColor} shadow-sm hover:shadow-xl transition-all duration-300`}
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${insight.bgColor} ${insight.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {insight.title}
                  </h4>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                    {insight.content}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
