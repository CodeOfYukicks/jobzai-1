import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import InlineFormCard from './InlineFormCard';
import InlineInput from './InlineInput';
import ToggleSwitch from './ToggleSwitch';
import AIEnhancePanel from './AIEnhancePanel';
import { CVExperience } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface ExperienceInlineFormProps {
  initialData?: CVExperience;
  onSave: (experience: CVExperience) => void;
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

export default function ExperienceInlineForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  jobContext,
  fullCV,
  conversationHistory,
  onAddToHistory,
  onResetHistory
}: ExperienceInlineFormProps) {
  const [formData, setFormData] = useState<CVExperience>({
    id: generateId(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    bullets: []
  });

  const [yearOnly, setYearOnly] = useState(false);
  const [hideSection, setHideSection] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    const cleanedData = {
      ...formData,
      bullets: formData.bullets.filter(b => b.trim() !== '')
    };
    onSave(cleanedData);
  };

  const addAchievement = () => {
    setFormData(prev => ({
      ...prev,
      bullets: [...prev.bullets, '']
    }));
  };

  const updateAchievement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      bullets: prev.bullets.map((b, i) => i === index ? value : b)
    }));
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index)
    }));
  };

  // Handle AI enhancement - parse the result and update bullets
  const handleAIEnhance = (enhancedContent: string) => {
    // Parse the enhanced content into bullet points
    // Filter out context lines (Role:, Company:, Achievements:, etc.)
    const lines = enhancedContent
      .split('\n')
      .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(line => {
        if (line.length === 0) return false;
        // Skip context/header lines
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('role:')) return false;
        if (lowerLine.startsWith('company:')) return false;
        if (lowerLine.startsWith('achievements:')) return false;
        if (lowerLine.startsWith('achievements')) return false;
        if (lowerLine.startsWith('description:')) return false;
        if (lowerLine.startsWith('key achievements:')) return false;
        if (lowerLine.startsWith('responsibilities:')) return false;
        if (lowerLine === 'achievements') return false;
        return true;
      });

    if (lines.length > 0) {
      setFormData(prev => ({
        ...prev,
        bullets: lines
      }));
    }
  };

  // Build current content for AI context - only send achievements to enhance
  const getCurrentContent = () => {
    // Only send the achievements/bullets for AI to enhance
    // The AI will know the role/company from jobContext
    if (formData.bullets.length > 0) {
      return formData.bullets.map(b => `• ${b}`).join('\n');
    }
    // Return empty string when no content - user should add content first
    return '';
  };

  return (
    <InlineFormCard
      onCancel={onCancel}
      onSave={handleSave}
      onDelete={onDelete}
      isEditing={!!initialData}
    >
      {/* Job Title & Employer - Same row */}
      <div className="grid grid-cols-2 gap-2">
        <InlineInput
          label="Job Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="ex: Engineer, Sales Manager"
          autoFocus
        />
        <InlineInput
          label="Employer"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          placeholder="i.e. Google, Tesla"
        />
      </div>

      {/* Date Section */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type={yearOnly ? 'number' : 'month'}
            value={yearOnly ? formData.startDate?.split('-')[0] || '' : formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder="+ start date"
            min={yearOnly ? 1950 : undefined}
            max={yearOnly ? 2030 : undefined}
            disabled={hideSection}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type={yearOnly ? 'number' : 'month'}
            value={formData.current ? '' : (yearOnly ? formData.endDate?.split('-')[0] || '' : formData.endDate)}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            placeholder="+ end date"
            min={yearOnly ? 1950 : undefined}
            max={yearOnly ? 2030 : undefined}
            disabled={formData.current || hideSection}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Date Options - Compact */}
      <div className="p-2.5 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex flex-wrap items-center gap-4">
          <ToggleSwitch
            label="Current"
            checked={formData.current}
            onChange={(checked) => setFormData(prev => ({ ...prev, current: checked, endDate: checked ? '' : prev.endDate }))}
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
      </div>

      {/* Location */}
      <InlineInput
        label="Location"
        value={formData.location || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
        placeholder="+ add location"
      />

      {/* AI Enhancement Panel - Always show, works with or without job context */}
      <AIEnhancePanel
        sectionType="experience"
        currentContent={getCurrentContent()}
        onApply={handleAIEnhance}
        jobContext={jobContext}
        fullCV={fullCV}
        conversationHistory={conversationHistory}
        onAddToHistory={onAddToHistory}
        onResetHistory={onResetHistory}
      />

      {/* Achievements Section - Compact */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Achievements
        </label>

        {formData.bullets.length === 0 ? (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center py-2">
            No achievements added...
          </p>
        ) : (
          <div className="space-y-1.5 mb-2">
            {formData.bullets.map((bullet, index) => (
              <div key={index} className="flex items-center gap-1.5 group">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateAchievement(index, e.target.value)}
                  placeholder="Describe your achievement..."
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeAchievement(index)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addAchievement}
          className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
        >
          <Plus className="w-3 h-3" />
          Achievement
        </button>
      </div>
    </InlineFormCard>
  );
}
