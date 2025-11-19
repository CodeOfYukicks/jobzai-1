import { memo } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface Milestone {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
  action: () => void;
}

interface PreparationProgressProps {
  preparationProgress: number;
  milestones: Milestone[];
}

const PreparationProgress = memo(function PreparationProgress({
  preparationProgress,
  milestones,
}: PreparationProgressProps) {
  return (
    <article className="group relative overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.92)] px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-black/5 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:bg-neutral-900/70 dark:ring-white/5">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="mb-1 text-xl font-semibold text-neutral-900 dark:text-white">Preparation Progress</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Complete the key milestones to feel fully ready</p>
        </div>
        <div className="flex flex-col items-end text-right">
          <div className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
            {preparationProgress}%
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {milestones.filter((m) => m.completed).length}/5 completed
          </div>
        </div>
      </header>
      
      {/* Progress bar */}
      <div className="mb-6 h-2 rounded-full bg-[#F5F5F7] dark:bg-neutral-800 overflow-hidden">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 transition-all duration-800 ease-out"
          style={{ width: `${preparationProgress}%` }}
        />
      </div>
        
      {/* Next actions */}
      <div className="space-y-2.5">
        <div className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">
          Next actions
        </div>
        {milestones.map((milestone) => (
          <button
            key={milestone.id}
            type="button"
            onClick={milestone.action}
            className={[
              'group/milestone w-full flex items-center justify-between rounded-[10px] px-4 py-3 text-left transition-all duration-200',
              milestone.completed
                ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50'
                : 'bg-white/60 dark:bg-white/5 border border-black/[0.04] dark:border-white/5 hover:bg-white/90 dark:hover:bg-white/10 hover:border-purple-200/50 dark:hover:border-purple-800/50',
            ].join(' ')}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={[
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] transition-transform',
                  milestone.completed 
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-[#F5F5F7] dark:bg-white/10 text-purple-600 dark:text-purple-400',
                ].join(' ')}
              >
                <div className="h-4 w-4">{milestone.icon}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={[
                    'truncate text-sm font-medium',
                    milestone.completed
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-neutral-900 dark:text-white',
                  ].join(' ')}
                >
                  {milestone.label}
                </div>
                <div className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {milestone.description}
                </div>
              </div>
            </div>
            {milestone.completed ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 ml-2" />
            ) : (
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-400 dark:text-neutral-500 group-hover/milestone:text-purple-500 dark:group-hover/milestone:text-purple-400 group-hover/milestone:translate-x-0.5 transition-all ml-2" />
            )}
          </button>
        ))}
      </div>
    </article>
  );
});

export default PreparationProgress;

