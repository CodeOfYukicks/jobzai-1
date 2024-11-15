import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

interface MergeFieldSelectorProps {
  onSelectField: (field: string) => void;
}

const MERGE_FIELDS = [
  { id: 'firstName', label: 'First name', value: '(First name)' },
  { id: 'lastName', label: 'Last name', value: '(Last name)' },
  { id: 'fullName', label: 'Full name', value: '(Full name)' },
  { id: 'company', label: 'Company', value: '(Company)' },
  { id: 'jobPosition', label: 'Job position', value: '(Job position)' }
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
          className="flex-none inline-flex items-center px-4 py-2 rounded-lg bg-[#8D75E6]/10 text-[#8D75E6] text-sm font-medium hover:bg-[#8D75E6]/20 transition-colors"
        >
          <Tag className="w-4 h-4 mr-2" />
          {field.label}
        </motion.button>
      ))}
    </div>
  );
}