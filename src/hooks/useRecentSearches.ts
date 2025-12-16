import { useState, useEffect } from 'react';
import { FilterState } from '../types/job-board';

export interface RecentSearch {
  query: string;
  timestamp: number;
  filters?: Partial<FilterState>;
}

const STORAGE_KEY = 'jobzai_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out any invalid entries (missing query property)
        const validSearches = Array.isArray(parsed) 
          ? parsed.filter((s: any) => s && typeof s.query === 'string' && s.query.trim())
          : [];
        setRecentSearches(validSearches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save a new search
  const addRecentSearch = (query: string, filters?: Partial<FilterState>) => {
    if (!query.trim()) return;

    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: Date.now(),
      filters,
    };

    setRecentSearches(prev => {
      // Remove duplicate if exists, also filter out any invalid entries
      const filtered = prev.filter(s => s?.query && s.query.toLowerCase() !== query.toLowerCase());
      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent search:', error);
      }
      
      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  // Remove a specific recent search
  const removeRecentSearch = (query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s.query !== query);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error removing recent search:', error);
      }
      return updated;
    });
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}

