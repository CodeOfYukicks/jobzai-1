import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (language: string, level: string) => void;
}

const languageLevels = [
  { id: 'native', label: 'Native' },
  { id: 'fluent', label: 'Fluent' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'beginner', label: 'Beginner' }
];

// Common languages list
const commonLanguages = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
  'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish',
  'Norwegian', 'Danish', 'Finnish', 'Polish', 'Turkish', 'Greek', 'Hebrew',
  'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Czech', 'Hungarian', 'Romanian',
  'Bulgarian', 'Croatian', 'Serbian', 'Slovak', 'Slovenian', 'Ukrainian',
  'Bengali', 'Urdu', 'Persian', 'Swahili', 'Tagalog', 'Mandarin', 'Cantonese'
].sort();

const LanguageModal = ({ isOpen, onClose, onSave }: LanguageModalProps) => {
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    if (language.trim()) {
      onSave(language.trim(), level);
      setLanguage('');
      setLevel('intermediate');
      onClose();
    }
  };

  const handleClose = () => {
    setLanguage('');
    setLevel('intermediate');
    setSuggestions([]);
    setShowSuggestions(false);
    onClose();
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    if (value.length >= 1) {
      const filtered = commonLanguages.filter(lang =>
        lang.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLanguageSelect = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Add Language
                </h3>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Language
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    onFocus={() => language.length >= 1 && setShowSuggestions(suggestions.length > 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !showSuggestions) {
                        handleSave();
                      }
                    }}
                    placeholder="e.g., English, French, Spanish..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                  />
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleLanguageSelect(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{suggestion}</div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Proficiency Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {languageLevels.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => setLevel(lvl.id)}
                        className={`
                          px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                          ${level === lvl.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                          }
                        `}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!language.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LanguageModal;

