import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InlineFormCard from './InlineFormCard';
import InlineInput from './InlineInput';
import ToggleSwitch from './ToggleSwitch';
import { CVEducation } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface EducationInlineFormProps {
  initialData?: CVEducation;
  onSave: (education: CVEducation) => void;
  onCancel: () => void;
}

export default function EducationInlineForm({
  initialData,
  onSave,
  onCancel
}: EducationInlineFormProps) {
  const [formData, setFormData] = useState<CVEducation>({
    id: generateId(),
    degree: '',
    field: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    gpa: '',
    honors: [],
    coursework: []
  });

  const [yearOnly, setYearOnly] = useState(true);
  const [hideSection, setHideSection] = useState(false);
  const [showDateSettings, setShowDateSettings] = useState(false);
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <InlineFormCard
      onCancel={onCancel}
      onSave={handleSave}
      isEditing={!!initialData}
    >
      {/* Degree & Field - Same row */}
      <div className="grid grid-cols-2 gap-2">
        <InlineInput
          label="Degree"
          value={formData.degree}
          onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
          placeholder="ex: Bachelor of Science"
          autoFocus
        />
        <InlineInput
          label="Field of Study"
          value={formData.field || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
          placeholder="ex: Computer Science"
        />
      </div>

      {/* Institution & Location */}
      <div className="grid grid-cols-2 gap-2">
        <InlineInput
          label="Institution"
          value={formData.institution}
          onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
          placeholder="i.e. Stanford, MIT"
        />
        <InlineInput
          label="Location"
          value={formData.location || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="+ add location"
        />
      </div>

      {/* Date Section */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type={yearOnly ? 'number' : 'month'}
            value={yearOnly ? formData.startDate?.split('-')[0] || '' : formData.startDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder="+ start"
            min={yearOnly ? 1950 : undefined}
            max={yearOnly ? 2030 : undefined}
            disabled={hideSection}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#EB7134]/30 focus:border-[#EB7134] transition-all disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Graduation
          </label>
          <input
            type={yearOnly ? 'number' : 'month'}
            value={inProgress ? '' : (yearOnly ? formData.endDate?.split('-')[0] || '' : formData.endDate)}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            placeholder="+ grad"
            min={yearOnly ? 1950 : undefined}
            max={yearOnly ? 2030 : undefined}
            disabled={inProgress || hideSection}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#EB7134]/30 focus:border-[#EB7134] transition-all disabled:opacity-50"
          />
        </div>
        <InlineInput
          label="GPA"
          value={formData.gpa || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
          placeholder="ex: 3.8/4.0"
        />
      </div>

      {/* Date Options - Compact */}
      <div className="p-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex flex-wrap items-center gap-4">
          <ToggleSwitch
            label="In Progress"
            checked={inProgress}
            onChange={(checked) => {
              setInProgress(checked);
              if (checked) setFormData(prev => ({ ...prev, endDate: '' }));
            }}
          />
          <ToggleSwitch
            label="Year only"
            checked={yearOnly}
            onChange={setYearOnly}
          />
          <ToggleSwitch
            label="Hide"
            checked={hideSection}
            onChange={setHideSection}
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowDateSettings(!showDateSettings)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-[#EB7134] hover:text-[#E85D04] font-medium transition-colors"
        >
          <Settings2 className="w-3 h-3" />
          Change Date Format
        </button>

        <AnimatePresence>
          {showDateSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-1.5">
                {['2024', 'Jan 2024', 'January 2024', '01/2024'].map((format) => (
                  <button
                    key={format}
                    type="button"
                    className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:border-[#EB7134] hover:text-[#EB7134] transition-all"
                  >
                    {format}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </InlineFormCard>
  );
}
