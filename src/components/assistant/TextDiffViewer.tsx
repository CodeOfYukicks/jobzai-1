import { motion } from 'framer-motion';
import { computeTextDiff, DiffSegment } from '../../utils/textDiff';
import { useMemo } from 'react';

interface TextDiffViewerProps {
  originalText: string;
  rewrittenText: string;
  showAnimation?: boolean;
}

export default function TextDiffViewer({ 
  originalText, 
  rewrittenText,
  showAnimation = true 
}: TextDiffViewerProps) {
  const diffSegments = useMemo(() => {
    return computeTextDiff(originalText, rewrittenText);
  }, [originalText, rewrittenText]);

  return (
    <div className="space-y-6">
      {/* Original Text */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Original
          </h3>
        </div>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#2a2a2b] border border-gray-200 dark:border-white/10">
          <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {diffSegments.map((segment, index) => {
              if (segment.type === 'removed') {
                return (
                  <motion.span
                    key={index}
                    initial={showAnimation ? { opacity: 0, x: -5 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded px-1 line-through decoration-2"
                  >
                    {segment.text}
                  </motion.span>
                );
              } else if (segment.type === 'unchanged') {
                return (
                  <span key={index} className="text-gray-600 dark:text-gray-400">
                    {segment.text}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* Arrow Indicator */}
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <svg
            className="w-6 h-6 text-[#635BFF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Changes
          </span>
        </motion.div>
      </div>

      {/* Rewritten Text */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-[#635BFF]" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Rewritten
          </h3>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-200/60 dark:border-indigo-500/20">
          <div className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {diffSegments.map((segment, index) => {
              if (segment.type === 'added') {
                return (
                  <motion.span
                    key={index}
                    initial={showAnimation ? { opacity: 0, x: 5 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded px-1 font-medium"
                  >
                    {segment.text}
                  </motion.span>
                );
              } else if (segment.type === 'unchanged') {
                return (
                  <span key={index}>
                    {segment.text}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}




