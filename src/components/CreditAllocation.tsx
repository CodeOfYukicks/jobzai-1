import { useState, useEffect } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreditAllocationProps {
  availableCredits: number;
  onChange: (credits: number) => void;
}

export default function CreditAllocation({ availableCredits, onChange }: CreditAllocationProps) {
  const [allocatedCredits, setAllocatedCredits] = useState<number>(0);
  const [isError, setIsError] = useState(false);

  // Only update error state and call onChange when allocatedCredits or availableCredits change
  useEffect(() => {
    const hasError = allocatedCredits > availableCredits;
    setIsError(hasError);
    
    // Only call onChange if there's no error
    if (!hasError) {
      onChange(allocatedCredits);
    }
  }, [allocatedCredits, availableCredits]); // Add onChange to dependency array if needed

  const handleInputChange = (value: string) => {
    const credits = parseInt(value) || 0;
    setAllocatedCredits(credits);
  };

  const percentage = Math.min((allocatedCredits / availableCredits) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-[#4D3E78]" />
          <h3 className="text-sm font-medium text-gray-700">Credit Allocation</h3>
        </div>
        <span className="text-sm text-gray-500">
          Available: {availableCredits} credits
        </span>
      </div>

      <div className="relative">
        <input
          type="number"
          min="0"
          max={availableCredits}
          value={allocatedCredits || ''}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-[#4D3E78] focus:border-[#4D3E78] ${
            isError ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter number of credits to use"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          credits
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#4D3E78] bg-[#4D3E78]/10">
              Credit Usage
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-[#4D3E78]">
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 text-xs flex rounded bg-[#4D3E78]/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
              isError ? 'bg-red-500' : 'bg-[#4D3E78]'
            }`}
          />
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center space-x-2 text-red-500 text-sm"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Exceeds available credits. Please adjust your allocation.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Usage Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Credit Usage</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• 1 credit = 1 spontaneous application</p>
          <p>• Remaining after allocation: {availableCredits - allocatedCredits} credits</p>
          <p>• Estimated applications: {allocatedCredits} companies</p>
        </div>
      </div>
    </div>
  );
}