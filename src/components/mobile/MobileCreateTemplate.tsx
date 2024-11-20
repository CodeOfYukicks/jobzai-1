import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { ConfigStep } from '../steps/ConfigStep';
import { ContentStep } from '../steps/ContentStep';
import { FinalizeStep } from '../steps/FinalizeStep';
import type { Template } from '../../types/template';

type Step = 'config' | 'content' | 'finalize';
const STEPS: Step[] = ['config', 'content', 'finalize'];
const STEP_LABELS = {
  config: 'Goal',
  content: 'Content',
  finalize: 'Settings'
};

interface Props {
  template: Template;
  setTemplate: (template: Template) => void;
  handleSave: () => void;
  insertMergeField: (field: string) => void;
  navigate: NavigateFunction;
}

export function MobileCreateTemplate({ 
  template, 
  setTemplate, 
  handleSave, 
  insertMergeField,
  navigate 
}: Props) {
  const [currentStep, setCurrentStep] = useState<Step>('config');

  const handleChange = (field: string, value: string) => {
    setTemplate({ ...template, [field]: value });
  };

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex === 0) {
      navigate(-1);
    } else {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const calculateProgress = () => {
    const stepIndex = STEPS.indexOf(currentStep);
    return Math.round(((stepIndex + 1) / STEPS.length) * 100);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0B1120] z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={handleBack} 
          className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#9333EA]/10 flex items-center justify-center">
            <span className="text-[#9333EA] text-sm font-medium">
              {calculateProgress()}%
            </span>
          </div>
          <div>
            <h1 className="text-gray-900 dark:text-white font-semibold">Template Studio</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create your perfect email</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Fil d'ariane */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-medium
                ${currentStep === step 
                  ? 'bg-[#9333EA] text-white' 
                  : STEPS.indexOf(currentStep) > index
                    ? 'bg-[#9333EA]/10 text-[#9333EA]'
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400'
                }
              `}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium
                ${currentStep === step 
                  ? 'text-gray-900 dark:text-white' 
                  : STEPS.indexOf(currentStep) > index
                    ? 'text-[#9333EA]'
                    : 'text-gray-400'
                }
              `}>
                {STEP_LABELS[step]}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div className={`
                h-[2px] w-16 mx-3
                ${STEPS.indexOf(currentStep) > index
                  ? 'bg-[#9333EA]'
                  : 'bg-gray-200 dark:bg-gray-800/50'
                }
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="h-[calc(100vh-12rem)] overflow-y-auto bg-white dark:bg-[#0B1120]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {currentStep === 'config' && (
              <div className="space-y-6">
                <ConfigStep 
                  template={template} 
                  handleChange={handleChange} 
                />
              </div>
            )}
            {currentStep === 'content' && (
              <div className="space-y-6">
                <ContentStep 
                  template={template} 
                  handleChange={handleChange}
                  insertMergeField={insertMergeField}
                />
              </div>
            )}
            {currentStep === 'finalize' && (
              <div className="space-y-6">
                <FinalizeStep 
                  template={template} 
                  handleChange={handleChange} 
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#0B1120] border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-4 
              bg-gray-100 dark:bg-gray-900 
              border border-gray-300 dark:border-gray-800
              text-gray-700 dark:text-gray-300 
              font-medium rounded-xl 
              hover:bg-gray-200 dark:hover:bg-gray-800 
              transition-colors"
          >
            Cancel
          </button>

          {currentStep !== 'config' && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-4 
                bg-gray-100 dark:bg-gray-900 
                border border-gray-300 dark:border-gray-800
                text-gray-700 dark:text-gray-300 
                font-medium rounded-xl 
                hover:bg-gray-200 dark:hover:bg-gray-800 
                transition-colors"
            >
              Previous
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 
              bg-[#9333EA] hover:bg-[#9333EA]/90
              text-white font-medium rounded-xl 
              transition-colors"
          >
            {currentStep === 'finalize' ? 'Generate Template' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
} 