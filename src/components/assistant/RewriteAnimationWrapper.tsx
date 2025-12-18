import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

export type AnimationType = 'fade' | 'slide' | 'morph' | 'none';

interface RewriteAnimationWrapperProps {
  children: ReactNode;
  isApplying: boolean;
  animationType?: AnimationType;
  onAnimationComplete?: () => void;
}

/**
 * Wrapper component that handles smooth animations when applying text rewrites
 * Inspired by Notion's fluid text transformations
 */
export default function RewriteAnimationWrapper({
  children,
  isApplying,
  animationType = 'morph',
  onAnimationComplete,
}: RewriteAnimationWrapperProps) {
  const getAnimationVariants = () => {
    switch (animationType) {
      case 'fade':
        return {
          initial: { opacity: 1 },
          applying: { opacity: 0.3, scale: 0.98 },
          complete: { opacity: 1, scale: 1 },
        };
      
      case 'slide':
        return {
          initial: { opacity: 1, x: 0 },
          applying: { opacity: 0, x: -20 },
          complete: { opacity: 1, x: 0 },
        };
      
      case 'morph':
        return {
          initial: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          applying: { 
            opacity: 0.5, 
            scale: 0.99, 
            filter: 'blur(2px)',
            transition: {
              duration: 0.15,
              ease: 'easeInOut',
            }
          },
          complete: { 
            opacity: 1, 
            scale: 1, 
            filter: 'blur(0px)',
            transition: {
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1], // Custom spring-like easing
            }
          },
        };
      
      case 'none':
      default:
        return {
          initial: {},
          applying: {},
          complete: {},
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.div
      initial="initial"
      animate={isApplying ? 'applying' : 'complete'}
      variants={variants}
      onAnimationComplete={() => {
        if (!isApplying && onAnimationComplete) {
          onAnimationComplete();
        }
      }}
      className="relative"
    >
      {children}
      
      {/* Overlay effect during application */}
      <AnimatePresence>
        {isApplying && animationType === 'morph' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#635BFF]/10 to-transparent animate-shimmer bg-200" />
            
            {/* Glow pulse */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0px rgba(99, 91, 255, 0)',
                  '0 0 20px rgba(99, 91, 255, 0.2)',
                  '0 0 0px rgba(99, 91, 255, 0)',
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Text morphing component for character-by-character transitions
 * Used for more granular text animations
 */
interface TextMorphProps {
  originalText: string;
  newText: string;
  isAnimating: boolean;
  onComplete?: () => void;
}

export function TextMorph({ originalText, newText, isAnimating, onComplete }: TextMorphProps) {
  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {isAnimating ? (
        <motion.div
          key="transition"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          {originalText}
        </motion.div>
      ) : (
        <motion.div
          key="final"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="inline-block"
        >
          {newText}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Highlight flash effect for showing where changes were applied
 */
interface HighlightFlashProps {
  children: ReactNode;
  isFlashing: boolean;
  color?: string;
}

export function HighlightFlash({ 
  children, 
  isFlashing,
  color = 'rgba(99, 91, 255, 0.15)'
}: HighlightFlashProps) {
  return (
    <motion.div
      animate={
        isFlashing
          ? {
              backgroundColor: [
                'transparent',
                color,
                color,
                'transparent',
              ],
            }
          : { backgroundColor: 'transparent' }
      }
      transition={{
        duration: 1.5,
        ease: 'easeInOut',
      }}
      className="rounded-lg px-1 -mx-1"
    >
      {children}
    </motion.div>
  );
}








