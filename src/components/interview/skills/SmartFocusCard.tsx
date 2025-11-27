import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, TrendingUp, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { SkillFocusRecommendation } from '../../../services/skillFocusAnalyzer';

interface SmartFocusCardProps {
  recommendation: SkillFocusRecommendation;
  onStartPlan: (skill: string) => void;
  onPractice: (skill: string) => void;
}

export default function SmartFocusCard({
  recommendation,
  onStartPlan,
  onPractice,
}: SmartFocusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 14) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getUrgencyBg = (days: number) => {
    if (days <= 7) return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    if (days <= 14) return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative overflow-hidden rounded-[14px] bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/30 dark:to-indigo-900/30 px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-purple-200/50 dark:ring-purple-800/50 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(139,92,246,0.15)]"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 opacity-50" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Focus on: {recommendation.skill}
                </h3>
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {recommendation.reasoning[0]}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            )}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`px-3 py-2 rounded-[8px] border ${getUrgencyBg(recommendation.daysUntilInterview)}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className={`w-3.5 h-3.5 ${getUrgencyColor(recommendation.daysUntilInterview)}`} />
              <span className={`text-xs font-semibold ${getUrgencyColor(recommendation.daysUntilInterview)}`}>
                {recommendation.daysUntilInterview === 0
                  ? 'Today'
                  : recommendation.daysUntilInterview === 1
                  ? 'Tomorrow'
                  : `${recommendation.daysUntilInterview} days`}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Until interview</p>
          </div>
          
          <div className="px-3 py-2 rounded-[8px] border border-purple-200/50 bg-purple-50/50 dark:border-purple-800/50 dark:bg-purple-900/20">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Gap {recommendation.gap}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Current rating: {recommendation.rating}/5</p>
          </div>
          
          {recommendation.jobDescriptionMentions > 0 && (
            <div className="px-3 py-2 rounded-[8px] border border-indigo-200/50 bg-indigo-50/50 dark:border-indigo-800/50 dark:bg-indigo-900/20">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {recommendation.jobDescriptionMentions}x
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">In job description</p>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-purple-200/50 dark:border-purple-800/50">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 uppercase tracking-wide">
                  Why this skill?
                </p>
                <ul className="space-y-1.5">
                  {recommendation.reasoning.slice(1).map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4">
          <motion.button
            onClick={() => onStartPlan(recommendation.skill)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 transition-colors dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            <Clock className="w-4 h-4" />
            Start 30-min Plan
          </motion.button>
          <motion.button
            onClick={() => onPractice(recommendation.skill)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] border border-purple-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-white hover:border-purple-300 transition-colors dark:border-purple-800 dark:bg-white/5 dark:text-purple-300 dark:hover:bg-white/10"
          >
            <Sparkles className="w-4 h-4" />
            Practice Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

