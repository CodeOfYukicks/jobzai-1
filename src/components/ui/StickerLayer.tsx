import { useState, useEffect, useRef, useCallback } from 'react';
import { DraggableSticker, StickerPosition } from './DraggableSticker';

const STORAGE_KEY = 'campaigns-sticker-positions';

// Sidebar width offset to avoid placing stickers behind the navigation
// Sidebar is ~320px wide on lg screens + some padding
const SIDEBAR_OFFSET = 340;

export interface StickerConfig {
  id: string;
  src: string;
  initialPosition: StickerPosition;
  rotation: number;
  size?: number;
}

// Default stickers configuration - positioned around the edges (accounting for sidebar)
const DEFAULT_STICKERS: StickerConfig[] = [
  {
    id: 'cv',
    src: '/images/stickers/cv.png',
    initialPosition: { x: SIDEBAR_OFFSET + 20, y: 100 },
    rotation: -8,
    size: 90,
  },
  {
    id: 'hiring',
    src: '/images/stickers/hiring.png',
    initialPosition: { x: SIDEBAR_OFFSET + 40, y: 480 },
    rotation: 12,
    size: 85,
  },
  {
    id: 'hiring2',
    src: '/images/stickers/hiring2.png',
    initialPosition: { x: SIDEBAR_OFFSET + 10, y: 280 },
    rotation: -5,
    size: 95,
  },
  {
    id: 'hiring3',
    src: '/images/stickers/hiring3.png',
    initialPosition: { x: SIDEBAR_OFFSET + 30, y: 620 },
    rotation: 15,
    size: 80,
  },
];

interface StickerLayerProps {
  stickers?: StickerConfig[];
  storageKey?: string;
}

export function StickerLayer({ 
  stickers = DEFAULT_STICKERS,
  storageKey = STORAGE_KEY,
}: StickerLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, StickerPosition>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Initialize positions from localStorage or defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPositions(parsed);
      }
    } catch (error) {
      console.warn('Failed to load sticker positions from localStorage:', error);
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Track container width for responsive positioning
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Save position to localStorage
  const handlePositionChange = useCallback((id: string, position: StickerPosition) => {
    setPositions((prev) => {
      const updated = { ...prev, [id]: position };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save sticker positions to localStorage:', error);
      }
      return updated;
    });
  }, [storageKey]);

  // Calculate initial position - place on right side for even-indexed stickers
  const getInitialPosition = (sticker: StickerConfig, index: number): StickerPosition => {
    // Check if we have a saved position
    if (positions[sticker.id]) {
      return positions[sticker.id];
    }

    // Calculate responsive positions based on container width
    const isRightSide = index % 2 === 1;
    
    if (isRightSide && containerWidth > 0) {
      // Position on the right edge
      return {
        x: containerWidth - 120,
        y: sticker.initialPosition.y,
      };
    }
    
    return sticker.initialPosition;
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 55 }} // Above sidebar (z-50) but below modals
    >
      {stickers.map((sticker, index) => {
        const position = getInitialPosition(sticker, index);
        
        return (
          <div key={sticker.id} className="pointer-events-auto">
            <DraggableSticker
              id={sticker.id}
              src={sticker.src}
              initialPosition={position}
              rotation={sticker.rotation}
              size={sticker.size}
              onPositionChange={handlePositionChange}
              containerRef={containerRef as React.RefObject<HTMLElement>}
              leftBoundary={SIDEBAR_OFFSET}
            />
          </div>
        );
      })}
    </div>
  );
}

export default StickerLayer;

