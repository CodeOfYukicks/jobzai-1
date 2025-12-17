import { useState, useCallback, useRef } from 'react';

export interface LocationSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

// Nominatim API response type
interface NominatimResult {
  place_id: number;
  display_name: string;
  name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  type: string;
  class: string;
}

/**
 * Hook for location autocomplete using OpenStreetMap Nominatim API
 * Free, no API key required!
 */
export function useGooglePlacesAutocomplete() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Search for locations using Nominatim
  const searchLocations = useCallback((input: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear suggestions if input is empty or too short
    if (!input.trim() || input.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce API calls (300ms)
    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();

      try {
        // Nominatim API - free, no key required
        // We search for places (cities, towns, etc.)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` + 
          new URLSearchParams({
            q: input,
            format: 'json',
            addressdetails: '1',
            limit: '8',
            featuretype: 'city', // Focus on cities
            'accept-language': 'en,fr', // Support English and French
          }),
          {
            signal: abortControllerRef.current.signal,
            headers: {
              'User-Agent': 'JobzAI/1.0 (https://jobzai.com)', // Required by Nominatim
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }

        const results: NominatimResult[] = await response.json();

        // Filter and format results
        const formattedSuggestions: LocationSuggestion[] = results
          .filter(result => {
            // Only keep relevant place types
            const validTypes = ['city', 'town', 'village', 'municipality', 'administrative'];
            return validTypes.includes(result.type) || result.class === 'place';
          })
          .map((result) => {
            const cityName = result.address.city || 
                            result.address.town || 
                            result.address.village || 
                            result.address.municipality ||
                            result.name;
            
            const country = result.address.country || '';
            const state = result.address.state || '';
            
            // Build secondary text (state/region, country)
            const secondaryParts = [state, country].filter(Boolean);
            const secondaryText = secondaryParts.join(', ');
            
            // Build full description
            const description = secondaryText ? `${cityName}, ${secondaryText}` : cityName;

            return {
              description,
              placeId: String(result.place_id),
              mainText: cityName,
              secondaryText,
            };
          })
          // Remove duplicates based on description
          .filter((suggestion, index, self) => 
            index === self.findIndex(s => s.description === suggestion.description)
          );

        setSuggestions(formattedSuggestions);
        setError(null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // Request was aborted, ignore
          return;
        }
        console.error('Location search error:', err);
        setError('Failed to search locations');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Reset (no-op for Nominatim, kept for API compatibility)
  const resetSessionToken = useCallback(() => {
    // No session token needed for Nominatim
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    isApiReady: true, // Nominatim is always ready (no setup needed)
    searchLocations,
    clearSuggestions,
    resetSessionToken,
  };
}
