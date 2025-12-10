import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ChevronDown, ChevronUp,
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
      className="bg-white dark:bg-[#242325] rounded-xl p-3.5 border border-gray-100 dark:border-[#3d3c3e]"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="p-1.5 bg-gray-50 dark:bg-[#3d3c3e] rounded-lg">
          <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
          improvement > 0
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-gray-50 text-gray-500 dark:bg-[#3d3c3e] dark:text-gray-400'
        }`}>
          <TrendingUp className="w-2.5 h-2.5" />
          +{improvement}%
        </span>
      </div>

      <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold text-gray-900 dark:text-white">{optimized}%</span>
        <span className="text-[10px] text-gray-400 line-through">{original}%</span>
      </div>

      <div className="mt-2.5 h-1 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${optimized}%` }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className={`h-full rounded-full ${
            optimized >= 80 ? 'bg-indigo-500' :
            optimized >= 60 ? 'bg-blue-500' : 'bg-orange-500'
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
    <div className="space-y-4">
      {/* Main Score Card - Compact */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 text-white"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-medium">
                Overall Match
              </span>
              {overallImprovement > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                  <TrendingUp className="w-2.5 h-2.5" />
                  +{overallImprovement} pts
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">{optimized.overall}%</h2>
              <span className="text-sm text-blue-200/60 line-through">{original.overall}%</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-100/70 leading-relaxed">
              Optimized for this position
            </p>
          </div>

          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                className="text-white/10"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
                r="28"
                cx="32"
                cy="32"
              />
              <motion.circle
                className="text-white"
                strokeWidth="5"
                strokeDasharray={176}
                initial={{ strokeDashoffset: 176 }}
                animate={{ strokeDashoffset: 176 - (optimized.overall / 100) * 176 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="28"
                cx="32"
                cy="32"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-300" />
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

      {/* Premium Insights - Compact */}
      {premiumAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 dark:bg-[#242325] rounded-xl p-4 border border-gray-100 dark:border-[#3d3c3e]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              Key Improvements
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              {showDetails ? 'Less' : 'View Details'}
              {showDetails ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          </div>

          <div className="space-y-2.5">
            {premiumAnalysis.improvements.slice(0, showDetails ? undefined : 2).map((imp, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="flex gap-2.5"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-900 dark:text-white">
                    {imp.category}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
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
                className="mt-3 pt-3 border-t border-gray-200 dark:border-[#3d3c3e] space-y-3"
              >
                {/* Quality Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-white dark:bg-[#1E1F22] rounded-lg border border-gray-100 dark:border-[#3d3c3e]">
                    <div className="text-[9px] text-gray-500 mb-0.5">ATS</div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{premiumAnalysis.qualityMetrics.atsScore}%</div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-[#1E1F22] rounded-lg border border-gray-100 dark:border-[#3d3c3e]">
                    <div className="text-[9px] text-gray-500 mb-0.5">Quality</div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{premiumAnalysis.qualityMetrics.realQualityScore}%</div>
                  </div>
                  <div className="text-center p-2 bg-white dark:bg-[#1E1F22] rounded-lg border border-gray-100 dark:border-[#3d3c3e]">
                    <div className="text-[9px] text-gray-500 mb-0.5">Target</div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{premiumAnalysis.qualityMetrics.targetingScore}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-medium text-gray-900 dark:text-white mb-1.5">Strong Points</h4>
                  <div className="space-y-1.5">
                    {premiumAnalysis.insights.strongPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
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
