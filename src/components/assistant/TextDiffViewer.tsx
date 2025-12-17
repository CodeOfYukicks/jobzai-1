import { motion } from 'framer-motion';
import { computeTextDiff } from '../../utils/textDiff';
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
    <div className="space-y-0">
      {/* Unified Notion-style inline diff */}
      <div className="
        p-5 rounded-lg
        bg-[#fbfbfa] dark:bg-[#202020]
        border border-[#e8e8e8] dark:border-[#303030]
      ">
        {/* Content with inline diff highlighting */}
        <div className="text-[14px] leading-[1.7] text-[#37352f] dark:text-[#e3e3e3] whitespace-pre-wrap font-normal">
          {diffSegments.map((segment, index) => {
            if (segment.type === 'removed') {
              return (
                <motion.span
                  key={index}
                  initial={showAnimation ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01, duration: 0.2 }}
                  className="
                    relative inline
                    text-[#eb5757] dark:text-[#ff6b6b]
                    line-through decoration-[#eb5757]/50
                  "
                >
                  {segment.text}
                </motion.span>
              );
            } else if (segment.type === 'added') {
              return (
                <motion.span
                  key={index}
                  initial={showAnimation ? { opacity: 0, y: 2 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01, duration: 0.2 }}
                  className="
                    relative inline
                    text-[#0f7b6c] dark:text-[#4dab9a]
                    bg-[#0f7b6c]/10 dark:bg-[#0f7b6c]/20
                    rounded-[3px] px-0.5 -mx-0.5
                  "
                >
                  {segment.text}
                </motion.span>
              );
            } else {
              // unchanged
              return (
                <span key={index} className="text-[#37352f] dark:text-[#ffffffcf]">
                  {segment.text}
                </span>
              );
            }
          })}
        </div>

        {/* Visual indicator bar on left - Notion style */}
        <div className="mt-4 pt-4 border-t border-[#ebebea] dark:border-[#303030]">
          <div className="flex items-center gap-4 text-[11px] text-[#9b9a97] dark:text-[#7f7f7f]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[3px] rounded-full bg-[#eb5757]/60" />
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[3px] rounded-full bg-[#0f7b6c]" />
              <span>Added</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
