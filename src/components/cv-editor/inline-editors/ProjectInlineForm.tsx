import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import InlineFormCard from './InlineFormCard';
import InlineInput from './InlineInput';
import ToggleSwitch from './ToggleSwitch';
import AIEnhancePanel from './AIEnhancePanel';
import { CVProject } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface ProjectInlineFormProps {
  initialData?: CVProject;
  onSave: (project: CVProject) => void;
  onCancel: () => void;
  onDelete?: () => void;
  jobContext?: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    keywords: string[];
    strengths: string[];
    gaps: string[];
  };
  fullCV?: string;
  conversationHistory?: string[];
  onAddToHistory?: (message: string) => void;
  onResetHistory?: () => void;
}

export default function ProjectInlineForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  jobContext,
  fullCV,
  conversationHistory,
  onAddToHistory,
  onResetHistory
}: ProjectInlineFormProps) {
  const [formData, setFormData] = useState<CVProject>({
    id: generateId(),
    name: '',
    description: '',
    technologies: [],
    url: '',
    startDate: '',
    endDate: '',
    highlights: []
  });

  const [techInput, setTechInput] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [ongoingProject, setOngoingProject] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setShowDates(!!(initialData.startDate || initialData.endDate));
    }
  }, [initialData]);

  const handleSave = () => {
    const cleanedData = {
      ...formData,
      highlights: formData.highlights.filter(h => h.trim() !== '')
    };
    onSave(cleanedData);
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

  // Handle AI enhancement - update description and highlights
  const handleAIEnhance = (enhancedContent: string) => {
    // Filter out context/header lines
    const lines = enhancedContent
      .split('\n')
      .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(line => {
        if (line.length === 0) return false;
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('project:')) return false;
        if (lowerLine.startsWith('description:')) return false;
        if (lowerLine.startsWith('technologies:')) return false;
        if (lowerLine.startsWith('key highlights:')) return false;
        if (lowerLine.startsWith('highlights:')) return false;
        if (lowerLine === 'highlights') return false;
        if (lowerLine === 'key highlights') return false;
        return true;
      });

    if (lines.length > 0) {
      // First line is description, rest are highlights
      setFormData(prev => ({
        ...prev,
        description: lines[0] || prev.description,
        highlights: lines.slice(1)
      }));
    }
  };

  // Build current content for AI context - only send content to enhance
  const getCurrentContent = () => {
    const parts = [];
    // Include description if present
    if (formData.description) {
      parts.push(formData.description);
    }
    // Include highlights
    if (formData.highlights.length > 0) {
      formData.highlights.forEach(h => parts.push(`• ${h}`));
    }
    // Return empty string when no content - user should add content first
    if (parts.length === 0) {
      return '';
    }
    return parts.join('\n');
  };

  return (
    <InlineFormCard
      onCancel={onCancel}
      onSave={handleSave}
      onDelete={onDelete}
      isEditing={!!initialData}
    >
      {/* Project Name & URL */}
      <div className="grid grid-cols-2 gap-2">
        <InlineInput
          label="Project Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="ex: E-commerce Platform"
          autoFocus
        />
        <InlineInput
          label="URL (Optional)"
          value={formData.url || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description..."
          rows={2}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
        />
      </div>

      {/* Technologies */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Technologies
        </label>
        
        {formData.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {formData.technologies.map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => removeTechnology(index)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-1.5">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
            placeholder="Add technology (Enter)"
            className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addTechnology}
            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Date Toggle - Compact */}
      <div className="p-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center gap-4">
          <ToggleSwitch
            label="Show dates"
            checked={showDates}
            onChange={setShowDates}
          />
          {showDates && (
            <ToggleSwitch
              label="Ongoing"
              checked={ongoingProject}
              onChange={(checked) => {
                setOngoingProject(checked);
                if (checked) setFormData(prev => ({ ...prev, endDate: '' }));
              }}
            />
          )}
        </div>

        {showDates && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Start</label>
              <input
                type="month"
                value={formData.startDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">End</label>
              <input
                type="month"
                value={formData.endDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={ongoingProject}
                className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Enhancement Panel - Always show, works with or without job context */}
      <AIEnhancePanel
        sectionType="project"
        currentContent={getCurrentContent()}
        onApply={handleAIEnhance}
        jobContext={jobContext}
        fullCV={fullCV}
        conversationHistory={conversationHistory}
        onAddToHistory={onAddToHistory}
        onResetHistory={onResetHistory}
      />

      {/* Highlights - Compact */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Key Highlights
        </label>

        {formData.highlights.length === 0 ? (
          <p className="text-[10px] text-gray-400 italic text-center py-2">
            No highlights added...
          </p>
        ) : (
          <div className="space-y-1.5 mb-2">
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-1.5 group">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => updateHighlight(index, e.target.value)}
                  placeholder="Key highlight..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addHighlight}
          className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
        >
          <Plus className="w-3 h-3" />
          Highlight
        </button>
      </div>
    </InlineFormCard>
  );
}
