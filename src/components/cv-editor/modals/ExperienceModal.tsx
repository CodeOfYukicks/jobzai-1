import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import PremiumModal from '../shared/PremiumModal';
import PremiumInput from '../shared/PremiumInput';
import PremiumTextarea from '../shared/PremiumTextarea';
import { CVExperience } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (experience: CVExperience) => void;
  initialData?: CVExperience;
}

export default function ExperienceModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: ExperienceModalProps) {
  const [formData, setFormData] = useState<CVExperience>({
    id: generateId(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    bullets: ['']
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: generateId(),
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        bullets: ['']
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    // Filter out empty bullets
    const cleanedData = {
      ...formData,
      bullets: formData.bullets.filter(b => b.trim() !== '')
    };
    onSave(cleanedData);
    onClose();
  };

  const addBullet = () => {
    setFormData(prev => ({
      ...prev,
      bullets: [...prev.bullets, '']
    }));
  };

  const updateBullet = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      bullets: prev.bullets.map((b, i) => i === index ? value : b)
    }));
  };

  const removeBullet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index)
    }));
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
        <span className="relative z-10">Save Experience</span>
      </button>
    </div>
  );

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Experience' : 'Add Experience'}
      footer={footer}
      maxWidth="lg"
    >
      <div className="space-y-7">
        {/* Job Title */}
        <PremiumInput
          label="Job Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          autoFocus
        />

        {/* Company and Location */}
        <div className="grid grid-cols-2 gap-6">
          <PremiumInput
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          />
          <PremiumInput
            label="Location"
            value={formData.location || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-6">
          <PremiumInput
            label="Start Date"
            type="month"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <div className="space-y-2">
            <PremiumInput
              label="End Date"
              type="month"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              disabled={formData.current}
            />
            <label className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all">
              <input
                type="checkbox"
                checked={formData.current}
                onChange={(e) => setFormData(prev => ({ ...prev, current: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <span className="font-medium">Currently working here</span>
            </label>
          </div>
        </div>

        {/* Description */}
        <PremiumTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          helperText="Brief overview of your role and responsibilities"
        />

        {/* Bullet Points */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-5">
            Key Achievements & Responsibilities
          </label>
          <div className="space-y-5">
            {formData.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-4 group">
                <div className="w-8 h-8 mt-2 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <PremiumInput
                    label={`Achievement ${index + 1}`}
                    value={bullet}
                    onChange={(e) => updateBullet(index, e.target.value)}
                  />
                </div>
                {formData.bullets.length > 1 && (
                  <button
                    onClick={() => removeBullet(index)}
                    className="p-2 mt-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addBullet}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Achievement
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}

