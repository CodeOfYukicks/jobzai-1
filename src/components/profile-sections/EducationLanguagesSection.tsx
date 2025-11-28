import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Languages, Plus, X, Edit2, MoreVertical, Copy, Trash2, Check, Loader2, Info } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import MonthPicker from '../ui/MonthPicker';
import { 
  PremiumLabel,
  SectionDivider,
  FieldGroup,
  SectionSkeleton,
  CollapsibleSection
} from '../profile/ui';
import debounce from 'lodash/debounce';

// Get flag emoji for a language
const getLanguageFlag = (languageName: string): string => {
  const languageMap: { [key: string]: string } = {
    'english': '🇬🇧',
    'french': '🇫🇷',
    'spanish': '🇪🇸',
    'german': '🇩🇪',
    'italian': '🇮🇹',
    'portuguese': '🇵🇹',
    'chinese': '🇨🇳',
    'japanese': '🇯🇵',
    'korean': '🇰🇷',
    'arabic': '🇸🇦',
    'russian': '🇷🇺',
    'dutch': '🇳🇱',
    'swedish': '🇸🇪',
    'norwegian': '🇳🇴',
    'danish': '🇩🇰',
    'polish': '🇵🇱',
    'turkish': '🇹🇷',
    'hindi': '🇮🇳',
    'greek': '🇬🇷',
    'hebrew': '🇮🇱'
  };
  
  const normalized = languageName.toLowerCase().trim();
  return languageMap[normalized] || '🌐';
};

interface SectionProps {
  onUpdate: (data: any) => void;
}

// New Education interface for multiple entries
interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

const EducationLanguagesSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    educations: [] as Education[],
    languages: [] as Array<{ language: string; level: string }>
  });
  
  // Education editing states
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [openEducationMenuIndex, setOpenEducationMenuIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async (data: { educations: Education[]; languages: Array<{ language: string; level: string }> }) => {
      if (!currentUser?.uid) return;
      
      try {
        setSaveStatus('saving');
        await updateDoc(doc(db, 'users', currentUser.uid), {
          educations: data.educations,
          languages: data.languages
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
          
          // Migrate old single education format to new multi-education format
          let educations: Education[] = userData.educations || [];
          
          // If no educations array but has old format, migrate
          if (educations.length === 0 && (userData.educationLevel || userData.educationInstitution)) {
            const migratedEducation: Education = {
              id: `edu-${Date.now()}`,
              degree: userData.educationLevel || '',
              field: userData.educationField || '',
              institution: userData.educationInstitution || '',
              startDate: '',
              endDate: userData.graduationYear ? `${userData.graduationYear}-06` : '',
              current: false,
              description: userData.educationMajor ? `Major: ${userData.educationMajor}` : ''
            };
            
            if (migratedEducation.degree || migratedEducation.institution) {
              educations = [migratedEducation];
            }
          }
          
          const newFormData = {
            educations,
            languages: userData.languages || []
          };
          
          setFormData(newFormData);
          onUpdate(newFormData);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading education and languages:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
    debouncedSave(newFormData);
  };

  // Education management functions
  const addEducation = () => {
    const newEducation: Education = {
      id: `edu-${Date.now()}`,
      degree: '',
      field: '',
      institution: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    const newEducations = [...formData.educations, newEducation];
    handleChange('educations', newEducations);
    setEditingEducationIndex(newEducations.length - 1);
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const updated = [...formData.educations];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('educations', updated);
  };

  const duplicateEducation = (index: number) => {
    const edu = formData.educations[index];
    const duplicated = { ...edu, id: `edu-${Date.now()}` };
    const newEducations = [...formData.educations];
    newEducations.splice(index + 1, 0, duplicated);
    handleChange('educations', newEducations);
    toast.success('Education duplicated');
    setOpenEducationMenuIndex(null);
  };

  const removeEducation = (index: number) => {
    const newEducations = formData.educations.filter((_, i) => i !== index);
    handleChange('educations', newEducations);
    toast.success('Education removed');
    setOpenEducationMenuIndex(null);
  };

  const degreeOptions = [
    { id: 'high-school', label: 'High School / Bac' },
    { id: 'associate', label: 'Associate / Bac+2' },
    { id: 'bachelor', label: 'Bachelor / Bac+3' },
    { id: 'master', label: 'Master / Bac+5' },
    { id: 'phd', label: 'PhD / Doctorate' },
    { id: 'bootcamp', label: 'Bootcamp / Certificate' },
    { id: 'other', label: 'Other' }
  ];

  const fieldOptions = [
    { value: '', label: 'Select field of study' },
    { value: 'Computer Science / IT', label: 'Computer Science / IT' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Business / Management', label: 'Business / Management' },
    { value: 'Design / Arts', label: 'Design / Arts' },
    { value: 'Marketing / Communication', label: 'Marketing / Communication' },
    { value: 'Finance / Accounting', label: 'Finance / Accounting' },
    { value: 'Law', label: 'Law' },
    { value: 'Medicine / Health', label: 'Medicine / Health' },
    { value: 'Education', label: 'Education' },
    { value: 'Humanities', label: 'Humanities' },
    { value: 'Sciences', label: 'Sciences' },
    { value: 'Other', label: 'Other' }
  ];

  const languageLevels = [
    { id: 'native', label: 'Native' },
    { id: 'fluent', label: 'Fluent' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'beginner', label: 'Beginner' }
  ];

  const commonLanguages = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
  ];

  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState('');

  const handleAddLanguage = () => {
    if (newLanguage.trim() && newLanguageLevel) {
      const languageExists = formData.languages.some(
        lang => lang.language.toLowerCase() === newLanguage.trim().toLowerCase()
      );
      
      if (!languageExists) {
        handleChange('languages', [
          ...formData.languages,
          { language: newLanguage.trim(), level: newLanguageLevel }
        ]);
        setNewLanguage('');
        setNewLanguageLevel('');
      }
    }
  };

  const handleRemoveLanguage = (index: number) => {
    handleChange('languages', formData.languages.filter((_, i) => i !== index));
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

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Education Section - Multiple Entries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Education</h3>
        </div>

          <div className="flex items-center gap-3">
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
              onClick={addEducation}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </button>
          </div>
        </div>

        {/* Education List */}
        <div className="space-y-4">
          {formData.educations.length === 0 ? (
            <div className="text-center py-10 px-6 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl border border-gray-300 dark:border-gray-600">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Add Your Education
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 max-w-sm mx-auto">
                Add your degrees, certifications, and educational background
              </p>
              <button
                onClick={addEducation}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-semibold shadow-sm mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>
          ) : (
            formData.educations.map((education, index) => {
              const isEditing = editingEducationIndex === index;
              const isMenuOpen = openEducationMenuIndex === index;
              
              return (
                <div
                  key={education.id}
                  className={`
                    relative rounded-xl transition-shadow duration-200
                    ${isEditing 
                      ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg' 
                      : 'bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-600 hover:shadow-md'
                    }
                  `}
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                          {education.institution || 'New Education'}
                        </h3>
                        <button
                          onClick={() => setEditingEducationIndex(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-semibold"
                        >
                          Done
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Degree Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Degree Level <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {degreeOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => updateEducation(index, 'degree', option.id)}
                                className={`
                                  p-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                  ${education.degree === option.id
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }
                                `}
                              >
                                {option.label}
                              </button>
                            ))}
          </div>
        </div>

                        {/* Field of Study & Institution */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                              Field of Study
                            </label>
                            <select
                              value={education.field}
                              onChange={(e) => updateEducation(index, 'field', e.target.value)}
                              className={selectClass}
                            >
                              {fieldOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                              Institution <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={education.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className={inputClass}
                              placeholder="e.g., Harvard University"
                            />
                          </div>
        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                              Start Date
                            </label>
                            <MonthPicker
                              value={education.startDate}
                              onChange={(value) => updateEducation(index, 'startDate', value)}
                              placeholder="Select month"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                              End Date
                            </label>
                            <MonthPicker
                              value={education.endDate}
                              onChange={(value) => updateEducation(index, 'endDate', value)}
                              disabled={education.current}
                              placeholder="Select month"
                            />
                          </div>
                          <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={education.current}
                                onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-gray-900/10 dark:focus:ring-white/10"
                              />
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Currently studying
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                            Description (optional)
                          </label>
                          <textarea
                            value={education.description}
                            onChange={(e) => updateEducation(index, 'description', e.target.value)}
                            className={`${inputClass} resize-none`}
                            rows={3}
                            placeholder="Major, honors, relevant coursework..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="p-5 relative">
                      {/* Actions */}
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <button
                          onClick={() => setEditingEducationIndex(index)}
                          className="p-2 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenEducationMenuIndex(isMenuOpen ? null : index)}
                            className="p-2 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors shadow-sm"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl overflow-hidden z-10">
                              <button
                                onClick={() => duplicateEducation(index)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => removeEducation(index)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="pr-24">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">🎓</span>
                          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                            {degreeOptions.find(d => d.id === education.degree)?.label || education.degree || 'Degree'}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                          {education.institution || 'Institution'}
                        </p>
                        {education.field && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {education.field}
                          </p>
                        )}
                        
                        {(education.startDate || education.endDate) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {education.startDate && (
                              <span>
                                {new Date(education.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {education.startDate && (education.endDate || education.current) && ' — '}
                            {education.current ? 'Present' : education.endDate && (
                              <span>
                                {new Date(education.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </p>
                        )}
                        
                        {education.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                            {education.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <SectionDivider />

      {/* Languages Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Languages className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            Languages <span className="text-red-400">*</span>
          </h3>
        </div>

        {/* Add Language */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
              list="languages-list"
              placeholder="Type a language..."
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
            />
            <datalist id="languages-list">
              {commonLanguages.map((lang) => (
                <option key={lang} value={lang} />
              ))}
            </datalist>
          </div>
          <select
            value={newLanguageLevel}
            onChange={(e) => setNewLanguageLevel(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-10"
          >
            <option value="">Select level</option>
            {languageLevels.map((level) => (
              <option key={level.id} value={level.id}>{level.label}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddLanguage}
            disabled={!newLanguage.trim() || !newLanguageLevel}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        </div>

        {/* Languages List */}
        <AnimatePresence mode="popLayout">
          {formData.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, index) => (
                <motion.div
                  key={`${lang.language}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 dark:bg-gray-700/60 rounded-xl"
                >
                  <span className="text-lg">{getLanguageFlag(lang.language)}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {lang.language}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-200/60 dark:bg-gray-600/60 rounded-full">
                    {languageLevels.find(l => l.id === lang.level)?.label || lang.level}
                  </span>
                  <button
                    onClick={() => handleRemoveLanguage(index)}
                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Add your language skills</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </FieldGroup>
  );
};

export default EducationLanguagesSection;
