import React from 'react';
import { ArrowLeft, ExternalLink, Building2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScoreDonutPremium from './ScoreDonutPremium';
import type { PremiumATSAnalysis } from '../../types/premiumATS';

interface HeroPremiumProps {
  analysis: PremiumATSAnalysis;
}

function getCompanyLogoUrl(company: string): string {
  try {
    const domain = company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `https://logo.clearbit.com/${domain}.com`;
  } catch {
    return '/images/logo-placeholder.svg';
  }
}

export default function HeroPremium({ analysis }: HeroPremiumProps) {
  const navigate = useNavigate();
  const logoUrl = getCompanyLogoUrl(analysis.company);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-transparent dark:from-[#0A0A0B] dark:via-[#0F0F12] dark:to-transparent">
      {/* Elegant background pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }}></div>
      </div>

      {/* Subtle gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-5xl mx-auto px-6 py-16 lg:py-24">
        {/* Subtle close button (top right) */}
        <button
          onClick={() => navigate('/cv-analysis')}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Centered Content */}
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Company Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/30 blur-2xl rounded-full"></div>
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-3xl overflow-hidden bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-3">
              <img
                src={logoUrl}
                alt={`${analysis.company} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/logo-placeholder.svg';
                }}
              />
            </div>
          </div>

          {/* Job Title */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              {analysis.jobTitle}
            </h1>
            
            {/* Company & Location */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-base text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2 font-medium">
                <Building2 className="w-4 h-4" />
                {analysis.company}
              </span>
              {analysis.location && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {analysis.location}
                  </span>
                </>
              )}
            </div>

            {analysis.jobUrl && (
              <a
                href={analysis.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium"
              >
                View job posting
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Score Donut - Prominent */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full scale-150"></div>
            <div className="relative">
              <ScoreDonutPremium matchScores={analysis.match_scores} size="large" />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="max-w-3xl">
            <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {analysis.executive_summary}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-[#0A0A0B] to-transparent"></div>
    </div>
  );
}

