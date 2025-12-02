import React from 'react';
import { AlertCircle, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import type { Gap } from '../../types/premiumATS';

interface GapCardProps {
  gap: Gap;
  index?: number;
}

export default function GapCard({ gap, index }: GapCardProps) {
  const getSeverityConfig = (severity: Gap['severity']) => {
    const configs = {
      High: {
        badge: 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50',
        icon: AlertTriangle,
        iconColor: 'text-rose-600 dark:text-rose-400',
        iconBg: 'bg-rose-50 dark:bg-rose-950/30',
        cardBorder: 'border-rose-200/50 dark:border-rose-800/50',
        cardHoverShadow: 'hover:shadow-rose-500/10',
        actionBg: 'bg-rose-50/50 dark:bg-rose-950/20',
        actionBorder: 'border-rose-200/40 dark:border-rose-900/40',
        actionIconBg: 'bg-rose-100 dark:bg-rose-900/30',
      },
      Medium: {
        badge: 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
        icon: AlertCircle,
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-50 dark:bg-amber-950/30',
        cardBorder: 'border-amber-200/50 dark:border-amber-800/50',
        cardHoverShadow: 'hover:shadow-amber-500/10',
        actionBg: 'bg-amber-50/50 dark:bg-amber-950/20',
        actionBorder: 'border-amber-200/40 dark:border-amber-900/40',
        actionIconBg: 'bg-amber-100 dark:bg-amber-900/30',
      },
      Low: {
        badge: 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
        icon: Info,
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-50 dark:bg-blue-950/30',
        cardBorder: 'border-blue-200/50 dark:border-blue-800/50',
        cardHoverShadow: 'hover:shadow-blue-500/10',
        actionBg: 'bg-blue-50/50 dark:bg-blue-950/20',
        actionBorder: 'border-blue-200/40 dark:border-blue-900/40',
        actionIconBg: 'bg-blue-100 dark:bg-blue-900/30',
      },
    };
    return configs[severity];
  };

  const config = getSeverityConfig(gap.severity);
  const IconComponent = config.icon;

  return (
    <div
      className={`group relative bg-white dark:bg-[#1A1A1D] rounded-xl border ${config.cardBorder} shadow-sm hover:shadow-md ${config.cardHoverShadow} hover:scale-[1.01] transition-all duration-300 overflow-hidden`}
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      {/* Subtle gradient overlay at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
        gap.severity === 'High' 
          ? 'from-rose-400 to-rose-500' 
          : gap.severity === 'Medium' 
            ? 'from-amber-400 to-amber-500' 
            : 'from-blue-400 to-blue-500'
      }`} />

      <div className="p-7 pt-8">
        {/* Top Bar: Icon + Name + Priority Badge */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                {gap.name}
              </h3>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.badge}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {gap.severity} Priority
              </div>
            </div>
          </div>
        </div>

        {/* Why It Matters */}
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Why it matters
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {gap.why_it_matters}
          </p>
        </div>

        {/* How to Fix - Action-oriented design */}
        <div className={`p-4 ${config.actionBg} rounded-lg border ${config.actionBorder}`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.actionIconBg} flex items-center justify-center`}>
              <Lightbulb className="w-4 h-4 text-[#635BFF] dark:text-[#a5a0ff]" />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                <span>Action Required</span>
                <span className="w-1 h-1 rounded-full bg-[#635BFF]" />
              </p>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {gap.how_to_fix}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient on hover */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${
        gap.severity === 'High' 
          ? 'from-rose-500/0 to-rose-600/0 group-hover:from-rose-500/3 group-hover:to-rose-600/3' 
          : gap.severity === 'Medium' 
            ? 'from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/3 group-hover:to-amber-600/3' 
            : 'from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/3 group-hover:to-blue-600/3'
      } transition-all duration-300 pointer-events-none`} />
    </div>
  );
}
