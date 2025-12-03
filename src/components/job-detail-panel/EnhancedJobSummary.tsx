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
      color: 'text-blue-600/70 dark:text-blue-400/80',
      bgColor: 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]',
      borderColor: 'border-blue-600/20 dark:border-blue-400/20',
      content: job.jobInsights?.keyResponsibilities
    },
    {
      id: 'skills',
      title: 'Required Skills',
      icon: Zap,
      color: 'text-rose-600/70 dark:text-rose-400/80',
      bgColor: 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05]',
      borderColor: 'border-rose-600/20 dark:border-rose-400/20',
      content: job.jobInsights?.requiredSkills
    },
    {
      id: 'experience',
      title: 'Experience Level',
      icon: TrendingUp,
      color: 'text-emerald-600/70 dark:text-emerald-400/80',
      bgColor: 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]',
      borderColor: 'border-emerald-600/20 dark:border-emerald-400/20',
      content: job.jobInsights?.experienceLevel
    },
    {
      id: 'compensation',
      title: 'Compensation & Benefits',
      icon: DollarSign,
      color: 'text-amber-600/70 dark:text-amber-400/80',
      bgColor: 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05]',
      borderColor: 'border-amber-600/20 dark:border-amber-400/20',
      content: job.jobInsights?.compensationBenefits
    },
    {
      id: 'culture',
      title: 'Company Culture',
      icon: Heart,
      color: 'text-violet-600/70 dark:text-violet-400/80',
      bgColor: 'bg-violet-500/[0.03] dark:bg-violet-500/[0.05]',
      borderColor: 'border-violet-600/20 dark:border-violet-400/20',
      content: job.jobInsights?.companyCulture
    },
    {
      id: 'growth',
      title: 'Growth Opportunities',
      icon: Rocket,
      color: 'text-indigo-600/70 dark:text-indigo-400/80',
      bgColor: 'bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05]',
      borderColor: 'border-indigo-600/20 dark:border-indigo-400/20',
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
              whileHover={{ y: -0.5 }}
              className={`group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border-l-2 ${insight.borderColor} border border-gray-100/50 dark:border-gray-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:border-opacity-30 dark:hover:border-opacity-30 transition-all duration-200 ease-out hover:bg-gradient-to-br hover:from-white/50 hover:to-transparent dark:hover:from-gray-800/30 dark:hover:to-transparent`}
            >
              <div className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-md border border-gray-200/50 dark:border-gray-700/30 ${insight.bgColor}`}>
                    <Icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    {insight.title}
                  </h4>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600/90 dark:text-gray-200 leading-[1.6] text-[13px] hyphens-auto">
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
