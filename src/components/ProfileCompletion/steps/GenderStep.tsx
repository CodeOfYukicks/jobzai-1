import { motion } from 'framer-motion';
import { User } from 'lucide-react';

interface GenderStepProps {
  value: string;
  onNext: (data: { gender: 'male' | 'female' }) => void;
}

export default function GenderStep({ value, onNext }: GenderStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Select Your Gender</h2>
        <p className="mt-1 text-sm text-gray-500">
          This helps us provide more relevant job recommendations
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNext({ gender: 'male' })}
          className={`p-4 rounded-lg border-2 transition-colors ${
            value === 'male'
              ? 'border-[#8D75E6] bg-[#8D75E6]/5'
              : 'border-gray-200 hover:border-[#8D75E6]/50'
          }`}
        >
          <User className="h-8 w-8 mx-auto mb-2 text-[#8D75E6]" />
          <div className="font-medium">Male</div>
        </button>

        <button
          onClick={() => onNext({ gender: 'female' })}
          className={`p-4 rounded-lg border-2 transition-colors ${
            value === 'female'
              ? 'border-[#8D75E6] bg-[#8D75E6]/5'
              : 'border-gray-200 hover:border-[#8D75E6]/50'
          }`}
        >
          <User className="h-8 w-8 mx-auto mb-2 text-[#8D75E6]" />
          <div className="font-medium">Female</div>
        </button>
      </div>
    </div>
  );
}