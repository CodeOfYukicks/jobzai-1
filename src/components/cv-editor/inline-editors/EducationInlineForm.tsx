import { useState, useEffect } from 'react';
import InlineFormCard from './InlineFormCard';
import InlineInput from './InlineInput';
import ToggleSwitch from './ToggleSwitch';
import { CVEducation } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface EducationInlineFormProps {
  initialData?: CVEducation;
  onSave: (education: CVEducation) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function EducationInlineForm({
  initialData,
  onSave,
  onCancel,
  onDelete
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

  const [hideSection, setHideSection] = useState(false);
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
      onDelete={onDelete}
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
            type="month"
            value={formData.startDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder="+ start"
            disabled={hideSection}
            className="w-full px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Graduation
          </label>
          <input
            type="month"
            value={inProgress ? '' : formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            placeholder="+ grad"
            disabled={inProgress || hideSection}
            className="w-full px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
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
      <div className="p-2.5 border border-dashed border-gray-200 dark:border-[#3d3c3e] rounded-lg bg-gray-50/50 dark:bg-[#2b2a2c]/30">
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
            label="Hide"
            checked={hideSection}
            onChange={setHideSection}
          />
        </div>
      </div>
    </InlineFormCard>
  );
}
