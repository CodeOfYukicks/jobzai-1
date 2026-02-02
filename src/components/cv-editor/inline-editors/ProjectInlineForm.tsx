import { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
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
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

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
      rows={2}
      placeholder={placeholder}
      className={className}
    />
  );
};

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

  // State for date selects
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setShowDates(!!(initialData.startDate || initialData.endDate));

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
    if (endYear && endMonth) {
      const monthIndex = MONTHS.indexOf(endMonth) + 1;
      const formattedMonth = monthIndex.toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, endDate: `${endYear}-${formattedMonth}` }));
    } else {
      if (!endYear || !endMonth) {
        setFormData(prev => ({ ...prev, endDate: '' }));
      }
    }
  }, [endMonth, endYear]);

  const handleSave = () => {
    const cleanedData = {
      ...formData,
      highlights: formData.highlights.filter(h => h.trim() !== ''),
      // Clean dates if toggle is off
      startDate: showDates ? formData.startDate : '',
      endDate: showDates ? formData.endDate : ''
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

  // Handle AI enhancement
  const handleAIEnhance = (enhancedContent: string) => {
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
      setFormData(prev => ({
        ...prev,
        description: lines[0] || prev.description,
        highlights: lines.slice(1)
      }));
    }
  };

  const getCurrentContent = () => {
    const parts = [];
    if (formData.description) parts.push(formData.description);
    if (formData.highlights.length > 0) {
      formData.highlights.forEach(h => parts.push(`• ${h}`));
    }
    return parts.length === 0 ? '' : parts.join('\n');
  };

  return (
    <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-lg p-0 animate-in fade-in duration-200 text-left">
      <div className="space-y-6">

        {/* Logical Group 1: Project Info */}
        <div className="space-y-4">
          {/* Row 1: Name & URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. E-commerce Platform"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                URL (Optional)
              </label>
              <input
                type="text"
                value={formData.url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Description
            </label>
            <AutoResizeTextarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none overflow-hidden block min-h-[60px]"
            />
          </div>

          {/* Row 3: Technologies */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Technologies
            </label>

            <div className="space-y-2">
              {formData.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-100 dark:border-blue-800/30"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(index)}
                        className="hover:text-red-500 transition-colors focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                  placeholder="Add technology (Press Enter)"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={addTechnology}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  disabled={!techInput.trim()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logical Group 2: Timeline */}
        <div className="space-y-4">
          {/* Row 4: Dates Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-dates-toggle"
                checked={showDates}
                onChange={(e) => setShowDates(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 cursor-pointer transition-all"
              />
              <label htmlFor="show-dates-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Show dates
              </label>
            </div>
          </div>

          {showDates && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Start Date */}
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

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 opacity-70" /> End Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className="w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none truncate font-medium cursor-pointer"
                  >
                    <option value="">Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    className="w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-medium cursor-pointer"
                  >
                    <option value="">Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logical Group 3: Highlights & AI */}
        <div className="space-y-4">
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

          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Key Highlights
            </label>

            <div className="space-y-3">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="group relative flex items-start gap-3">
                  <div className="pt-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                  </div>
                  <AutoResizeTextarea
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    placeholder="Describe a key highlight or achievement..."
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none overflow-hidden block min-h-[42px] leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(index)}
                    className="absolute -right-2 -top-2 p-1 bg-white dark:bg-[#333] text-gray-400 hover:text-red-500 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove highlight"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addHighlight}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-1 py-1"
            >
              <Plus className="w-4 h-4" />
              Add Highlight
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#333]">
          <div className="flex items-center gap-3 w-full justify-end">
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
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
