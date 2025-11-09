import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import ProfileBreadcrumbs from '../components/ProfileCompletion/ProfileBreadcrumbs';
import NameStep from '../components/ProfileCompletion/steps/NameStep';
import GenderStep from '../components/ProfileCompletion/steps/GenderStep';
import ContractTypeStep from '../components/ProfileCompletion/steps/ContractTypeStep';
import LocationStep from '../components/ProfileCompletion/steps/LocationStep';
import CVUploadStep from '../components/ProfileCompletion/steps/CVUploadStep';
import MotivationStep from '../components/ProfileCompletion/steps/MotivationStep';
import SubscriptionStep from '../components/ProfileCompletion/steps/SubscriptionStep';
import OnboardingLayout from '../components/layouts/OnboardingLayout';

const STEPS = ['name', 'gender', 'contract', 'location', 'cv', 'motivation', 'subscription'] as const;
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
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    contractType: '',
    location: '',
    cvUrl: '',
    cvName: '',
    motivation: '',
    plan: 'free'
  });

  const handleNext = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
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
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile');
    }
  };

  const getCurrentStepInfo = (): StepInfo => {
    const currentIndex = STEPS.indexOf(currentStep) + 1;
    const totalSteps = STEPS.length;

    switch(currentStep) {
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
          value={formData.location}
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

      {currentStep === 'subscription' && (
        <SubscriptionStep
          onComplete={handleComplete}
          onBack={handleBack}
        />
      )}
    </OnboardingLayout>
  );
} 