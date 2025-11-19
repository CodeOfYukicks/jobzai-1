import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface GenerationLoadingScreenProps {
  onBack: () => void;
  toolName: string;
}

export const GenerationLoadingScreen = ({ onBack, toolName }: GenerationLoadingScreenProps) => {
  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800">
      {/* Back button - top left */}
      <div className="absolute top-4 left-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Spinner - minimalist design */}
      <div className="relative w-12 h-12 mb-6">
        {/* Outer circle */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-200 dark:border-purple-800"
        />
        {/* Animated segment */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 dark:border-t-purple-400"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Main message */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-base font-semibold text-purple-900 dark:text-purple-100 mb-2"
      >
        Still Going, hang in there...
      </motion.h2>

      {/* Secondary message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xs text-purple-700 dark:text-purple-300 text-center max-w-sm leading-relaxed"
      >
        This may take up to a minute for some tools, hang tight... it's worth the wait!
      </motion.p>
    </div>
  );
};

