import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { Strength } from '../../types/premiumATS';

interface StrengthCardProps {
  strength: Strength;
  index?: number;
}

export default function StrengthCard({ strength, index }: StrengthCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';
    if (score >= 80) return 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50';
    return 'bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]/20 dark:bg-[#635BFF]/20 dark:text-[#a5a0ff] dark:border-[#635BFF]/30';
  };

  return (
    <div
      className="group relative bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 p-7"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      {/* Top Bar: Name + Score */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
            {strength.name}
          </h3>
        </div>
        
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getScoreColor(strength.score)}`}>
          {strength.score}
        </div>
      </div>

      {/* Example Quote */}
      <div className="mb-5 p-4 bg-gray-50/80 dark:bg-gray-900/30 rounded-lg border border-gray-200/40 dark:border-gray-800/40">
        <p className="text-sm font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
          "{strength.example_from_resume}"
        </p>
      </div>

      {/* Why It Matters */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Why it matters
        </p>
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {strength.why_it_matters}
        </p>
      </div>

      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/3 group-hover:to-blue-500/3 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
}

