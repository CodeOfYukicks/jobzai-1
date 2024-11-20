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
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        {contractTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNext({ contractType: id })}
            className={`
              group relative p-6 rounded-xl transition-all duration-200
              ${value === id 
                ? 'bg-[#8D75E6]/10 border-2 border-[#8D75E6]' 
                : 'bg-gray-50 border-2 border-transparent hover:border-[#8D75E6]/30'
              }
            `}
          >
            <div className="flex flex-col items-center text-center">
              <Icon className={`h-10 w-10 mb-4 transition-colors ${
                value === id ? 'text-[#8D75E6]' : 'text-gray-400 group-hover:text-[#8D75E6]'
              }`} />
              <span className={`font-medium text-lg transition-colors ${
                value === id ? 'text-[#8D75E6]' : 'text-gray-700'
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
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => value && onNext({ contractType: value as any })}
          disabled={!value}
          className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7B64D3] transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
