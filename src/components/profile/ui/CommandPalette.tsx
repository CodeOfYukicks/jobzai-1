import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Command, 
  User, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  FileText, 
  Target,
  Settings,
  ArrowRight,
  Keyboard
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category?: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  customCommands?: CommandItem[];
}

const CommandPalette = ({
  isOpen,
  onClose,
  onNavigateToSection,
  customCommands = []
}: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Default commands
  const defaultCommands: CommandItem[] = [
    {
      id: 'personal',
      label: 'Personal Information',
      description: 'Edit your name, headline, and photo',
      icon: <User className="w-4 h-4" />,
      action: () => onNavigateToSection?.('personal'),
      category: 'Navigate'
    },
    {
      id: 'experience',
      label: 'Experience',
      description: 'Add or edit work history',
      icon: <Briefcase className="w-4 h-4" />,
      action: () => onNavigateToSection?.('experience'),
      category: 'Navigate'
    },
    {
      id: 'education',
      label: 'Education & Languages',
      description: 'Update education and language skills',
      icon: <GraduationCap className="w-4 h-4" />,
      action: () => onNavigateToSection?.('education'),
      category: 'Navigate'
    },
    {
      id: 'location',
      label: 'Location & Mobility',
      description: 'Set location and work preferences',
      icon: <MapPin className="w-4 h-4" />,
      action: () => onNavigateToSection?.('location'),
      category: 'Navigate'
    },
    {
      id: 'skills',
      label: 'Skills & Expertise',
      description: 'Manage your skills and tools',
      icon: <Settings className="w-4 h-4" />,
      action: () => onNavigateToSection?.('skills'),
      category: 'Navigate'
    },
    {
      id: 'documents',
      label: 'Documents & Links',
      description: 'Upload CV and add links',
      icon: <FileText className="w-4 h-4" />,
      action: () => onNavigateToSection?.('documents'),
      category: 'Navigate'
    },
    {
      id: 'objectives',
      label: 'Career Objectives',
      description: 'Set target position and salary',
      icon: <Target className="w-4 h-4" />,
      action: () => onNavigateToSection?.('objectives'),
      category: 'Navigate'
    }
  ];

  const allCommands = [...defaultCommands, ...customCommands];

  // Filter commands based on query
  const filteredCommands = allCommands.filter(cmd => {
    const searchStr = `${cmd.label} ${cmd.description || ''} ${cmd.category || ''}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  const handleSelect = (command: CommandItem) => {
    command.action();
    onClose();
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This should trigger opening from parent
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 outline-none text-base"
                />
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">esc</kbd>
                  <span>to close</span>
                </div>
              </div>

              {/* Commands list */}
              <div 
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto py-2"
              >
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No commands found</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, commands]) => (
                    <div key={category}>
                      <div className="px-4 py-1.5">
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          {category}
                        </span>
                      </div>
                      {commands.map((command) => {
                        const index = filteredCommands.indexOf(command);
                        const isSelected = index === selectedIndex;
                        
                        return (
                          <div
                            key={command.id}
                            data-index={index}
                            onClick={() => handleSelect(command)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 cursor-pointer
                              transition-colors duration-100
                              ${isSelected 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }
                            `}
                          >
                            <div className={`
                              p-2 rounded-lg
                              ${isSelected 
                                ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              }
                            `}>
                              {command.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`
                                text-sm font-medium truncate
                                ${isSelected 
                                  ? 'text-indigo-900 dark:text-indigo-100' 
                                  : 'text-gray-900 dark:text-white'
                                }
                              `}>
                                {command.label}
                              </p>
                              {command.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {command.description}
                                </p>
                              )}
                            </div>
                            {command.shortcut && (
                              <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-mono">
                                {command.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">↑↓</kbd>
                    <span>navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">↵</kbd>
                    <span>select</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>⌘K to open anytime</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to manage command palette state
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
};

export default CommandPalette;

