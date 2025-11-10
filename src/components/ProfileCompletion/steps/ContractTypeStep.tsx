import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Clock, Calendar, GraduationCap } from 'lucide-react';

interface ContractTypeStepProps {
  value: string;
  onNext: (data: { contractType: 'full-time' | 'part-time' | 'contract' | 'internship' }) => void;
  onBack: () => void;
}

const contractTypes = [
  { id: 'full-time', label: 'Full Time', icon: Briefcase },
  { id: 'part-time', label: 'Part Time', icon: Clock },
  { id: 'contract', label: 'Contract', icon: Calendar },
  { id: 'internship', label: 'Internship', icon: GraduationCap },
] as const;

export default function ContractTypeStep({ value, onNext, onBack }: ContractTypeStepProps) {
  const [selectedContractType, setSelectedContractType] = useState(value);

  // Update local state when prop value changes
  useEffect(() => {
    setSelectedContractType(value);
  }, [value]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        {contractTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedContractType(id)}
            className={`
              group relative p-6 rounded-xl transition-all duration-200
              ${selectedContractType === id 
                ? 'bg-[#8D75E6]/10 dark:bg-[#8D75E6]/20 border-2 border-[#8D75E6] dark:shadow-[0_0_0_1px_rgba(141,117,230,0.4),0_8px_16px_rgba(141,117,230,0.2)]' 
                : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-[#8D75E6]/30 dark:hover:border-[#8D75E6]/30 dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
              }
            `}
          >
            <div className="flex flex-col items-center text-center">
              <Icon className={`h-10 w-10 mb-4 transition-colors ${
                selectedContractType === id ? 'text-[#8D75E6]' : 'text-gray-400 dark:text-gray-500 group-hover:text-[#8D75E6]'
              }`} />
              <span className={`font-medium text-lg transition-colors ${
                selectedContractType === id ? 'text-[#8D75E6]' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => selectedContractType && onNext({ contractType: selectedContractType as any })}
          disabled={!selectedContractType}
          className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7B64D3] transition-all duration-200
            shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]
            hover:shadow-lg dark:hover:shadow-[0_6px_12px_rgba(141,117,230,0.4)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
