import React from 'react';
import { Building2, Calendar as CalendarIcon } from 'lucide-react';
import ScoreDonut from './ScoreDonut';
import SubscoreGrid from './SubscoreGrid';

type CategoryScores = {
  skills: number;
  experience: number;
  education: number;
  industryFit: number;
};

interface HeaderAnalysis {
  jobTitle: string;
  company: string;
  location?: string;
  date: string;
  matchScore: number;
  status?: string;
  jobUrl?: string;
  categoryScores: CategoryScores;
}

interface HeaderCardProps {
  analysis: HeaderAnalysis;
}

function formatDateString(dateString: string): string {
  if (dateString && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  return dateString;
}

function getDomainFromCompanyName(name?: string | null) {
  if (!name) return null;
  try {
    const slug = name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) return null;
    return `${slug}.com`;
  } catch {
    return null;
  }
}

function getCompanyLogoUrl(company?: string | null) {
  const placeholder = '/images/logo-placeholder.svg';
  const domain = getDomainFromCompanyName(company || '');
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  return placeholder;
}

function getStatusClasses(status?: string) {
  const value = status?.toLowerCase() || 'completed';

  if (value.includes('complete')) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  }

  if (value.includes('pending') || value.includes('progress') || value.includes('active')) {
    return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
  }

  if (value.includes('rejected') || value.includes('failed') || value.includes('error')) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  }

  return 'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300';
}

const HeaderCard: React.FC<HeaderCardProps> = ({ analysis }) => {
  const logoUrl = getCompanyLogoUrl(analysis.company);
  const statusLabel = (analysis.status || 'Completed')
    .toString()
    .charAt(0)
    .toUpperCase() + (analysis.status || 'Completed').toString().slice(1);

  return (
    <div className="rounded-2xl p-6 bg-white dark:bg-[#1E1F22] border border-gray-200 dark:border-[#2A2A2E] shadow-sm flex flex-col md:flex-row justify-between items-start gap-8">
      {/* Left column: logo + meta */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-8 ring-white dark:ring-[#1E1F22] bg-gray-50 dark:bg-[#2A2A2E]">
          <img
            src={logoUrl}
            alt={`${analysis.company} logo`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/images/logo-placeholder.svg';
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-2 min-w-0">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 truncate">
              {analysis.jobTitle}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              <span className="truncate">
                {analysis.company}
                {analysis.location ? ` • ${analysis.location}` : ''}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formatDateString(analysis.date)}</span>
            </span>

            <span
              className={[
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                getStatusClasses(analysis.status),
              ].join(' ')}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Right column: donut + subscores */}
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <ScoreDonut value={analysis.matchScore} />
          <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Match Score</span>
        </div>
        <SubscoreGrid scores={analysis.categoryScores} />
      </div>
    </div>
  );
};

export default HeaderCard;


