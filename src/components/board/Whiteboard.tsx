import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWhiteboardStore } from '../../stores/whiteboardStore';
import { BoardObject } from '../../types/whiteboard';

interface WhiteboardProps {
  width?: number;
  height?: number;
  onSave?: (objects: BoardObject[]) => void;
  initialObjects?: BoardObject[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function Whiteboard({ 
  width, 
  height, 
  onSave,
  initialObjects,
  isFullscreen = false,
  onToggleFullscreen
}: WhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: width || 800, height: height || 600 });
  const { objects, loadObjects, saveToHistory, canvasState } = useWhiteboardStore();

  useKeyboardShortcuts();

  // Load initial objects - loadObjects initializes history immediately
  useEffect(() => {
    if (initialObjects && initialObjects.length > 0) {
      loadObjects(initialObjects);
    }
  }, [initialObjects, loadObjects]);

  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef.current || width || height) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  // Auto-save callback - save even if objects.length === 0
  useEffect(() => {
    if (onSave) {
      const timeoutId = setTimeout(() => {
        console.log('[AUTO-SAVE] Saving objects:', objects.length);
        onSave(objects);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [objects, onSave]);

  // Save canvasState when it changes (pan/zoom)
  useEffect(() => {
    if (onSave) {
      const timeoutId = setTimeout(() => {
        console.log('[AUTO-SAVE] Saving canvasState');
        onSave(objects);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [canvasState, objects, onSave]);

  // Save before page unload or visibility change
  useEffect(() => {
    if (!onSave) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save when page becomes hidden
        console.log('[AUTO-SAVE] Saving on visibility change');
        onSave(objects);
      }
    };

    const handleBeforeUnload = () => {
      // Try to save synchronously before unload (may not always work)
      console.log('[AUTO-SAVE] Attempting save before unload');
      // Note: async operations in beforeunload are not guaranteed
      // The debounced save should handle most cases
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [objects, onSave]);

  const fullscreenHeight = isFullscreen ? window.innerHeight : (height || dimensions.height);
  const fullscreenWidth = isFullscreen ? window.innerWidth : (width || dimensions.width);

  if (isFullscreen) {
    return (
      <AnimatePresence>
        {/* Backdrop overlay - keeps page visible with blur/darkening */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onToggleFullscreen}
        />
        
        {/* Whiteboard panel - slides down from top */}
        <motion.div
          initial={{ y: -window.innerHeight, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -window.innerHeight, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 top-0 bottom-0 z-50 bg-white dark:bg-gray-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
              title="Réduire"
            >
              <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          <div className="flex w-full h-full bg-gray-50 dark:bg-gray-900">
            <WhiteboardToolbar />
            <div className="flex-1 relative">
              <WhiteboardCanvas width={fullscreenWidth - 60} height={fullscreenHeight} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full h-full bg-gray-50 dark:bg-gray-900 relative"
      style={{ width: width || '100%', height: height || '100%' }}
    >
      <WhiteboardToolbar />
      <div className="flex-1 relative">
        <WhiteboardCanvas width={dimensions.width} height={dimensions.height} />
        {/* Maximize button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="absolute top-2 right-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm z-20"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
}

