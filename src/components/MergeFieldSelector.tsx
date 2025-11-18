import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

interface MergeFieldSelectorProps {
  onSelectField: (field: string) => void;
}

const MERGE_FIELDS = [
  { id: 'salutation', label: 'Salutation', value: 'salutationField' },
  { id: 'firstName', label: 'First name', value: 'firstNameField' },
  { id: 'lastName', label: 'Last name', value: 'lastNameField' },
  { id: 'company', label: 'Company', value: 'companyField' },
  { id: 'jobPosition', label: 'Job position', value: 'positionField' }
];

export default function MergeFieldSelector({ onSelectField }: MergeFieldSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {MERGE_FIELDS.map((field) => (
        <motion.button
          key={field.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectField(field.value)}
          className="flex-none inline-flex items-center px-4 py-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium hover:bg-[hsl(var(--primary))]/20 transition-colors"
        >
          <Tag className="w-4 h-4 mr-2" />
          {field.label}
        </motion.button>
      ))}
    </div>
  );
}
