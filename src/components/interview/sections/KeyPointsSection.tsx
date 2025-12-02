import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare } from 'lucide-react';
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
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="h-full rounded-2xl bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800/60 p-6 transition-all hover:shadow-premium-soft"
    >
      
      {/* Header - Premium badge style */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500">
            Key Talking Points
          </span>
          {keyPoints.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-jobzai-100 dark:bg-jobzai-950/50 text-[10px] font-bold text-jobzai-600 dark:text-jobzai-400">
              {keyPoints.length}
            </span>
          )}
        </div>
      </div>

      {keyPoints.length > 0 ? (
        <div className="space-y-0">
          <AnimatePresence>
            {visiblePoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group py-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  {/* Number indicator - Premium violet gradient */}
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg text-white text-[10px] font-bold flex items-center justify-center mt-0.5 shadow-sm" style={{ background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)' }}>
                    {index + 1}
                  </span>
                  
                  {/* Content */}
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {point}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Expand/Collapse Button */}
          {hasMore && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-jobzai-600 hover:text-jobzai-700 dark:text-jobzai-400 dark:hover:text-jobzai-300 transition-colors"
            >
              {isExpanded ? 'Show less' : `+${keyPoints.length - 4} more`}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </motion.button>
          )}
        </div>
      ) : (
        <div className="py-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No points yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Analyze job to generate
          </p>
        </div>
      )}
    </motion.article>
  );
});

export default KeyPointsSection;
