import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface CampaignBreadcrumbsProps {
  currentStep: 'details' | 'template';
  onStepClick: (step: 'details' | 'template') => void;
  isStepValid: (step: 'details' | 'template') => boolean;
}

export default function CampaignBreadcrumbs({ 
  currentStep, 
  onStepClick,
  isStepValid 
}: CampaignBreadcrumbsProps) {
  const steps = [
    { id: 'details', name: 'Campaign Details', description: 'Basic information and settings' },
    { id: 'template', name: 'Email Template', description: 'Customize your message' },
  ];

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}
          >
            {/* Line connecting steps */}
            {stepIdx !== steps.length - 1 && (
              <div className="absolute top-4 left-7 -ml-px mt-0.5 h-0.5 w-full sm:w-full max-w-[100px] bg-gray-200">
                {currentStep === 'template' && (
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#6956A8]"
                  />
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (isStepValid(step.id as 'details' | 'template')) {
                  onStepClick(step.id as 'details' | 'template');
                }
              }}
              disabled={!isStepValid(step.id as 'details' | 'template')}
              className={`group relative flex items-start ${
                isStepValid(step.id as 'details' | 'template') ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <span className="flex h-9 items-center" aria-hidden="true">
                {step.id === 'details' && currentStep === 'template' ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#6956A8]"
                  >
                    <Check className="h-5 w-5 text-white" />
                  </motion.span>
                ) : (
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                      step.id === currentStep
                        ? 'border-[#6956A8] bg-white'
                        : isStepValid(step.id as 'details' | 'template')
                        ? 'border-gray-300 bg-white group-hover:border-[#6956A8]'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        step.id === currentStep ? 'bg-[#6956A8]' : 'bg-transparent'
                      }`}
                    />
                  </span>
                )}
              </span>
              <span className="ml-3 flex min-w-0 flex-col">
                <span
                  className={`text-sm font-medium transition-colors ${
                    step.id === currentStep || (step.id === 'details' && currentStep === 'template')
                      ? 'text-[#6956A8]'
                      : isStepValid(step.id as 'details' | 'template')
                      ? 'text-gray-500 group-hover:text-[#6956A8]'
                      : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
                <span
                  className={`text-xs transition-colors ${
                    isStepValid(step.id as 'details' | 'template')
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}