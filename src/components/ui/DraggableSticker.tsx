import { useState, useRef, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';

export interface StickerPosition {
  x: number;
  y: number;
}

export interface DraggableStickerProps {
  id: string;
  src: string;
  initialPosition: StickerPosition;
  rotation?: number;
  size?: number;
  onPositionChange?: (id: string, position: StickerPosition) => void;
  containerRef?: React.RefObject<HTMLElement>;
  leftBoundary?: number; // Minimum x position (to avoid sidebar)
}

export function DraggableSticker({
  id,
  src,
  initialPosition,
  rotation = 0,
  size = 80,
  onPositionChange,
  containerRef,
  leftBoundary = 0,
}: DraggableStickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const stickerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for enhanced effects
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Create a subtle 3D tilt effect based on drag position
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  // Track viewport size for drag constraints
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate drag constraints to keep sticker within bounds and away from sidebar
  const dragConstraints = {
    left: leftBoundary - position.x,
    right: viewportSize.width - position.x - size,
    top: -position.y,
    bottom: viewportSize.height - position.y - size,
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const newPosition = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    };
    
    // Ensure sticker stays within viewport bounds and respects left boundary (sidebar)
    if (containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const stickerSize = size;
      
      // Enforce left boundary to prevent going over sidebar
      newPosition.x = Math.max(leftBoundary, Math.min(newPosition.x, containerRect.width - stickerSize / 2));
      newPosition.y = Math.max(-stickerSize / 2, Math.min(newPosition.y, containerRect.height - stickerSize / 2));
    } else {
      // Even without container ref, enforce left boundary
      newPosition.x = Math.max(leftBoundary, newPosition.x);
    }
    
    setPosition(newPosition);
    onPositionChange?.(id, newPosition);
  };

  return (
    <motion.div
      ref={stickerRef}
      className="absolute select-none touch-none"
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        zIndex: isDragging ? 9999 : 50,
        cursor: isDragging ? 'grabbing' : 'grab',
        x,
        y,
        rotateX,
        rotateY,
        rotate: rotation,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={dragConstraints}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.2 },
      }}
      animate={{
        scale: isDragging ? 1.15 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      {/* Sticker image */}
      <motion.img
        src={src}
        alt="Sticker"
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
    </motion.div>
  );
}

export default DraggableSticker;

