import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PALETTE = [
  { name: 'Jaune', value: '#ffeb3b', class: 'bg-yellow-400' },
  { name: 'Rose', value: '#f48fb1', class: 'bg-pink-400' },
  { name: 'Bleu', value: '#90caf9', class: 'bg-blue-400' },
  { name: 'Vert', value: '#a5d6a7', class: 'bg-green-400' },
  { name: 'Violet', value: '#ce93d8', class: 'bg-purple-400' },
  { name: 'Orange', value: '#ffb74d', class: 'bg-orange-400' },
  { name: 'Rouge', value: '#ef9a9a', class: 'bg-red-400' },
  { name: 'Cyan', value: '#80deea', class: 'bg-cyan-400' },
  { name: 'Ambre', value: '#ffcc80', class: 'bg-amber-400' },
  { name: 'Indigo', value: '#9fa8da', class: 'bg-indigo-400' },
  { name: 'Lime', value: '#d4e157', class: 'bg-lime-400' },
  { name: 'Gris', value: '#bdbdbd', class: 'bg-gray-400' },
];

export function ColorPicker({ selectedColor, onColorChange, isOpen, onClose }: ColorPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute left-12 top-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[180px]"
    >
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 px-1">
        Couleur du post-it
      </div>
      <div className="grid grid-cols-3 gap-3">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color.value}
            onClick={() => {
              onColorChange(color.value);
              onClose();
            }}
            className={`w-10 h-10 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center ${
              selectedColor === color.value
                ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-purple-500 dark:ring-purple-400 shadow-md'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400'
            }`}
            title={color.name}
            style={{ backgroundColor: color.value }}
          >
            {selectedColor === color.value && (
              <Check className="w-5 h-5 text-gray-900 dark:text-white" strokeWidth={3} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

