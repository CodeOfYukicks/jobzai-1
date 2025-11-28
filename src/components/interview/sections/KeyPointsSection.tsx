import { memo } from 'react';
import { Sparkles, Target, Zap, Award, TrendingUp, Lightbulb, Star, CheckCircle } from 'lucide-react';
import { Interview } from '../../../types/interview';

interface KeyPointsSectionProps {
  interview: Interview;
}

const iconMap = [Sparkles, Target, Zap, Award, TrendingUp, Lightbulb, Star, CheckCircle];

const KeyPointsSection = memo(function KeyPointsSection({
  interview,
}: KeyPointsSectionProps) {
  const keyPoints = interview?.preparation?.keyPoints || [];

  return (
    <article className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-inset ring-amber-100 dark:ring-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">
              Key Points to Emphasize
            </h2>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Strategic talking points tailored for this interview
            </div>
          </div>
        </div>
      </header>

      {keyPoints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyPoints.slice(0, 8).map((point, index) => {
            const Icon = iconMap[index % iconMap.length];
            
            return (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 p-5 transition-all duration-200 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                     <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/20">
                        {index + 1}
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-normal">
                      {point}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
          <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            No key points generated
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Analyze the job posting to get strategic talking points
          </p>
        </div>
      )}
    </article>
  );
});

export default KeyPointsSection;
