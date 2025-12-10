import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { PremiumATSAnalysis } from '../../../types/premiumATS';

interface OverviewTabProps {
  analysis: PremiumATSAnalysis;
}

// Minimalist metric card - Vercel style
function MetricCard({ 
  label, 
  value, 
  maxValue,
  subtitle 
}: { 
  label: string; 
  value: number; 
  maxValue?: number;
  subtitle?: string;
}) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className={`text-3xl font-semibold tabular-nums ${getColor(value)}`}>
          {value}
        </span>
        {maxValue && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            /{maxValue}
          </span>
        )}
      </div>
      {/* Progress bar - ultra thin */}
      <div className="h-1 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBgColor(value)} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
      {subtitle && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}

// Parse scoring rationale to extract gate triggers
function parseGateTriggers(rationale?: string): string[] {
  if (!rationale) return [];
  const triggers: string[] = [];
  const gatePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+\s+Gate)\s+triggered/gi;
  let match;
  while ((match = gatePattern.exec(rationale)) !== null) {
    triggers.push(match[1]);
  }
  return triggers;
}

export default function OverviewTab({ analysis }: OverviewTabProps) {
  const gateTriggers = parseGateTriggers(analysis.scoring_rationale);

  return (
    <div className="space-y-10">
      {/* Executive Summary - Clean typography */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Executive Summary
        </h2>
        <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
          {analysis.executive_summary}
        </p>
      </section>

      {/* Gate Triggers - Subtle warning */}
      {gateTriggers.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-sm text-amber-800 dark:text-amber-200">
              {gateTriggers.map((trigger, i) => (
                <span key={i}>
                  {i > 0 && ' · '}
                  {trigger}
                </span>
              ))}
              {' triggered'}
            </span>
          </div>
        </div>
      )}

      {/* Score Metrics Grid - 4 columns */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
          Score Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <MetricCard 
            label="Skills" 
            value={analysis.match_scores.skills_score}
          />
          <MetricCard 
            label="Experience" 
            value={analysis.match_scores.experience_score}
          />
          <MetricCard 
            label="Education" 
            value={analysis.match_scores.education_score}
          />
          <MetricCard 
            label="Industry Fit" 
            value={analysis.match_scores.industry_fit_score}
          />
        </div>
      </section>

      {/* Keywords Score - Separate section */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          ATS Keywords
        </h2>
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-semibold tabular-nums ${
              analysis.match_scores.ats_keywords_score >= 70 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {analysis.match_scores.ats_keywords_score}%
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">match</span>
          </div>
          <div className="flex-1 h-2 bg-gray-100 dark:bg-[#3d3c3e] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${
                analysis.match_scores.ats_keywords_score >= 70 
                  ? 'bg-emerald-500' 
                  : 'bg-amber-500'
              }`}
              style={{ width: `${analysis.match_scores.ats_keywords_score}%` }}
            />
          </div>
        </div>
        
        {/* Quick keyword stats */}
        <div className="mt-4 flex gap-6 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {analysis.match_breakdown.keywords.found.length}
            </span> found
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              {analysis.match_breakdown.keywords.priority_missing.length}
            </span> priority missing
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-500 dark:text-gray-500 font-medium">
              {analysis.match_breakdown.keywords.missing.length}
            </span> other missing
          </span>
        </div>
      </section>

      {/* Scoring Rationale - Expandable detail */}
      {analysis.scoring_rationale && (
        <section className="pt-6 border-t border-gray-200 dark:border-[#3d3c3e]">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            How This Score Was Calculated
          </h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {analysis.scoring_rationale}
          </p>
        </section>
      )}
    </div>
  );
}

