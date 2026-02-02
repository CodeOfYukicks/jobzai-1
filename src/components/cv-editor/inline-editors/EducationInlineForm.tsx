import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { CVEducation } from '../../../types/cvEditor';
import { generateId } from '../../../lib/cvEditorUtils';

interface EducationInlineFormProps {
  initialData?: CVEducation;
  onSave: (education: CVEducation) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() + 5) - i);

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
    if (inProgress) {
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
  }, [endMonth, endYear, inProgress]);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-lg p-0 animate-in fade-in duration-200 text-left">
      <div className="space-y-6">

        {/* Logical Group 1: Academic Details */}
        <div className="space-y-4">
          {/* Row 1: Degree & Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Degree
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                placeholder="e.g. Bachelor of Science"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Field of Study
              </label>
              <input
                type="text"
                value={formData.field || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, field: e.target.value }))}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 2: Institution (Full Width) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Institution
            </label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
              placeholder="e.g. Stanford University"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Row 3: Location (Full Width) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Palo Alto, CA"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Logical Group 2: Timeline */}
        <div className="space-y-4">
          {/* Row 4: Dates */}
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
                  disabled={inProgress}
                  className={`w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none truncate font-medium ${inProgress ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option value="">Month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  disabled={inProgress}
                  className={`w-full px-2 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-medium ${inProgress ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option value="">Year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Row 5: "Currently studying here" Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="in-progress-checkbox"
              checked={inProgress}
              onChange={(e) => setInProgress(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500/20 cursor-pointer transition-all"
            />
            <label htmlFor="in-progress-checkbox" className="text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer select-none">
              Currently studying here
            </label>
          </div>
        </div>

        {/* Logical Group 3: Extras */}
        <div className="space-y-4">
          {/* Row 6: GPA */}
          <div className="space-y-1.5 max-w-[140px]">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              GPA
            </label>
            <input
              type="text"
              value={formData.gpa || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
              placeholder="e.g. 3.8/4.0"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#2A2A2A] border border-gray-200 dark:border-[#333] rounded-md text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
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
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
