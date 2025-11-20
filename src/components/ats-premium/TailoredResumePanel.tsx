import { motion } from 'framer-motion';
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Wand2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import CVScoreComparison from './CVScoreComparison';
import { PremiumATSAnalysis, CVRewrite } from '../../types/premiumATS';

interface TailoredResumePanelProps {
  analysis: PremiumATSAnalysis | null;
  cvRewrite: CVRewrite | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onViewFull: () => void;
  optimizedScore?: {
    overall: number;
    skills: number;
    experience: number;
  };
  premiumAnalysis?: any;
}

export default function TailoredResumePanel({
  analysis,
  cvRewrite,
  isGenerating,
  onGenerate,
  onViewFull,
  optimizedScore,
  premiumAnalysis
}: TailoredResumePanelProps) {

  // Empty State - Not generated yet
  if (!cvRewrite && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
          <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-[#26262B] border border-gray-100 dark:border-[#2A2A2E] flex items-center justify-center shadow-xl">
            <Wand2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="space-y-3 max-w-[280px]">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Tailor Your Resume
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Generate a version of your CV specifically optimized for this job description using our advanced AI.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={onGenerate}
            className="w-full group relative inline-flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
            <Sparkles className="w-4 h-4" />
            <span>Generate Tailored CV</span>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> ATS Optimized
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Keyword Rich
            </span>
          </div>
        </div>
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
          <div>
            <h3 className="text-sm font-bold text-green-900 dark:text-green-100">
              Optimization Complete
            </h3>
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
    </div>
  );
}
