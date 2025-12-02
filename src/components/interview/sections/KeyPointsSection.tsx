import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Interview } from '../../../types/interview';

interface KeyPointsSectionProps {
  interview: Interview;
}

const KeyPointsSection = memo(function KeyPointsSection({
  interview,
}: KeyPointsSectionProps) {
  const keyPoints = interview?.preparation?.keyPoints || [];
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Show first 4 by default, rest on expand
  const visiblePoints = isExpanded ? keyPoints : keyPoints.slice(0, 4);
  const hasMore = keyPoints.length > 4;

  return (
    <article className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 transition-colors">
      
      {/* Header - Minimal */}
      <div className="mb-5">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-400 dark:text-slate-500">
          Key Talking Points
        </span>
        {keyPoints.length > 0 && (
          <span className="ml-2 text-[10px] font-medium text-slate-300 dark:text-slate-600">
            {keyPoints.length}
          </span>
        )}
      </div>

      {keyPoints.length > 0 ? (
        <div className="space-y-0">
          {visiblePoints.map((point, index) => (
            <div
              key={index}
              className="group py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                {/* Number indicator */}
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {index + 1}
                </span>
                
                {/* Content */}
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {point}
                </p>
              </div>
            </div>
          ))}
          
          {/* Expand/Collapse Button */}
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full pt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              {isExpanded ? 'Show less' : `+${keyPoints.length - 4} more`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No points yet
          </p>
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">
            Analyze job to generate
          </p>
        </div>
      )}
    </article>
  );
});

export default KeyPointsSection;
