import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Wand2,
  ChevronRight,
  Loader2,
  Shield,
  Scale,
  Rocket,
  Check,
  ChevronLeft
} from 'lucide-react';
import CVScoreComparison from './CVScoreComparison';
import SuggestedAdditionsPanel from './SuggestedAdditionsPanel';
import { PremiumATSAnalysis, CVRewrite, AdaptationLevel } from '../../types/premiumATS';

interface TailoredResumePanelProps {
  analysis: PremiumATSAnalysis | null;
  cvRewrite: CVRewrite | null;
  isGenerating: boolean;
  onGenerate: (level: AdaptationLevel) => void;
  onViewFull: () => void;
  optimizedScore?: {
    overall: number;
    skills: number;
    experience: number;
  };
  premiumAnalysis?: any;
}

// Get adaptation level display info
const getLevelInfo = (level: AdaptationLevel) => {
  const icons = { conservative: Shield, balanced: Scale, optimized: Rocket };
  const colors = {
    conservative: 'text-blue-600 dark:text-blue-400',
    balanced: 'text-purple-600 dark:text-purple-400',
    optimized: 'text-amber-600 dark:text-amber-400',
  };
  const names = {
    conservative: 'Conservative',
    balanced: 'Balanced',
    optimized: 'Maximum',
  };
  return {
    Icon: icons[level],
    color: colors[level],
    name: names[level],
  };
};

// Level data for inline selector
const levelData: Record<AdaptationLevel, {
  name: string;
  description: string;
  features: string[];
  scoreGain: string;
}> = {
  conservative: {
    name: 'Conservative',
    description: 'Light edits, keeps your voice',
    features: ['Grammar fixes', 'Formatting', '3-5 keywords'],
    scoreGain: '+5-10%',
  },
  balanced: {
    name: 'Balanced',
    description: 'Moderate optimization',
    features: ['Enhanced bullets', '10-15 keywords', 'Better summary'],
    scoreGain: '+15-25%',
  },
  optimized: {
    name: 'Maximum',
    description: 'Full transformation',
    features: ['Complete rewrite', '20+ keywords', 'Senior tone'],
    scoreGain: '+30-40%',
  },
};

const levelIcons = {
  conservative: Shield,
  balanced: Scale,
  optimized: Rocket,
};

const levelColors = {
  conservative: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    selectedBorder: 'border-blue-500',
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-400',
    shadow: 'shadow-blue-500/20',
  },
  balanced: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    selectedBorder: 'border-purple-500',
    icon: 'text-purple-500',
    iconBg: 'bg-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-400',
    shadow: 'shadow-purple-500/20',
  },
  optimized: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    selectedBorder: 'border-amber-500',
    icon: 'text-amber-500',
    iconBg: 'bg-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-400',
    shadow: 'shadow-amber-500/20',
  },
};

export default function TailoredResumePanel({
  analysis,
  cvRewrite,
  isGenerating,
  onGenerate,
  onViewFull,
  optimizedScore,
  premiumAnalysis
}: TailoredResumePanelProps) {
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<AdaptationLevel>('balanced');

  const handleConfirmLevel = () => {
    onGenerate(selectedLevel);
  };

  // Empty State - Not generated yet
  if (!cvRewrite && !isGenerating) {
    return (
      <div className="h-full flex flex-col">
        <AnimatePresence mode="wait">
          {!showLevelSelector ? (
            // Initial View - Generate Button
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-[#26262B] border border-gray-100 dark:border-[#2A2A2E] flex items-center justify-center shadow-xl">
                  <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div className="space-y-2 max-w-[260px] mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  Tailor Your Resume
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Generate a CV optimized for this job using AI
                </p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={() => setShowLevelSelector(true)}
                  className="w-full group relative inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Tailored CV</span>
                  <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-3 text-[10px] font-medium text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> ATS Ready
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Keywords
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            // Level Selection View - Full Panel Premium Design
            <motion.div
              key="levels"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              {/* Minimal Header */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0">
                <button
                  onClick={() => setShowLevelSelector(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                </button>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                  Choose Intensity
                </h3>
              </div>

              {/* Level Cards - Full Height with Premium Spacing */}
              <div className="flex-1 flex flex-col px-4 py-3 gap-3">
                {(['conservative', 'balanced', 'optimized'] as AdaptationLevel[]).map((levelKey, index) => {
                  const level = levelData[levelKey];
                  const Icon = levelIcons[levelKey];
                  const colors = levelColors[levelKey];
                  const isSelected = selectedLevel === levelKey;

                  return (
                    <motion.button
                      key={levelKey}
                      onClick={() => setSelectedLevel(levelKey)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                        isSelected
                          ? `${colors.selectedBorder} ${colors.bg} shadow-lg ${colors.shadow}`
                          : `${colors.border} bg-white dark:bg-gray-900 hover:${colors.bg} hover:border-opacity-50`
                      }`}
                    >
                      {/* Selected State Background Gradient */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colors.bg} opacity-50`}
                        />
                      )}

                      <div className="relative flex items-start gap-3">
                        {/* Icon Container */}
                        <div className={`p-2.5 rounded-lg ${colors.iconBg} flex-shrink-0 shadow-sm`}>
                          <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                              {level.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.badge} shadow-sm`}>
                              {level.scoreGain}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                            {level.description}
                          </p>

                          {/* Features - Compact Layout */}
                          <div className="flex flex-col gap-1">
                            {level.features.map((feature, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400"
                              >
                                <div className={`w-1 h-1 rounded-full ${colors.icon.replace('text-', 'bg-')} flex-shrink-0`} />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Hover Glow Effect */}
                      {!isSelected && (
                        <motion.div
                          className={`absolute inset-0 rounded-xl ${colors.bg} opacity-0 hover:opacity-10 transition-opacity duration-300`}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Generate Button - Notion/Google-style Premium Hover */}
              <div className="px-4 pb-4 pt-3 flex-shrink-0 border-t border-gray-100 dark:border-gray-800">
                <motion.button
                  onClick={handleConfirmLevel}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full group flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-50 text-white dark:text-gray-900 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl ring-1 ring-gray-900/5 dark:ring-gray-200/50 hover:ring-gray-900/10 dark:hover:ring-gray-300/60 transition-all duration-200 ease-out"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate CV</span>
                  <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Loading State
  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-[#26262B] shadow-2xl border border-gray-100 dark:border-[#2A2A2E] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white animate-pulse">
            Crafting your tailored resume...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analyzing job requirements and optimizing your content.
          </p>
        </div>
      </div>
    );
  }

  // Get level info if available
  const levelInfo = cvRewrite?.adaptationLevel ? getLevelInfo(cvRewrite.adaptationLevel) : null;

  // Generated State
  return (
    <div className="space-y-6 pb-6">
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl p-5 border border-green-100 dark:border-green-900/20"
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-green-900 dark:text-green-100">
                Optimization Complete
              </h3>
              {levelInfo && (
                <span className={`flex items-center gap-1.5 text-xs font-medium ${levelInfo.color}`}>
                  <levelInfo.Icon className="w-3.5 h-3.5" />
                  {levelInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1.5 leading-relaxed">
              Your CV has been rewritten to better match the job description while maintaining your authentic voice.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Primary Action */}
      <button
        onClick={onViewFull}
        className="w-full group flex items-center justify-between p-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-gray-100 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">
              View & Edit Full Resume
            </div>
            <div className="text-xs text-gray-300 dark:text-gray-500 opacity-90">
              Open in editor to customize
            </div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-gray-100 flex items-center justify-center group-hover:bg-white/20 dark:group-hover:bg-gray-200 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Score Comparison */}
      {analysis?.match_scores && optimizedScore && (
        <CVScoreComparison
          original={{
            overall: analysis.match_scores.overall_score,
            skills: analysis.match_scores.skills_score,
            experience: analysis.match_scores.experience_score
          }}
          optimized={optimizedScore}
          premiumAnalysis={premiumAnalysis}
        />
      )}

      {/* Suggested Additions - bullets that couldn't be integrated into existing experiences */}
      {cvRewrite?.suggested_additions?.items && cvRewrite.suggested_additions.items.length > 0 && (
        <SuggestedAdditionsPanel
          suggestedAdditions={cvRewrite.suggested_additions}
          experiences={cvRewrite.structured_data?.experiences?.map(exp => ({
            id: exp.id,
            title: exp.title,
            company: exp.company
          })) || []}
        />
      )}
    </div>
  );
}
