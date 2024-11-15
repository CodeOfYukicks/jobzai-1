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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motivation.trim()) {
      onNext({ motivation: motivation.trim() });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Job Search Context</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about your motivation and what you're looking for in your next role
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          rows={6}
          placeholder="Example: I'm looking to transition from my current role in marketing to a product management position. I'm particularly interested in tech companies with strong mentorship programs..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6]"
        />

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!motivation.trim() || isSubmitting}
            className="btn-primary px-6 py-2 rounded-lg disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Complete Profile</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}