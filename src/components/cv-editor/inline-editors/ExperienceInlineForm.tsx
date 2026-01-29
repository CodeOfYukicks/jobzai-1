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
      <div className="space-y-3">
        {/* Row 1: Job Title & Employer */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Job Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Senior Product Designer"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Employer
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="e.g. Airbnb"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Row 2: Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="month"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="month"
              value={formData.current ? '' : formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              disabled={formData.current}
              className={`w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200 ${formData.current ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-[#2b2a2c]/50' : ''}`}
            />
          </div>
        </div>

        {/* Row 3: Location & Toggles */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3 py-2 bg-white dark:bg-[#242325]/50 border border-gray-200/80 dark:border-[#3d3c3e]/60 rounded-lg text-[13px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-200/50 dark:focus:ring-gray-700/50 transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3 pb-1">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-lg border border-gray-200/60 dark:border-[#3d3c3e]/60">
              <input
                type="checkbox"
                id="current-role"
                checked={formData.current}
                onChange={(e) => setFormData(prev => ({ ...prev, current: e.target.checked, endDate: e.target.checked ? '' : prev.endDate }))}
                className="w-3.5 h-3.5 text-[#635BFF] rounded border-gray-300 focus:ring-[#635BFF]"
              />
              <label htmlFor="current-role" className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Current Role
              </label>
            </div>
          </div>
        </div>

        {/* AI Enhancement Panel */}
        <div className="pt-1">
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
        </div>

        {/* Achievements */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Achievements
          </label>

          <div className="space-y-2">
            {formData.bullets.map((bullet, index) => (
              <div key={index} className="group flex items-start gap-2">
                <div className="flex-shrink-0 mt-2 w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <textarea
                  value={bullet}
                  onChange={(e) => {
                    updateAchievement(index, e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  rows={1}
                  placeholder="Describe an achievement..."
                  className="flex-1 px-0 py-1 bg-transparent border-0 border-b border-gray-100 dark:border-[#3d3c3e] focus:border-gray-300 dark:focus:border-gray-500 focus:ring-0 text-[13px] text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none leading-relaxed transition-colors"
                  style={{ minHeight: '28px' }}
                />
                <button
                  type="button"
                  onClick={() => removeAchievement(index)}
                  className="p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAchievement}
            className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[#635BFF] hover:text-[#5249e6] transition-colors px-2 py-1 rounded hover:bg-[#635BFF]/5"
          >
            <Plus className="w-3 h-3" />
            Add Achievement
          </button>
        </div>
      </div>
    </InlineFormCard>
  );
}
