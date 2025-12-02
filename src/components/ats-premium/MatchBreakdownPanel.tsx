import React from 'react';
import { Code, Briefcase, GraduationCap, Building2, Hash } from 'lucide-react';
import type { MatchBreakdown, MatchScores } from '../../types/premiumATS';

interface MatchBreakdownPanelProps {
  matchBreakdown: MatchBreakdown;
  matchScores: MatchScores;
}

interface CategoryCardProps {
  title: string;
  score: number;
  matched: string[];
  missing: string[];
  icon: React.ReactNode;
  explanations?: string;
}

function CategoryCard({ title, score, matched, missing, icon, explanations }: CategoryCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#635BFF] dark:text-[#a5a0ff]';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-[#635BFF] to-[#7c75ff]';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all duration-300 p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${getProgressColor(score)} transition-all duration-700 ease-out rounded-full`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {/* Matched Items */}
      {matched.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            ✓ Matched ({matched.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {matched.slice(0, 5).map((item, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200/60 dark:border-emerald-900/60"
              >
                {item}
              </span>
            ))}
            {matched.length > 5 && (
              <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                +{matched.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Missing Items */}
      {missing.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            ✗ Missing ({missing.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.slice(0, 5).map((item, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200/60 dark:border-rose-900/60"
              >
                {item}
              </span>
            ))}
            {missing.length > 5 && (
              <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                +{missing.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Explanations - Always shown for transparency */}
      <div className="pt-4 border-t border-gray-200/60 dark:border-gray-800/60">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
          📊 Analysis
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {explanations || 'Detailed analysis not available.'}
        </p>
      </div>
    </div>
  );
}

export default function MatchBreakdownPanel({ matchBreakdown, matchScores }: MatchBreakdownPanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <CategoryCard
        title="Skills"
        score={matchScores.skills_score}
        matched={matchBreakdown.skills.matched}
        missing={matchBreakdown.skills.missing}
        explanations={matchBreakdown.skills.explanations}
        icon={<Code className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />}
      />

      <CategoryCard
        title="Experience"
        score={matchScores.experience_score}
        matched={matchBreakdown.experience.matched}
        missing={matchBreakdown.experience.missing}
        explanations={matchBreakdown.experience.explanations}
        icon={<Briefcase className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />}
      />

      <CategoryCard
        title="Education"
        score={matchScores.education_score}
        matched={matchBreakdown.education.matched}
        missing={matchBreakdown.education.missing}
        explanations={matchBreakdown.education.explanations}
        icon={<GraduationCap className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />}
      />

      <CategoryCard
        title="Industry Fit"
        score={matchScores.industry_fit_score}
        matched={matchBreakdown.industry.matched}
        missing={matchBreakdown.industry.missing}
        explanations={matchBreakdown.industry.explanations}
        icon={<Building2 className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />}
      />

      {/* Keywords - Full Width */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all duration-300 p-7 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />
              </div>
              <h3 className="font-semibold text-base text-gray-900 dark:text-white">ATS Keywords</h3>
            </div>
            <div className="text-2xl font-bold text-[#635BFF] dark:text-[#a5a0ff]">
              {matchScores.ats_keywords_score}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#635BFF] to-[#7c75ff] transition-all duration-700 ease-out rounded-full"
              style={{ width: `${matchScores.ats_keywords_score}%` }}
            ></div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Found Keywords */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ✓ Found ({matchBreakdown.keywords.found.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {matchBreakdown.keywords.found.slice(0, 4).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200/60 dark:border-emerald-900/60"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Priority Missing */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                ! Priority Missing ({matchBreakdown.keywords.priority_missing.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {matchBreakdown.keywords.priority_missing.slice(0, 4).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-200/60 dark:border-rose-900/60"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Other Missing */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ✗ Missing ({matchBreakdown.keywords.missing.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {matchBreakdown.keywords.missing.slice(0, 4).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium border border-gray-200/60 dark:border-gray-700/60"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

