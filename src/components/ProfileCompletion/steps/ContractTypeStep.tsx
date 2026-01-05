import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ContractTypeStepProps {
  value: string;
  onNext: (data: { contractType: 'full-time' | 'part-time' | 'contract' | 'internship' }) => void;
  onBack: () => void;
}

const contractTypes = [
  { id: 'full-time', label: 'Full Time' },
  { id: 'part-time', label: 'Part Time' },
  { id: 'contract', label: 'Contract' },
  { id: 'internship', label: 'Internship' },
] as const;

export default function ContractTypeStep({ value, onNext, onBack }: ContractTypeStepProps) {
  const [selectedContractType, setSelectedContractType] = useState(value);

  useEffect(() => {
    setSelectedContractType(value);
  }, [value]);

  return (
    <div className="space-y-8">
      {/* Selection Pills - Clean, minimal */}
      <div className="flex flex-wrap gap-3">
        {contractTypes.map(({ id, label }) => {
          const isSelected = selectedContractType === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedContractType(id)}
              className={`
                relative px-5 py-3 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                }
              `}
            >
              {/* Selected background with animation */}
              {isSelected && (
                <motion.div
                  layoutId="contract-selected"
                  className="absolute inset-0 bg-gray-900 dark:bg-white rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className={`relative z-10 ${isSelected ? 'text-white dark:text-gray-900' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => selectedContractType && onNext({ contractType: selectedContractType as any })}
          disabled={!selectedContractType}
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
