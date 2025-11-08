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
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Select Your Gender</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          This helps us provide more relevant job recommendations
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNext({ gender: 'male' })}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            value === 'male'
              ? 'border-[#8D75E6] bg-[#8D75E6]/5 dark:bg-[#8D75E6]/10 dark:shadow-[0_0_0_1px_rgba(141,117,230,0.3),0_4px_12px_rgba(141,117,230,0.15)]'
              : 'border-gray-200 dark:border-gray-700 hover:border-[#8D75E6]/50 dark:hover:border-[#8D75E6]/50 bg-white dark:bg-gray-700/50 dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
          }`}
        >
          <User className="h-8 w-8 mx-auto mb-2 text-[#8D75E6]" />
          <div className="font-medium text-gray-900 dark:text-white">Male</div>
        </button>

        <button
          onClick={() => onNext({ gender: 'female' })}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            value === 'female'
              ? 'border-[#8D75E6] bg-[#8D75E6]/5 dark:bg-[#8D75E6]/10 dark:shadow-[0_0_0_1px_rgba(141,117,230,0.3),0_4px_12px_rgba(141,117,230,0.15)]'
              : 'border-gray-200 dark:border-gray-700 hover:border-[#8D75E6]/50 dark:hover:border-[#8D75E6]/50 bg-white dark:bg-gray-700/50 dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)] hover:shadow-md dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.3)]'
          }`}
        >
          <User className="h-8 w-8 mx-auto mb-2 text-[#8D75E6]" />
          <div className="font-medium text-gray-900 dark:text-white">Female</div>
        </button>
      </div>
    </div>
  );
}
