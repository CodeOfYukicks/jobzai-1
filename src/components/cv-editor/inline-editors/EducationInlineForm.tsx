import { useState, useEffect } from 'react';
import InlineFormCard from './InlineFormCard';
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
      <div className="space-y-3">
        {/* Row 1: Degree & Field */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Degree
            </label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
              placeholder="e.g. Bachelor of Science"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Field of Study
            </label>
            <input
              type="text"
              value={formData.field || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
              placeholder="e.g. Computer Science"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Row 2: Institution & Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Institution
            </label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
              placeholder="e.g. Stanford University"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Palo Alto, CA"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Row 3: Dates & GPA */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="month"
              value={formData.startDate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Graduation
            </label>
            <input
              type="month"
              value={inProgress ? '' : formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              disabled={inProgress}
              className={`w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200 ${inProgress ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-[#2b2a2c]/50' : ''}`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              GPA
            </label>
            <input
              type="text"
              value={formData.gpa || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
              placeholder="e.g. 3.8/4.0"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Row 4: Toggles */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-lg border border-gray-200/60 dark:border-[#3d3c3e]/60">
            <input
              type="checkbox"
              id="in-progress"
              checked={inProgress}
              onChange={(e) => {
                setInProgress(e.target.checked);
                if (e.target.checked) setFormData(prev => ({ ...prev, endDate: '' }));
              }}
              className="w-3.5 h-3.5 text-[#635BFF] rounded border-gray-300 focus:ring-[#635BFF]"
            />
            <label htmlFor="in-progress" className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              In Progress
            </label>
          </div>
        </div>
      </div>
    </InlineFormCard>
  );
}
