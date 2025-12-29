import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProfileBreadcrumbs from '../components/ProfileCompletion/ProfileBreadcrumbs';
import NameStep from '../components/ProfileCompletion/steps/NameStep';
import GenderStep from '../components/ProfileCompletion/steps/GenderStep';
import ContractTypeStep from '../components/ProfileCompletion/steps/ContractTypeStep';
import LocationStep from '../components/ProfileCompletion/steps/LocationStep';
import CVUploadStep from '../components/ProfileCompletion/steps/CVUploadStep';
import MotivationStep from '../components/ProfileCompletion/steps/MotivationStep';
import AvatarSetupStep from '../components/ProfileCompletion/steps/AvatarSetupStep';
import SubscriptionStep from '../components/ProfileCompletion/steps/SubscriptionStep';
import OnboardingLayout from '../components/layouts/OnboardingLayout';
import { saveAvatarConfig } from '../components/assistant/avatar/avatarConfig';
import { useIsMobile } from '../hooks/useIsMobile';
import MobileCompleteProfileFlow from './mobile/MobileCompleteProfileFlow';


const STEPS = ['name', 'gender', 'contract', 'location', 'cv', 'motivation', 'avatars', 'subscription'] as const;
type Step = typeof STEPS[number];

type StepInfo = {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
};

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { currentUser, completeProfile } = useAuth();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    contractType: '',
    city: '',
    country: '',
    cvUrl: '',
    cvName: '',
    motivation: '',
    plan: 'free'
  });

  // Use dedicated mobile flow on mobile devices
  if (isMobile) {
    return <MobileCompleteProfileFlow />;
  }

  const handleNext = async (data: any) => {
    const updatedData = { ...formData, ...data };
    setFormData(updatedData);

    // Save to Firestore
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        // Filter out undefined values as Firebase doesn't accept them
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await updateDoc(userRef, {
          ...cleanData,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        notify.error('Failed to save progress');
        return;
      }
    }

    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      // If it's the last step, navigate to dashboard or trigger final completion
      // The original code had a separate handleComplete for the last step.
      // This part might need adjustment based on the intended flow.
      // For now, let's assume the final step's 'onComplete' handles navigation.
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    try {
      await completeProfile(formData);
      navigate('/hub'); // Navigate to Hub after successful completion
    } catch (error) {
      console.error('Error completing profile:', error);
      notify.error('Failed to complete profile');
    }
  };

  const getCurrentStepInfo = (): StepInfo => {
    const currentIndex = STEPS.indexOf(currentStep) + 1;
    const totalSteps = STEPS.length;

    switch (currentStep) {
      case 'name':
        return {
          title: "Let's start with your name",
          subtitle: "We'll use this to personalize your experience",
          currentStep: currentIndex,
          totalSteps
        };
      case 'gender':
        return {
          title: "Tell us about yourself",
          subtitle: "This information helps us personalize your job search experience",
          currentStep: currentIndex,
          totalSteps
        };
      case 'contract':
        return {
          title: "What type of work are you looking for?",
          subtitle: "Select your preferred employment type",
          currentStep: currentIndex,
          totalSteps
        };
      case 'location':
        return {
          title: "Where would you like to work?",
          subtitle: "Select your preferred location",
          currentStep: currentIndex,
          totalSteps
        };
      case 'cv':
        return {
          title: "Upload your CV",
          subtitle: "Help us understand your experience better",
          currentStep: currentIndex,
          totalSteps
        };
      case 'motivation':
        return {
          title: "What motivates you?",
          subtitle: "Tell us about your career goals",
          currentStep: currentIndex,
          totalSteps
        };
      case 'avatars':
        return {
          title: "Create your duo",
          subtitle: "Customize your avatar and meet your AI assistant",
          currentStep: currentIndex,
          totalSteps
        };
      case 'subscription':
        return {
          title: "Choose your plan",
          subtitle: "Select the plan that best fits your needs",
          currentStep: currentIndex,
          totalSteps
        };
      default:
        return {
          title: "Complete your profile",
          subtitle: "Tell us more about yourself",
          currentStep: currentIndex,
          totalSteps
        };
    }
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <OnboardingLayout
      currentStep={stepInfo.currentStep}
      totalSteps={stepInfo.totalSteps}
      title={stepInfo.title}
      subtitle={stepInfo.subtitle}
    >
      {currentStep === 'name' && (
        <NameStep
          firstName={formData.firstName}
          lastName={formData.lastName}
          onNext={handleNext}
        />
      )}

      {currentStep === 'gender' && (
        <GenderStep
          value={formData.gender}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'contract' && (
        <ContractTypeStep
          value={formData.contractType}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'location' && (
        <LocationStep
          value={formData.city && formData.country ? `${formData.city}, ${formData.country}` : ''}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'cv' && (
        <CVUploadStep
          cvUrl={formData.cvUrl}
          cvName={formData.cvName}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 'motivation' && (
        <MotivationStep
          value={formData.motivation}
          onNext={handleNext}
          onBack={handleBack}
          isSubmitting={false}
        />
      )}

      {currentStep === 'avatars' && (
        <AvatarSetupStep
          onNext={async (data) => {
            // Save AI assistant avatar to localStorage (existing pattern)
            if (currentUser && data.assistantAvatarConfig) {
              await saveAvatarConfig(currentUser.uid, data.assistantAvatarConfig);
            }
            // Save profile avatar config to Firestore via handleNext
            handleNext({
              profileAvatarConfig: data.profileAvatarConfig,
              profileAvatarType: data.profileAvatarType,
            });
          }}
          onBack={handleBack}
        />
      )}

      {currentStep === 'subscription' && (
        <SubscriptionStep
          onComplete={handleComplete}
          onBack={handleBack}
          profileData={formData}
        />
      )}
    </OnboardingLayout>
  );
} 