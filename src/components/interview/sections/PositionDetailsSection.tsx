import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText } from 'lucide-react';
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
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800/60 overflow-hidden transition-all hover:shadow-premium-soft"
    >
      
      {/* Header Bar - Premium gradient accent */}
      <div className="relative px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50">
        {/* Subtle violet accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-jobzai-500/30 to-transparent" />
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400 dark:text-slate-500">
              Role Overview
            </span>
            <h3 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {application.position}
            </h3>
          </div>
          {responsibilities.length > 0 && (
            <span className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm" style={{ background: 'linear-gradient(135deg, #635BFF 0%, #5249e6 100%)', boxShadow: '0 2px 8px rgba(99, 91, 255, 0.3)' }}>
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

            {/* Responsibilities List - Premium accordion */}
            <div className="space-y-1">
              {responsibilities.map((responsibility, index) => {
                const isExpanded = expandedIndex === index;
                const text = responsibility.trim();
                const isLong = text.length > 80;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      group rounded-xl transition-all duration-200
                      ${isExpanded 
                        ? 'bg-jobzai-50/50 dark:bg-jobzai-950/20 ring-1 ring-jobzai-200/50 dark:ring-jobzai-800/30' 
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                      }
                    `}
                  >
                    <button
                      onClick={() => isLong && setExpandedIndex(isExpanded ? null : index)}
                      className={`
                        w-full text-left px-4 py-3.5 flex items-start gap-4
                        ${isLong ? 'cursor-pointer' : 'cursor-default'}
                      `}
                      disabled={!isLong}
                    >
                      {/* Index - Premium style */}
                      <span className={`
                        flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
                        text-xs font-semibold transition-all
                        ${isExpanded 
                          ? 'bg-jobzai-500 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-jobzai-100 dark:group-hover:bg-jobzai-900/30 group-hover:text-jobzai-600 dark:group-hover:text-jobzai-400'
                        }
                      `}>
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
                            flex-shrink-0 w-4 h-4 mt-0.5 transition-all duration-200
                            ${isExpanded 
                              ? 'rotate-90 text-jobzai-500' 
                              : 'text-slate-300 dark:text-slate-600 group-hover:text-jobzai-400'
                            }
                          `} 
                        />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No role details available
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Analyze the job posting to extract responsibilities
            </p>
          </div>
        )}
      </div>
    </motion.article>
  );
});

export default PositionDetailsSection;
