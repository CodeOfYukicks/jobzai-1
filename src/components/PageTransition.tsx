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

  const duration = window.innerWidth > 1024 ? 0.6 : 0.4;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ 
            clipPath: `circle(0px at ${clickPosition.x}px ${clickPosition.y}px)` 
          }}
          animate={{ 
            clipPath: `circle(150% at ${clickPosition.x}px ${clickPosition.y}px)` 
          }}
          exit={{ 
            clipPath: `circle(0px at ${clickPosition.x}px ${clickPosition.y}px)` 
          }}
          transition={{ 
            duration,
            ease: "easeInOut"
          }}
          onAnimationComplete={onAnimationComplete}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: color,
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default PageTransition; 