import React from 'react';
import { AlertCircle, Lightbulb } from 'lucide-react';
import type { Gap } from '../../types/premiumATS';

interface GapCardProps {
  gap: Gap;
  index?: number;
}

export default function GapCard({ gap, index }: GapCardProps) {
  const getSeverityConfig = (severity: Gap['severity']) => {
    const configs = {
      High: {
        badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        icon: 'text-rose-600 dark:text-rose-400',
        accent: 'border-l-rose-500',
      },
      Medium: {
        badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        icon: 'text-amber-600 dark:text-amber-400',
        accent: 'border-l-amber-500',
      },
      Low: {
        badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
        icon: 'text-blue-600 dark:text-blue-400',
        accent: 'border-l-blue-500',
      },
    };
    return configs[severity];
  };

  const config = getSeverityConfig(gap.severity);

  return (
    <div
      className={`group relative bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 ${config.accent} p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      {/* Top Bar: Name + Severity */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
            <AlertCircle className={`w-4 h-4 ${config.icon}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {gap.name}
          </h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${config.badge}`}>
          {gap.severity} Priority
        </div>
      </div>

      {/* Why It Matters */}
      <div className="mb-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Why it matters
        </p>
        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {gap.why_it_matters}
        </p>
      </div>

      {/* How to Fix */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
              How to fix
            </p>
            <p className="text-sm leading-relaxed text-indigo-800 dark:text-indigo-300">
              {gap.how_to_fix}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

