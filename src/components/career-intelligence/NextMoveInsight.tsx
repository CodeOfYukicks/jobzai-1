import { motion } from 'framer-motion';
import { Building2, MapPin, TrendingUp, ArrowRight, Briefcase, AlertTriangle, CheckCircle, XCircle, Lightbulb, Target } from 'lucide-react';

interface Company {
  name: string;
  matchScore: number;
  industry: string;
  location: string;
  whyMatch: string;
  topRole?: string;
  alreadyApplied?: boolean;
}

interface CareerStep {
  title: string;
  timeline: string;
  description: string;
}

interface AlignmentAnalysis {
  profileVsApplicationsMatch: number;
  directionAssessment: 'on-track' | 'misaligned' | 'over-reaching' | 'under-selling';
  criticalIssues: string[];
  honestFeedback: string;
}

interface NextMoveData {
  summary: string;
  opportunityCount: number;
  topCompanies: Company[];
  careerPath: {
    currentPosition: string;
    targetPosition: string;
    steps: CareerStep[];
  };
  alignmentAnalysis?: AlignmentAnalysis;
  honestFeedback?: string;
  correctiveActions?: string[];
}

interface NextMoveInsightProps {
  data?: NextMoveData | null;
}

const getDirectionColor = (direction: string) => {
  switch (direction) {
    case 'on-track':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    case 'misaligned':
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
    case 'over-reaching':
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    case 'under-selling':
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
  }
};

const getDirectionIcon = (direction: string) => {
  switch (direction) {
    case 'on-track':
      return CheckCircle;
    case 'misaligned':
    case 'over-reaching':
      return AlertTriangle;
    case 'under-selling':
      return Target;
    default:
      return AlertTriangle;
  }
};

const getDirectionLabel = (direction: string) => {
  switch (direction) {
    case 'on-track':
      return 'On Track';
    case 'misaligned':
      return 'Needs Adjustment';
    case 'over-reaching':
      return 'Over-reaching';
    case 'under-selling':
      return 'Under-selling';
    default:
      return direction;
  }
};

export default function NextMoveInsight({ data }: NextMoveInsightProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to see your opportunities.
        </p>
      </div>
    );
  }

  const DirectionIcon = data.alignmentAnalysis?.directionAssessment 
    ? getDirectionIcon(data.alignmentAnalysis.directionAssessment)
    : AlertTriangle;

  return (
    <div className="space-y-8 pt-4">
      {/* Alignment Analysis Section - NEW */}
      {data.alignmentAnalysis && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl border-2 border-indigo-200 dark:border-indigo-800/50 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/20 dark:to-[#2b2a2c]"
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Job Search Alignment Analysis
          </h4>

          {/* Direction Assessment */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getDirectionColor(data.alignmentAnalysis.directionAssessment)}`}>
              <DirectionIcon className="w-4 h-4" />
              {getDirectionLabel(data.alignmentAnalysis.directionAssessment)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Profile Match:</span>
              <span className={`text-lg font-bold ${data.alignmentAnalysis.profileVsApplicationsMatch >= 70 ? 'text-emerald-600' : data.alignmentAnalysis.profileVsApplicationsMatch >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {data.alignmentAnalysis.profileVsApplicationsMatch}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.alignmentAnalysis.profileVsApplicationsMatch}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                data.alignmentAnalysis.profileVsApplicationsMatch >= 70 
                  ? 'bg-emerald-500' 
                  : data.alignmentAnalysis.profileVsApplicationsMatch >= 50 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
              }`}
            />
          </div>

          {/* Critical Issues */}
          {data.alignmentAnalysis.criticalIssues?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Critical Issues</p>
              <div className="space-y-2">
                {data.alignmentAnalysis.criticalIssues.map((issue, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alignment Feedback */}
          {data.alignmentAnalysis.honestFeedback && (
            <div className="p-3 bg-white/60 dark:bg-[#2b2a2c]/60 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {data.alignmentAnalysis.honestFeedback}
              </p>
            </div>
          )}
        </motion.section>
      )}

      {/* Honest Feedback Section - NEW */}
      {data.honestFeedback && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Reality Check
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                {data.honestFeedback}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Corrective Actions - NEW */}
      {data.correctiveActions && data.correctiveActions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Recommended Corrections
          </h4>
          <div className="space-y-2">
            {data.correctiveActions.map((action, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Top Companies */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-500" />
          Top Matching Companies
        </h4>
        
        <div className="space-y-3">
          {data.topCompanies?.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group p-4 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg
                border border-transparent hover:border-gray-200 dark:hover:border-gray-700
                transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {company.name}
                    </h5>
                    {company.alreadyApplied && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        Applied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {company.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {company.location}
                    </span>
                  </div>
                </div>
                
                {/* Match Score */}
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${
                      company.matchScore >= 80 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : company.matchScore >= 60 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {company.matchScore}%
                    </span>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      match
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {company.whyMatch}
              </p>
              
              {company.topRole && (
                <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-[#3d3c3e]/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Best fit role: <span className="text-gray-700 dark:text-gray-300 font-medium">{company.topRole}</span>
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Career Path */}
      {data.careerPath && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Recommended Career Path
          </h4>
          
          {/* Path Header */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {data.careerPath.currentPosition}
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {data.careerPath.targetPosition}
            </span>
          </div>
          
          {/* Steps Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-200 dark:bg-[#3d3c3e]" />
            
            <div className="space-y-4">
              {data.careerPath.steps?.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="relative flex gap-4 pl-6"
                >
                  {/* Dot */}
                  <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full 
                    bg-white dark:bg-[#242325] border-2 border-indigo-500 z-10" />
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {step.title}
                      </h5>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {step.timeline}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
