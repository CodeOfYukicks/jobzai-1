import React from 'react';
import { Target, Briefcase, CheckCircle, Eye } from 'lucide-react';
import type { JobSummary } from '../../types/premiumATS';

interface JobSummaryPanelProps {
  jobSummary: JobSummary;
  compact?: boolean;
}

export default function JobSummaryPanel({ jobSummary, compact = false }: JobSummaryPanelProps) {
  // Compact version for sidebar - Ultra Sleek
  if (compact) {
    return (
      <div className="space-y-6">
        {/* Role & Mission - Sleek Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border border-purple-100 dark:border-purple-900/30 p-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                Role
              </h4>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed font-semibold mb-3">
              {jobSummary.role}
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed">
              {jobSummary.mission}
            </p>
          </div>
        </div>

        {/* Key Responsibilities - Sleek */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Key Responsibilities
            </h4>
          </div>
          <ul className="space-y-2">
            {jobSummary.key_responsibilities.map((resp, index) => (
              <li key={index} className="flex items-start gap-2.5 group">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 group-hover:scale-125 transition-transform"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {resp}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Core Requirements - Sleek */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Core Requirements
            </h4>
          </div>
          <ul className="space-y-2">
            {jobSummary.core_requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2.5 group">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5 group-hover:scale-125 transition-transform"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {req}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hidden Expectations - Sleek */}
        {jobSummary.hidden_expectations.length > 0 && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-900/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Hidden Expectations
                </h4>
              </div>
              <ul className="space-y-2">
                {jobSummary.hidden_expectations.map((expectation, index) => (
                  <li key={index} className="flex items-start gap-2.5 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 flex-shrink-0 mt-1.5 group-hover:scale-125 transition-transform"></div>
                    <span className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                      {expectation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full version for main content
  return (
    <div className="space-y-6">
      {/* Role & Mission */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-1">
                Role
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {jobSummary.role}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wide mb-1">
                Mission
              </h3>
              <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">
                {jobSummary.mission}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Responsibilities */}
        <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Key Responsibilities
            </h3>
          </div>
          <ul className="space-y-2.5">
            {jobSummary.key_responsibilities.map((resp, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {resp}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Core Requirements */}
        <div className="bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Core Requirements
            </h3>
          </div>
          <ul className="space-y-2.5">
            {jobSummary.core_requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
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
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                Hidden Expectations
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-400 mb-3">
                These aren't explicitly stated but are likely expected for this role:
              </p>
              <ul className="space-y-2">
                {jobSummary.hidden_expectations.map((expectation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 flex-shrink-0 mt-2"></div>
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

