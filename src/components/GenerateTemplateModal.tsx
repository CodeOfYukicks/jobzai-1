import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wand2, Loader2, Target, Palette, Settings2, 
  ChevronLeft, Check, Globe2, Zap, FileText, Sparkles
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { generateEmailTemplate, type GenerateOptions, type LanguageType } from '../lib/emailTemplates';
import { EMAIL_GOALS, type EmailGoal } from '../lib/constants/emailGoals';
import { EMAIL_LENGTHS, type EmailLength } from '../lib/constants/emailLength';

// Steps type definition
type Step = 'goal' | 'style' | 'details';
const STEPS: Step[] = ['goal', 'style', 'details'];

interface GenerateTemplateModalProps {
  onClose: () => void;
  onTemplateCreated?: (templateId: string) => void;
}

export default function GenerateTemplateModal({ onClose, onTemplateCreated }: GenerateTemplateModalProps) {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<Step>('goal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<Omit<GenerateOptions, 'userProfile'>>({
    goal: 'network',
    language: 'en',
    length: 'short',
    specificPoints: ''
  });

  // Calculate progress percentage
  const progressPercentage = (() => {
    const stepIndex = STEPS.indexOf(currentStep);
    return Math.round(((stepIndex + 1) / STEPS.length) * 100);
  })();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        notify.error('Failed to load user profile');
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Event handlers 
  const handleGoalSelect = (goal: EmailGoal) => {
    setOptions(prev => ({ ...prev, goal }));
  };

  const handleStyleSelect = (updates: Partial<GenerateOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  const handleDetailsSelect = (updates: Partial<GenerateOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    if (!currentUser || !userProfile) {
      notify.error('Please wait while loading your profile');
      return;
    }

    setIsGenerating(true);

    try {
      const template = await generateEmailTemplate({
        ...options,
        userProfile: {
          ...userProfile,
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          currentPosition: userProfile.currentPosition || '',
          yearsOfExperience: userProfile.yearsOfExperience || '',
          skills: userProfile.skills || [],
          targetPosition: userProfile.targetPosition || '',
          targetSectors: userProfile.targetSectors || [],
        }
      });

      const templateData = {
        ...template,
        aiGenerated: true,
        liked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: currentUser.uid
      };

      const templatesRef = collection(db, 'users', currentUser.uid, 'emailTemplates');
      const docRef = await addDoc(templatesRef, templateData);

      notify.success('Template generated successfully!');
      onTemplateCreated?.(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error generating template:', error);
      notify.error('Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex === 0) {
      onClose();
    } else {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  // UI components for each step
  const renderGoalStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a Goal</h3>
        </div>
        <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
          Step 1 of 3
        </span>
      </div>
      
      {Object.entries(EMAIL_GOALS).map(([key, goal]) => (
        <button
          key={key}
          onClick={() => handleGoalSelect(key as EmailGoal)}
          className={`w-full p-5 rounded-xl border transition-all duration-200 relative
            ${options.goal === key
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 text-left">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">{goal.label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {goal.examples[options.language]}
              </div>
            </div>
            
            {options.goal === key && (
              <div className="absolute right-5 top-5 w-5 h-5 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  const renderStyleStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600 dark:text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose Your Style</h3>
        </div>
        <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
          Step 2 of 3
        </span>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Length
        </label>
        
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(EMAIL_LENGTHS).map(([key, length]) => (
            <button
              key={key}
              onClick={() => handleStyleSelect({ length: key as EmailLength })}
              className={`w-full p-4 rounded-xl border transition-all duration-200 relative
                ${options.length === key
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {key === 'short' ? (
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                )}
                
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">{length.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {length.description[options.language]}
                  </div>
                </div>
                
                {options.length === key && (
                  <div className="w-5 h-5 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Language
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleStyleSelect({ language: 'en' })}
            className={`p-4 rounded-xl border transition-all duration-200 relative
              ${options.language === 'en'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
              }
            `}
          >
            <span className="font-medium text-gray-900 dark:text-white">English</span>
            
            {options.language === 'en' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
          
          <button
            onClick={() => handleStyleSelect({ language: 'fr' })}
            className={`p-4 rounded-xl border transition-all duration-200 relative
              ${options.language === 'fr'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
              }
            `}
          >
            <span className="font-medium text-gray-900 dark:text-white">Français</span>
            
            {options.language === 'fr' && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-purple-600 dark:text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Details</h3>
        </div>
        <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
          Step 3 of 3
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Any specific points you'd like to include?
          </label>
          <div className="flex items-center text-xs text-purple-600 dark:text-purple-400">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            <span>AI will use this to personalize your email</span>
          </div>
        </div>
        
        <textarea
          value={options.specificPoints}
          onChange={(e) => handleDetailsSelect({ specificPoints: e.target.value })}
          placeholder="Example: Mention my background in software development and my interest in AI projects..."
          className="w-full p-4 rounded-xl border border-gray-200 
            dark:border-gray-700 bg-white dark:bg-gray-800/50
            placeholder-gray-400 dark:placeholder-gray-500
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500
            text-sm resize-none"
          rows={8}
        />
      </div>

      <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 
        bg-purple-50 dark:bg-purple-900/20 p-5">
        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Tips for better results
        </h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-2 ml-5 list-disc">
          <li>Be specific about your experience and goals</li>
          <li>Mention any connections or mutual interests</li>
          <li>Include any specific achievements relevant to your goal</li>
          <li>Specify if you have any time constraints or deadlines</li>
        </ul>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-xl h-[85vh] bg-white dark:bg-gray-900 
          rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Template Studio
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your perfect email
              </p>
            </div>
          </div>
          
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                className="text-gray-100 dark:text-gray-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
                r="18"
                cx="20"
                cy="20"
              />
              <circle
                className="text-purple-600 dark:text-purple-500"
                strokeWidth="3"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * progressPercentage) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="18"
                cx="20"
                cy="20"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => index < STEPS.indexOf(currentStep) && setCurrentStep(step)}
                  className={`
                    flex items-center cursor-pointer
                    ${index <= STEPS.indexOf(currentStep) ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-600'}
                  `}
                  disabled={index > STEPS.indexOf(currentStep)}
                >
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-xs
                    ${index === STEPS.indexOf(currentStep)
                      ? 'bg-purple-600 dark:bg-purple-500 text-white'
                      : index < STEPS.indexOf(currentStep)
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                    }
                  `}>
                    {index < STEPS.indexOf(currentStep) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`ml-2 text-xs font-medium capitalize ${
                    index <= STEPS.indexOf(currentStep) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {step}
                  </span>
                </button>
                
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2
                    ${index < STEPS.indexOf(currentStep)
                      ? 'bg-purple-200 dark:bg-purple-900/50'
                      : 'bg-gray-200 dark:bg-gray-800'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 'goal' && renderGoalStep()}
              {currentStep === 'style' && renderStyleStep()}
              {currentStep === 'details' && renderDetailsStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-700
                text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800
                transition-colors duration-200"
            >
              {currentStep === 'goal' ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={handleNext}
              disabled={isGenerating}
              className="flex-1 px-5 py-2.5 rounded-lg
                bg-gradient-to-r from-purple-600 to-indigo-600
                text-white font-medium
                hover:opacity-90 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {currentStep === 'details' ? (
                isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Generate Template</span>
                  </>
                )
              ) : (
                <span>Continue</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}