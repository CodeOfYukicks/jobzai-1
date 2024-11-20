import { motion } from 'framer-motion';
import { FormField } from '../../ui/FormField';
import { MobileStepLayout } from './MobileStepLayout';

interface BasicInfoStepProps {
  formData: any;
  onFormChange: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
  onBack?: () => void;
}

export function BasicInfoStep({ formData, onFormChange, onNext, onBack, onCancel }: BasicInfoStepProps) {
  return (
    <MobileStepLayout
      title="Campaign Details"
      subtitle="Basic information"
      progress={20}
      onNext={onNext}
      onBack={onBack}
      onCancel={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <FormField
          label="Campaign Title"
          placeholder="e.g., Senior Developer Positions in Europe"
          value={formData.title}
          onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
        />
        
        <FormField
          label="Job Title"
          placeholder="e.g., Software Engineer"
          value={formData.jobTitle}
          onChange={(e) => onFormChange({ ...formData, jobTitle: e.target.value })}
        />

        <FormField
          label="Industry"
          type="select"
          value={formData.industry}
          onChange={(e) => onFormChange({ ...formData, industry: e.target.value })}
          options={[
            { value: "", label: "Select Industry" },
            { value: "technology", label: "Technology" },
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
            { value: "", label: "Select Job Type" },
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

        <FormField
          label="Description"
          type="textarea"
          placeholder="Describe what you're looking for..."
          value={formData.description}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
        />
      </motion.div>
    </MobileStepLayout>
  );
} 