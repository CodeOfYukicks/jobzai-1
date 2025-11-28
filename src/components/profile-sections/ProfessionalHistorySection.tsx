import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Briefcase, Plus, MoreVertical, Edit2, Copy, Trash2, Check, Loader2, Info, FileText, Lightbulb, ChevronDown } from 'lucide-react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import MonthPicker from '../ui/MonthPicker';
import { CollapsibleSection, BulletInput, FieldGroup, SectionSkeleton } from '../profile/ui';
import { CompanyLogo } from '../common/CompanyLogo';
import debounce from 'lodash/debounce';

interface SectionProps {
  onUpdate: (data: any) => void;
}

interface ProfessionalExperience {
  title: string;
  company: string;
  companyLogo?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  industry: string;
  contractType: string;
  location: string;
  responsibilities: string[];
}

interface CompanyGroup {
  company: string;
  totalDuration: string;
  experiences: Array<ProfessionalExperience & { originalIndex: number }>;
}

// Helper function to calculate duration between dates
const calculateDuration = (startDate: string, endDate: string, current: boolean): number => {
  if (!startDate) return 0;
  const start = new Date(startDate + '-01');
  const end = current ? new Date() : (endDate ? new Date(endDate + '-01') : new Date());
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
};

// Format duration as "X yrs Y mos"
const formatDuration = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} mos`;
  if (remainingMonths === 0) return `${years} yr${years > 1 ? 's' : ''}`;
  return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mos`;
};

const ProfessionalHistorySectionV2 = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    professionalHistory: [] as ProfessionalExperience[]
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: { details: boolean; content: boolean } }>({});
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const companyInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const logoFetchTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Group experiences by company (LinkedIn style)
  const groupedExperiences = useMemo((): CompanyGroup[] => {
    const groups = new Map<string, CompanyGroup>();
    
    formData.professionalHistory.forEach((exp, index) => {
      const companyKey = exp.company.toLowerCase().trim() || 'unknown';
      
      if (!groups.has(companyKey)) {
        groups.set(companyKey, {
          company: exp.company || 'Unknown Company',
          totalDuration: '',
          experiences: []
        });
      }
      
      groups.get(companyKey)!.experiences.push({ ...exp, originalIndex: index });
    });
    
    // Calculate total duration for each company
    groups.forEach(group => {
      // Sort experiences by start date (newest first)
      group.experiences.sort((a, b) => {
        const dateA = a.startDate || '0000-00';
        const dateB = b.startDate || '0000-00';
        return dateB.localeCompare(dateA);
      });
      
      // Calculate total months at company
      let totalMonths = 0;
      group.experiences.forEach(exp => {
        totalMonths += calculateDuration(exp.startDate, exp.endDate, exp.current);
      });
      group.totalDuration = formatDuration(totalMonths);
    });
    
    // Convert to array and sort by most recent experience
    return Array.from(groups.values()).sort((a, b) => {
      const latestA = a.experiences[0]?.startDate || '0000-00';
      const latestB = b.experiences[0]?.startDate || '0000-00';
      return latestB.localeCompare(latestA);
    });
  }, [formData.professionalHistory]);

  const toggleCompanyExpansion = (company: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(company)) {
        newSet.delete(company);
      } else {
        newSet.add(company);
      }
      return newSet;
    });
  };

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async (data: { professionalHistory: ProfessionalExperience[] }) => {
      if (!currentUser?.uid) return;
      
      try {
        setSaveStatus('saving');
        await updateDoc(doc(db, 'users', currentUser.uid), {
          professionalHistory: data.professionalHistory
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Failed to save');
        setSaveStatus('idle');
      }
    }, 500),
    [currentUser]
  );

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }
    
    // Use onSnapshot to listen for real-time updates (e.g., from CV import)
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const normalizedHistory = (userData.professionalHistory || []).map((exp: any) => ({
            ...exp,
            responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
            companyLogo: exp.companyLogo || ''
          }));
          
          setFormData({ professionalHistory: normalizedHistory });
          onUpdate({ professionalHistory: normalizedHistory });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading professional history:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onUpdate(newFormData);
    debouncedSave(newFormData);
  };

  const updateExperience = (index: number, field: keyof ProfessionalExperience, value: any) => {
    const updated = [...formData.professionalHistory];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('professionalHistory', updated);
  };

  const toggleSection = (expIndex: number, section: 'details' | 'content') => {
    setExpandedSections(prev => ({
      ...prev,
      [expIndex]: {
        ...prev[expIndex],
        [section]: !prev[expIndex]?.[section]
      }
    }));
  };

  const addExperience = () => {
    const newExperience: ProfessionalExperience = {
      title: '',
      company: '',
      companyLogo: '',
      startDate: '',
      endDate: '',
      current: false,
      industry: '',
      contractType: '',
      location: '',
      responsibilities: ['']
    };
    const newHistory = [...formData.professionalHistory, newExperience];
    handleChange('professionalHistory', newHistory);
    setEditingIndex(newHistory.length - 1);
    // Expand all sections for new experience
    setExpandedSections(prev => ({
      ...prev,
      [newHistory.length - 1]: { details: true, content: true }
    }));
  };

  const duplicateExperience = (index: number) => {
    const exp = formData.professionalHistory[index];
    const duplicated = { ...exp };
    const newHistory = [...formData.professionalHistory];
    newHistory.splice(index + 1, 0, duplicated);
    handleChange('professionalHistory', newHistory);
    toast.success('Experience duplicated');
    setOpenMenuIndex(null);
  };

  const removeExperience = (index: number) => {
    const newHistory = formData.professionalHistory.filter((_, i) => i !== index);
    handleChange('professionalHistory', newHistory);
    toast.success('Experience removed');
    setOpenMenuIndex(null);
  };

  const hasDetails = (exp: ProfessionalExperience) => {
    return !!(exp.industry || exp.contractType || exp.location);
  };

  const hasContent = (exp: ProfessionalExperience) => {
    return exp.responsibilities.some(r => r.trim());
  };

  const inputClass = `
    w-full px-4 py-2.5 rounded-xl
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    text-gray-900 dark:text-gray-100
    text-[15px]
    placeholder:text-gray-400 dark:placeholder:text-gray-400
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10
    focus:border-gray-400 dark:focus:border-gray-500
    hover:border-gray-400 dark:hover:border-gray-500
  `;

  const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-10`;

  const industries = ['Technology / IT', 'Finance / Banking', 'Healthcare', 'Consulting', 'Manufacturing', 'Retail / E-commerce', 'Education', 'Media / Entertainment', 'Real Estate', 'Energy', 'Transportation', 'Other'];
  const contractTypes = [
    { id: 'full-time', label: 'Full Time' },
    { id: 'part-time', label: 'Part Time' },
    { id: 'contract', label: 'Contract' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'internship', label: 'Internship' }
  ];

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-6">
      {/* Header with Add Button & Save Status */}
      <div className="flex items-center justify-between gap-3">
        {saveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-xs">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-300">Saved</span>
                </>
              )}
            </div>
          )}

        <button
          onClick={addExperience}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-semibold shadow-sm ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </button>
      </div>

      {/* Experience List - Grouped by Company (LinkedIn Style) */}
      <div className="space-y-4">
        {formData.professionalHistory.length === 0 ? (
          <div className="text-center py-12 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Add Your First Experience
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
              Build your professional profile by adding your work history
            </p>
            
            <button
              onClick={addExperience}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0A66C2] border border-[#0A66C2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Experience
            </button>

            <div className="mt-6 flex items-start gap-2 text-left max-w-md mx-auto p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg">
              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Include 3-5 key responsibilities per role
              </p>
            </div>
          </div>
        ) : (
          /* LinkedIn-style grouped view */
          groupedExperiences.map((group) => {
            const hasMultiplePositions = group.experiences.length > 1;
            const isExpanded = expandedCompanies.has(group.company);
            const visibleExperiences = isExpanded ? group.experiences : group.experiences.slice(0, 2);
            const hiddenCount = group.experiences.length - visibleExperiences.length;
            
            return (
              <div key={group.company} className="relative">
                {/* Company Header with Logo */}
                <div className="flex gap-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0 relative">
                    <CompanyLogo 
                      companyName={group.company} 
                      size="xl"
                      className="rounded border border-gray-200 dark:border-gray-700"
                    />
                    {/* Vertical timeline line (only for multiple positions) */}
                    {hasMultiplePositions && (
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 bg-gray-200 dark:bg-gray-700" 
                           style={{ height: 'calc(100% - 4rem)' }} />
                    )}
                  </div>
                  
                  {/* Company Info and Positions */}
                  <div className="flex-1 min-w-0">
                    {/* Company Name and Total Duration */}
                    {hasMultiplePositions && (
                      <div className="mb-3">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {group.company}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {group.totalDuration}
                        </p>
                      </div>
                    )}
                    
                    {/* Positions List */}
                    <div className={hasMultiplePositions ? 'space-y-4 relative' : ''}>
                      {visibleExperiences.map((experience, expIndex) => {
                        const isEditing = editingIndex === experience.originalIndex;
                        const isMenuOpen = openMenuIndex === experience.originalIndex;
                        const duration = formatDuration(calculateDuration(experience.startDate, experience.endDate, experience.current));
                        
                        return (
                          <div key={experience.originalIndex} className="relative">
                            {/* Timeline dot (only for multiple positions) */}
                            {hasMultiplePositions && (
                              <div className="absolute -left-[3.25rem] top-1 w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500 border-2 border-white dark:border-gray-800" />
                            )}
                            
                            {isEditing ? (
                              /* Edit Mode */
                              <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-5">
                                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {experience.title || 'New Position'}
                                  </h3>
                                  <button
                                    onClick={() => setEditingIndex(null)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-full hover:bg-[#004182] transition-colors text-sm font-semibold"
                                  >
                                    Done
                                  </button>
                                </div>

                                <div className="space-y-5">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Job Title <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={experience.title}
                                        onChange={(e) => updateExperience(experience.originalIndex, 'title', e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g., Senior Consultant"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Company <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={experience.company}
                                        onChange={(e) => updateExperience(experience.originalIndex, 'company', e.target.value)}
                                        className={inputClass}
                                        placeholder="e.g., Accenture"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Start Date <span className="text-red-500">*</span>
                                      </label>
                                      <MonthPicker
                                        value={experience.startDate}
                                        onChange={(value) => updateExperience(experience.originalIndex, 'startDate', value)}
                                        placeholder="Select month"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        End Date
                                      </label>
                                      <MonthPicker
                                        value={experience.endDate}
                                        onChange={(value) => updateExperience(experience.originalIndex, 'endDate', value)}
                                        disabled={experience.current}
                                        placeholder="Select month"
                                      />
                                    </div>
                                    <div className="flex items-end pb-1.5">
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={experience.current}
                                          onChange={(e) => updateExperience(experience.originalIndex, 'current', e.target.checked)}
                                          className="w-4 h-4 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2]"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Current role</span>
                                      </label>
                                    </div>
                                  </div>

                                  <CollapsibleSection
                                    title="Additional Details"
                                    icon={Info}
                                    isExpanded={expandedSections[experience.originalIndex]?.details || false}
                                    onToggle={() => toggleSection(experience.originalIndex, 'details')}
                                    badge={hasDetails(experience) ? '✓' : null}
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                          Industry
                                        </label>
                                        <select
                                          value={experience.industry}
                                          onChange={(e) => updateExperience(experience.originalIndex, 'industry', e.target.value)}
                                          className={selectClass}
                                        >
                                          <option value="">Select industry</option>
                                          {industries.map(ind => (
                                            <option key={ind} value={ind}>{ind}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                          Contract Type
                                        </label>
                                        <select
                                          value={experience.contractType}
                                          onChange={(e) => updateExperience(experience.originalIndex, 'contractType', e.target.value)}
                                          className={selectClass}
                                        >
                                          <option value="">Select type</option>
                                          {contractTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                          Location
                                        </label>
                                        <input
                                          type="text"
                                          value={experience.location}
                                          onChange={(e) => updateExperience(experience.originalIndex, 'location', e.target.value)}
                                          className={inputClass}
                                          placeholder="e.g., Paris, France"
                                        />
                                      </div>
                                    </div>
                                  </CollapsibleSection>

                                  <CollapsibleSection
                                    title="Responsibilities"
                                    icon={FileText}
                                    isExpanded={expandedSections[experience.originalIndex]?.content || false}
                                    onToggle={() => toggleSection(experience.originalIndex, 'content')}
                                    badge={hasContent(experience) ? '✓' : null}
                                  >
                                    <BulletInput
                                      items={experience.responsibilities}
                                      onChange={(items) => updateExperience(experience.originalIndex, 'responsibilities', items)}
                                      placeholder="e.g., Led product strategy for mobile apps..."
                                      emptyText="No responsibilities added"
                                    />
                                  </CollapsibleSection>
                                </div>
                              </div>
                            ) : (
                              /* View Mode - LinkedIn Style */
                              <div className="group relative pr-16">
                                {/* Actions */}
                                <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setEditingIndex(experience.originalIndex)}
                                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => setOpenMenuIndex(isMenuOpen ? null : experience.originalIndex)}
                                      className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                    
                                    {isMenuOpen && (
                                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                                        <button
                                          onClick={() => duplicateExperience(experience.originalIndex)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                          <Copy className="w-4 h-4" />
                                          Duplicate
                                        </button>
                                        <button
                                          onClick={() => removeExperience(experience.originalIndex)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Position Content */}
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {experience.title || 'Untitled Position'}
                                  </h5>
                                  {!hasMultiplePositions && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {experience.company}
                                    </p>
                                  )}
                                  {experience.contractType && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {contractTypes.find(t => t.id === experience.contractType)?.label || experience.contractType}
                                    </p>
                                  )}
                                  
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {experience.startDate && (
                                      <>
                                        {new Date(experience.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        {' - '}
                                        {experience.current ? 'Present' : experience.endDate ? new Date(experience.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                                        {' · '}
                                        {duration}
                                      </>
                                    )}
                                  </p>
                                  {experience.location && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {experience.location}
                                    </p>
                                  )}

                                  {experience.responsibilities.filter(r => r.trim()).length > 0 && (
                                    <div className="mt-2.5">
                                      <ul className="space-y-1">
                                        {experience.responsibilities.filter(r => r.trim()).slice(0, 2).map((resp, i) => (
                                          <li key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {resp}
                                          </li>
                                        ))}
                                        {experience.responsibilities.filter(r => r.trim()).length > 2 && (
                                          <li className="text-xs text-gray-500 dark:text-gray-400">
                                            ...see more
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Show all / Show less button */}
                    {hasMultiplePositions && group.experiences.length > 2 && (
                      <button
                        onClick={() => toggleCompanyExpansion(group.company)}
                        className="mt-3 flex items-center gap-1 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Show less
                            <ChevronDown className="w-4 h-4 rotate-180" />
                          </>
                        ) : (
                          <>
                            Show all {group.experiences.length} experiences
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Separator between company groups */}
                <div className="mt-5 border-b border-gray-100 dark:border-gray-700/50" />
              </div>
            );
          })
        )}
      </div>
    </FieldGroup>
  );
};

export default ProfessionalHistorySectionV2;

