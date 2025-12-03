import React from 'react';
import { Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { JobApplication } from '../../types/job';
import { StepChip } from './StepChip';
import { CompanyLogo } from '../common/CompanyLogo';

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
  isInactive = false,
  inactiveDays = 0,
}: {
  app: JobApplication;
  onDelete: () => void;
  onClick: () => void;
  isDragging?: boolean;
  isInactive?: boolean;
  inactiveDays?: number;
}) {
  const interviewTypes =
    app.interviews?.map((i) => i.type).filter((v, i, a) => a.indexOf(v) === i) || [];
  const hasInterviews = (app.interviews?.length || 0) > 0;
  const interviewCount = app.interviews?.length || 0;

  return (
    <div
      onClick={onClick}
      className={[
        'group relative w-full cursor-pointer select-none',
        'rounded-xl border',
        'bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm',
        'border-gray-200/60 dark:border-gray-700/50',
        'hover:border-gray-300/80 dark:hover:border-gray-600/60',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200',
        'h-full flex flex-col',
        isDragging ? 'ring-2 ring-[#2563EB] ring-offset-0 shadow-lg' : '',
      ].join(' ')}
      role="button"
    >
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {/* Inactive Badge */}
        {isInactive && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
              {inactiveDays}d inactive
            </span>
          </div>
        )}

        {/* Section 1: Header - Position avec logo */}
        <div className="flex items-start gap-3 mb-3 flex-shrink-0">
          <CompanyLogo 
            companyName={app.companyName} 
            size="lg"
            className="rounded-lg border border-gray-100 dark:border-gray-700 flex-shrink-0"
          />
          <h3
            className="text-base font-medium text-gray-900 dark:text-white leading-tight flex-1 min-w-0"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {app.position}
          </h3>
        </div>

        {/* Section 2: Métadonnées avec icônes */}
        <div className="flex flex-wrap items-center gap-3 mb-3 flex-shrink-0">
          {/* Date d'application */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(app.appliedDate)}</span>
          </div>

          {/* Location */}
          {app.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{app.location}</span>
            </div>
          )}

          {/* Interviews */}
          {hasInterviews && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {interviewCount} {interviewCount === 1 ? 'interview' : 'interviews'}
              </span>
            </div>
          )}
        </div>

        {/* Section 3: Entreprise */}
        <div className="mb-3 flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
            <CompanyLogo companyName={app.companyName} size="md" />
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{app.companyName}</span>
          </div>
        </div>

        {/* Section 4: Tags d'interviews */}
        {hasInterviews && interviewTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3 flex-shrink-0">
            {interviewTypes.slice(0, 3).map((t) => <StepChip key={t} type={t} />)}
            {interviewTypes.length > 3 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                +{interviewTypes.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1"></div>

        {/* Section 5: Footer avec actions */}
        <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-gray-700/50 flex-shrink-0">
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


