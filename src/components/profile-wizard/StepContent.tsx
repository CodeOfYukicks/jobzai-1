import { ReactNode } from 'react';
import WelcomeStep from './steps/WelcomeStep';
import PersonalStep from './steps/PersonalStep';
import LocationStep from './steps/LocationStep';
import EducationStep from './steps/EducationStep';
import ExperienceStep from './steps/ExperienceStep';
import SkillsStep from './steps/SkillsStep';
import ObjectivesStep from './steps/ObjectivesStep';
import MotivationsStep from './steps/MotivationsStep';
import RolePreferencesStep from './steps/RolePreferencesStep';
import SoftSkillsStep from './steps/SoftSkillsStep';
import FinalizationStep from './steps/FinalizationStep';

interface StepContentProps {
  step: number;
  data: any;
  onUpdate: (data: any) => void;
}

const StepContent = ({ step, data, onUpdate }: StepContentProps) => {
  const renderStep = (): ReactNode => {
    switch (step) {
      case 1:
        return <WelcomeStep data={data} onUpdate={onUpdate} />;
      case 2:
        return <PersonalStep data={data} onUpdate={onUpdate} />;
      case 3:
        return <LocationStep data={data} onUpdate={onUpdate} />;
      case 4:
        return <EducationStep data={data} onUpdate={onUpdate} />;
      case 5:
        return <ExperienceStep data={data} onUpdate={onUpdate} />;
      case 6:
        return <SkillsStep data={data} onUpdate={onUpdate} />;
      case 7:
        return <ObjectivesStep data={data} onUpdate={onUpdate} />;
      case 8:
        return <MotivationsStep data={data} onUpdate={onUpdate} />;
      case 9:
        return <RolePreferencesStep data={data} onUpdate={onUpdate} />;
      case 10:
        return <SoftSkillsStep data={data} onUpdate={onUpdate} />;
      case 11:
        return <FinalizationStep data={data} onUpdate={onUpdate} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Étape {step} - À venir
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-[400px]">
      {renderStep()}
    </div>
  );
};

export default StepContent;

