import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, CheckCircle } from 'lucide-react';

interface CVGenerationModalProps {
  isOpen: boolean;
  progress: number; // 0-100
  currentStep?: number;
  totalSteps?: number;
  message?: string;
  onClose?: () => void;
}

const generationSteps = [
  { label: 'Analyzing your resume...', progress: 0 },
  { label: 'Extracting key strengths...', progress: 25 },
  { label: 'Optimizing content...', progress: 50 },
  { label: 'Integrating keywords...', progress: 75 },
  { label: 'Finalizing your tailored resume...', progress: 90 },
];

export default function CVGenerationModal({ 
  isOpen, 
  progress, 
  currentStep = 0,
  totalSteps = 5,
  message,
  onClose 
}: CVGenerationModalProps) {
  const currentStepData = generationSteps[Math.min(currentStep, generationSteps.length - 1)] || generationSteps[0];
  const displayMessage = message || currentStepData.label;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="bg-white dark:bg-[#1E1F22] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 pointer-events-auto border border-gray-200 dark:border-[#2A2A2E]"
            >
              {/* Premium Spinner */}
              <div className="flex flex-col items-center justify-center mb-6">
                {/* Animated Gradient Spinner */}
                <div className="relative w-20 h-20 mb-6">
                  {/* Outer rotating ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg, #9333ea, #6366f1, #9333ea)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  >
                    <div className="absolute inset-[3px] rounded-full bg-white dark:bg-[#1E1F22]" />
                  </motion.div>
                  
                  {/* Inner icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Message */}
                <div className="text-center w-full">
                  <motion.div
                    key={displayMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center gap-2 mb-2"
                  >
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {displayMessage}
                    </h3>
                  </motion.div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This may take up to 60 seconds...
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-full relative overflow-hidden"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '200%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                </motion.div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {generationSteps.slice(0, totalSteps).map((step, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index <= currentStep
                        ? 'bg-purple-600 dark:bg-purple-400 w-6'
                        : 'bg-gray-200 dark:bg-gray-700 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


