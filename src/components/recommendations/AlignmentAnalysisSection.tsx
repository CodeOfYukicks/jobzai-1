import { motion } from 'framer-motion';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Loader2, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  Building2,
  Briefcase,
  ArrowRight,
  Lightbulb,
  Clock
} from 'lucide-react';

interface AlignmentMismatch {
  type: 'seniority' | 'industry' | 'skills' | 'salary' | 'location';
  description: string;
  evidence: string;
  recommendation: string;
  severity: 'critical' | 'warning' | 'info';
}

interface CampaignAnalysis {
  campaign_name: string;
  alignment_score: number;
  feedback: string;
  issues: string[];
}

interface ApplicationPattern {
  companies_targeted: string[];
  roles_applied: string[];
  success_rate_by_type: { type: string; rate: number }[];
  time_wasted_analysis: string;
}

interface AlignmentAnalysisData {
  alignment_analysis: {
    overall_alignment_score: number;
    profile_vs_applications_match: number;
    direction_assessment: 'on-track' | 'misaligned' | 'over-reaching' | 'under-selling';
    critical_mismatches: AlignmentMismatch[];
    application_patterns: ApplicationPattern;
    campaign_analysis: CampaignAnalysis[];
    honest_feedback: string;
    corrective_actions: string[];
  };
}

interface AlignmentAnalysisSectionProps {
  data: AlignmentAnalysisData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const getDirectionBadge = (direction: string) => {
  switch (direction) {
    case 'on-track':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        icon: CheckCircle,
        label: 'On Track'
      };
    case 'over-reaching':
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        icon: TrendingUp,
        label: 'Over-Reaching'
      };
    case 'under-selling':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        icon: TrendingDown,
        label: 'Under-Selling'
      };
    case 'misaligned':
    default:
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        icon: XCircle,
        label: 'Misaligned'
      };
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        border: 'border-l-red-500',
        bg: 'bg-red-50 dark:bg-red-900/10',
        icon: XCircle,
        iconColor: 'text-red-500'
      };
    case 'warning':
      return {
        border: 'border-l-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/10',
        icon: AlertTriangle,
        iconColor: 'text-amber-500'
      };
    default:
      return {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        icon: AlertCircle,
        iconColor: 'text-blue-500'
      };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30';
  if (score >= 40) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
};

export default function AlignmentAnalysisSection({
  data,
  isLoading,
  error,
  onRefresh
}: AlignmentAnalysisSectionProps) {
  const analysis = data?.alignment_analysis;

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Job Search Alignment Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing your applications and campaigns against your profile...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Performing deep analysis of your job search strategy...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Job Search Alignment Analysis
            </h2>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Job Search Alignment Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Critical analysis of how well your job search matches your profile
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No alignment analysis available yet. Start applying to jobs to get insights.
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Analysis
          </button>
        </div>
      </section>
    );
  }

  const directionBadge = getDirectionBadge(analysis.direction_assessment);
  const DirectionIcon = directionBadge.icon;

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Job Search Alignment Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Critical analysis of how well your job search matches your profile
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
        >
          Refresh Analysis
        </button>
      </div>

      {/* Main Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Overall Alignment Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overall Alignment
            </h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(analysis.overall_alignment_score)}`}>
              {analysis.overall_alignment_score}%
            </span>
          </div>
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreBg(analysis.overall_alignment_score)} transition-all duration-500`}
              style={{ width: `${analysis.overall_alignment_score}%` }}
            />
          </div>
        </motion.div>

        {/* Profile vs Applications Match */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Profile-Application Match
            </h3>
            <Briefcase className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(analysis.profile_vs_applications_match)}`}>
              {analysis.profile_vs_applications_match}%
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            How well your applications align with your profile
          </p>
        </motion.div>

        {/* Direction Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Direction Assessment
            </h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${directionBadge.bg}`}>
            <DirectionIcon className={`h-5 w-5 ${directionBadge.text}`} />
            <span className={`text-lg font-semibold ${directionBadge.text}`}>
              {directionBadge.label}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Honest Feedback Banner */}
      {analysis.honest_feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Honest Feedback
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis.honest_feedback}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Critical Mismatches */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Critical Mismatches
          </h3>
          {analysis.critical_mismatches && analysis.critical_mismatches.length > 0 ? (
            <div className="space-y-4">
              {analysis.critical_mismatches.map((mismatch, index) => {
                const severity = getSeverityStyles(mismatch.severity);
                const SeverityIcon = severity.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`${severity.bg} border-l-4 ${severity.border} rounded-r-xl p-5`}
                  >
                    <div className="flex items-start gap-3">
                      <SeverityIcon className={`h-5 w-5 ${severity.iconColor} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {mismatch.type}
                          </span>
                          <span className={`text-xs font-semibold uppercase ${severity.iconColor}`}>
                            {mismatch.severity}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {mismatch.description}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                          "{mismatch.evidence}"
                        </p>
                        <div className="flex items-start gap-2 mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {mismatch.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 text-center border border-green-200 dark:border-green-800">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-green-700 dark:text-green-300 font-medium">
                No critical mismatches detected! Your job search is well-aligned.
              </p>
            </div>
          )}
        </div>

        {/* Corrective Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400" />
            Recommended Actions
          </h3>
          {analysis.corrective_actions && analysis.corrective_actions.length > 0 ? (
            <div className="space-y-3">
              {analysis.corrective_actions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {action}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">
                Keep up the good work! No corrective actions needed.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Application Patterns */}
      {analysis.application_patterns && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Application Patterns
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Companies Targeted */}
            {analysis.application_patterns.companies_targeted && analysis.application_patterns.companies_targeted.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Top Companies Targeted
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.application_patterns.companies_targeted.slice(0, 8).map((company, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Roles Applied */}
            {analysis.application_patterns.roles_applied && analysis.application_patterns.roles_applied.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Top Roles Applied
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.application_patterns.roles_applied.slice(0, 8).map((role, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time Wasted Analysis */}
          {analysis.application_patterns.time_wasted_analysis && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                    Time Investment Analysis
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {analysis.application_patterns.time_wasted_analysis}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Rate by Type */}
          {analysis.application_patterns.success_rate_by_type && analysis.application_patterns.success_rate_by_type.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Success Rate by Application Type
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analysis.application_patterns.success_rate_by_type.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center"
                  >
                    <div className={`text-2xl font-bold ${getScoreColor(item.rate)}`}>
                      {item.rate}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {item.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Campaign Analysis */}
      {analysis.campaign_analysis && analysis.campaign_analysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Campaign Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.campaign_analysis.map((campaign, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {campaign.campaign_name}
                  </h4>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBg(campaign.alignment_score)} ${getScoreColor(campaign.alignment_score)}`}>
                    {campaign.alignment_score}%
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {campaign.feedback}
                </p>
                {campaign.issues && campaign.issues.length > 0 && (
                  <div className="space-y-1">
                    {campaign.issues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}







