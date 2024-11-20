import { useState } from 'react';
import { BasicInfoStep } from './BasicInfoStep';
import { EmailTemplateStep } from './EmailTemplateStep';

interface CampaignFormMobileProps {
  formData: {
    title: string;
    jobTitle: string;
    industry: string;
    jobType: string;
    location: string;
    description: string;
  };
  onFormChange: (data: any) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function CampaignFormMobile({ 
  formData, 
  onFormChange,
  onSubmit,
  onCancel 
}: CampaignFormMobileProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      component: BasicInfoStep,
      title: "Campaign Details",
      subtitle: "Basic information"
    },
    {
      component: EmailTemplateStep,
      title: "Email Template",
      subtitle: "Choose your template"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const CurrentStep = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <CurrentStep
        formData={formData}
        onFormChange={onFormChange}
        onNext={handleNext}
        onBack={currentStep > 0 ? handleBack : undefined}
        onCancel={onCancel}
      />
    </div>
  );
} 