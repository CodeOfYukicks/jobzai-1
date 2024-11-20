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
        className="w-full p-4 border-2 border-gray-200 rounded-xl
          focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]
          transition-all duration-200 resize-none"
      />

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          Back
        </button>
        <button
          onClick={() => motivation.trim() && onNext({ motivation: motivation.trim() })}
          disabled={!motivation.trim() || isSubmitting}
          className="px-8 py-2 bg-[#8D75E6] text-white rounded-lg font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-[#7B64D3] transition-colors
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
