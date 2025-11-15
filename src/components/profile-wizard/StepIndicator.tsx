import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
}

const StepIndicator = ({ 
  currentStep, 
  totalSteps, 
  completedSteps,
  onStepClick 
}: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-between gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = completedSteps.has(step);
        const isCurrent = step === currentStep;
        const isClickable = step <= currentStep || isCompleted;

        return (
          <div key={step} className="flex-1 flex items-center">
            {/* Point de l'étape */}
            <button
              onClick={() => isClickable && onStepClick?.(step)}
              disabled={!isClickable}
              className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-full
                transition-all duration-300
                ${isCurrent
                  ? 'bg-purple-600 text-white scale-110 shadow-lg'
                  : isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }
                ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
              `}
            >
              {isCompleted && !isCurrent ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{step}</span>
              )}
              
              {/* Tooltip */}
              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                >
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                    Étape {step}
                  </div>
                </motion.div>
              )}
            </button>

            {/* Ligne de connexion */}
            {step < totalSteps && (
              <div className="flex-1 h-1 mx-2 relative">
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ 
                    scaleX: step < currentStep || completedSteps.has(step) ? 1 : 0 
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;






