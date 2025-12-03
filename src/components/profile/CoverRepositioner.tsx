import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CoverRepositionerProps {
  isOpen: boolean;
  coverImageUrl: string;
  onClose: () => void;
  onSave: (position: { x: number; y: number }) => Promise<void>;
  containerRef: React.RefObject<HTMLDivElement>;
}

const CoverRepositioner = ({
  isOpen,
  coverImageUrl,
  onClose,
  onSave,
  containerRef,
}: CoverRepositionerProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Get container dimensions
  useEffect(() => {
    if (!isOpen) {
      setContainerDimensions({ width: 0, height: 0 });
      return;
    }

    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          setContainerDimensions({ width, height });
          return true;
        }
      }
      return false;
    };

    // Try immediately
    if (!updateDimensions()) {
      // If dimensions are still 0, try again with intervals
      const timeoutId = setTimeout(() => {
        updateDimensions();
      }, 100);
      
      const intervalId = setInterval(() => {
        if (updateDimensions()) {
          clearInterval(intervalId);
        }
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    }

    const handleResize = () => updateDimensions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, containerRef]);

  const containerWidth = containerDimensions.width || 1584;
  const containerHeight = containerDimensions.height || 396;

  // Load image to get natural dimensions
  useEffect(() => {
    if (!coverImageUrl || !isOpen || containerWidth === 0 || containerHeight === 0) {
      setImageLoaded(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
      
      // Calculate initial position to center the image
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let displayWidth: number;
      let displayHeight: number;
      
      if (imgAspectRatio > containerAspectRatio) {
        // Image is wider - fit to height
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgAspectRatio;
      } else {
        // Image is taller - fit to width
        displayWidth = containerWidth;
        displayHeight = containerWidth / imgAspectRatio;
      }
      
      // Center the image
      const initialX = (containerWidth - displayWidth) / 2;
      const initialY = (containerHeight - displayHeight) / 2;
      
      setPosition({ x: initialX, y: initialY });
      setInitialPosition({ x: initialX, y: initialY });
    };
    img.src = coverImageUrl;
  }, [coverImageUrl, isOpen, containerWidth, containerHeight]);

  // Calculate bounds for image positioning
  const getBounds = useCallback(() => {
    if (!imageNaturalSize || containerWidth === 0 || containerHeight === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const imgAspectRatio = imageNaturalSize.width / imageNaturalSize.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let displayWidth: number;
    let displayHeight: number;
    
    if (imgAspectRatio > containerAspectRatio) {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imgAspectRatio;
    } else {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imgAspectRatio;
    }

    return {
      minX: containerWidth - displayWidth,
      maxX: 0,
      minY: containerHeight - displayHeight,
      maxY: 0,
    };
  }, [imageNaturalSize, containerWidth, containerHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setInitialPosition({ ...position });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const bounds = getBounds();
    
    const newX = Math.max(bounds.minX, Math.min(bounds.maxX, initialPosition.x + dx));
    const newY = Math.max(bounds.minY, Math.min(bounds.maxY, initialPosition.y + dy));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, initialPosition, getBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    setInitialPosition({ ...position });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragStart.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    const bounds = getBounds();
    
    const newX = Math.max(bounds.minX, Math.min(bounds.maxX, initialPosition.x + dx));
    const newY = Math.max(bounds.minY, Math.min(bounds.maxY, initialPosition.y + dy));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, initialPosition, getBounds]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  const handleSave = async () => {
    if (containerWidth === 0 || containerHeight === 0) return;
    
    setIsSaving(true);
    try {
      // Calculate relative position (0-1 range)
      const bounds = getBounds();
      const relativeX = bounds.maxX === bounds.minX ? 0.5 : (position.x - bounds.minX) / (bounds.maxX - bounds.minX);
      const relativeY = bounds.maxY === bounds.minY ? 0.5 : (position.y - bounds.minY) / (bounds.maxY - bounds.minY);
      
      await onSave({ x: relativeX, y: relativeY });
      onClose();
    } catch (error) {
      console.error('Error saving position:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to initial position
    setPosition(initialPosition);
    onClose();
  };

  if (!isOpen || !coverImageUrl) return null;
  
  // Show loading state if dimensions are not yet available
  if (containerWidth === 0 || containerHeight === 0) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="px-4 py-2 bg-gray-900/80 dark:bg-gray-800/90 backdrop-blur-md rounded-lg">
                <p className="text-sm font-medium text-white">Loading...</p>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  }

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: imageNaturalSize 
      ? `${(imageNaturalSize.width / imageNaturalSize.height) > (containerWidth / containerHeight) 
          ? containerHeight * (imageNaturalSize.width / imageNaturalSize.height)
          : containerWidth}px`
      : '100%',
    height: imageNaturalSize
      ? `${(imageNaturalSize.width / imageNaturalSize.height) > (containerWidth / containerHeight)
          ? containerHeight
          : containerWidth / (imageNaturalSize.width / imageNaturalSize.height)}px`
      : '100%',
    objectFit: 'cover',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover image area */}
            <div 
              className="relative overflow-hidden bg-gray-100 dark:bg-gray-900"
              style={{
                width: `${containerWidth}px`,
                height: `${containerHeight}px`,
                maxWidth: '100vw',
                maxHeight: '100vh',
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              {imageLoaded && imageNaturalSize && (
                <img
                  ref={imageRef}
                  src={coverImageUrl}
                  alt="Cover"
                  style={imageStyle}
                  draggable={false}
                />
              )}
              
              {/* Drag indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="px-4 py-2 bg-gray-900/80 dark:bg-gray-800/90 backdrop-blur-md rounded-lg border border-gray-700/50">
                  <p className="text-sm font-medium text-white">
                    Drag image to reposition
                  </p>
                </div>
              </motion.div>
            </div>
            
            {/* Control buttons - Top right */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 flex items-center gap-2 z-10"
            >
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
                  bg-white/90 dark:bg-gray-900/90 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800
                  border border-gray-200 dark:border-gray-700 rounded-md shadow-sm transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white 
                  bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700
                  rounded-md shadow-sm transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save position'
                )}
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CoverRepositioner;

