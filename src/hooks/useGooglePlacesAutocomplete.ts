import { useState, useEffect, useCallback, useRef } from 'react';

// Types for Google Places API
interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface AutocompleteResult {
  predictions: PlacePrediction[];
  status: string;
}

// Cache for loaded script
let googleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const loadGoogleMapsScript = (): Promise<void> => {
  if (googleMapsLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };

    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

export interface LocationSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export function useGooglePlacesAutocomplete() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Maps API
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      // If no API key, we'll fall back to static suggestions
      setError('Google Maps API key not configured');
      return;
    }

    loadGoogleMapsScript()
      .then(() => {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setIsApiReady(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load location service');
      });
  }, []);

  // Reset session token after selection
  const resetSessionToken = useCallback(() => {
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, []);

  // Search for locations
  const searchLocations = useCallback((input: string) => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear suggestions if input is empty
    if (!input.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Check if API is ready
    if (!isApiReady || !autocompleteServiceRef.current) {
      return;
    }

    setIsLoading(true);

    // Debounce API calls
    debounceTimerRef.current = setTimeout(() => {
      autocompleteServiceRef.current!.getPlacePredictions(
        {
          input,
          types: ['(cities)'], // Only cities for location search
          sessionToken: sessionTokenRef.current!,
        },
        (predictions, status) => {
          setIsLoading(false);

          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              console.warn('Places API error:', status);
            }
            setSuggestions([]);
            return;
          }

          const formattedSuggestions: LocationSuggestion[] = predictions.map((prediction) => ({
            description: prediction.description,
            placeId: prediction.place_id,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text,
          }));

          setSuggestions(formattedSuggestions);
        }
      );
    }, 300); // 300ms debounce
  }, [isApiReady]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    isApiReady,
    searchLocations,
    clearSuggestions,
    resetSessionToken,
  };
}

// Declare google types for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}
