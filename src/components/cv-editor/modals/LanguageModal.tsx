import { useState, useEffect } from 'react';
import PremiumModal from '../shared/PremiumModal';
import PremiumInput from '../shared/PremiumInput';
import { CVLanguage } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (language: CVLanguage) => void;
  initialData?: CVLanguage;
}

const proficiencyLevels: Array<CVLanguage['proficiency']> = [
  'basic',
  'intermediate',
  'advanced',
  'fluent',
  'native'
];

const proficiencyLabels: Record<CVLanguage['proficiency'], string> = {
  basic: 'Basic - Can understand simple phrases',
  intermediate: 'Intermediate - Can have basic conversations',
  advanced: 'Advanced - Can communicate effectively',
  fluent: 'Fluent - Near-native proficiency',
  native: 'Native - Mother tongue'
};

export default function LanguageModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: LanguageModalProps) {
  const [formData, setFormData] = useState<CVLanguage>({
    id: generateId(),
    name: '',
    proficiency: 'intermediate'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: generateId(),
        name: '',
        proficiency: 'intermediate'
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        className="group relative px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <span className="relative z-10">Save Language</span>
      </button>
    </div>
  );

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Language' : 'Add Language'}
      footer={footer}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Language Name */}
        <PremiumInput
          label="Language"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          autoFocus
          helperText="e.g., English, Spanish, Mandarin"
        />

        {/* Proficiency Level */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-4">
            Proficiency Level
          </label>
          <div className="space-y-2">
            {proficiencyLevels.map((level) => (
              <label
                key={level}
                className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <input
                  type="radio"
                  name="proficiency"
                  value={level}
                  checked={formData.proficiency === level}
                  onChange={(e) => setFormData(prev => ({ ...prev, proficiency: e.target.value as CVLanguage['proficiency'] }))}
                  className="mt-0.5 w-4 h-4 border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {proficiencyLabels[level]}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </PremiumModal>
  );
}

