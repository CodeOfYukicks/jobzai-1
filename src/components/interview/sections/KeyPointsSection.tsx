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
  
  if (keyPoints.length === 0) {
    return (
      <article className="rounded-xl bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-6 shadow-sm">
        <header className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Key Points to Emphasize
            </h2>
          </div>
        </header>
        
        <div className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2A2A2E] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Run job post analysis to generate key talking points
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-6 shadow-sm transition-all duration-200">
      <header className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Key Points to Emphasize
          </h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 ml-9">
          Messages that will make you stand out
        </p>
      </header>
      
      {/* Key Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {keyPoints.slice(0, 8).map((point, index) => {
          const Icon = iconMap[index % iconMap.length];
          
          return (
            <div
              key={index}
              className="group rounded-lg bg-gray-50/50 dark:bg-[#1A1A1D]/50 border border-gray-100 dark:border-[#2A2A2E] p-4 transition-all duration-200 hover:bg-white dark:hover:bg-[#1E1F22] hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {point}
                  </p>
                </div>

                {/* Number Badge */}
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {index + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Points Indicator */}
      {keyPoints.length > 8 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#2A2A2E] text-xs text-gray-600 dark:text-gray-400">
            <Sparkles className="w-3 h-3" />
            +{keyPoints.length - 8} more points
          </div>
        </div>
      )}
    </article>
  );
});

export default KeyPointsSection;
