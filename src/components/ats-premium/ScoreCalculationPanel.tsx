import React from 'react';
import { Activity, Zap, TrendingUp, GraduationCap, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { MatchScores } from '../../types/premiumATS';

interface ScoreCalculationPanelProps {
  matchScores: MatchScores;
  scoringRationale?: string;
}

interface ScoreBreakdown {
  category: string;
  points: number;
  maxPoints: number;
  percentage: number;
}

interface ParsedRationale {
  breakdowns: ScoreBreakdown[];
  keyFactors: string[];
  gateTriggers: string[];
  explanation: string;
}

function parseScoringRationale(rationale: string): ParsedRationale {
  const result: ParsedRationale = {
    breakdowns: [],
    keyFactors: [],
    gateTriggers: [],
    explanation: rationale
  };

  // Extract point breakdowns (e.g., "Skills: 5/30 pts", "Experience: 5/20 pts")
  const breakdownPattern = /(\w+(?:\s+\w+)?):\s*(\d+)\/(\d+)\s*pts?/gi;
  let match;
  while ((match = breakdownPattern.exec(rationale)) !== null) {
    const category = match[1].trim();
    const points = parseInt(match[2], 10);
    const maxPoints = parseInt(match[3], 10);
    const percentage = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
    
    result.breakdowns.push({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      points,
      maxPoints,
      percentage
    });
  }

  // Extract key factors (e.g., "Key factors: ...")
  const keyFactorsMatch = rationale.match(/[Kk]ey\s+factors?:\s*([^.]+)/i);
  if (keyFactorsMatch) {
    const factorsText = keyFactorsMatch[1];
    // Split by common separators (but, however, and, etc.)
    result.keyFactors = factorsText
      .split(/\s*(?:but|however|and|,)\s+/i)
      .map(f => f.trim())
      .filter(f => f.length > 0);
  }

  // Extract gate triggers (e.g., "Role Alignment Gate triggered")
  const gatePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+\s+Gate)\s+triggered/gi;
  while ((match = gatePattern.exec(rationale)) !== null) {
    result.gateTriggers.push(match[1]);
  }

  return result;
}

interface ScoreCardProps {
  title: string;
  score: number;
  points?: number;
  maxPoints?: number;
  icon: React.ReactNode;
  description?: string;
}

function ScoreCard({ title, score, points, maxPoints, icon, description }: ScoreCardProps) {
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

  const getIconBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-950/30';
    if (score >= 60) return 'bg-blue-100 dark:bg-blue-950/30';
    if (score >= 40) return 'bg-amber-100 dark:bg-amber-950/30';
    return 'bg-rose-100 dark:bg-rose-950/30';
  };

  const getIconColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-[#1A1A1D] dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${getIconBgColor(score)} flex items-center justify-center shadow-sm`}>
            <div className={getIconColor(score)}>
              {icon}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            {points !== undefined && maxPoints !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {points}/{maxPoints} points
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
            <span className="text-lg">%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${getProgressColor(score)} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${score}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>

      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pt-1">
          {description}
        </p>
      )}
    </div>
  );
}

export default function ScoreCalculationPanel({ matchScores, scoringRationale }: ScoreCalculationPanelProps) {
  const parsed = scoringRationale ? parseScoringRationale(scoringRationale) : null;

  // Map categories to match scores
  const getBreakdownForCategory = (category: string): ScoreBreakdown | undefined => {
    if (!parsed) return undefined;
    const normalizedCategory = category.toLowerCase();
    return parsed.breakdowns.find(b => 
      b.category.toLowerCase().includes(normalizedCategory) ||
      normalizedCategory.includes(b.category.toLowerCase())
    );
  };

  const skillsBreakdown = getBreakdownForCategory('skills');
  const experienceBreakdown = getBreakdownForCategory('experience');
  const educationBreakdown = getBreakdownForCategory('education');
  const softSkillsBreakdown = getBreakdownForCategory('soft skills');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/30 dark:to-purple-950/30 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            How This Score Was Calculated
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Detailed breakdown of your match score across all categories
          </p>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <ScoreCard
          title="Skills"
          score={matchScores.skills_score}
          points={skillsBreakdown?.points}
          maxPoints={skillsBreakdown?.maxPoints}
          icon={<Zap className="w-6 h-6" />}
        />
        <ScoreCard
          title="Experience"
          score={matchScores.experience_score}
          points={experienceBreakdown?.points}
          maxPoints={experienceBreakdown?.maxPoints}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <ScoreCard
          title="Education"
          score={matchScores.education_score}
          points={educationBreakdown?.points}
          maxPoints={educationBreakdown?.maxPoints}
          icon={<GraduationCap className="w-6 h-6" />}
        />
        <ScoreCard
          title="Industry Fit"
          score={matchScores.industry_fit_score}
          icon={<Building2 className="w-6 h-6" />}
        />
      </div>

      {/* Gate Triggers */}
      {parsed && parsed.gateTriggers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Gate Triggers
              </h4>
              <ul className="space-y-1">
                {parsed.gateTriggers.map((trigger, index) => (
                  <li key={index} className="text-sm text-amber-800 dark:text-amber-300">
                    • {trigger}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Key Factors */}
      {parsed && parsed.keyFactors.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Key Factors
              </h4>
              <div className="space-y-2">
                {parsed.keyFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                      {factor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Explanation */}
      {scoringRationale && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {scoringRationale}
          </p>
        </div>
      )}
    </div>
  );
}

