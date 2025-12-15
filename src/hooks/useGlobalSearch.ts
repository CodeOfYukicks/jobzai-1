import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  GlobalSearchResult,
  globalSearch,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
} from '../lib/globalSearchService';

interface UseGlobalSearchReturn {
  // State
  isOpen: boolean;
  query: string;
  results: GlobalSearchResult[];
  isLoading: boolean;
  selectedIndex: number;
  recentSearches: string[];
  
  // Actions
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  selectResult: (result: GlobalSearchResult) => void;
  navigateResults: (direction: 'up' | 'down') => void;
  selectCurrentResult: () => void;
  clearRecent: () => void;
  setSelectedIndex: (index: number) => void;
}

const DEBOUNCE_MS = 200;

export function useGlobalSearch(): UseGlobalSearchReturn {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Perform search with debouncing
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!currentUser) return;

    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    
    try {
      const searchResults = await globalSearch(currentUser.uid, {
        query: searchQuery || undefined,
        limit: 15,
      });
      
      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Debounced query handler
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, DEBOUNCE_MS);
  }, [performSearch]);

  // Open search
  const openSearch = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    setRecentSearches(getRecentSearches());
    
    // Load initial results
    if (currentUser) {
      performSearch('');
    }
  }, [currentUser, performSearch, setQuery]);

  // Close search
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQueryState('');
    setResults([]);
    setSelectedIndex(0);
    
    // Clean up
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  // Navigate to result
  const selectResult = useCallback((result: GlobalSearchResult) => {
    if (result.path) {
      // Add to recent searches if there was a query
      if (query.trim()) {
        addRecentSearch(query);
      }
      
      navigate(result.path);
      closeSearch();
    }
  }, [navigate, closeSearch, query]);

  // Keyboard navigation
  const navigateResults = useCallback((direction: 'up' | 'down') => {
    setSelectedIndex((current) => {
      if (direction === 'up') {
        return current > 0 ? current - 1 : results.length - 1;
      } else {
        return current < results.length - 1 ? current + 1 : 0;
      }
    });
  }, [results.length]);

  // Select current highlighted result
  const selectCurrentResult = useCallback(() => {
    if (results[selectedIndex]) {
      selectResult(results[selectedIndex]);
    }
  }, [results, selectedIndex, selectResult]);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  // Global keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
        return;
      }

      // Only handle these when open
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeSearch();
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateResults('down');
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateResults('up');
          break;
        case 'Enter':
          e.preventDefault();
          selectCurrentResult();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch, navigateResults, selectCurrentResult]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    isOpen,
    query,
    results,
    isLoading,
    selectedIndex,
    recentSearches,
    openSearch,
    closeSearch,
    setQuery,
    selectResult,
    navigateResults,
    selectCurrentResult,
    clearRecent,
    setSelectedIndex,
  };
}

export default useGlobalSearch;





