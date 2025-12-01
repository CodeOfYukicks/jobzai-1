import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Briefcase, 
  FileText, 
  BarChart3, 
  Calendar,
  Loader2,
  Layers,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  searchMentionableRecords, 
  MentionSearchResult,
  getMentionTypeLabel 
} from '../../lib/mentionSearchService';
import type { MentionEmbedType } from './extensions/MentionEmbed';
import type { EditorView } from '@tiptap/pm/view';

type TabType = 'all' | MentionEmbedType;

interface MentionMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  query: string;
  onSelect: (result: MentionSearchResult) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  editorView?: EditorView;
  selectionPos?: number | null;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'job-application', label: 'Applications', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'resume', label: 'Resumes', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'cv-analysis', label: 'Analyses', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'interview', label: 'Interviews', icon: <Calendar className="w-3.5 h-3.5" /> },
];

const typeIcons: Record<MentionEmbedType, React.ReactNode> = {
  'job-application': <Briefcase className="w-4 h-4" />,
  'resume': <FileText className="w-4 h-4" />,
  'cv-analysis': <BarChart3 className="w-4 h-4" />,
  'interview': <Calendar className="w-4 h-4" />,
};

const typeColors: Record<MentionEmbedType, string> = {
  'job-application': 'from-blue-500 to-indigo-500',
  'resume': 'from-emerald-500 to-teal-500',
  'cv-analysis': 'from-purple-500 to-pink-500',
  'interview': 'from-amber-500 to-orange-500',
};

export default function MentionMenu({
  isOpen,
  position,
  query,
  onSelect,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
  editorView,
  selectionPos,
}: MentionMenuProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [results, setResults] = useState<MentionSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [currentPosition, setCurrentPosition] = useState(position);
  const [showAbove, setShowAbove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const MENU_HEIGHT = 480; // Max height of the menu

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search for results
  const performSearch = useCallback(async (searchQuery: string, type: TabType) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const searchResults = await searchMentionableRecords(currentUser.uid, {
        query: searchQuery || undefined,
        type: type === 'all' ? 'all' : type,
        limit: 15,
      });
      setResults(searchResults);
      onSelectedIndexChange(0);
    } catch (error) {
      console.error('Error searching records:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, onSelectedIndexChange]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchInput || query, activeTab);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, searchInput, query, activeTab, performSearch]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    onSelectedIndexChange(0);
  };

  // Handle result selection
  const handleSelect = (result: MentionSearchResult) => {
    onSelect(result);
    onClose();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Update position when initial position changes
  useEffect(() => {
    setCurrentPosition(position);
  }, [position]);

  // Recalculate position on scroll to keep menu anchored to the @ symbol
  useEffect(() => {
    if (!isOpen || !editorView || selectionPos === null || selectionPos === undefined) return;

    const updatePosition = () => {
      try {
        const coords = editorView.coordsAtPos(selectionPos);
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - coords.bottom;
        const spaceAbove = coords.top;
        
        // Determine if we should show above or below
        const shouldShowAbove = spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow;
        setShowAbove(shouldShowAbove);
        
        // Calculate position
        if (shouldShowAbove) {
          // Position above the cursor
          setCurrentPosition({
            top: coords.top - 10, // Will use bottom instead
            left: coords.left,
          });
        } else {
          // Position below the cursor
          setCurrentPosition({
            top: coords.bottom + 5,
            left: coords.left,
          });
        }
      } catch (e) {
        // Position might be invalid if content changed
        console.warn('Could not update menu position:', e);
      }
    };

    // Initial position check
    updatePosition();

    const handleScroll = (e: Event) => {
      // Don't reposition if scrolling inside the menu itself
      if (menuRef.current?.contains(e.target as Node)) return;
      
      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(updatePosition);
    };

    // Listen for scroll on window and any scrollable parent
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, editorView, selectionPos]);

  if (!isOpen) return null;

  // Calculate menu style based on position and direction
  const getMenuStyle = () => {
    const baseStyle = {
      left: `${Math.max(10, Math.min(currentPosition.left, window.innerWidth - 540))}px`,
      width: '520px',
      maxHeight: `${MENU_HEIGHT}px`,
    };

    if (showAbove) {
      return {
        ...baseStyle,
        bottom: `${window.innerHeight - currentPosition.top + 5}px`,
        top: 'auto',
      };
    } else {
      return {
        ...baseStyle,
        top: `${currentPosition.top}px`,
        bottom: 'auto',
      };
    }
  };

  // Use Portal to render outside of any parent with transform that breaks fixed positioning
  const menuContent = (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: showAbove ? 10 : -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: showAbove ? 10 : -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={getMenuStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">@</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mention a record
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 
              border border-gray-200 dark:border-gray-700 rounded-xl
              focus:border-purple-500 dark:focus:border-purple-500
              focus:ring-2 focus:ring-purple-500/20
              text-gray-900 dark:text-white placeholder-gray-400
              transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No records found
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {searchInput ? 'Try a different search term' : 'Start by adding some applications or resumes'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {results.map((result, index) => (
              <motion.button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => onSelectedIndexChange(index)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all
                  ${index === selectedIndex
                    ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-200 dark:ring-purple-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
              >
                {/* Type Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${typeColors[result.type]} flex items-center justify-center text-white shadow-lg`}>
                  {typeIcons[result.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {getMentionTypeLabel(result.type)}
                    </span>
                    {result.status && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                        ${result.status === 'offer' || result.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : result.status === 'rejected' || result.status === 'cancelled'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {result.status}
                      </span>
                    )}
                    {result.score !== undefined && (
                      <span className={`text-[10px] font-bold
                        ${result.score >= 80 ? 'text-emerald-500' : result.score >= 60 ? 'text-amber-500' : 'text-red-500'}
                      `}>
                        {result.score}% match
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                    {result.title}
                  </h4>

                  {result.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {result.subtitle}
                    </p>
                  )}

                  {result.date && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {result.date}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">Esc</kbd>
              Close
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </motion.div>
  );

  // Portal the menu to body to avoid scroll issues from parent transforms
  return createPortal(menuContent, document.body);
}

