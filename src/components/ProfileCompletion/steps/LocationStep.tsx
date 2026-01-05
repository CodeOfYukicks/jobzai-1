import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LocationStepProps {
  value: string;
  onNext: (data: { city: string; country: string }) => void;
  onBack: () => void;
}

interface Country {
  name: {
    common: string;
  };
  cca2: string;
}

interface CitySuggestion {
  name: string;
  country: string;
  displayName: string;
}

const popularCities: CitySuggestion[] = [
  { name: 'London', country: 'United Kingdom', displayName: 'London, United Kingdom' },
  { name: 'New York', country: 'United States', displayName: 'New York, United States' },
  { name: 'Paris', country: 'France', displayName: 'Paris, France' },
  { name: 'Berlin', country: 'Germany', displayName: 'Berlin, Germany' },
  { name: 'Amsterdam', country: 'Netherlands', displayName: 'Amsterdam, Netherlands' },
  { name: 'Toronto', country: 'Canada', displayName: 'Toronto, Canada' },
  { name: 'Sydney', country: 'Australia', displayName: 'Sydney, Australia' },
  { name: 'Tokyo', country: 'Japan', displayName: 'Tokyo, Japan' },
  { name: 'Dubai', country: 'United Arab Emirates', displayName: 'Dubai, UAE' },
];

export default function LocationStep({ value, onNext, onBack }: LocationStepProps) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const citySuggestionsRef = useRef<HTMLDivElement>(null);
  const countrySuggestionsRef = useRef<HTMLDivElement>(null);

  // Parse initial value if it exists (format: "City, Country" or just city/country)
  useEffect(() => {
    if (value) {
      const parts = value.split(',').map(s => s.trim());
      if (parts.length === 2) {
        setCity(parts[0]);
        setCountry(parts[1]);
      } else {
        // Try to match with popular cities
        const match = popularCities.find(c => c.displayName === value || c.name === value);
        if (match) {
          setCity(match.name);
          setCountry(match.country);
        } else {
          setCity(value);
        }
      }
    }
  }, [value]);

  // Fetch countries from REST Countries API
  const fetchCountries = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCountrySuggestions([]);
      return;
    }

    setLoadingCountries(true);
    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(searchTerm)}?fields=name,cca2`);
      if (response.ok) {
        const data: Country[] = await response.json();
        setCountrySuggestions(data.slice(0, 10));
      } else {
        setCountrySuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountrySuggestions([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Fetch cities using Photon API (better for autocomplete)
  const fetchCities = async (searchTerm: string, countryCode?: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCitySuggestions([]);
      return;
    }

    setLoadingCities(true);
    try {
      // Use Photon API which is better for autocomplete
      // Add lang parameter to get English names
      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerm)}&limit=15&lang=en`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en'
        }
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.features && Array.isArray(data.features)) {
          const suggestions: CitySuggestion[] = data.features
            .filter((item: any) => {
              // Filter for cities, towns, villages, municipalities
              const placeType = item.properties?.osm_value || item.properties?.type;
              const osmKey = item.properties?.osm_key;

              // Accept places (cities, towns, villages) or administrative boundaries
              return (osmKey === 'place' && (placeType === 'city' || placeType === 'town' || placeType === 'village' || placeType === 'municipality')) ||
                (osmKey === 'boundary' && placeType === 'administrative') ||
                (item.properties?.name && item.geometry?.type === 'Point'); // Fallback for any named place
            })
            .map((item: any) => {
              // Prefer English name if available, otherwise use default name
              const name = item.properties?.['name:en'] || item.properties?.name || '';
              const country = item.properties?.country || item.properties?.countrycode?.toUpperCase() || '';
              return {
                name: name,
                country: country,
                displayName: country ? `${name}, ${country}` : name
              };
            })
            .filter((suggestion: CitySuggestion) => suggestion.name && suggestion.name.length > 0) // Remove empty names
            .reduce((acc: CitySuggestion[], current: CitySuggestion) => {
              // Remove duplicates
              if (!acc.find(item => item.name === current.name && item.country === current.country)) {
                acc.push(current);
              }
              return acc;
            }, [])
            .slice(0, 10);

          if (suggestions.length > 0) {
            setCitySuggestions(suggestions);
          } else {
            // If no results from Photon, try Nominatim
            await fetchCitiesNominatim(searchTerm, countryCode);
          }
        } else {
          // Fallback to Nominatim if Photon fails
          await fetchCitiesNominatim(searchTerm, countryCode);
        }
      } else {
        // Fallback to Nominatim if Photon fails
        await fetchCitiesNominatim(searchTerm, countryCode);
      }
    } catch (error) {
      console.error('Error fetching cities from Photon:', error);
      // Fallback to Nominatim
      await fetchCitiesNominatim(searchTerm, countryCode);
    } finally {
      setLoadingCities(false);
    }
  };

  // Fallback: Fetch cities using Nominatim (OpenStreetMap) API
  const fetchCitiesNominatim = async (searchTerm: string, countryCode?: string) => {
    try {
      // Add accept-language parameter to get English names
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}+city&limit=10&addressdetails=1&accept-language=en`;
      if (countryCode) {
        url += `&countrycodes=${countryCode}`;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Cubbbe Location Selector',
          'Accept-Language': 'en'
        }
      });

      if (response.ok) {
        const data: any[] = await response.json();
        const suggestions: CitySuggestion[] = data
          .filter(item => {
            // More flexible filtering
            const type = item.type || item.class;
            return type === 'city' || type === 'town' || type === 'village' ||
              item.class === 'place' || item.place_type === 'city';
          })
          .map(item => {
            // Nominatim returns localized names, try to get English name from address
            // The display_name format is usually: "City Name, State, Country"
            const displayParts = item.display_name?.split(',') || [];
            const cityName = item.name || displayParts[0]?.trim() || '';
            const country = item.address?.country || item.address?.country_code?.toUpperCase() || '';
            return {
              name: cityName,
              country: country,
              displayName: country ? `${cityName}, ${country}` : cityName
            };
          })
          .filter(suggestion => suggestion.name) // Remove empty names
          .slice(0, 10);

        setCitySuggestions(suggestions);
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching cities from Nominatim:', error);
      setCitySuggestions([]);
    }
  };

  // Debounce timer for city search
  const citySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce timer for country search
  const countrySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle city input change with debounce
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);

    // Clear previous timeout
    if (citySearchTimeoutRef.current) {
      clearTimeout(citySearchTimeoutRef.current);
    }

    if (value.length >= 2) {
      // Debounce the API call
      citySearchTimeoutRef.current = setTimeout(() => {
        fetchCities(value);
        setShowCitySuggestions(true);
      }, 300); // Wait 300ms after user stops typing
    } else {
      setShowCitySuggestions(false);
      setCitySuggestions([]);
    }
  };

  // Handle country input change with debounce
  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountry(value);

    // Clear previous timeout
    if (countrySearchTimeoutRef.current) {
      clearTimeout(countrySearchTimeoutRef.current);
    }

    if (value.length >= 2) {
      // Debounce the API call
      countrySearchTimeoutRef.current = setTimeout(() => {
        fetchCountries(value);
        setShowCountrySuggestions(true);
      }, 300); // Wait 300ms after user stops typing
    } else {
      setShowCountrySuggestions(false);
      setCountrySuggestions([]);
    }
  };

  // Handle city selection
  const handleCitySelect = (suggestion: CitySuggestion) => {
    setCity(suggestion.name);
    if (suggestion.country && suggestion.country !== 'Remote') {
      setCountry(suggestion.country);
    }
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setCountry(country.name.common);
    setShowCountrySuggestions(false);
    setCountrySuggestions([]);
  };

  // Handle popular city selection
  const handlePopularCitySelect = (suggestion: CitySuggestion) => {
    setCity(suggestion.name);
    setCountry(suggestion.country);
    setShowCitySuggestions(false);
    setShowCountrySuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        citySuggestionsRef.current &&
        !citySuggestionsRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
      if (
        countrySuggestionsRef.current &&
        !countrySuggestionsRef.current.contains(event.target as Node) &&
        countryInputRef.current &&
        !countryInputRef.current.contains(event.target as Node)
      ) {
        setShowCountrySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canContinue = city.trim() && country.trim();

  return (
    <div className="space-y-6">
      {/* City Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          City
        </label>
        <div className="relative">
          <input
            ref={cityInputRef}
            type="text"
            value={city}
            onChange={handleCityChange}
            onFocus={() => city.length >= 2 && setShowCitySuggestions(true)}
            placeholder="Enter city..."
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
              focus:border-gray-900 dark:focus:border-white focus:outline-none focus:ring-0
              transition-colors text-lg"
          />
          {loadingCities && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>

        {/* City Suggestions Dropdown */}
        <AnimatePresence>
          {showCitySuggestions && (citySuggestions.length > 0 || loadingCities) && (
            <motion.div
              ref={citySuggestionsRef}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {loadingCities ? (
                <div className="p-3 text-center text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : (
                citySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(suggestion)}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">{suggestion.name}</span>
                    {suggestion.country && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">· {suggestion.country}</span>
                    )}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Country Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Country
        </label>
        <div className="relative">
          <input
            ref={countryInputRef}
            type="text"
            value={country}
            onChange={handleCountryChange}
            onFocus={() => country.length >= 2 && setShowCountrySuggestions(true)}
            placeholder="Enter country..."
            className="w-full px-0 py-3 bg-transparent border-0 border-b border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
              focus:border-gray-900 dark:focus:border-white focus:outline-none focus:ring-0
              transition-colors text-lg"
          />
          {loadingCountries && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Country Suggestions Dropdown */}
        <AnimatePresence>
          {showCountrySuggestions && (countrySuggestions.length > 0 || loadingCountries) && (
            <motion.div
              ref={countrySuggestionsRef}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {loadingCountries ? (
                <div className="p-3 text-center text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : (
                countrySuggestions.map((country, index) => (
                  <button
                    key={index}
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">{country.name.common}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popular Locations - Subtle */}
      <div>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Popular</p>
        <div className="flex flex-wrap gap-2">
          {popularCities.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion.displayName}
              onClick={() => handlePopularCitySelect(suggestion)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${city === suggestion.name && country === suggestion.country
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                }
              `}
            >
              {suggestion.name}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => canContinue && onNext({ city: city.trim(), country: country.trim() })}
          disabled={!canContinue}
          className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
