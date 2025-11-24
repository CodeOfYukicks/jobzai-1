import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles } from 'lucide-react';
import { FilterState } from '../../types/job-board';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { SearchSuggestionsDropdown } from './SearchSuggestionsDropdown';
import { InlineFilterChips } from './InlineFilterChips';

interface PremiumSearchBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  filters: FilterState;
  onRemoveFilter: (category: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  isCollapsed?: boolean;
}

export function PremiumSearchBar({
  searchInput,
  onSearchChange,
  onSearch,
  filters,
  onRemoveFilter,
  onClearFilters,
  isCollapsed = false,
}: PremiumSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const { suggestions, popularSearches, loading } = useSearchSuggestions(searchInput);
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useRecentSearches();

  // Show dropdown when focused and there's content to show
  const showDropdown = isFocused && (
    recentSearches.length > 0 || 
    suggestions.length > 0 || 
    (!searchInput.trim() && popularSearches.length > 0)
  );

  // Calculate total suggestions for keyboard navigation
  const totalSuggestions = isFocused && !searchInput.trim() 
    ? recentSearches.length || popularSearches.length
    : recentSearches.length + suggestions.length;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < totalSuggestions - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            // Select suggestion
            if (!searchInput.trim() && recentSearches.length > 0) {
              // Recent search selected
              if (selectedSuggestionIndex < recentSearches.length) {
                handleSelectSuggestion(recentSearches[selectedSuggestionIndex].query);
              }
            } else if (!searchInput.trim() && popularSearches.length > 0) {
              // Popular search selected
              handleSelectSuggestion(popularSearches[selectedSuggestionIndex].text);
            } else if (suggestions.length > 0) {
              // Autocomplete suggestion selected
              const adjustedIndex = selectedSuggestionIndex - (searchInput.trim() ? 0 : recentSearches.length);
              if (adjustedIndex >= 0 && adjustedIndex < suggestions.length) {
                handleSelectSuggestion(suggestions[adjustedIndex].text);
              }
            }
          } else {
            // No suggestion selected, perform search
            handleSearch();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsFocused(false);
          inputRef.current?.blur();
          break;
      }
    };

    if (isFocused) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showDropdown, selectedSuggestionIndex, totalSuggestions, searchInput, recentSearches, suggestions, popularSearches]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    if (isFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFocused]);

  const handleSelectSuggestion = (text: string) => {
    onSearchChange(text);
    setIsFocused(false);
    setSelectedSuggestionIndex(-1);
    // Trigger search after a brief delay
    setTimeout(() => {
      addRecentSearch(text, filters);
      onSearch();
    }, 100);
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      addRecentSearch(searchInput, filters);
      onSearch();
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
    setSelectedSuggestionIndex(-1);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setSelectedSuggestionIndex(-1);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.employmentType.length > 0 ||
    filters.workLocation.length > 0 ||
    filters.experienceLevel.length > 0 ||
    filters.industries.length > 0 ||
    filters.technologies.length > 0 ||
    filters.skills.length > 0 ||
    filters.datePosted !== 'any';

  return (
    <div className="w-full max-w-4xl mx-auto" ref={containerRef}>
      {/* Main Search Container */}
      <motion.div
        animate={{
          scale: isFocused && !isCollapsed ? 1.005 : 1,
          boxShadow: isFocused
            ? '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(99, 102, 241, 0.1)'
            : isCollapsed 
              ? '0 1px 6px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.03)'
              : '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`
          relative bg-white dark:bg-gray-900 rounded-2xl overflow-visible
          transition-all duration-200
          ${isFocused ? 'ring-2 ring-indigo-500/20' : ''}
          ${isCollapsed ? 'rounded-xl' : 'rounded-2xl'}
        `}
      >
        {/* Search Input */}
        <motion.div 
          animate={{
            height: isCollapsed ? '48px' : '56px',
            paddingLeft: isCollapsed ? '16px' : '20px',
            paddingRight: isCollapsed ? '16px' : '20px',
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <motion.div 
            animate={{
              width: isCollapsed ? '18px' : '20px',
              height: isCollapsed ? '18px' : '20px',
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`
              flex-shrink-0 transition-all duration-200
              ${isFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
            `}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className={isCollapsed ? "w-4.5 h-4.5" : "w-5 h-5"} />
              </motion.div>
            ) : (
              <Search className={isCollapsed ? "w-4.5 h-4.5" : "w-5 h-5"} />
            )}
          </motion.div>

          <motion.input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={handleFocus}
            placeholder={isCollapsed ? "Search jobs..." : "Search for jobs, companies, or skills..."}
            animate={{
              fontSize: isCollapsed ? '15px' : '16px',
            }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 bg-transparent border-none outline-none font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
          />

          {/* Clear Button */}
          {searchInput && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </motion.button>
          )}

          {/* Search Button - Hidden on mobile, always visible on desktop */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            disabled={!searchInput.trim()}
            className={`
              hidden sm:flex flex-shrink-0 items-center justify-center px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm
              ${searchInput.trim() 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isCollapsed ? '🔍' : 'Search'}
          </motion.button>
        </motion.div>

        {/* Filter Chips Below Search - Hide when collapsed */}
        <AnimatePresence>
          {hasActiveFilters && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="px-5 pb-3 pt-1"
            >
              <InlineFilterChips
                filters={filters}
                onRemoveFilter={onRemoveFilter}
                onClearAll={onClearFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions Dropdown */}
        <SearchSuggestionsDropdown
          isOpen={showDropdown}
          searchInput={searchInput}
          suggestions={suggestions}
          popularSearches={popularSearches}
          recentSearches={recentSearches}
          selectedIndex={selectedSuggestionIndex}
          onSelectSuggestion={handleSelectSuggestion}
          onRemoveRecent={removeRecentSearch}
          onClearRecent={clearRecentSearches}
        />
      </motion.div>

      {/* Smart Search Hint - Hide when collapsed */}
      {isFocused && !searchInput && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Try: <span className="font-medium text-gray-700 dark:text-gray-300">"Software Engineer in New York"</span> or{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">"Remote React Developer"</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-300 dark:border-gray-700">↑</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-300 dark:border-gray-700">↓</kbd> to navigate • {' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-300 dark:border-gray-700">Enter</kbd> to select • {' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-300 dark:border-gray-700">Esc</kbd> to close
          </p>
        </motion.div>
      )}
    </div>
  );
}

