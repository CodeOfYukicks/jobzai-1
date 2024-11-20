import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  isOpen: boolean;
  color: string;
  clickPosition: { x: number; y: number } | null;
  onAnimationComplete: () => void;
}

const PageTransition: FC<PageTransitionProps> = ({ 
  isOpen, 
  color, 
  clickPosition,
  onAnimationComplete 
}) => {
  if (!clickPosition) return null;

  const isMobile = window.innerWidth <= 768;
  const duration = isMobile ? 0.35 : 0.6;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ 
            clipPath: `circle(0px at ${clickPosition.x}px ${clickPosition.y}px)` 
          }}
          animate={{ 
            clipPath: `circle(200% at ${clickPosition.x}px ${clickPosition.y}px)` 
          }}
          exit={{ 
            clipPath: `circle(0px at ${clickPosition.x}px ${clickPosition.y}px)` 
          }}
          transition={{ 
            duration,
            ease: isMobile ? "easeOut" : "easeInOut"
          }}
          onAnimationComplete={onAnimationComplete}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: color,
            zIndex: 9999,
            pointerEvents: 'none',
            willChange: 'clip-path'
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default PageTransition; 