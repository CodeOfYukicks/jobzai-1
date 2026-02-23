import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PremiumATSAnalysis, Strength } from '../../../types/premiumATS';

interface MatchDetailsTabProps {
  analysis: PremiumATSAnalysis;
}

// Minimalist category section
function CategorySection({
  title,
  score,
  matched,
  missing,
  explanation
}: {
  title: string;
  score: number;
  matched: string[];
  missing: string[];
  explanation?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (s >= 60) return 'text-blue-600 dark:text-blue-400';
    if (s >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getBgColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 60) return 'bg-blue-500';
    if (s >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="border-b border-gray-200 dark:border-[#3d3c3e] last:border-b-0">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 dark:hover:bg-[#3d3c3e]/30 transition-colors -mx-4 px-4 rounded-lg"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-base font-medium text-gray-900 dark:text-white">
            {title}
          </span>
          {/* Inline progress indicator */}
          <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
            <div
              className={`h-full ${getBgColor(score)} transition-all`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-semibold tabular-nums ${getScoreColor(score)}`}>
            {score}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="pb-5 space-y-4">
          {/* Matched */}
          {matched.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Matched ({matched.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {matched.map((item, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 rounded-md"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {missing.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Missing ({missing.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {missing.map((item, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 rounded-md"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          {explanation && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-2">
              {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Minimalist strength item
function StrengthItem({ strength, index }: { strength: Strength; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-4 border-b border-gray-200 dark:border-[#3d3c3e] last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between gap-4 text-left"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5 w-5">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {strength.name}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {strength.score}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 ml-8 space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 italic border-l-2 border-gray-200 dark:border-[#3d3c3e] pl-3">
            "{strength.example_from_resume}"
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {strength.why_it_matters}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MatchDetailsTab({ analysis }: MatchDetailsTabProps) {
  return (
    <div className="space-y-10">
      {/* Categories Breakdown */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Match by Category
        </h2>
        <div className="bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e]">
          <div className="px-4">
            <CategorySection
              title="Skills"
              score={analysis.match_scores.skills_score}
              matched={analysis.match_breakdown.skills.matched}
              missing={analysis.match_breakdown.skills.missing}
              explanation={analysis.match_breakdown.skills.explanations}
            />
            <CategorySection
              title="Experience"
              score={analysis.match_scores.experience_score}
              matched={analysis.match_breakdown.experience.matched}
              missing={analysis.match_breakdown.experience.missing}
              explanation={analysis.match_breakdown.experience.explanations}
            />
            <CategorySection
              title="Education"
              score={analysis.match_scores.education_score}
              matched={analysis.match_breakdown.education.matched}
              missing={analysis.match_breakdown.education.missing}
              explanation={analysis.match_breakdown.education.explanations}
            />
            <CategorySection
              title="Industry Fit"
              score={analysis.match_scores.industry_fit_score}
              matched={analysis.match_breakdown.industry.matched}
              missing={analysis.match_breakdown.industry.missing}
              explanation={analysis.match_breakdown.industry.explanations}
            />
          </div>
        </div>
      </section>

      {/* Keywords Detail */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          ATS Keywords Detail
        </h2>
        <div className="space-y-6">
          {/* Found Keywords */}
          {analysis.match_breakdown.keywords.found.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Found ({analysis.match_breakdown.keywords.found.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.match_breakdown.keywords.found.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#3d3c3e] rounded-md"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Priority Missing */}
          {analysis.match_breakdown.keywords.priority_missing.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Priority Missing ({analysis.match_breakdown.keywords.priority_missing.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.match_breakdown.keywords.priority_missing.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 rounded-md border border-rose-200/50 dark:border-rose-800/50"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Other Missing */}
          {analysis.match_breakdown.keywords.missing.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Other Missing ({analysis.match_breakdown.keywords.missing.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.match_breakdown.keywords.missing.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#3d3c3e]/50 rounded-md"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Top Strengths */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Top Strengths
        </h2>
        <div className="bg-white dark:bg-[#2b2a2c] rounded-xl border border-gray-200 dark:border-[#3d3c3e] px-4">
          {analysis.top_strengths.map((strength, index) => (
            <StrengthItem key={index} strength={strength} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

