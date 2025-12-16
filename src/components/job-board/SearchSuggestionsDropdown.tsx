import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp, MapPin, Briefcase, Building2, Code, X } from 'lucide-react';
import { SearchSuggestion } from '../../hooks/useSearchSuggestions';
import { RecentSearch } from '../../hooks/useRecentSearches';

interface SearchSuggestionsDropdownProps {
  isOpen: boolean;
  searchInput: string;
  suggestions: SearchSuggestion[];
  popularSearches: SearchSuggestion[];
  recentSearches: RecentSearch[];
  selectedIndex: number;
  onSelectSuggestion: (suggestion: string) => void;
  onRemoveRecent: (query: string) => void;
  onClearRecent: () => void;
}

export function SearchSuggestionsDropdown({
  isOpen,
  searchInput,
  suggestions,
  popularSearches,
  recentSearches,
  selectedIndex,
  onSelectSuggestion,
  onRemoveRecent,
  onClearRecent,
}: SearchSuggestionsDropdownProps) {
  if (!isOpen) return null;

  const hasRecentSearches = recentSearches.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const showPopular = !searchInput.trim() && !hasRecentSearches;

  // If nothing to show, don't render
  if (!hasRecentSearches && !hasSuggestions && !showPopular) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ 
          duration: 0.25, 
          ease: [0.34, 1.56, 0.64, 1]
        }}
        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#242325] rounded-2xl shadow-xl border border-gray-200 dark:border-[#3d3c3e] overflow-hidden z-50"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {/* Recent Searches */}
          {hasRecentSearches && !searchInput.trim() && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Recent
                </span>
                <button
                  onClick={onClearRecent}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <SuggestionItem
                  key={`recent-${search.query}-${search.timestamp}`}
                  icon={<Clock className="w-4 h-4" />}
                  text={search.query}
                  isSelected={selectedIndex === index}
                  onClick={() => onSelectSuggestion(search.query)}
                  onRemove={() => onRemoveRecent(search.query)}
                />
              ))}
            </div>
          )}

          {/* Suggestions */}
          {hasSuggestions && (
            <div className="p-2">
              {hasRecentSearches && !searchInput.trim() && (
                <div className="h-px bg-gray-200 dark:bg-[#2b2a2c] my-2" />
              )}
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Suggestions
                </span>
              </div>
              {suggestions.map((suggestion, index) => {
                const adjustedIndex = hasRecentSearches ? recentSearches.length + index : index;
                return (
                  <SuggestionItem
                    key={suggestion.id}
                    icon={getIconForType(suggestion.type)}
                    text={suggestion.text}
                    type={suggestion.type}
                    isSelected={selectedIndex === adjustedIndex}
                    onClick={() => onSelectSuggestion(suggestion.text)}
                  />
                );
              })}
            </div>
          )}

          {/* Popular Searches */}
          {showPopular && (
            <div className="p-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Popular
                </span>
              </div>
              {popularSearches.map((search, index) => (
                <SuggestionItem
                  key={`popular-${search.id || search.text}-${index}`}
                  icon={<TrendingUp className="w-4 h-4" />}
                  text={search.text}
                  isSelected={selectedIndex === index}
                  onClick={() => onSelectSuggestion(search.text)}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

interface SuggestionItemProps {
  icon: React.ReactNode;
  text: string;
  type?: string;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

function SuggestionItem({ icon, text, type, isSelected, onClick, onRemove }: SuggestionItemProps) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className={`
        flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer group
        transition-all duration-150
        ${isSelected 
          ? 'bg-gray-100 dark:bg-[#2b2a2c] shadow-sm' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`
          flex-shrink-0 text-gray-400 dark:text-gray-500
          ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : ''}
        `}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`
            text-sm font-medium block truncate
            ${isSelected 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-700 dark:text-gray-300'
            }
          `}>
            {text}
          </span>
          {type && (
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {type.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
      
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          aria-label="Remove from recent searches"
        >
          <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </motion.div>
  );
}

function getIconForType(type: string): React.ReactNode {
  switch (type) {
    case 'job_title':
      return <Briefcase className="w-4 h-4" />;
    case 'company':
      return <Building2 className="w-4 h-4" />;
    case 'skill':
      return <Code className="w-4 h-4" />;
    case 'location':
      return <MapPin className="w-4 h-4" />;
    case 'popular':
      return <TrendingUp className="w-4 h-4" />;
    default:
      return <Search className="w-4 h-4" />;
  }
}

