import { memo } from 'react';
import { Check, Flag, ArrowUp, ArrowRight } from 'lucide-react';
import { Interview } from '../../../types/interview';

interface KeyPointsSectionProps {
  interview: Interview;
}

const KeyPointsSection = memo(function KeyPointsSection({
  interview,
}: KeyPointsSectionProps) {
  return (
    <article className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5">
      <header className="mb-5">
        <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Key Points to Emphasize</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Core messages to highlight during the interview</p>
      </header>
      
      {interview?.preparation?.keyPoints && interview.preparation.keyPoints.length > 0 ? (
        <div className="space-y-3">
          <ul className="space-y-3">
            {interview.preparation.keyPoints.slice(0, 5).map((point, index) => (
              <li 
                key={index} 
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                </div>
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {point}
                </p>
              </li>
            ))}
          </ul>
          {interview.preparation.keyPoints.length > 5 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 transition-colors"
              >
                View all {interview.preparation.keyPoints.length} points
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-black/[0.08] bg-[#FAFAFA] dark:border-white/10 dark:bg-white/5 px-4 py-8 text-center">
          <Flag className="mb-3 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            No key points available yet. Run the job post analysis to generate tailored talking points.
          </p>
          <button
            type="button"
            onClick={() =>
              (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus()
            }
            className="inline-flex items-center justify-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-200 dark:hover:bg-purple-800/60 transition-colors"
          >
            <ArrowUp className="h-3 w-3" />
            Analyze a job posting
          </button>
        </div>
      )}
    </article>
  );
});

export default KeyPointsSection;

