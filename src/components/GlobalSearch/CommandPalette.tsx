import { useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, Loader2, Clock, Trash2 } from 'lucide-react';
import { GlobalSearchResult, SearchResultType, getTypeLabel } from '../../lib/globalSearchService';
import { SearchResult } from './SearchResult';

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  results: GlobalSearchResult[];
  isLoading: boolean;
  selectedIndex: number;
  recentSearches: string[];
  sidebarWidth?: number;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelectResult: (result: GlobalSearchResult) => void;
  onClearRecent: () => void;
  setSelectedIndex: (index: number) => void;
}

// Group results by type
const groupResults = (results: GlobalSearchResult[]): Map<SearchResultType, GlobalSearchResult[]> => {
  const groups = new Map<SearchResultType, GlobalSearchResult[]>();
  
  // Define order
  const typeOrder: SearchResultType[] = ['page', 'job-application', 'interview', 'resume', 'cv-analysis', 'campaign'];
  
  typeOrder.forEach(type => {
    const items = results.filter(r => r.type === type);
    if (items.length > 0) {
      groups.set(type, items);
    }
  });
  
  return groups;
};

const getGroupLabel = (type: SearchResultType): string => {
  switch (type) {
    case 'page': return 'Quick Navigation';
    case 'job-application': return 'Job Applications';
    case 'interview': return 'Interviews';
    case 'resume': return 'Resumes';
    case 'cv-analysis': return 'CV Analyses';
    case 'campaign': return 'Campaign Contacts';
    default: return getTypeLabel(type);
  }
};

export function CommandPalette({
  isOpen,
  query,
  results,
  isLoading,
  selectedIndex,
  recentSearches,
  sidebarWidth = 72,
  onClose,
  onQueryChange,
  onSelectResult,
  onClearRecent,
  setSelectedIndex,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Group results
  const groupedResults = groupResults(results);
  
  // Build flat index for keyboard navigation
  let currentIndex = 0;
  const indexedResults: { result: GlobalSearchResult; index: number }[] = [];
  groupedResults.forEach((items) => {
    items.forEach((result) => {
      indexedResults.push({ result, index: currentIndex++ });
    });
  });

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/40 z-[100]"
            onClick={onClose}
          />

          {/* Modal - positioned below the TopBar search, same positioning as TopBar */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-14 right-0 z-[101] flex justify-center px-4"
            style={{ left: sidebarWidth }}
          >
            <div className="
              w-full max-w-2xl
              bg-white dark:bg-[#2b2a2c] 
              rounded-xl shadow-2xl 
              border border-gray-200 dark:border-[#3d3c3e]
              overflow-hidden
              ring-1 ring-black/5 dark:ring-white/5
            ">
              {/* Search Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#3d3c3e]">
                <div className="flex-shrink-0">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-[#635BFF] animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search applications, resumes, interviews, or navigate..."
                  className="
                    flex-1 bg-transparent border-none outline-none
                    text-base text-gray-900 dark:text-gray-100
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                  "
                />

                {query && (
                  <button
                    onClick={() => onQueryChange('')}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#3d3c3e] transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}

                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-[#3d3c3e]">
                  <span className="text-xs text-gray-400">esc</span>
                </div>
              </div>

              {/* Recent Searches (when no query) */}
              {!query && recentSearches.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-100 dark:border-[#3d3c3e]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Recent Searches
                    </span>
                    <button
                      onClick={onClearRecent}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => onQueryChange(search)}
                        className="
                          px-2.5 py-1 rounded-full text-xs font-medium
                          bg-gray-100 dark:bg-[#3d3c3e] 
                          text-gray-600 dark:text-gray-300
                          hover:bg-gray-200 dark:hover:bg-[#4a494b]
                          transition-colors
                        "
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Results */}
              <div 
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              >
                {results.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-[#3d3c3e] mb-3">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {query ? 'No results found' : 'Start typing to search'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {query 
                        ? 'Try different keywords or check spelling'
                        : 'Search across all your applications, resumes, and more'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {Array.from(groupedResults.entries()).map(([type, items]) => (
                      <Fragment key={type}>
                        {/* Group Header */}
                        <div className="px-5 py-1.5 sticky top-0 bg-white/95 dark:bg-[#2b2a2c]/95 backdrop-blur-sm z-10">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {getGroupLabel(type)}
                          </span>
                        </div>
                        
                        {/* Group Items */}
                        {items.map((result) => {
                          const itemIndex = indexedResults.find(ir => ir.result === result)?.index ?? 0;
                          return (
                            <div key={`${result.type}-${result.id}`} data-index={itemIndex}>
                              <SearchResult
                                result={result}
                                isSelected={selectedIndex === itemIndex}
                                query={query}
                                onClick={() => onSelectResult(result)}
                                onMouseEnter={() => setSelectedIndex(itemIndex)}
                              />
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-[#3d3c3e] bg-gray-50/50 dark:bg-[#242325]/50">
                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#3d3c3e] font-medium">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#3d3c3e] font-medium">↵</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-[#3d3c3e] font-medium">esc</kbd>
                      Close
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Command className="w-3 h-3" />
                    <span className="font-medium">K</span>
                    <span>to open anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal
  return createPortal(content, document.body);
}

export default CommandPalette;

