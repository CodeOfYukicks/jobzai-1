import { useState, useEffect } from 'react';
import InlineFormCard from './InlineFormCard';
import InlineInput from './InlineInput';
import { CVLanguage } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface LanguageInlineFormProps {
  initialData?: CVLanguage;
  onSave: (language: CVLanguage) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PROFICIENCY_LEVELS: { value: CVLanguage['proficiency']; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' }
];

export default function LanguageInlineForm({
  initialData,
  onSave,
  onCancel,
  onDelete
}: LanguageInlineFormProps) {
  const [formData, setFormData] = useState<CVLanguage>({
    id: generateId(),
    name: '',
    proficiency: 'intermediate'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <InlineFormCard
      onCancel={onCancel}
      onSave={handleSave}
      onDelete={onDelete}
      isEditing={!!initialData}
    >
      {/* Language Name */}
      <InlineInput
        label="Language"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="ex: English, French, Spanish"
        autoFocus
      />

      {/* Proficiency Level - Compact horizontal */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-wide uppercase">
          Proficiency Level
        </label>
        
        <div className="flex flex-wrap gap-1.5">
          {PROFICIENCY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, proficiency: level.value }))}
              className={`
                px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                ${formData.proficiency === level.value
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                  : 'bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>
    </InlineFormCard>
  );
}
