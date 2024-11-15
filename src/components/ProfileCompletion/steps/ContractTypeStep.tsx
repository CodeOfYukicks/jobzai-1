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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Preferred Contract Type</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select the type of employment you're looking for
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {contractTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNext({ contractType: id })}
            className={`p-4 rounded-lg border-2 transition-colors ${
              value === id
                ? 'border-[#8D75E6] bg-[#8D75E6]/5'
                : 'border-gray-200 hover:border-[#8D75E6]/50'
            }`}
          >
            <Icon className="h-8 w-8 mx-auto mb-2 text-[#8D75E6]" />
            <div className="font-medium">{label}</div>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ contractType: value as any })}
          disabled={!value}
          className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}