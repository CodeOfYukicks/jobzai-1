import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const stepTitles = {
  gender: 'Gender',
  contract: 'Contract Type',
  location: 'Location',
  cv: 'CV Upload',
  motivation: 'Motivation',
  subscription: 'Plan Selection'
};

interface ProfileBreadcrumbsProps {
  steps: readonly string[];
  currentStep: string;
  onStepClick: (step: any) => void;
}

export default function ProfileBreadcrumbs({ steps, currentStep, onStepClick }: ProfileBreadcrumbsProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step}
            className={`relative ${
              index !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
            }`}
          >
            {/* Connecting line */}
            {index !== steps.length - 1 && (
              <div className="absolute top-4 left-7 -ml-px mt-0.5 h-0.5 w-full sm:w-full max-w-[100px] bg-gray-200">
                {index < currentIndex && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    className="h-full bg-[#635bff] dark:bg-[#7C3AED]"
                  />
                )}
              </div>
            )}

            <button
              onClick={() => index <= currentIndex && onStepClick(step)}
              className={`group relative flex items-start ${
                index <= currentIndex ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <span className="flex h-9 items-center" aria-hidden="true">
                {index < currentIndex ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#635bff] dark:bg-[#7C3AED]"
                  >
                    <Check className="h-5 w-5 text-white" />
                  </motion.span>
                ) : (
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      index === currentIndex
                        ? 'border-[#635bff] dark:border-[#7C3AED] bg-white dark:bg-gray-800'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        index === currentIndex ? 'bg-[#635bff] dark:bg-[#7C3AED]' : 'bg-transparent'
                      }`}
                    />
                  </span>
                )}
              </span>
              <span className="ml-3 text-sm font-medium text-gray-500">
                {stepTitles[step as keyof typeof stepTitles]}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
