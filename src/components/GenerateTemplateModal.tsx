import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Wand2, Loader2, Target, Palette, Eye, Settings2, Check } from 'lucide-react';
import { GoalStep } from './steps/GoalStep';
import { StyleStep } from './steps/StyleStep';
import { DetailsStep } from './steps/DetailsStep';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { generateEmailTemplate, type GenerateOptions } from '../lib/emailTemplates';
import { EMAIL_GOALS, type EmailGoal } from '../lib/constants/emailGoals';
import { EMAIL_LENGTHS, type EmailLength } from '../lib/constants/emailLength';

// Types pour le stepper
type Step = 'goal' | 'style' | 'details';

interface GenerateTemplateModalProps {
  onClose: () => void;
  onTemplateCreated?: (templateId: string) => void;
}

// Utilitaires pour la gestion des étapes
const STEPS = ['goal', 'style', 'details'] as const;

const getStepNumber = (step: typeof STEPS[number]): number => {
  return STEPS.indexOf(step) + 1;
};

const getNextStep = (currentStep: typeof STEPS[number]): typeof STEPS[number] => {
  const currentIndex = STEPS.indexOf(currentStep);
  return STEPS[currentIndex + 1] || currentStep;
};

// Fonctions d'aide (helpers)
const getTipsForGoal = (goal: EmailGoal) => {
  switch (goal) {
    case 'network':
      return 'Focus on mutual benefits and shared interests';
    case 'explore':
      return 'Highlight your relevant skills and experience';
    case 'introduction':
      return 'Keep it professional but personable';
    default:
      return '';
  }
};

const getTipsForLength = (length: EmailLength) => {
  switch (length) {
    case 'short':
      return 'Be concise and get straight to the point';
    case 'detailed':
      return 'Include relevant context and specific examples';
    default:
      return '';
  }
};

export default function GenerateTemplateModal({ onClose, onTemplateCreated }: GenerateTemplateModalProps) {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<typeof STEPS[number]>('goal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<Omit<GenerateOptions, 'userProfile'>>({
    goal: 'network',
    language: 'en',
    length: 'short',
    specificPoints: ''
  });

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
        toast.error('Failed to load user profile');
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Gestionnaires d'événements pour chaque étape
  const handleGoalSelect = (goal: EmailGoal) => {
    setOptions(prev => ({ ...prev, goal }));
  };

  const handleStyleSelect = (updates: Partial<GenerateOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  const handleDetailsSelect = (updates: Partial<GenerateOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  // Ajout de la fonction handleGenerate
  const handleGenerate = async () => {
    if (!currentUser || !userProfile) {
      toast.error('Please wait while loading your profile');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Generating with options:', options); // Debug log
      
      const template = await generateEmailTemplate({
        ...options,
        userProfile: {
          ...userProfile,
          // Assurez-vous que ces champs existent dans votre profil
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          // Ajoutez d'autres champs nécessaires selon votre modèle
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

      toast.success('Template generated successfully!');
      onTemplateCreated?.(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  // Navigation
  const handleNext = () => {
    if (currentStep === 'details') {
      handleGenerate();
    } else {
      setCurrentStep(getNextStep(currentStep));
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

  // Ajout du calcul de progression
  const calculateProgress = () => {
    let progress = 0;
    
    // Goal sélectionné : +33%
    if (options.goal) progress += 33;
    
    // Style (length + language) : +33%
    if (options.length) progress += 16.5;
    if (options.language) progress += 16.5;
    
    // Details (specificPoints) : +34%
    if (options.specificPoints.trim()) progress += 34;
    
    return Math.round(progress);
  };

  const progressPercentage = calculateProgress();

  // Ajout d'une fonction pour gérer le clic sur une étape
  const handleStepClick = (stepIndex: number) => {
    const targetStep = STEPS[stepIndex];
    const currentIndex = STEPS.indexOf(currentStep);
    
    // Ne permet que de revenir en arrière, pas d'avancer
    if (stepIndex < currentIndex) {
      setCurrentStep(targetStep);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm p-4">
      <div className="relative h-auto max-h-[90vh] w-full max-w-2xl mx-auto rounded-2xl overflow-hidden">
        {/* Version Mobile - NE PAS TOUCHER */}
        <div className="md:hidden bg-white dark:bg-[#1a1f2e] h-full">
          {/* Header Mobile */}
          <header className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-800">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <X className="h-5 w-5" />
              <span className="text-sm">Cancel</span>
            </button>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Generate Template</h1>
            <div className="w-14" />
          </header>

          {/* Stepper Mobile */}
          <div className="px-4 py-2 flex justify-between text-sm">
            {['Goal', 'Style', 'Details'].map((step, index) => (
              <div key={step} className="flex items-center">
                <button 
                  onClick={() => handleStepClick(index)}
                  className={`
                    flex items-center
                    ${index < STEPS.indexOf(currentStep) ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${index + 1 === getStepNumber(currentStep)
                      ? 'bg-purple-600 text-white'
                      : index < STEPS.indexOf(currentStep)
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' // Étape complétée
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500' // Étape future
                    }
                  `}>
                    {index < STEPS.indexOf(currentStep) ? (
                      <Check className="h-3 w-3" /> // Icône de validation pour les étapes complétées
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`ml-2 
                    ${index + 1 === getStepNumber(currentStep)
                      ? 'text-gray-900 dark:text-white'
                      : index < STEPS.indexOf(currentStep)
                        ? 'text-purple-600 dark:text-purple-400' // Étape complétée
                        : 'text-gray-500 dark:text-gray-400' // Étape future
                    }`}
                  >
                    {step}
                  </span>
                </button>
                {index < 2 && (
                  <div className={`w-12 h-px mx-2
                    ${index < STEPS.indexOf(currentStep)
                      ? 'bg-purple-200 dark:bg-purple-900/50' // Ligne complétée
                      : 'bg-gray-200 dark:bg-gray-800' // Ligne future
                    }
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Content Mobile avec Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 overflow-y-auto"
              style={{ height: 'calc(100vh - 8.5rem)' }}
            >
              {currentStep === 'goal' && <GoalStep options={options} onSelect={handleGoalSelect} />}
              {currentStep === 'style' && <StyleStep options={options} onSelect={handleStyleSelect} />}
              {currentStep === 'details' && <DetailsStep options={options} onSelect={handleDetailsSelect} />}
            </motion.div>
          </AnimatePresence>

          {/* Footer Mobile */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1a1f2e] border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-3">
              {/* Bouton Cancel - toujours visible */}
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 
                  text-gray-700 dark:text-gray-300 rounded-xl
                  hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              {/* Bouton Previous - visible sauf à la première étape */}
              {currentStep !== 'goal' && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-700 
                    text-gray-700 dark:text-gray-300 rounded-xl
                    hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
              )}
              
              {/* Bouton Continue/Generate */}
              <button
                onClick={currentStep === 'details' ? handleGenerate : handleNext}
                disabled={isGenerating}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl
                  flex items-center justify-center gap-2 hover:bg-purple-700 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    {currentStep === 'details' ? (
                      <>
                        <Wand2 className="h-5 w-5" />
                        <span>Generate</span>
                      </>
                    ) : (
                      <span>Continue</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Version Desktop - NOUVELLE VERSION */}
        <div className="hidden md:block bg-white dark:bg-[#0B1120] h-full">
          <div className="flex flex-col h-full">
            {/* Header avec progression */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      className="text-gray-100 dark:text-purple-900/30"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="24"
                      cy="24"
                    />
                    <circle
                      className="text-purple-600"
                      strokeWidth="3"
                      strokeDasharray={125}
                      strokeDashoffset={125 - (125 * progressPercentage) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="24"
                      cy="24"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-purple-600 dark:text-purple-400">
                    {progressPercentage}%
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Template Studio</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create your perfect email</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu principal */}
            <div className="flex flex-1">
              {/* Colonne de gauche */}
              <div className="w-1/2 p-6 space-y-8">
                {/* Section Goal */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                      <span className="text-gray-900 dark:text-gray-400">Goal</span>
                    </div>
                    <span className="text-sm text-purple-600 dark:text-purple-500">1/3</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(EMAIL_GOALS).map(([key, goal]) => (
                      <button
                        key={key}
                        onClick={() => handleGoalSelect(key as EmailGoal)}
                        className={`w-full p-4 rounded-xl border ${
                          options.goal === key
                            ? 'bg-purple-50 border-purple-600 dark:bg-purple-600/10 dark:border-purple-500'
                            : 'bg-white border-gray-200 hover:border-purple-300 dark:bg-transparent dark:border-gray-800 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="text-left">
                          <div className="text-gray-900 dark:text-white mb-1">{goal.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {goal.examples[options.language]}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Style */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                      <span className="text-gray-900 dark:text-gray-400">Style</span>
                    </div>
                    <span className="text-sm text-purple-600 dark:text-purple-500">2/3</span>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(EMAIL_LENGTHS).map(([key, length]) => (
                      <button
                        key={key}
                        onClick={() => handleStyleSelect({ length: key as EmailLength })}
                        className={`w-full p-4 rounded-xl border ${
                          options.length === key
                            ? 'bg-purple-50 border-purple-600 dark:bg-purple-600/10 dark:border-purple-500'
                            : 'bg-white border-gray-200 hover:border-purple-300 dark:bg-transparent dark:border-gray-800 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="text-left">
                          <div className="text-gray-900 dark:text-white mb-1">{length.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {length.description[options.language]}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-2 gap-3">
                  {['en', 'fr'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleStyleSelect({ language: lang as 'en' | 'fr' })}
                      className={`p-4 rounded-xl border ${
                        options.language === lang
                          ? 'bg-purple-50 border-purple-600 dark:bg-purple-600/10 dark:border-purple-500'
                          : 'bg-white border-gray-200 hover:border-purple-300 dark:bg-transparent dark:border-gray-800 dark:hover:border-gray-700'
                      }`}
                    >
                      <span className={options.language === lang ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}>
                        {lang === 'en' ? 'English' : 'Français'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colonne de droite */}
              <div className="w-1/2 p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                    <span className="text-gray-900 dark:text-gray-400">Additional Details</span>
                  </div>
                  <textarea
                    value={options.specificPoints}
                    onChange={(e) => handleDetailsSelect({ specificPoints: e.target.value })}
                    placeholder="Add any specific points you'd like to include..."
                    className="w-full h-[300px] p-4 rounded-xl 
                      bg-white dark:bg-gray-800/50 
                      border-gray-200 dark:border-gray-800
                      text-gray-900 dark:text-white 
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:ring-2 focus:ring-purple-500
                      focus:border-purple-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl
                  flex items-center justify-center gap-2 hover:bg-purple-700 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    <span>Generate Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}