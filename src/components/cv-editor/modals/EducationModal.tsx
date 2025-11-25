import { useState, useEffect } from 'react';
import PremiumModal from '../shared/PremiumModal';
import PremiumInput from '../shared/PremiumInput';
import { CVEducation } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (education: CVEducation) => void;
  initialData?: CVEducation;
}

export default function EducationModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: EducationModalProps) {
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

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
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
        className="group relative px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <span className="relative z-10">Save Education</span>
      </button>
    </div>
  );

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Education' : 'Add Education'}
      footer={footer}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Degree */}
        <PremiumInput
          label="Degree"
          value={formData.degree}
          onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
          autoFocus
          helperText="e.g., Bachelor of Science, Master of Arts"
        />

        {/* Field and Institution */}
        <div className="grid grid-cols-2 gap-6">
          <PremiumInput
            label="Field of Study"
            value={formData.field || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
          />
          <PremiumInput
            label="Institution"
            value={formData.institution}
            onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
          />
        </div>

        {/* Location */}
        <PremiumInput
          label="Location"
          value={formData.location || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-6">
          <PremiumInput
            label="Start Date (Optional)"
            type="month"
            value={formData.startDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <PremiumInput
            label="Graduation Date"
            type="month"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        {/* GPA */}
        <PremiumInput
          label="GPA (Optional)"
          value={formData.gpa || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
          helperText="e.g., 3.8/4.0"
        />
      </div>
    </PremiumModal>
  );
}

