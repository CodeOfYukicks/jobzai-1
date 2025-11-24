import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import PremiumModal from '../shared/PremiumModal';
import PremiumInput from '../shared/PremiumInput';
import PremiumTextarea from '../shared/PremiumTextarea';
import { CVProject } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: CVProject) => void;
  initialData?: CVProject;
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: ProjectModalProps) {
  const [formData, setFormData] = useState<CVProject>({
    id: generateId(),
    name: '',
    description: '',
    technologies: [],
    url: '',
    startDate: '',
    endDate: '',
    highlights: ['']
  });

  const [techInput, setTechInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: generateId(),
        name: '',
        description: '',
        technologies: [],
        url: '',
        startDate: '',
        endDate: '',
        highlights: ['']
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    const cleanedData = {
      ...formData,
      highlights: formData.highlights.filter(h => h.trim() !== '')
    };
    onSave(cleanedData);
    onClose();
  };

  const addTechnology = () => {
    if (techInput.trim()) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()]
      }));
      setTechInput('');
    }
  };

  const removeTechnology = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }));
  };

  const updateHighlight = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => i === index ? value : h)
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
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
        className="group relative px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EB7134]600 to-[#5D4D6B]600 hover:from-[#EB7134]700 hover:to-[#5D4D6B]700 rounded-full shadow-lg shadow-[#EB7134]500/30 hover:shadow-xl hover:shadow-[#EB7134]500/40 transition-all overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        <span className="relative z-10">Save Project</span>
      </button>
    </div>
  );

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Project' : 'Add Project'}
      footer={footer}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Project Name */}
        <PremiumInput
          label="Project Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          autoFocus
        />

        {/* Description */}
        <PremiumTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          helperText="Brief overview of the project"
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
            label="End Date (Optional)"
            type="month"
            value={formData.endDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        {/* URL */}
        <PremiumInput
          label="Project URL (Optional)"
          type="url"
          value={formData.url || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          helperText="Link to live project or repository"
        />

        {/* Technologies */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
            Technologies Used
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.technologies.map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EB7134]50 dark:bg-[#EB7134]900/20 text-[#EB7134]700 dark:text-[#EB7134]300 rounded-full text-sm"
              >
                {tech}
                <button
                  onClick={() => removeTechnology(index)}
                  className="hover:bg-[#EB7134]100 dark:hover:bg-[#EB7134]800/30 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              placeholder="Add technology..."
              className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#EB7134]500 focus:border-transparent"
            />
            <button
              onClick={addTechnology}
              className="px-4 py-2.5 bg-[#EB7134]600 hover:bg-[#EB7134]700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlights */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-4">
            Key Highlights
          </label>
          <div className="space-y-3">
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2 group">
                <span className="text-gray-400 mt-3 flex-shrink-0">•</span>
                <div className="flex-1">
                  <PremiumInput
                    label={`Highlight ${index + 1}`}
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                  />
                </div>
                {formData.highlights.length > 1 && (
                  <button
                    onClick={() => removeHighlight(index)}
                    className="p-2 mt-2 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addHighlight}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-[#EB7134]600 dark:text-[#EB7134]400 hover:text-[#EB7134]700 dark:hover:text-[#EB7134]300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add highlight
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}

