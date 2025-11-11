import { useState, useEffect } from 'react';
import { GraduationCap, Languages, Plus, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

// Fonction pour obtenir l'emoji drapeau d'une langue
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
    'hebrew': '🇮🇱',
    'thai': '🇹🇭',
    'vietnamese': '🇻🇳',
    'indonesian': '🇮🇩',
    'malay': '🇲🇾',
    'finnish': '🇫🇮',
    'czech': '🇨🇿',
    'hungarian': '🇭🇺',
    'romanian': '🇷🇴',
    'ukrainian': '🇺🇦',
    'croatian': '🇭🇷',
    'serbian': '🇷🇸',
    'bulgarian': '🇧🇬',
    'slovak': '🇸🇰',
    'slovenian': '🇸🇮',
  };
  
  const normalized = languageName.toLowerCase().trim();
  return languageMap[normalized] || '🌐';
};

interface SectionProps {
  onUpdate: (data: any) => void;
}

const EducationLanguagesSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    educationLevel: '',
    educationField: '',
    educationInstitution: '',
    graduationYear: '',
    educationMajor: '',
    languages: [] as Array<{ language: string; level: string }>
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            educationLevel: userData.educationLevel || '',
            educationField: userData.educationField || '',
            educationInstitution: userData.educationInstitution || '',
            graduationYear: userData.graduationYear || '',
            educationMajor: userData.educationMajor || '',
            languages: userData.languages || []
          });
          onUpdate({
            educationLevel: userData.educationLevel || '',
            educationField: userData.educationField || '',
            educationInstitution: userData.educationInstitution || '',
            graduationYear: userData.graduationYear || '',
            educationMajor: userData.educationMajor || '',
            languages: userData.languages || []
          });
        }
      } catch (error) {
        console.error('Error loading education and languages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const educationLevels = [
    { id: 'high-school', label: 'High School / Bac' },
    { id: 'associate', label: 'Associate / Bac+2' },
    { id: 'bachelor', label: 'Bachelor / Bac+3' },
    { id: 'master', label: 'Master / Bac+5' },
    { id: 'phd', label: 'PhD / Doctorate' },
    { id: 'other', label: 'Other' }
  ];

  const educationFields = [
    'Computer Science / IT',
    'Engineering',
    'Business / Management',
    'Design / Arts',
    'Marketing / Communication',
    'Finance / Accounting',
    'Law',
    'Medicine / Health',
    'Education',
    'Humanities',
    'Sciences',
    'Other'
  ];

  const languageLevels = [
    { id: 'native', label: 'Native' },
    { id: 'fluent', label: 'Fluent' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'beginner', label: 'Beginner' }
  ];

  const commonLanguages = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch',
    'Swedish', 'Norwegian', 'Danish', 'Polish', 'Turkish', 'Hindi'
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

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="education-languages" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">

      <div className="space-y-6">
        {/* Education Section */}
        <div className="border-b dark:border-gray-700 pb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Education
          </h3>

          <div className="space-y-4">
            {/* Education Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Education Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {educationLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleChange('educationLevel', level.id)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 text-sm
                      ${formData.educationLevel === level.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }
                    `}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Education Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Field of Study
              </label>
              <select
                value={formData.educationField}
                onChange={(e) => handleChange('educationField', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="">Select field of study</option>
                {educationFields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            {/* Institution & Major */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Institution (Optional)
                </label>
                <input
                  type="text"
                  value={formData.educationInstitution}
                  onChange={(e) => handleChange('educationInstitution', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="University or school name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Major / Specialization (Optional)
                </label>
                <input
                  type="text"
                  value={formData.educationMajor}
                  onChange={(e) => handleChange('educationMajor', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="e.g., Computer Science, Marketing"
                />
              </div>
            </div>

            {/* Graduation Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Graduation Year (Optional)
              </label>
              <input
                type="number"
                value={formData.graduationYear}
                onChange={(e) => handleChange('graduationYear', e.target.value)}
                min="1950"
                max={new Date().getFullYear() + 5}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="e.g., 2020"
              />
            </div>
          </div>
        </div>

        {/* Languages Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Languages className="w-5 h-5 text-purple-600" />
            Languages <span className="text-red-500">*</span>
          </h3>

          <div className="space-y-4">
            {/* Add Language */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                  list="languages-list"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Enter language name"
                />
                <datalist id="languages-list">
                  {commonLanguages.map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>
              </div>
              <div>
                <select
                  value={newLanguageLevel}
                  onChange={(e) => setNewLanguageLevel(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  {languageLevels.map((level) => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleAddLanguage}
              disabled={!newLanguage.trim() || !newLanguageLevel}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Language
            </button>

            {/* Languages List */}
            {formData.languages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-2"
                  >
                    <span className="text-lg">{getLanguageFlag(lang.language)}</span>
                    <span className="font-medium">{lang.language}</span>
                    <span className="text-xs">({languageLevels.find(l => l.id === lang.level)?.label || lang.level})</span>
                    <button
                      onClick={() => handleRemoveLanguage(index)}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationLanguagesSection;

