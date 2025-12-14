import { motion } from 'framer-motion';
import { MessageSquare, Target, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

interface Question {
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'culture';
  tip: string;
}

interface PreparationArea {
  area: string;
  currentLevel: number;
  importance: 'critical' | 'high' | 'medium';
  advice: string;
}

interface InterviewReadinessData {
  summary: string;
  readinessScore: number;
  topQuestions: Question[];
  preparationAreas: PreparationArea[];
  redFlags: string[];
  mockInterviewFocus: string;
  honestFeedback?: string;
  correctiveActions?: string[];
}

interface InterviewReadinessInsightProps {
  data?: InterviewReadinessData | null;
}

export default function InterviewReadinessInsight({ data }: InterviewReadinessInsightProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to see your interview readiness.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-pink-600 dark:text-pink-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-pink-500';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'technical':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'situational':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'culture':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-[#2b2a2c] dark:text-gray-400';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-amber-500';
      default:
        return 'border-l-emerald-500';
    }
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Readiness Score */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-pink-500" />
          Interview Readiness Score
        </h4>
        
        <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl">
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className={`text-4xl font-bold ${getScoreColor(data.readinessScore)}`}>
                {data.readinessScore}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Ready for interviews
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.readinessScore}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full ${getScoreBgColor(data.readinessScore)}`}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {data.summary}
          </p>
        </div>
      </section>

      {/* Honest Feedback Section - NEW */}
      {data.honestFeedback && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Interview Preparation Reality Check
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
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Priority Preparation Steps
          </h4>
          <div className="space-y-2">
            {data.correctiveActions.map((action, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-xs font-bold text-pink-600 dark:text-pink-400 flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{action}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Top Questions to Prepare */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-pink-500" />
          Questions You'll Likely Face
        </h4>
        
        <div className="space-y-3">
          {data.topQuestions?.map((q, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 dark:bg-[#2b2a2c]/40 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">
                  "{q.question}"
                </p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${getCategoryColor(q.category)}`}>
                  {q.category}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                {q.tip}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Preparation Areas */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-pink-500" />
          Areas to Prepare
        </h4>
        
        <div className="space-y-3">
          {data.preparationAreas?.map((area, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 bg-white dark:bg-[#2b2a2c]/40 rounded-lg border-l-4 ${getImportanceColor(area.importance)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                  {area.area}
                </h5>
                <span className={`text-xs font-medium ${
                  area.currentLevel >= 70 ? 'text-emerald-600' : area.currentLevel >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {area.currentLevel}% ready
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-[#3d3c3e] rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${area.currentLevel}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${
                    area.currentLevel >= 70 ? 'bg-emerald-500' : area.currentLevel >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {area.advice}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Red Flags to Avoid */}
      {data.redFlags && data.redFlags.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Avoid These Mistakes
          </h4>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/30">
            <ul className="space-y-2">
              {data.redFlags.map((flag, index) => (
                <li key={index} className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Mock Interview Suggestion */}
      {data.mockInterviewFocus && (
        <section className="p-4 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-lg">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Recommended Mock Interview Focus
          </p>
          <p className="text-sm text-gray-900 dark:text-white">
            {data.mockInterviewFocus}
          </p>
        </section>
      )}
    </div>
  );
}
