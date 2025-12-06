import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import debounce from 'lodash/debounce';
import StepIndicator from './StepIndicator';
import StepContent from './StepContent';

interface ProfileWizardProps {
  onComplete?: () => void;
  onUpdate?: (data: any) => void;
}

const steps = [
  {
    id: 1,
    title: 'Welcome',
    subtitle: 'Let\'s start by understanding your situation',
    component: 'WelcomeStep'
  },
  {
    id: 2,
    title: 'Personal Information',
    subtitle: 'Some basic information',
    component: 'PersonalStep'
  },
  {
    id: 3,
    title: 'Location',
    subtitle: 'Where are you located?',
    component: 'LocationStep'
  },
  {
    id: 4,
    title: 'Education & Languages',
    subtitle: 'Your educational background',
    component: 'EducationStep'
  },
  {
    id: 5,
    title: 'Professional Experience',
    subtitle: 'Your professional journey',
    component: 'ExperienceStep'
  },
  {
    id: 6,
    title: 'Skills',
    subtitle: 'Your technical skills',
    component: 'SkillsStep'
  },
  {
    id: 7,
    title: 'Objectives',
    subtitle: 'What you are looking for',
    component: 'ObjectivesStep'
  },
  {
    id: 8,
    title: 'Motivations',
    subtitle: 'What motivates you',
    component: 'MotivationsStep'
  },
  {
    id: 9,
    title: 'Role Preferences',
    subtitle: 'Preferred role type',
    component: 'RolePreferencesStep'
  },
  {
    id: 10,
    title: 'Soft Skills',
    subtitle: 'Your behavioral skills',
    component: 'SoftSkillsStep'
  },
  {
    id: 11,
    title: 'Finalization',
    subtitle: 'Final touches',
    component: 'FinalizationStep'
  }
];

const ProfileWizard = ({ onComplete, onUpdate }: ProfileWizardProps) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données existantes depuis Firestore
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData(userData);
          
          // Marquer les étapes complétées
          const completed = new Set<number>();
          if (userData.firstName && userData.lastName) completed.add(2);
          if (userData.city && userData.country) completed.add(3);
          if (userData.educationLevel) completed.add(4);
          if (userData.professionalHistory && userData.professionalHistory.length > 0) completed.add(5);
          if (userData.skills && userData.skills.length > 0) completed.add(6);
          if (userData.targetPosition) completed.add(7);
          if (userData.careerPriorities && userData.careerPriorities.length > 0) completed.add(8);
          if (userData.roleType) completed.add(9);
          if (userData.softSkills && userData.softSkills.length > 0) completed.add(10);
          if (userData.cvUrl || userData.linkedinUrl) completed.add(11);
          
          setCompletedSteps(completed);
        }
      } catch (error) {
        console.error('Error loading wizard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Sauvegarde automatique debounced
  const saveToFirebase = debounce(async (data: any) => {
    if (!currentUser?.uid) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...data,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving wizard data:', error);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Auto-save
      if (onUpdate) {
        onUpdate(formData);
      }
      saveToFirebase(formData);
    } else {
      // Final step - complete
      saveToFirebase(formData);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || completedSteps.has(step)) {
      setCurrentStep(step);
    }
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const handleDataUpdate = (data: any) => {
    const updated = { ...formData, ...data };
    setFormData(updated);
    markStepComplete(currentStep);
    saveToFirebase(updated);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const currentStepData = steps.find(s => s.id === currentStep);
  const progress = (currentStep / totalSteps) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header cohérent avec le reste du site */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => {
                  if (onComplete) {
                    onComplete();
                  }
                }}
                whileHover={{ x: -2 }}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 
                  hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 
                  transition-all duration-200 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to full view</span>
              </motion.button>
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">
                  Step {currentStep} of {totalSteps}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  {Math.round(progress)}% complete
                </div>
              </div>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"></div>
                Saving...
              </div>
            )}
          </div>
          
          {/* Barre de progression cohérente */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Cohérent avec le reste du site */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-[calc(100vh-200px)]">
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="w-full"
            >
              <StepContent
                step={currentStep}
                data={formData}
                onUpdate={handleDataUpdate}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation cohérente */}
        <div className="flex items-center justify-between mt-8 flex-shrink-0">
          <motion.button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            whileHover={{ x: -2 }}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
              transition-all duration-200
              ${currentStep === 1
                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </motion.button>

          <div className="flex items-center gap-3">
            {completedSteps.has(currentStep) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800"
              >
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Completed</span>
              </motion.div>
            )}
          </div>

          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
              transition-all duration-200
              ${currentStep === totalSteps
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-indigo-700'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {currentStep === totalSteps ? 'Finish' : 'Continue'}
            {currentStep < totalSteps && <ChevronRight className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard;

