import { memo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';

interface PositionDetailsSectionProps {
  application: JobApplication;
  interview: Interview;
}

const PositionDetailsSection = memo(function PositionDetailsSection({
  application,
  interview,
}: PositionDetailsSectionProps) {
  const positionDetails = interview?.preparation?.positionDetails;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Extract headline
  const headline = positionDetails?.split('.')[0] || `Key responsibilities for ${application.position}`;
  
  // Extract sentences as responsibilities
  const responsibilities = positionDetails
    ?.split('.')
    .slice(1)
    .filter(s => s.trim().length > 10)
    .slice(0, 6) || [];

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
      
      {/* Header Bar */}
      <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
              Role Overview
            </span>
            <h3 className="mt-1 text-lg font-medium text-slate-900 dark:text-white">
              {application.position}
            </h3>
          </div>
          {responsibilities.length > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium">
              {responsibilities.length} responsibilities
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {responsibilities.length > 0 ? (
          <div className="space-y-0">
            {/* Headline insight */}
            <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {headline}.
            </p>

            {/* Responsibilities List - Accordion style */}
            <div className="space-y-1">
              {responsibilities.map((responsibility, index) => {
                const isExpanded = expandedIndex === index;
                const text = responsibility.trim();
                const isLong = text.length > 80;
                
                return (
                  <div
                    key={index}
                    className={`
                      group rounded-lg transition-all duration-200
                      ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                    `}
                  >
                    <button
                      onClick={() => isLong && setExpandedIndex(isExpanded ? null : index)}
                      className={`
                        w-full text-left px-4 py-3 flex items-start gap-4
                        ${isLong ? 'cursor-pointer' : 'cursor-default'}
                      `}
                      disabled={!isLong}
                    >
                      {/* Index */}
                      <span className="flex-shrink-0 w-6 text-xs font-mono text-slate-300 dark:text-slate-600 pt-0.5">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      
                      {/* Content */}
                      <span 
                        className={`
                          flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300
                          ${!isExpanded && isLong ? 'line-clamp-1' : ''}
                        `}
                      >
                        {text}.
                      </span>
                      
                      {/* Expand indicator */}
                      {isLong && (
                        <ChevronRight 
                          className={`
                            flex-shrink-0 w-4 h-4 text-slate-300 dark:text-slate-600 mt-0.5
                            transition-transform duration-200
                            ${isExpanded ? 'rotate-90' : ''}
                          `} 
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No role details available
            </p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
              Analyze the job posting to extract responsibilities
            </p>
          </div>
        )}
      </div>
    </article>
  );
});

export default PositionDetailsSection;
