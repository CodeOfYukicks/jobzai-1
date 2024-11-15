import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import ProfileBreadcrumbs from './ProfileBreadcrumbs';
import GenderStep from './steps/GenderStep';
import ContractTypeStep from './steps/ContractTypeStep';
import LocationStep from './steps/LocationStep';
import CVUploadStep from './steps/CVUploadStep';
import MotivationStep from './steps/MotivationStep';
import SubscriptionStep from './SubscriptionStep';

export type ProfileData = {
  gender: 'male' | 'female' | '';
  contractType: 'full-time' | 'part-time' | 'contract' | 'internship' | '';
  location: string;
  cvUrl?: string;
  cvName?: string;
  motivation: string;
}

// Reorder steps to put subscription at the end
const steps = ['gender', 'contract', 'location', 'cv', 'motivation', 'subscription'] as const;
type Step = typeof steps[number];

export default function ProfileCompletionFlow() {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('gender');
  const [profileData, setProfileData] = useState<ProfileData>({
    gender: '',
    contractType: '',
    location: '',
    motivation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async (data: Partial<ProfileData>) => {
    const updatedData = { ...profileData, ...data };
    setProfileData(updatedData);

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      // If we're moving to the subscription step, save the profile data first
      if (steps[currentIndex + 1] === 'subscription') {
        try {
          setIsSubmitting(true);
          const userRef = doc(db, 'users', currentUser!.uid);
          await updateDoc(userRef, {
            ...updatedData,
            lastUpdated: new Date().toISOString()
          });
          toast.success('Profile information saved');
        } catch (error) {
          console.error('Error saving profile:', error);
          toast.error('Failed to save profile data');
          return;
        } finally {
          setIsSubmitting(false);
        }
      }
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Help us personalize your job search experience
            </p>
          </div>

          {/* Progress */}
          <div className="px-8 py-4 bg-gray-50 border-b">
            <ProfileBreadcrumbs 
              steps={steps} 
              currentStep={currentStep} 
              onStepClick={setCurrentStep}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 'gender' && (
                  <GenderStep 
                    value={profileData.gender}
                    onNext={handleNext}
                  />
                )}
                {currentStep === 'contract' && (
                  <ContractTypeStep
                    value={profileData.contractType}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 'location' && (
                  <LocationStep
                    value={profileData.location}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 'cv' && (
                  <CVUploadStep
                    cvUrl={profileData.cvUrl}
                    cvName={profileData.cvName}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {currentStep === 'motivation' && (
                  <MotivationStep
                    value={profileData.motivation}
                    onNext={handleNext}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                  />
                )}
                {currentStep === 'subscription' && (
                  <SubscriptionStep
                    onComplete={() => {
                      // Redirect to dashboard after subscription
                      window.location.href = '/dashboard';
                    }}
                    onBack={handleBack}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}