import { memo } from 'react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';

interface CompanyProfileSectionProps {
  application: JobApplication;
  interview: Interview;
}

const CompanyProfileSection = memo(function CompanyProfileSection({
  application,
  interview,
}: CompanyProfileSectionProps) {
  return (
    <article className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5">
      <header className="mb-5">
        <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Company Profile</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">How to describe the company and its context</p>
      </header>
      
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-neutral-900 dark:text-white">
          <span className="mr-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            KEY
          </span>
          {interview?.preparation?.companyInfo?.split('.')[0] ||
            `${application.companyName} is a leading company in its industry.`}
        </p>
        
        {interview?.preparation?.companyInfo ? (
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {interview.preparation.companyInfo.split('.').slice(1, 3).join('.')}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            No additional company information available yet. Run the job post analysis to generate richer company context.
          </p>
        )}

        <div className="rounded-[12px] border border-blue-200/50 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-900/10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-neutral-50">
            Focus points
          </div>
          <ul className="space-y-2.5 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
              <span>Research their mission, values, and long-term vision.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
              <span>Review recent company achievements, projects, or announcements.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
              <span>Understand their market position, competitors, and key challenges.</span>
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
});

export default CompanyProfileSection;

