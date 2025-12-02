import React from 'react';
import { TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import type { OpportunityFit } from '../../types/premiumATS';

interface OpportunityFitPanelProps {
  opportunityFit: OpportunityFit;
}

export default function OpportunityFitPanel({ opportunityFit }: OpportunityFitPanelProps) {
  const successFactors = Array.isArray(opportunityFit?.why_you_will_succeed) ? opportunityFit.why_you_will_succeed : [];
  const risks = Array.isArray(opportunityFit?.risks) ? opportunityFit.risks : [];
  const mitigation = Array.isArray(opportunityFit?.mitigation) ? opportunityFit.mitigation : [];
  
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Why You Will Succeed */}
      <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all duration-300 p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            Why You'll Succeed
          </h3>
        </div>
        <ul className="space-y-3">
          {successFactors.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Risks */}
      <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all duration-300 p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            Potential Risks
          </h3>
        </div>
        <ul className="space-y-3">
          {risks.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mitigation */}
      <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-md transition-all duration-300 p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#635BFF] dark:text-[#a5a0ff]" />
          </div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            Risk Mitigation
          </h3>
        </div>
        <ul className="space-y-3">
          {mitigation.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#635BFF]/10 dark:bg-[#635BFF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#635BFF] dark:bg-[#a5a0ff]"></div>
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

