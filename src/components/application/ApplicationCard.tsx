import React, { useEffect, useState } from 'react';
import { Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { JobApplication } from '../../types/job';
import { StepChip } from './StepChip';
import { CompanyLogo } from '../common/CompanyLogo';

function getStatusBorderColor(status: JobApplication['status']): string {
  switch (status) {
    case 'applied': return '#E8F1FD';
    case 'interview': return '#FFF5CC';
    case 'pending_decision': return '#F3F4F6';
    case 'offer': return '#E2FBE2';
    case 'rejected': return '#FDE2E4';
    case 'archived':
    default: return '#F3F4F6';
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export function ApplicationCard({
  app, onDelete, onClick, isDragging = false,
}: {
  app: JobApplication;
  onDelete: () => void;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const interviewTypes =
    app.interviews?.map((i) => i.type).filter((v, i, a) => a.indexOf(v) === i) || [];
  const hasInterviews = (app.interviews?.length || 0) > 0;
  const lightBorderColor = getStatusBorderColor(app.status);

  // Detect dark mode to neutralize the status border for premium dark appearance
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsDark(root.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const interviewCount = app.interviews?.length || 0;

  return (
    <div
      onClick={onClick}
      className={[
        'group relative w-full cursor-pointer select-none',
        'rounded-xl border',
        'bg-white dark:bg-[#1E1F22] hover:bg-gray-50 dark:hover:bg-[#232428] transition-all duration-200',
        'shadow-sm hover:shadow-md',
        isDragging ? 'ring-2 ring-[#2563EB] ring-offset-0 shadow-lg' : '',
      ].join(' ')}
      style={{ borderColor: isDark ? '#2A2A2E' : lightBorderColor }}
      role="button"
    >
      <div className="p-4">
        {/* Section 1: Header - Position avec logo */}
        <div className="flex items-start gap-3 mb-3">
          <CompanyLogo companyName={app.companyName} size="md" />
          <h3
            className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight flex-1 min-w-0"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {app.position}
          </h3>
        </div>

        {/* Section 2: Métadonnées avec icônes */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {/* Date d'application */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(app.appliedDate)}</span>
          </div>

          {/* Location */}
          {app.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{app.location}</span>
            </div>
          )}

          {/* Interviews */}
          {hasInterviews && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {interviewCount} {interviewCount === 1 ? 'interview' : 'interviews'}
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Entreprise */}
        <div className="mb-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#2A2A2E] border border-gray-200 dark:border-gray-800">
            <CompanyLogo companyName={app.companyName} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{app.companyName}</span>
          </div>
        </div>

        {/* Section 4: Tags d'interviews */}
        {hasInterviews && interviewTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {interviewTypes.slice(0, 3).map((t) => <StepChip key={t} type={t} />)}
            {interviewTypes.length > 3 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#2A2A2E]">
                +{interviewTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Section 5: Footer avec actions */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
          {/* Actions visibles au hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              aria-label="Delete application"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


