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
  const duration = isMobile ? 0.8 : 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ 
            clipPath: `circle(0px at ${clickPosition.x}px ${clickPosition.y}px)`,
            opacity: 0.8
          }}
          animate={{ 
            clipPath: `circle(170% at ${clickPosition.x}px ${clickPosition.y}px)`,
            opacity: 1
          }}
          exit={{ 
            clipPath: `circle(0px at ${clickPosition.x}px ${clickPosition.y}px)`,
            opacity: 0.8
          }}
          transition={{ 
            duration,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: color,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default PageTransition; 