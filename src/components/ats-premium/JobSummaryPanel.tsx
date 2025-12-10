import React from 'react';
import { Target, Briefcase, CheckCircle, Eye } from 'lucide-react';
import type { JobSummary } from '../../types/premiumATS';

interface JobSummaryPanelProps {
  jobSummary: JobSummary;
  compact?: boolean;
}

export default function JobSummaryPanel({ jobSummary, compact = false }: JobSummaryPanelProps) {
  // Compact version for sidebar - Ultra minimal
  if (compact) {
    return (
      <div className="space-y-6">
        {/* Role & Mission */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Role
          </h4>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {jobSummary.role}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {jobSummary.mission}
          </p>
        </div>

        {/* Key Responsibilities */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Key Responsibilities
          </h4>
          <ul className="space-y-2">
            {jobSummary.key_responsibilities.slice(0, 5).map((resp, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 mt-1.5" />
                <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {resp}
                </span>
              </li>
            ))}
            {jobSummary.key_responsibilities.length > 5 && (
              <li className="text-xs text-gray-400 dark:text-gray-500 pl-3">
                +{jobSummary.key_responsibilities.length - 5} more
              </li>
            )}
          </ul>
        </div>

        {/* Core Requirements */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Core Requirements
          </h4>
          <ul className="space-y-2">
            {jobSummary.core_requirements.slice(0, 5).map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 mt-1.5" />
                <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {req}
                </span>
              </li>
            ))}
            {jobSummary.core_requirements.length > 5 && (
              <li className="text-xs text-gray-400 dark:text-gray-500 pl-3">
                +{jobSummary.core_requirements.length - 5} more
              </li>
            )}
          </ul>
        </div>

        {/* Hidden Expectations */}
        {jobSummary.hidden_expectations.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Hidden Expectations
            </h4>
            <ul className="space-y-2">
              {jobSummary.hidden_expectations.map((expectation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-500 flex-shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    {expectation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Full version for main content - Notion Style
  return (
    <div className="space-y-6">
      {/* Role & Mission */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Role
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {jobSummary.role}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Mission
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {jobSummary.mission}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Responsibilities */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Key Responsibilities
            </h3>
          </div>
          <ul className="space-y-2.5">
            {jobSummary.key_responsibilities.map((resp, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {resp}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Core Requirements */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Core Requirements
            </h3>
          </div>
          <ul className="space-y-2.5">
            {jobSummary.core_requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {req}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hidden Expectations - Full Width */}
      {jobSummary.hidden_expectations.length > 0 && (
        <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-200 dark:border-amber-900/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                Hidden Expectations
              </h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-400/80 mb-3">
                These aren't explicitly stated but are likely expected for this role:
              </p>
              <ul className="space-y-2">
                {jobSummary.hidden_expectations.map((expectation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 flex-shrink-0 mt-2"></div>
                    <span className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">
                      {expectation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
