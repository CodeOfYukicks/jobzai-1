import { useRef, useEffect } from 'react';
import { COLOR_PALETTE } from './ColorPicker';

interface ColorCirclePickerProps {
  x: number;
  y: number;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

export function ColorCirclePicker({ x, y, onColorSelect, onClose }: ColorCirclePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to prevent immediate closure when opening
    let cleanup: (() => void) | null = null;
    
    const timeoutId = setTimeout(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      cleanup = () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [onClose]);

  // Calculate positions for circles in an arc
  const radius = 60; // Distance from center to circles
  const angleStep = (2 * Math.PI) / COLOR_PALETTE.length; // Distribute colors evenly in a circle

  return (
    <div
      ref={pickerRef}
      className="fixed z-[1000] pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative w-0 h-0">
        {COLOR_PALETTE.map((color, index) => {
          const angle = index * angleStep - Math.PI / 2; // Start from top
          const circleX = Math.cos(angle) * radius;
          const circleY = Math.sin(angle) * radius;

          return (
            <button
              key={color.value}
              onClick={(e) => {
                e.stopPropagation();
                onColorSelect(color.value);
              }}
              className="absolute rounded-full border-2 border-white dark:border-gray-800 shadow-lg hover:scale-110 transition-all pointer-events-auto"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: color.value,
                left: `${circleX}px`,
                top: `${circleY}px`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
              }}
              title={color.name}
            />
          );
        })}
      </div>
    </div>
  );
}

