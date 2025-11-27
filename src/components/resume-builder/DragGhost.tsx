import { memo, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Resume } from '../../pages/ResumeBuilderPage';
import CVPreviewCard from './CVPreviewCard';

interface DragGhostProps {
  resume: Resume | null;
  isVisible: boolean;
}

const DragGhost = memo(({ resume, isVisible }: DragGhostProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 400 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);
  const rotate = useTransform(xSpring, (value) => (value % 20) / 10);

  useEffect(() => {
    if (!isVisible) {
      x.set(0);
      y.set(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Offset by approximate half width/height of CV card
      x.set(e.clientX - 110);
      y.set(e.clientY - 80);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible, x, y]);

  if (!isVisible || !resume) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        x: xSpring,
        y: ySpring,
        rotate: rotate,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 0.75, scale: 0.9 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <div
        style={{
          filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) blur(1px)',
        }}
      >
        <CVPreviewCard
          resume={resume}
          onDelete={() => {}}
          onRename={() => {}}
          onEdit={() => {}}
        />
      </div>
    </motion.div>
  );
});

DragGhost.displayName = 'DragGhost';

export default DragGhost;

