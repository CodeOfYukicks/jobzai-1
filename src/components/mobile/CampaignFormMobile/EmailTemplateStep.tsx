import { motion } from 'framer-motion';
import { MobileStepLayout } from './MobileStepLayout';

interface EmailTemplateStepProps {
  formData: any;
  onFormChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function EmailTemplateStep({ formData, onFormChange, onNext, onBack, onCancel }: EmailTemplateStepProps) {
  return (
    <MobileStepLayout
      title="Email Template"
      subtitle="Choose your template"
      progress={60}
      onNext={onNext}
      onBack={onBack}
      onCancel={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Contenu de l'étape template */}
      </motion.div>
    </MobileStepLayout>
  );
} 