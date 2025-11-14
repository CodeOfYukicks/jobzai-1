import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

type JobCardProps = {
  id: string;
  title: string;
  company: string;
  location: string;
  logoUrl?: string | null;
  postedAt?: any;
  type?: string | null;
  seniority?: string | null;
  category?: string | null;
  score?: number | null;
  applyUrl: string;
  isSaved?: boolean;
  onToggleSave?: (jobId: string, nextState: boolean) => void;
  onApply?: (jobId: string) => void;
  onShowDetails?: () => void;
};

function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatRelativeTime(input?: any): string {
  if (!input) return 'Posted recently';
  let date: Date | null = null;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input?.toDate === 'function') {
    try {
      date = input.toDate();
    } catch {
      date = null;
    }
  } else if (typeof input === 'number') {
    date = new Date(input);
  } else if (typeof input === 'string') {
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) date = parsed;
  }
  if (!date) return 'Posted recently';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `Posted ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Posted ${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `Posted ${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Posted ${months}mo ago`;
  const years = Math.floor(days / 365);
  return `Posted ${years}y ago`;
}

export default function JobCard(props: JobCardProps) {
  const {
    id,
    title,
    company,
    location,
    logoUrl,
    postedAt,
    type,
    seniority,
    category,
    score,
    applyUrl,
    isSaved = false,
    onToggleSave,
    onApply,
    onShowDetails,
  } = props;
  const { currentUser } = useAuth();

  const relative = useMemo(() => formatRelativeTime(postedAt), [postedAt]);

  return (
    <div
      className={classNames(
        'rounded-xl border p-5 bg-white shadow-sm transition',
        'hover:bg-gray-50',
        'dark:bg-[#1E1F22] dark:border-[#2A2A2E] dark:hover:bg-[#26262B]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600">
            {logoUrl ? (
              <img src={logoUrl} alt={company} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-white">
                {getInitials(company || 'Company')}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {company} • {location || 'Remote'}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">
          {relative}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(type || '').trim() !== '' && (
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-gray-700 bg-gray-50 dark:bg-[#26262B] dark:text-gray-200 dark:border-[#2A2A2E]">
            {type}
          </span>
        )}
        {(seniority || '').trim() !== '' && (
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-gray-700 bg-gray-50 dark:bg-[#26262B] dark:text-gray-200 dark:border-[#2A2A2E]">
            {seniority}
          </span>
        )}
        {(category || '').trim() !== '' && (
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs text-gray-700 bg-gray-50 dark:bg-[#26262B] dark:text-gray-200 dark:border-[#2A2A2E]">
            {category}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onShowDetails}
          className={classNames(
            'inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition',
            'text-gray-700 hover:bg-gray-50 border-gray-300',
            'dark:text-gray-200 dark:border-[#2A2A2E] dark:hover:bg-[#26262B]'
          )}
        >
          Show details
        </button>
        <button
          type="button"
          aria-label={isSaved ? 'Unsave job' : 'Save job'}
          onClick={() => onToggleSave?.(id, !isSaved)}
          className={classNames(
            'inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition',
            'text-gray-700 hover:bg-gray-50 border-gray-300',
            'dark:text-gray-200 dark:border-[#2A2A2E] dark:hover:bg-[#26262B]'
          )}
          disabled={!currentUser}
        >
          Save
        </button>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onApply?.(id)}
          className={classNames(
            'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition',
            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500',
            'focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:ring-offset-2',
            'dark:focus:ring-offset-[#1E1F22]'
          )}
        >
          Apply
        </a>
      </div>
    </div>
  );
}


