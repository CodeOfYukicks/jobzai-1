import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Globe } from 'lucide-react';
import LanguageModal from '../LanguageModal';

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

interface EducationStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const educationLevels = [
  { id: 'high-school', label: 'High School', description: 'High School Diploma' },
  { id: 'associate', label: 'Associate', description: 'Associate Degree' },
  { id: 'bachelor', label: 'Bachelor', description: "Bachelor's Degree" },
  { id: 'master', label: 'Master', description: "Master's Degree" },
  { id: 'phd', label: 'PhD', description: 'Doctorate' }
];

const languageLevels = [
  { id: 'native', label: 'Native' },
  { id: 'fluent', label: 'Fluent' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'beginner', label: 'Beginner' }
];

const EducationStep = ({ data, onUpdate }: EducationStepProps) => {
  const [educationLevel, setEducationLevel] = useState(data.educationLevel || '');
  const [educationField, setEducationField] = useState(data.educationField || '');
  const [educationInstitution, setEducationInstitution] = useState(data.educationInstitution || '');
  const [educationMajor, setEducationMajor] = useState(data.educationMajor || '');
  const [graduationYear, setGraduationYear] = useState(data.graduationYear || '');
  const [languages, setLanguages] = useState(data.languages || []);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  const handleEducationLevelChange = (level: string) => {
    setEducationLevel(level);
    onUpdate({ educationLevel: level });
  };


  const handleAddLanguage = (language: string, level: string) => {
    const newLanguages = [...languages, { language, level }];
    setLanguages(newLanguages);
    onUpdate({ languages: newLanguages });
  };

  const removeLanguage = (index: number) => {
    const newLanguages = languages.filter((_: any, i: number) => i !== index);
    setLanguages(newLanguages);
    onUpdate({ languages: newLanguages });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onSave={handleAddLanguage}
      />
      
      {/* Section 1: Education Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
          What is your highest level of education?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {educationLevels.map((level, index) => {
            const isSelected = educationLevel === level.id;
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => handleEducationLevelChange(level.id)}
                whileHover={{ scale: 1.02 }}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 text-center
                  ${isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <div className="font-semibold text-base mb-1">{level.label}</div>
                <div className={`
                  text-xs
                  ${isSelected ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {level.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Section 2: Essential Information - Only shown if education level is selected */}
      {educationLevel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Essential Information
            </h3>
            
            {/* Field of Study */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Field of Study *
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={educationField}
                  onChange={(e) => {
                    setEducationField(e.target.value);
                    onUpdate({ educationField: e.target.value });
                  }}
                  placeholder="e.g., Computer Science, Marketing, Finance..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 3: Additional Details - Collapsible/Optional */}
      {educationLevel && educationField && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-4"
        >
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Additional Details
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Optional</span>
            </div>
            
            <div className="space-y-4">
              {/* Institution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Institution
                </label>
                <input
                  type="text"
                  value={educationInstitution}
                  onChange={(e) => {
                    setEducationInstitution(e.target.value);
                    onUpdate({ educationInstitution: e.target.value });
                  }}
                  placeholder="University or school name"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                />
              </div>

              {/* Major & Graduation Year - Side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Major / Specialization
                  </label>
                  <input
                    type="text"
                    value={educationMajor}
                    onChange={(e) => {
                      setEducationMajor(e.target.value);
                      onUpdate({ educationMajor: e.target.value });
                    }}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => {
                      setGraduationYear(e.target.value);
                      onUpdate({ graduationYear: e.target.value });
                    }}
                    min="1950"
                    max={new Date().getFullYear() + 5}
                    placeholder="e.g., 2020"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 4: Languages - Separated */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="border-t border-gray-200 dark:border-gray-700 pt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Spoken Languages
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add languages you speak fluently
            </p>
          </div>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsLanguageModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span>+</span>
            <span>Add Language</span>
          </motion.button>
        </div>
        
        <div className="space-y-2">
          {languages.map((lang: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getLanguageFlag(lang.language)}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {lang.language}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {languageLevels.find(l => l.id === lang.level)?.label || lang.level}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  const newLanguages = languages.filter((_: any, i: number) => i !== index);
                  setLanguages(newLanguages);
                  onUpdate({ languages: newLanguages });
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-1.5 rounded-lg text-lg font-light"
              >
                ×
              </button>
            </motion.div>
          ))}
          {languages.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
              No languages added yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EducationStep;

