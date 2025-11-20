import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Target, Sparkles, Award, AlertCircle, CheckCircle2, Info } from 'lucide-react';
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

function ScoreBar({ 
  label, 
  original, 
  optimized, 
  maxValue = 100,
  reasons = []
}: { 
  label: string; 
  original: number; 
  optimized: number; 
  maxValue?: number;
  reasons?: string[];
}) {
  const improvement = optimized - original;
  const [showReasons, setShowReasons] = useState(false);
  
  const getImprovementIcon = () => {
    if (improvement > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (improvement < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-purple-500 to-indigo-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    return 'from-pink-500 to-rose-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
          {reasons.length > 0 && (
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Info className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-500 line-through">
            {original}%
          </span>
          <span className={`font-semibold ${
            improvement > 0 ? 'text-green-600 dark:text-green-400' : 
            improvement < 0 ? 'text-red-600 dark:text-red-400' : 
            'text-gray-600 dark:text-gray-400'
          }`}>
            {optimized}%
          </span>
          {improvement !== 0 && (
            <div className={`flex items-center gap-0.5 text-xs ${
              improvement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {getImprovementIcon()}
              <span className="font-medium">
                {improvement > 0 ? '+' : ''}{improvement}%
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Reasons dropdown */}
      <AnimatePresence>
        {showReasons && reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2 space-y-1"
          >
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        {/* Original score background (lighter) */}
        <div 
          className="absolute left-0 top-0 h-full bg-gray-200 dark:bg-gray-700 rounded-full"
          style={{ width: `${(original / maxValue) * 100}%` }}
        />
        
        {/* Optimized score overlay */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(optimized / maxValue) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getScoreColor(optimized)} rounded-full`}
        />
      </div>
    </div>
  );
}

function QualityBadge({ quality }: { quality: 'excellent' | 'good' | 'fair' | 'needs-improvement' }) {
  const config = {
    'excellent': { color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', icon: '🏆', label: 'Excellent' },
    'good': { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: '✨', label: 'Good' },
    'fair': { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: '👍', label: 'Fair' },
    'needs-improvement': { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', icon: '📈', label: 'Can Improve' }
  };

  const { color, icon, label } = config[quality];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${color} text-xs font-semibold`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 85) return 'bg-green-500';
    if (confidence >= 70) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">Confidence Level</span>
        <span className="font-semibold text-gray-900 dark:text-white">{confidence}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${getColor()} rounded-full`}
        />
      </div>
    </div>
  );
}

export default function CVScoreComparison({ original, optimized, premiumAnalysis }: CVScoreComparisonProps) {
  const [showDetails, setShowDetails] = useState(false);
  const overallImprovement = optimized.overall - original.overall;
  const overallImprovementPercent = original.overall > 0 
    ? Math.round((overallImprovement / original.overall) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2E]"
    >
      <div className="space-y-4">
        {/* Header with Quality Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Score Comparison
            </h4>
            {premiumAnalysis && (
              <QualityBadge quality={premiumAnalysis.qualityMetrics.overallQuality} />
            )}
          </div>
          {overallImprovement > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-semibold">+{overallImprovement} pts</span>
            </div>
          )}
          {overallImprovement === 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              <Minus className="w-3 h-3" />
              <span className="text-xs font-semibold">Maintained</span>
            </div>
          )}
          {overallImprovement < 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
              <AlertCircle className="w-3 h-3" />
              <span className="text-xs font-semibold">Review Needed</span>
            </div>
          )}
        </div>

        {/* Overall Score - Highlighted */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Overall Match</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-500 line-through">
                {original.overall}%
              </span>
              <span className={`text-lg font-bold ${
                overallImprovement > 0 ? 'text-green-600 dark:text-green-400' : 
                overallImprovement < 0 ? 'text-orange-600 dark:text-orange-400' : 
                'text-gray-900 dark:text-white'
              }`}>
                {optimized.overall}%
              </span>
              {overallImprovement !== 0 && (
                <span className={`text-xs font-semibold ${
                  overallImprovement > 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {overallImprovement > 0 ? '+' : ''}{overallImprovement}%
                </span>
              )}
            </div>
          </div>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gray-300 dark:bg-gray-600 rounded-full"
              style={{ width: `${original.overall}%` }}
            />
            <motion.div
              initial={{ width: `${original.overall}%` }}
              animate={{ width: `${optimized.overall}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`absolute left-0 top-0 h-full bg-gradient-to-r ${
                optimized.overall >= 80 ? 'from-purple-500 to-indigo-500' :
                optimized.overall >= 60 ? 'from-blue-500 to-cyan-500' :
                'from-pink-500 to-rose-500'
              } rounded-full`}
            />
          </div>
        </div>

        {/* Premium Analysis Insights */}
        {premiumAnalysis && (
          <div className="space-y-3">
            {/* Key Improvements */}
            {premiumAnalysis.improvements.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Key Improvements
                </h5>
                <div className="space-y-1.5">
                  {premiumAnalysis.improvements.slice(0, 3).map((improvement, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <span className="text-sm">{improvement.icon}</span>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{improvement.category}:</span>
                        {' '}{improvement.description}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/30">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">ATS Match</div>
                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {premiumAnalysis.qualityMetrics.atsScore}%
                </div>
              </div>
              <div className="text-center border-x border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Content Quality</div>
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {premiumAnalysis.qualityMetrics.realQualityScore}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Job Targeting</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {premiumAnalysis.qualityMetrics.targetingScore}%
                </div>
              </div>
            </div>

            {/* Confidence Level */}
            <ConfidenceMeter confidence={premiumAnalysis.confidenceLevel} />
          </div>
        )}

        {/* Sub-scores */}
        <div className="space-y-3">
          <ScoreBar 
            label="Skills" 
            original={original.skills} 
            optimized={optimized.skills}
            reasons={premiumAnalysis?.comparison.skills.reasons}
          />
          <ScoreBar 
            label="Experience" 
            original={original.experience} 
            optimized={optimized.experience}
            reasons={premiumAnalysis?.comparison.experience.reasons}
          />
        </div>

        {/* Expandable Details Section */}
        {premiumAnalysis && (
          <div className="border-t border-gray-200 dark:border-[#2A2A2E] pt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Detailed Analysis
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3"
                >
                  {/* Strong Points */}
                  {premiumAnalysis.insights.strongPoints.length > 0 && (
                    <div className="space-y-1.5">
                      <h6 className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Strong Points
                      </h6>
                      {premiumAnalysis.insights.strongPoints.map((point, idx) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                          • {point}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {premiumAnalysis.recommendations.length > 0 && (
                    <div className="space-y-1.5">
                      <h6 className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Recommendations
                      </h6>
                      {premiumAnalysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optimization Areas */}
                  {premiumAnalysis.insights.optimizationAreas.length > 0 && (
                    <div className="space-y-1.5">
                      <h6 className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Optimization Areas
                      </h6>
                      {premiumAnalysis.insights.optimizationAreas.map((area, idx) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                          • {area}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Improvement Summary */}
        {overallImprovement > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-[#2A2A2E]">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {overallImprovementPercent > 0 ? `+${overallImprovementPercent}%` : `${overallImprovementPercent}%`}
              </span>
              {' '}improvement vs. original CV
            </p>
          </div>
        )}

        {/* Warning message if score didn't improve (shouldn't happen with new algo) */}
        {overallImprovement <= 0 && (
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                The tailored CV has a similar score to the original. This may indicate that your original CV was already well-optimized. 
                {premiumAnalysis && (
                  <> Note that the <strong>quality score ({premiumAnalysis.qualityMetrics.realQualityScore}%)</strong> and <strong>targeting ({premiumAnalysis.qualityMetrics.targetingScore}%)</strong> may still show improvements in content quality.</>
                )}
              </span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
