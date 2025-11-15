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
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${getProgressColor(score)} transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>

      {/* Matched Items */}
      {matched.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            ✓ Matched ({matched.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {matched.slice(0, 5).map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-900"
              >
                {item}
              </span>
            ))}
            {matched.length > 5 && (
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                +{matched.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Missing Items */}
      {missing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            ✗ Missing ({missing.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.slice(0, 5).map((item, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-900"
              >
                {item}
              </span>
            ))}
            {missing.length > 5 && (
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                +{missing.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Explanations */}
      {explanations && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {explanations}
          </p>
        </div>
      )}
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
        icon={<Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      />

      <CategoryCard
        title="Experience"
        score={matchScores.experience_score}
        matched={matchBreakdown.experience.matched}
        missing={matchBreakdown.experience.missing}
        explanations={matchBreakdown.experience.explanations}
        icon={<Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      />

      <CategoryCard
        title="Education"
        score={matchScores.education_score}
        matched={matchBreakdown.education.matched}
        missing={matchBreakdown.education.missing}
        explanations={matchBreakdown.education.explanations}
        icon={<GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      />

      <CategoryCard
        title="Industry Fit"
        score={matchScores.industry_fit_score}
        matched={matchBreakdown.industry.matched}
        missing={matchBreakdown.industry.missing}
        explanations={matchBreakdown.industry.explanations}
        icon={<Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      />

      {/* Keywords - Full Width */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">ATS Keywords</h3>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {matchScores.ats_keywords_score}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-purple-500 transition-all duration-700 ease-out"
              style={{ width: `${matchScores.ats_keywords_score}%` }}
            ></div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Found Keywords */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                ✓ Found ({matchBreakdown.keywords.found.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {matchBreakdown.keywords.found.slice(0, 4).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Priority Missing */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                ! Priority Missing ({matchBreakdown.keywords.priority_missing.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {matchBreakdown.keywords.priority_missing.slice(0, 4).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Other Missing */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                ✗ Missing ({matchBreakdown.keywords.missing.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {matchBreakdown.keywords.missing.slice(0, 4).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium"
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

