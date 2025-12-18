import { motion } from 'framer-motion';
import { Pencil, Type } from 'lucide-react';

interface AIUpdatingIndicatorProps {
  variant?: 'note' | 'selection';
}

/**
 * Premium AI updating indicator with Notion-like animations
 * Features: breathing glow icon + shimmer text effect
 */
export default function AIUpdatingIndicator({ variant = 'note' }: AIUpdatingIndicatorProps) {
  const text = variant === 'selection' 
    ? 'Editing selected text' 
    : 'Updating your note';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-2.5 py-1"
    >
      {/* Animated Icon with Glow */}
      <div className="relative flex items-center justify-center">
        {/* Glow ring - breathing animation */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0.15, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-[#635BFF]"
          style={{ filter: 'blur(6px)' }}
        />
        
        {/* Icon container */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full 
            bg-gradient-to-br from-[#635BFF] to-[#8B7FFF]"
        >
          {variant === 'selection' ? (
            <Type className="w-2.5 h-2.5 text-white" />
          ) : (
            <Pencil className="w-2.5 h-2.5 text-white" />
          )}
        </motion.div>
      </div>

      {/* Shimmer Text */}
      <div className="relative overflow-hidden">
        <span 
          className="text-[14px] font-medium text-gray-500 dark:text-gray-400"
          style={{
            background: 'linear-gradient(90deg, currentColor 0%, currentColor 40%, rgba(99, 91, 255, 0.9) 50%, currentColor 60%, currentColor 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'ai-shimmer-text 2.5s ease-in-out infinite',
          }}
        >
          {text}
        </span>
        
        {/* Animated dots */}
        <span className="inline-flex ml-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="text-[14px] font-medium text-gray-400 dark:text-gray-500"
            >
              .
            </motion.span>
          ))}
        </span>
      </div>

      {/* Inline keyframes style */}
      <style>{`
        @keyframes ai-shimmer-text {
          0%, 100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </motion.div>
  );
}

