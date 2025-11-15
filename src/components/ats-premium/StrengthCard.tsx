import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Strength } from '../../types/premiumATS';

interface StrengthCardProps {
  strength: Strength;
  index?: number;
}

export default function StrengthCard({ strength, index }: StrengthCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
    if (score >= 80) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
    return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900';
  };

  return (
    <div
      className="group relative bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      {/* Top Bar: Name + Score */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {strength.name}
          </h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(strength.score)}`}>
          {strength.score}
        </div>
      </div>

      {/* Example Quote */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
        <p className="text-sm font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
          "{strength.example_from_resume}"
        </p>
      </div>

      {/* Why It Matters */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Why it matters
        </p>
        <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
          {strength.why_it_matters}
        </p>
      </div>

      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
}

