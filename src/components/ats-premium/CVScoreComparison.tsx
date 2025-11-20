import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Minus, ChevronDown, ChevronUp,
  Sparkles, Award, CheckCircle2,
  Zap, BarChart3
} from 'lucide-react';
import { useState } from 'react';
import type { PremiumScoreAnalysis } from '../../lib/premiumScoreAnalyzer';

interface CVScoreComparisonProps {
  original: {
    overall: number;
    skills: number;
    experience: number;
  };
  optimized: {
    overall: number;
    skills: number;
    experience: number;
  };
  premiumAnalysis?: PremiumScoreAnalysis;
}

function MetricCard({
  label,
  original,
  optimized,
  icon: Icon,
  delay = 0
}: {
  label: string;
  original: number;
  optimized: number;
  icon: any;
  delay?: number;
}) {
  const improvement = optimized - original;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white dark:bg-[#26262B] rounded-2xl p-4 border border-gray-100 dark:border-[#2A2A2E] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${improvement > 0
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
          {improvement > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {improvement > 0 ? '+' : ''}{improvement}%
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{optimized}%</span>
          <span className="text-xs text-gray-400 line-through">{original}%</span>
        </div>
      </div>

      <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${optimized}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className={`h-full rounded-full ${optimized >= 80 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
              optimized >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                'bg-gradient-to-r from-orange-400 to-orange-500'
            }`}
        />
      </div>
    </motion.div>
  );
}

export default function CVScoreComparison({ original, optimized, premiumAnalysis }: CVScoreComparisonProps) {
  const [showDetails, setShowDetails] = useState(false);
  const overallImprovement = optimized.overall - original.overall;

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm border border-white/10">
                Overall Match
              </span>
              {overallImprovement > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-300">
                  <TrendingUp className="w-3 h-3" />
                  +{overallImprovement} pts
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-bold tracking-tight">{optimized.overall}%</h2>
              <span className="text-lg text-blue-100/60 line-through">{original.overall}%</span>
            </div>
            <p className="mt-2 text-sm text-blue-100/80 max-w-[200px] leading-relaxed">
              Your resume is now highly optimized for this position.
            </p>
          </div>

          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                className="text-white/10"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="48"
                cy="48"
              />
              <motion.circle
                className="text-white"
                strokeWidth="8"
                strokeDasharray={263}
                initial={{ strokeDashoffset: 263 }}
                animate={{ strokeDashoffset: 263 - (optimized.overall / 100) * 263 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="42"
                cx="48"
                cy="48"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Skills Match"
          original={original.skills}
          optimized={optimized.skills}
          icon={Zap}
          delay={0.1}
        />
        <MetricCard
          label="Experience"
          original={original.experience}
          optimized={optimized.experience}
          icon={BarChart3}
          delay={0.2}
        />
      </div>

      {/* Premium Insights */}
      {premiumAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 dark:bg-[#26262B]/50 rounded-2xl p-5 border border-gray-100 dark:border-[#2A2A2E]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" />
              Key Improvements
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {showDetails ? 'Show Less' : 'View Details'}
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="space-y-3">
            {premiumAnalysis.improvements.slice(0, showDetails ? undefined : 2).map((imp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {imp.category}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {imp.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4"
              >
                {/* Quality Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-white dark:bg-[#1E1F22] rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] text-gray-500 mb-1">ATS Score</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{premiumAnalysis.qualityMetrics.atsScore}%</div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-[#1E1F22] rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] text-gray-500 mb-1">Quality</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{premiumAnalysis.qualityMetrics.realQualityScore}%</div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-[#1E1F22] rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] text-gray-500 mb-1">Targeting</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{premiumAnalysis.qualityMetrics.targetingScore}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Strong Points</h4>
                  <div className="space-y-2">
                    {premiumAnalysis.insights.strongPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
