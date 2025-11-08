import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface MotivationStepProps {
  value: string;
  onNext: (data: { motivation: string }) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function MotivationStep({ value, onNext, onBack, isSubmitting }: MotivationStepProps) {
  const [motivation, setMotivation] = useState(value);

  return (
    <div className="space-y-8">
      <textarea
        value={motivation}
        onChange={(e) => setMotivation(e.target.value)}
        rows={6}
        placeholder="Example: I'm looking to transition from my current role in marketing to a product management position. I'm particularly interested in tech companies with strong mentorship programs..."
        className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl
          bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]
          transition-all duration-200 resize-none
          shadow-sm dark:shadow-[0_2px_4px_rgba(0,0,0,0.2)]
          focus:shadow-md dark:focus:shadow-[0_4px_8px_rgba(141,117,230,0.2),0_2px_4px_rgba(0,0,0,0.3)]"
      />

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => motivation.trim() && onNext({ motivation: motivation.trim() })}
          disabled={!motivation.trim() || isSubmitting}
          className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7B64D3] transition-all duration-200
            shadow-md dark:shadow-[0_4px_8px_rgba(141,117,230,0.3)]
            hover:shadow-lg dark:hover:shadow-[0_6px_12px_rgba(141,117,230,0.4)]
            flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Complete Profile</span>
          )}
        </button>
      </div>
    </div>
  );
}
