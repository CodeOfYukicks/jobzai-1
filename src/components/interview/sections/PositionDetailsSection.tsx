import { memo } from 'react';
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
  return (
    <article className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5">
      <header className="mb-5">
        <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Position Details</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">What this role expects and how to position yourself</p>
      </header>
      
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-900 dark:text-white">
          <span className="mr-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
            KEY
          </span>
          {interview?.preparation?.positionDetails?.split('.')[0] ||
            `The ${application.position} role involves key responsibilities in the organization.`}
        </p>
        
        {interview?.preparation?.positionDetails ? (
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {interview.preparation.positionDetails.split('.').slice(1, 3).join('.')}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            No detailed position information available yet. Run the job post analysis to get a more precise breakdown of responsibilities and expectations.
          </p>
        )}

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-50">
            Required skills
          </div>
          {interview?.preparation?.requiredSkills &&
          interview.preparation.requiredSkills.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {interview.preparation.requiredSkills.map((skill, index) => (
                <div
                  key={index} 
                  className="inline-flex items-center rounded-[8px] border border-black/[0.04] bg-white/80 px-3 py-1.5 text-xs text-neutral-800 dark:border-white/5 dark:bg-white/5 dark:text-neutral-100"
                >
                  <span className="mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                  <span className="truncate">{skill}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No skills information available yet. Once you run the analysis, key skills will appear here in a structured list.
            </p>
          )}
        </div>
      </div>
    </article>
  );
});

export default PositionDetailsSection;

