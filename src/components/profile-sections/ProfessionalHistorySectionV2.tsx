import { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, Plus, MoreVertical, Edit2, Copy, Trash2, Check, Search, Loader2, Info, FileText, Lightbulb, Linkedin, Upload } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import MonthPicker from '../ui/MonthPicker';
import { CollapsibleSection, BulletInput, FieldGroup, SectionSkeleton } from '../profile/ui';
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
  achievements: string[];
}

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
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
  const [loadingLogo, setLoadingLogo] = useState<{ [key: number]: boolean }>({});
  const companyInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const suggestionsRef = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const logoFetchTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

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
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const normalizedHistory = (userData.professionalHistory || []).map((exp: any) => ({
            ...exp,
            responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
            achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
            companyLogo: exp.companyLogo || ''
          }));
          
          setFormData({ professionalHistory: normalizedHistory });
          onUpdate({ professionalHistory: normalizedHistory });
        }
      } catch (error) {
        console.error('Error loading professional history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
      responsibilities: [''],
      achievements: ['']
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
    return exp.responsibilities.some(r => r.trim()) || exp.achievements.some(a => a.trim());
  };

  const inputClass = `
    w-full px-4 py-2.5 rounded-xl
    bg-white dark:bg-gray-800/80
    border border-gray-200/80 dark:border-gray-600/50
    text-gray-900 dark:text-white
    text-[15px]
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10
    focus:border-gray-300 dark:focus:border-gray-500
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
      <div className="flex items-center justify-between">
        <AnimatePresence mode="wait">
          {saveStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs"
            >
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addExperience}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-semibold shadow-sm ml-auto"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </motion.button>
      </div>

      {/* Experience List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {formData.professionalHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/40"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Add Your First Experience
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                Build your professional profile by adding your work history
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addExperience}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Manually
                </motion.button>
              </div>

              <div className="flex items-center gap-3 justify-center text-xs text-gray-400 dark:text-gray-500 mb-4">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span>or import from</span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  LinkedIn
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-300">
                  <Upload className="w-4 h-4" />
                  Upload CV
                </button>
              </div>

              <div className="mt-6 flex items-start gap-2 text-left max-w-md mx-auto p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg">
                <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Include 3-5 key accomplishments per role with metrics when possible
                </p>
              </div>
            </motion.div>
          ) : (
            formData.professionalHistory.map((experience, index) => {
              const isEditing = editingIndex === index;
              const isMenuOpen = openMenuIndex === index;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                  className={`
                    relative rounded-xl transition-all duration-200
                    ${isEditing 
                      ? 'bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/60 shadow-lg' 
                      : 'bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/40 hover:shadow-md'
                    }
                  `}
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="p-6">
                      {/* Header with Done button */}
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                          {experience.title || 'New Experience'}
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setEditingIndex(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-semibold"
                        >
                          Done
                        </motion.button>
                      </div>

                      <div className="space-y-6">
                        {/* Essentials - Always Visible */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Job Title <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={experience.title}
                                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                className={inputClass}
                                placeholder="e.g., Senior Product Manager"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Company <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={experience.company}
                                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                className={inputClass}
                                placeholder="e.g., Google"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date <span className="text-red-400">*</span>
                              </label>
                              <MonthPicker
                                value={experience.startDate}
                                onChange={(value) => updateExperience(index, 'startDate', value)}
                                placeholder="Select month"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                              </label>
                              <MonthPicker
                                value={experience.endDate}
                                onChange={(value) => updateExperience(index, 'endDate', value)}
                                disabled={experience.current}
                                placeholder="Select month"
                              />
                            </div>
                            <div className="flex items-end pb-1">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={experience.current}
                                  onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-gray-900/10 dark:focus:ring-white/10"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Current
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Additional Details - Collapsible */}
                        <CollapsibleSection
                          title="Additional Details"
                          icon={Info}
                          isExpanded={expandedSections[index]?.details || false}
                          onToggle={() => toggleSection(index, 'details')}
                          badge={hasDetails(experience) ? '✓' : null}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Industry
                              </label>
                              <select
                                value={experience.industry}
                                onChange={(e) => updateExperience(index, 'industry', e.target.value)}
                                className={selectClass}
                              >
                                <option value="">Select industry</option>
                                {industries.map(ind => (
                                  <option key={ind} value={ind}>{ind}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contract Type
                              </label>
                              <select
                                value={experience.contractType}
                                onChange={(e) => updateExperience(index, 'contractType', e.target.value)}
                                className={selectClass}
                              >
                                <option value="">Select type</option>
                                {contractTypes.map(type => (
                                  <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location
                              </label>
                              <input
                                type="text"
                                value={experience.location}
                                onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                className={inputClass}
                                placeholder="e.g., Paris, France"
                              />
                            </div>
                          </div>
                        </CollapsibleSection>

                        {/* Content - Collapsible */}
                        <CollapsibleSection
                          title="Responsibilities & Achievements"
                          icon={FileText}
                          isExpanded={expandedSections[index]?.content || false}
                          onToggle={() => toggleSection(index, 'content')}
                          badge={hasContent(experience) ? '✓' : null}
                        >
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Key Responsibilities
                              </label>
                              <BulletInput
                                items={experience.responsibilities}
                                onChange={(items) => updateExperience(index, 'responsibilities', items)}
                                placeholder="e.g., Led product strategy for mobile apps..."
                                emptyText="No responsibilities added"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Key Achievements
                              </label>
                              <BulletInput
                                items={experience.achievements}
                                onChange={(items) => updateExperience(index, 'achievements', items)}
                                placeholder="e.g., Increased revenue by 30% in Q2..."
                                emptyText="No achievements added"
                              />
                            </div>
                          </div>
                        </CollapsibleSection>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="p-5 relative">
                      {/* Actions - Always Visible */}
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingIndex(index)}
                          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setOpenMenuIndex(isMenuOpen ? null : index)}
                            className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all shadow-sm"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </motion.button>
                          
                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-10"
                              >
                                <button
                                  onClick={() => duplicateExperience(index)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => removeExperience(index)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pr-24">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
                          {experience.title || 'Untitled Position'}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {experience.company || 'Company'}
                        </p>
                        
                        {(experience.startDate || experience.location) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {experience.startDate && (
                              <span>
                                {new Date(experience.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                {' — '}
                                {experience.current ? 'Present' : experience.endDate ? new Date(experience.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                              </span>
                            )}
                            {experience.location && (
                              <span className="ml-3">
                                • {experience.location}
                              </span>
                            )}
                          </p>
                        )}

                        {experience.responsibilities.filter(r => r.trim()).length > 0 && (
                          <div className="mt-4">
                            <ul className="space-y-1">
                              {experience.responsibilities.filter(r => r.trim()).slice(0, 3).map((resp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="text-gray-400 dark:text-gray-500 mt-1.5">•</span>
                                  <span>{resp}</span>
                                </li>
                              ))}
                              {experience.responsibilities.filter(r => r.trim()).length > 3 && (
                                <li className="text-xs text-gray-500 dark:text-gray-400 italic pl-4">
                                  +{experience.responsibilities.filter(r => r.trim()).length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </FieldGroup>
  );
};

export default ProfessionalHistorySectionV2;





