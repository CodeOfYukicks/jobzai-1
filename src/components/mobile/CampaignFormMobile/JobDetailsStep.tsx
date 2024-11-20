import { motion } from 'framer-motion';
import { FormField } from '../../ui/FormField';
import { MobileStepLayout } from './MobileStepLayout';

interface StepProps {
  formData: any;
  onFormChange: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function JobDetailsStep({ formData, onFormChange, onNext, onBack }: StepProps) {
  return (
    <MobileStepLayout
      title="Job Details"
      subtitle="Specify position requirements"
      progress={40}
      onNext={onNext}
      onBack={onBack}
    >
      <motion.div className="space-y-6">
        <FormField
          label="Industry"
          type="select"
          value={formData.industry}
          onChange={(e) => onFormChange({ ...formData, industry: e.target.value })}
          options={[
            { value: "tech", label: "Technology" },
            { value: "finance", label: "Finance" },
            { value: "healthcare", label: "Healthcare" }
          ]}
        />
        
        <FormField
          label="Job Type"
          type="select"
          value={formData.jobType}
          onChange={(e) => onFormChange({ ...formData, jobType: e.target.value })}
          options={[
            { value: "full-time", label: "Full Time" },
            { value: "part-time", label: "Part Time" },
            { value: "contract", label: "Contract" }
          ]}
        />

        <FormField
          label="Location"
          placeholder="e.g., Remote, New York, London"
          value={formData.location}
          onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
        />
      </motion.div>
    </MobileStepLayout>
  );
} 