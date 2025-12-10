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
      <div className="flex-1 min-h-0 flex flex-col">
        <AnimatePresence mode="wait">
          {!showLevelSelector ? (
            // Initial View - Generate Button - Truly Centered
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col items-center justify-center p-5"
            >
              <div className="relative group mb-5">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                <div className="relative w-14 h-14 rounded-xl bg-white dark:bg-[#3d3c3e] border border-gray-100 dark:border-[#4a494b] flex items-center justify-center shadow-lg">
                  <Wand2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                  Tailor Your Resume
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[220px]">
                  Generate a CV optimized for this job using AI
                </p>
              </div>

              <button
                onClick={() => setShowLevelSelector(true)}
                className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Tailored CV</span>
                <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ATS Ready
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Keywords
                </span>
              </div>
            </motion.div>
          ) : (
            // Level Selection View - Full Panel Premium Design
            <motion.div
              key="levels"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {/* Minimal Header */}
              <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b border-gray-100 dark:border-[#3d3c3e]">
                <button
                  onClick={() => setShowLevelSelector(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors group"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                </button>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Choose Intensity
                </h3>
              </div>

              {/* Level Cards */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {(['conservative', 'balanced', 'optimized'] as AdaptationLevel[]).map((levelKey) => {
                  const level = levelData[levelKey];
                  const Icon = levelIcons[levelKey];
                  const colors = levelColors[levelKey];
                  const isSelected = selectedLevel === levelKey;

                  return (
                    <button
                      key={levelKey}
                      onClick={() => setSelectedLevel(levelKey)}
                      className={`relative w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? `${colors.selectedBorder} ${colors.bg}`
                          : `border-gray-200 dark:border-[#3d3c3e] bg-white dark:bg-[#242325] hover:border-gray-300 dark:hover:border-[#4a494b]`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon Container */}
                        <div className={`p-2 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${colors.icon}`} strokeWidth={2} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {level.name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors.badge}`}>
                              {level.scoreGain}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {level.description}
                          </p>

                          {/* Features */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {level.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] text-gray-400 dark:text-gray-500"
                              >
                                • {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Generate Button */}
              <div className="px-4 py-4 flex-shrink-0 border-t border-gray-100 dark:border-[#3d3c3e]">
                <button
                  onClick={handleConfirmLevel}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate CV</span>
                </button>
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
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center p-5">
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-14 h-14 rounded-xl bg-white dark:bg-[#3d3c3e] shadow-lg border border-gray-100 dark:border-[#4a494b] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
          </div>
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
          Generating your CV...
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
          Optimizing content for this job
        </p>
      </div>
    );
  }

  // Get level info if available
  const levelInfo = cvRewrite?.adaptationLevel ? getLevelInfo(cvRewrite.adaptationLevel) : null;

  // Generated State
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Success Header - Compact */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30"
      >
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              Optimization Complete
            </span>
            {levelInfo && (
              <span className={`text-xs ${levelInfo.color}`}>
                • {levelInfo.name}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Primary Action - Simplified */}
      <button
        onClick={onViewFull}
        className="w-full group flex items-center justify-between p-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 dark:bg-gray-100 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">View & Edit Resume</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Open in editor
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
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

      {/* Suggested Additions */}
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

