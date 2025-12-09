import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Languages, Plus, X, Edit2, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { motion, AnimatePresence } from 'framer-motion';
import MonthPicker from '../ui/MonthPicker';
import { 
  SectionDivider,
  FieldGroup,
  SectionSkeleton
} from '../profile/ui';
import { InstitutionLogo } from '../common/InstitutionLogo';
import debounce from 'lodash/debounce';

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
  const [, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
        notify.error('Failed to save');
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
    notify.success('Education duplicated');
    setOpenEducationMenuIndex(null);
  };

  const removeEducation = (index: number) => {
    const newEducations = formData.educations.filter((_, i) => i !== index);
    handleChange('educations', newEducations);
    notify.success('Education removed');
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
    bg-white dark:bg-[#2b2a2c]
    border border-gray-300 dark:border-[#4a494b]
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
        {/* Education List */}
        <div className="space-y-4">
          {formData.educations.length === 0 ? (
            <div className="text-center py-10 px-6 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-xl border border-gray-200 dark:border-[#3d3c3e]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white dark:bg-[#3d3c3e] shadow-sm flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Add Your Education
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                Add your degrees, certifications, and educational background
              </p>
              <button
                onClick={addEducation}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0A66C2] border border-[#0A66C2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
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
                <div key={education.id}>
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="p-5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {education.institution || 'New Education'}
                        </h3>
                        <button
                          onClick={() => setEditingEducationIndex(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-full hover:bg-[#004182] transition-colors text-sm font-semibold"
                        >
                          Done
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Degree Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Degree Level <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {degreeOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => updateEducation(index, 'degree', option.id)}
                                className={`
                                  p-2.5 rounded-lg text-sm font-medium transition-all
                                  ${education.degree === option.id
                                    ? 'bg-[#0A66C2] text-white'
                                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Institution <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={education.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className={inputClass}
                              placeholder="e.g., KEDGE Business School"
                            />
                          </div>
        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Start Date
                            </label>
                            <MonthPicker
                              value={education.startDate}
                              onChange={(value) => updateEducation(index, 'startDate', value)}
                              placeholder="Select month"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              End Date
                            </label>
                            <MonthPicker
                              value={education.endDate}
                              onChange={(value) => updateEducation(index, 'endDate', value)}
                              disabled={education.current}
                              placeholder="Select month"
                            />
                          </div>
                          <div className="flex items-end pb-1.5">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={education.current}
                                onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-[#0A66C2] focus:ring-[#0A66C2]"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Currently studying</span>
                            </label>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                    /* View Mode - LinkedIn-style Layout */
                    <div className="flex gap-4 group relative py-3">
                      {/* Institution Logo */}
                      <div className="flex-shrink-0">
                        <InstitutionLogo 
                          institutionName={education.institution} 
                          size="lg"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-16">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {education.institution || 'Institution'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {degreeOptions.find(d => d.id === education.degree)?.label || education.degree || 'Degree'}
                          {education.field && `, ${education.field}`}
                        </p>
                        
                        {(education.startDate || education.endDate) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {education.startDate && (
                              <span>
                                {new Date(education.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {education.startDate && (education.endDate || education.current) && ' - '}
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
                      
                      {/* Actions - Show on hover */}
                      <div className="absolute top-3 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingEducationIndex(index)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setOpenEducationMenuIndex(isMenuOpen ? null : index)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {isMenuOpen && (
                            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg shadow-lg overflow-hidden z-20">
                              <button
                                onClick={() => duplicateEducation(index)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                onClick={() => removeEducation(index)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Separator */}
                  {index < formData.educations.length - 1 && !isEditing && (
                    <div className="border-b border-gray-100 dark:border-[#3d3c3e]/50 my-2" />
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Languages
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
              className="w-full px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] transition-all"
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
            className="px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#0A66C2] focus:border-[#0A66C2] transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-10"
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
            className="px-4 py-2.5 bg-[#0A66C2] text-white rounded-full font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </motion.button>
        </div>

        {/* Languages List - LinkedIn Style */}
        <AnimatePresence mode="popLayout">
          {formData.languages.length > 0 ? (
            <div className="space-y-1">
              {formData.languages.map((lang, index) => (
                <motion.div
                  key={`${lang.language}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                  className="group flex items-center justify-between py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {lang.language}
                  </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      · {languageLevels.find(l => l.id === lang.level)?.label || lang.level}
                    </span>
                  </div>
                    <button
                      onClick={() => handleRemoveLanguage(index)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
                    >
                    <X className="w-4 h-4" />
                    </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-6 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-lg border border-dashed border-gray-200 dark:border-[#3d3c3e]">
              <Languages className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Add your language skills</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </FieldGroup>
  );
};

export default EducationLanguagesSection;
