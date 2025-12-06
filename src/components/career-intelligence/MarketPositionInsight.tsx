import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Star, AlertCircle, Award } from 'lucide-react';

interface Strength {
  title: string;
  description: string;
  competitiveEdge: string;
}

interface Weakness {
  title: string;
  description: string;
  howToImprove: string;
}

interface MarketPositionData {
  summary: string;
  marketFitScore: number;
  strengths: Strength[];
  weaknesses: Weakness[];
  uniqueValue: string;
  competitorComparison: string;
}

interface MarketPositionInsightProps {
  data?: MarketPositionData | null;
}

export default function MarketPositionInsight({ data }: MarketPositionInsightProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No data available yet. Generate insights to see your market position.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8 pt-4">
      {/* Market Fit Score */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-500" />
          Market Fit Score
        </h4>
        
        <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-4xl font-bold ${getScoreColor(data.marketFitScore)}`}>
                {data.marketFitScore}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Market competitiveness
              </p>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  className={getScoreColor(data.marketFitScore)}
                  initial={{ strokeDasharray: '0 220' }}
                  animate={{ strokeDasharray: `${(data.marketFitScore / 100) * 220} 220` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {data.summary}
          </p>
        </div>
      </section>

      {/* Competitive Strengths */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Your Competitive Strengths
        </h4>
        
        <div className="space-y-3">
          {data.strengths?.map((strength, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30"
            >
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {strength.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {strength.description}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                    💪 {strength.competitiveEdge}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Areas to Improve */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-amber-500" />
          Areas to Improve
        </h4>
        
        <div className="space-y-3">
          {data.weaknesses?.map((weakness, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {weakness.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {weakness.description}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
                    💡 {weakness.howToImprove}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Unique Value Proposition */}
      <section>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-violet-500" />
          Your Unique Value
        </h4>
        
        <div className="p-4 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
            "{data.uniqueValue}"
          </p>
        </div>
        
        {data.competitorComparison && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
            📊 {data.competitorComparison}
          </p>
        )}
      </section>
    </div>
  );
}

