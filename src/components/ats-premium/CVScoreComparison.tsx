import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
}

function ScoreBar({ 
  label, 
  original, 
  optimized, 
  maxValue = 100 
}: { 
  label: string; 
  original: number; 
  optimized: number; 
  maxValue?: number;
}) {
  const improvement = optimized - original;
  
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
        <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
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

export default function CVScoreComparison({ original, optimized }: CVScoreComparisonProps) {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Score Comparison
          </h4>
          {overallImprovement > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-semibold">+{overallImprovement} points</span>
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
                overallImprovement < 0 ? 'text-red-600 dark:text-red-400' : 
                'text-gray-900 dark:text-white'
              }`}>
                {optimized.overall}%
              </span>
              {overallImprovement !== 0 && (
                <span className={`text-xs font-semibold ${
                  overallImprovement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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

        {/* Sub-scores */}
        <div className="space-y-3">
          <ScoreBar 
            label="Skills" 
            original={original.skills} 
            optimized={optimized.skills} 
          />
          <ScoreBar 
            label="Experience" 
            original={original.experience} 
            optimized={optimized.experience} 
          />
        </div>

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
      </div>
    </motion.div>
  );
}

