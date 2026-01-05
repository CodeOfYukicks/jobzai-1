import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GenderStepProps {
  value: string;
  onNext: (data: { gender: 'male' | 'female' | 'prefer-not-to-say' }) => void;
  onBack?: () => void;
}

const genderOptions = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

export default function GenderStep({ value, onNext, onBack }: GenderStepProps) {
  const [selectedGender, setSelectedGender] = useState(value);

  useEffect(() => {
    setSelectedGender(value);
  }, [value]);

  return (
    <div className="space-y-8">
      {/* Segmented Control - Clean, no icons */}
      <div className="bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1">
        <div className="grid grid-cols-3 gap-1">
          {genderOptions.map((option) => {
            const isSelected = selectedGender === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedGender(option.id)}
                className={`
                  relative py-3.5 px-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isSelected
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70'
                  }
                `}
              >
                {/* Selected background */}
                {isSelected && (
                  <motion.div
                    layoutId="gender-selected"
                    className="absolute inset-0 bg-white dark:bg-white/[0.12] rounded-lg shadow-sm"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={() => selectedGender && onNext({ gender: selectedGender as 'male' | 'female' | 'prefer-not-to-say' })}
          disabled={!selectedGender}
          className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
