import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, X, Globe } from 'lucide-react';
import { useGooglePlacesAutocomplete, LocationSuggestion } from '../../hooks/useGooglePlacesAutocomplete';

// Quick suggestions shown when input is empty
const QUICK_SUGGESTIONS = [
  'Remote',
  'Paris, France',
  'London, United Kingdom',
  'New York, United States',
  'San Francisco, United States',
  'Berlin, Germany',
];

interface LocationAutocompleteProps {
  selectedLocations: string[];
  onAddLocation: (location: string) => void;
  onRemoveLocation: (location: string) => void;
  placeholder?: string;
}

export default function LocationAutocomplete({
  selectedLocations,
  onAddLocation,
  onRemoveLocation,
  placeholder = 'e.g., Paris, London, Remote'
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    suggestions,
    isLoading,
    searchLocations,
    clearSuggestions,
    resetSessionToken
  } = useGooglePlacesAutocomplete();

  // Filter out already selected locations from suggestions
  const filteredSuggestions = suggestions.filter(s => !selectedLocations.includes(s.description));

  // Quick suggestions when input is empty (filtered)
  const quickSuggestions = QUICK_SUGGESTIONS.filter(loc => !selectedLocations.includes(loc));

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setHighlightedIndex(-1);
    setShowDropdown(true);
    
    // Search with Nominatim
    searchLocations(value);
  };

  // Handle location selection
  const handleSelectLocation = (location: string) => {
    onAddLocation(location);
    setInputValue('');
    clearSuggestions();
    resetSessionToken();
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Use API suggestions if we have input, otherwise use quick suggestions
    const items = inputValue.trim() ? filteredSuggestions : quickSuggestions;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, maxIndex));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex <= maxIndex) {
          const item = items[highlightedIndex];
          const location = typeof item === 'string' ? item : (item as LocationSuggestion).description;
          handleSelectLocation(location);
        } else if (inputValue.trim()) {
          // Allow adding custom location on Enter
          handleSelectLocation(inputValue.trim());
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      );
      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <div className="space-y-2">
      {/* Selected locations */}
      <div className="flex flex-wrap gap-2">
        {selectedLocations.map(loc => (
          <span
            key={loc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 
              bg-gray-100 dark:bg-white/[0.08] rounded-full
              text-[13px] font-medium text-gray-700 dark:text-white"
          >
            <MapPin className="w-3 h-3" />
            {loc}
            <button 
              onClick={() => onRemoveLocation(loc)} 
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Input with autocomplete */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 pl-10 bg-gray-50 dark:bg-white/[0.04] 
              border border-gray-200 dark:border-white/[0.08] rounded-lg
              text-[14px] text-gray-900 dark:text-white 
              placeholder:text-gray-400 dark:placeholder:text-white/30
              focus:outline-none focus:border-gray-300 dark:focus:border-white/20
              transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 py-2 bg-white dark:bg-[#1a1a1a] 
                border border-gray-200 dark:border-white/[0.1] rounded-xl 
                shadow-xl dark:shadow-2xl max-h-60 overflow-y-auto"
            >
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center gap-2 px-4 py-3 text-[13px] text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching locations...
                </div>
              )}

              {/* API Suggestions (when user is typing) */}
              {!isLoading && inputValue.trim() && filteredSuggestions.length > 0 && (
                filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.placeId}
                    data-index={index}
                    onClick={() => handleSelectLocation(suggestion.description)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                      transition-colors ${
                        highlightedIndex === index
                          ? 'bg-gray-100 dark:bg-white/[0.08]'
                          : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      }`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[14px] text-gray-900 dark:text-white truncate">
                        {suggestion.mainText}
                      </p>
                      {suggestion.secondaryText && (
                        <p className="text-[12px] text-gray-500 dark:text-white/50 truncate">
                          {suggestion.secondaryText}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}

              {/* Quick suggestions (when input is empty) */}
              {!isLoading && !inputValue.trim() && quickSuggestions.length > 0 && (
                <>
                  <p className="px-4 py-2 text-[11px] text-gray-400 dark:text-white/40 uppercase tracking-wider font-medium">
                    Popular locations
                  </p>
                  {quickSuggestions.map((loc, index) => (
                    <button
                      key={loc}
                      data-index={index}
                      onClick={() => handleSelectLocation(loc)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-left
                        transition-colors ${
                          highlightedIndex === index
                            ? 'bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {loc}
                    </button>
                  ))}
                </>
              )}

              {/* Add custom location option */}
              {inputValue.trim() && 
               !selectedLocations.includes(inputValue.trim()) &&
               !filteredSuggestions.some(s => s.description.toLowerCase() === inputValue.toLowerCase()) && (
                <button
                  onClick={() => handleSelectLocation(inputValue.trim())}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-left
                    ${filteredSuggestions.length > 0 ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''}
                    text-violet-600 dark:text-violet-400 
                    hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors`}
                >
                  <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-500/20 
                    flex items-center justify-center text-[10px] font-bold">+</span>
                  Add "{inputValue.trim()}"
                </button>
              )}

              {/* No results message */}
              {!isLoading && inputValue.trim() && filteredSuggestions.length === 0 && (
                <div className="px-4 py-2 text-[12px] text-gray-400 dark:text-white/40">
                  No results found. Press Enter to add "{inputValue.trim()}"
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-gray-400 dark:text-white/30 flex items-center gap-1.5">
        <Globe className="w-3 h-3" />
        Powered by OpenStreetMap
      </p>
    </div>
  );
}
