import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Languages, Check, FolderOpen, Briefcase, Target, Star, Heart, Zap, Rocket, BookOpen, Code, Palette, Sparkles, ChevronDown } from 'lucide-react';

// Import Folder type from SaveAsModal to reuse structure if possible, or define compatible interface
interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranslate: (targetLanguage: string, folderId: string | null) => Promise<void>;
  folders?: Folder[];
}

const TARGET_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
];

// Helper to render folder icon
const renderFolderIcon = (iconName: string, color: string) => {
  const iconMap: Record<string, any> = {
    'Folder': FolderOpen,
    'Briefcase': Briefcase,
    'Target': Target,
    'Star': Star,
    'Heart': Heart,
    'Zap': Zap,
    'Rocket': Rocket,
    'BookOpen': BookOpen,
    'Code': Code,
    'Palette': Palette
  };

  const IconComponent = iconMap[iconName] || FolderOpen;
  
  // If it's an emoji
  if (['📁', '💼', '🎯', '⭐', '🚀', '💡', '📚', '🎨', '💻', '🔥', '✨', '🎪'].includes(iconName)) {
    return <span className="text-lg">{iconName}</span>;
  }

  return <IconComponent className="w-4 h-4" style={{ color }} />;
};

export default function TranslationModal({
  isOpen,
  onClose,
  onTranslate,
  folders = []
}: TranslationModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  // Refs for dropdown click outside
  const folderDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setIsFolderDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [folderDropdownRef, languageDropdownRef]);

  const handleTranslateClick = () => {
    if (selectedLanguage) {
      onTranslate(selectedLanguage, selectedFolderId);
    }
  };

  const selectedFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null;
  const selectedLangObj = selectedLanguage ? TARGET_LANGUAGES.find(l => l.name === selectedLanguage) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white shadow-2xl dark:bg-[#121212] rounded-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col"
          >
            {/* Header - Minimalist Google/Notion style */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    Translate to...
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Select language and destination
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-visible space-y-6">
              {/* Language Selection - Picklist Dropdown */}
              <div className="relative" ref={languageDropdownRef}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
                  Target Language
                </h3>
                
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className={`w-full flex items-center justify-between p-3 text-left border rounded-xl transition-all duration-200 ${
                    isLanguageDropdownOpen
                      ? 'border-purple-500 ring-1 ring-purple-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 dark:bg-[#2b2a2c] text-xl shadow-sm border border-gray-100 dark:border-[#3d3c3e]`}>
                      {selectedLangObj ? selectedLangObj.flag : '🌐'}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${selectedLangObj ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {selectedLangObj ? selectedLangObj.name : 'Select a language'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isLanguageDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {/* Language Dropdown Menu */}
                <AnimatePresence>
                  {isLanguageDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-0 right-0 mt-2 z-50 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-[240px] overflow-y-auto p-1"
                    >
                      {TARGET_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.name);
                            setIsLanguageDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors ${
                            selectedLanguage === lang.name
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className="text-sm font-medium flex-1">{lang.name}</span>
                          {selectedLanguage === lang.name && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Folder Selection - Picklist Dropdown */}
              <div className="relative" ref={folderDropdownRef}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">
                  Save to Folder
                </h3>
                
                <button
                  onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                  className={`w-full flex items-center justify-between p-3 text-left border rounded-xl transition-all duration-200 ${
                    isFolderDropdownOpen
                      ? 'border-purple-500 ring-1 ring-purple-500/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedFolderId === null 
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300' 
                        : 'bg-gray-100 dark:bg-[#2b2a2c]'
                    }`} style={{ 
                      color: selectedFolder ? undefined : undefined,
                      backgroundColor: selectedFolder ? `${selectedFolder.color}15` : undefined
                    }}>
                      {selectedFolder 
                        ? renderFolderIcon(selectedFolder.icon || 'Folder', selectedFolder.color || 'currentColor')
                        : <FolderOpen className="w-4 h-4" />
                      }
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedFolder ? selectedFolder.name : 'All Resumes'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedFolder ? 'Custom Folder' : 'Default location'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isFolderDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {/* Folder Dropdown Menu */}
                <AnimatePresence>
                  {isFolderDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                      className="absolute left-0 right-0 mt-2 z-40 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-[200px] overflow-y-auto p-1"
                    >
                      <button
                        onClick={() => {
                          setSelectedFolderId(null);
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors ${
                          selectedFolderId === null
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium flex-1">All Resumes</span>
                        {selectedFolderId === null && <Check className="w-4 h-4" />}
                      </button>

                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => {
                            setSelectedFolderId(folder.id);
                            setIsFolderDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-2 text-left rounded-lg transition-colors ${
                            selectedFolderId === folder.id
                              ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="p-1.5 rounded-md bg-gray-100 dark:bg-[#2b2a2c]" style={{ color: folder.color }}>
                            {renderFolderIcon(folder.icon || 'Folder', 'currentColor')}
                          </div>
                          <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
                          {selectedFolderId === folder.id && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors rounded-xl hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleTranslateClick}
                disabled={!selectedLanguage}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white transition-all bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 dark:shadow-white/5 hover:shadow-xl active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Start Translation
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
