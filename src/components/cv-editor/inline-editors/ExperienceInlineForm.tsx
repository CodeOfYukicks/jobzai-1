import { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar, MapPin } from 'lucide-react';
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() + 5) - i);

// Helper component for auto-resizing textarea
const AutoResizeTextarea = ({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to correctly calculate new scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set new height based on scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Initial resize on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      rows={1}
      placeholder={placeholder}
      className={className}
    />
  );
};

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

  // State for date selects
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);

      // Parse dates for selects
      if (initialData.startDate) {
        const [y, m] = initialData.startDate.split('-');
        if (y && m) {
          setStartYear(y);
          setStartMonth(MONTHS[parseInt(m) - 1]);
        }
      }

      if (initialData.endDate) {
        const [y, m] = initialData.endDate.split('-');
        if (y && m) {
          setEndYear(y);
          setEndMonth(MONTHS[parseInt(m) - 1]);
        }
      }
    }
  }, [initialData]);

  // Update formData when date selects change
  useEffect(() => {
    if (startYear && startMonth) {
      const monthIndex = MONTHS.indexOf(startMonth) + 1;
      const formattedMonth = monthIndex.toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, startDate: `${startYear}-${formattedMonth}` }));
    } else {
      if (!startYear || !startMonth) {
        setFormData(prev => ({ ...prev, startDate: '' }));
      }
    }
  }, [startMonth, startYear]);

  useEffect(() => {
    if (formData.current) {
      setFormData(prev => ({ ...prev, endDate: '' }));
    } else if (endYear && endMonth) {
      const monthIndex = MONTHS.indexOf(endMonth) + 1;
      const formattedMonth = monthIndex.toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, endDate: `${endYear}-${formattedMonth}` }));
    } else {
      if (!endYear || !endMonth) {
        setFormData(prev => ({ ...prev, endDate: '' }));
      }
    }
  }, [endMonth, endYear, formData.current]);

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
    const lines = enhancedContent
      .split('\n')
      .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(line => {
        if (line.length === 0) return false;
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

  const getCurrentContent = () => {
    if (formData.bullets.length > 0) {
      return formData.bullets.map(b => `• ${b}`).join('\n');
    }
    return '';
  };

  return (
    <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-lg p-0 animate-in fade-in duration-200 text-left">

      <div className="space-y-6">

        {/* Row 1: Job Title & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Job Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Senior Product Designer"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="e.g. Airbnb"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Row 2: Location (Full Width) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. San Francisco, CA"
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Row 3: Dates (2 Columns) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 opacity-70" /> Start Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer truncate font-medium"
              >
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer font-medium"
              >
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* End Date Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 opacity-70" /> End Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                disabled={formData.current}
                className={`w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none truncate font-medium ${formData.current ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                disabled={formData.current}
                className={`w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-medium ${formData.current ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Row 4: "Current role" Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="current-role-checkbox"
            checked={formData.current}
            onChange={(e) => setFormData(prev => ({ ...prev, current: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 cursor-pointer transition-all"
          />
          <label htmlFor="current-role-checkbox" className="text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer select-none">
            Current role
          </label>
        </div>

        {/* AI Enhancement */}
        <div className="pt-2">
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
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Achievements
          </label>

          <div className="space-y-3">
            {formData.bullets.map((bullet, index) => (
              <div key={index} className="group relative flex items-start gap-3">
                <div className="pt-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                </div>
                <AutoResizeTextarea
                  value={bullet}
                  onChange={(e) => updateAchievement(index, e.target.value)}
                  placeholder="Describe your achievement..."
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none overflow-hidden block min-h-[42px] leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => removeAchievement(index)}
                  className="absolute -right-2 -top-2 p-1 bg-white dark:bg-[#333] text-gray-400 hover:text-red-500 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove achievement"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAchievement}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-1 py-1"
          >
            <Plus className="w-4 h-4" />
            Add Achievement
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#333]">

          <div className="flex items-center gap-3 w-full justify-end">
            {/* Delete Button (if editing existing) */}
            {initialData && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-medium text-red-500 hover:text-red-600 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors mr-auto"
              >
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#333] rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-200 rounded-md shadow-sm transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
