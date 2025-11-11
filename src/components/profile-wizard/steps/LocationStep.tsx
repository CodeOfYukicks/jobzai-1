import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Globe, Loader2 } from 'lucide-react';

interface LocationStepProps {
  data: any;
  onUpdate: (data: any) => void;
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

const LocationStep = ({ data, onUpdate }: LocationStepProps) => {
  const [city, setCity] = useState(data.city || '');
  const [country, setCountry] = useState(data.country || '');
  const [willingToRelocate, setWillingToRelocate] = useState(data.willingToRelocate || false);
  const [workPreference, setWorkPreference] = useState(data.workPreference || '');
  const [travelPreference, setTravelPreference] = useState(data.travelPreference || '');
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
  const citySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countrySearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const workPreferences = [
    { id: 'onsite', label: 'On Site' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'remote', label: 'Full Remote' },
    { id: 'international', label: 'International' }
  ];

  useEffect(() => {
    setCity(data.city || '');
    setCountry(data.country || '');
  }, [data]);

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

  // Fetch cities using Photon API
  const fetchCities = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCitySuggestions([]);
      return;
    }

    setLoadingCities(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerm)}&limit=15&lang=en`;
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
              const placeType = item.properties?.osm_value || item.properties?.type;
              const osmKey = item.properties?.osm_key;
              return (osmKey === 'place' && (placeType === 'city' || placeType === 'town' || placeType === 'village' || placeType === 'municipality')) ||
                     (osmKey === 'boundary' && placeType === 'administrative') ||
                     (item.properties?.name && item.geometry?.type === 'Point');
            })
            .map((item: any) => {
              const name = item.properties?.['name:en'] || item.properties?.name || '';
              const country = item.properties?.country || item.properties?.countrycode?.toUpperCase() || '';
              return {
                name: name,
                country: country,
                displayName: country ? `${name}, ${country}` : name
              };
            })
            .filter((suggestion: CitySuggestion) => suggestion.name && suggestion.name.length > 0)
            .reduce((acc: CitySuggestion[], current: CitySuggestion) => {
              if (!acc.find(item => item.name === current.name && item.country === current.country)) {
                acc.push(current);
              }
              return acc;
            }, [])
            .slice(0, 10);
          
          setCitySuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCitySuggestions([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);
    
    if (citySearchTimeoutRef.current) {
      clearTimeout(citySearchTimeoutRef.current);
    }
    
    if (value.length >= 2) {
      citySearchTimeoutRef.current = setTimeout(() => {
        fetchCities(value);
        setShowCitySuggestions(true);
      }, 300);
    } else {
      setShowCitySuggestions(false);
      setCitySuggestions([]);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCountry(value);
    
    if (countrySearchTimeoutRef.current) {
      clearTimeout(countrySearchTimeoutRef.current);
    }
    
    if (value.length >= 2) {
      countrySearchTimeoutRef.current = setTimeout(() => {
        fetchCountries(value);
        setShowCountrySuggestions(true);
      }, 300);
    } else {
      setShowCountrySuggestions(false);
      setCountrySuggestions([]);
    }
  };

  const handleCitySelect = (suggestion: CitySuggestion) => {
    setCity(suggestion.name);
    if (suggestion.country && suggestion.country !== 'Remote') {
      setCountry(suggestion.country);
    }
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    onUpdate({ city: suggestion.name, country: suggestion.country || country });
  };

  const handleCountrySelect = (country: Country) => {
    setCountry(country.name.common);
    setShowCountrySuggestions(false);
    setCountrySuggestions([]);
    onUpdate({ city, country: country.name.common });
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

  const handleChange = (field: string, value: string) => {
    const updates: any = {};
    updates[field] = value;
    onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 max-w-md mx-auto">
        {/* City */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            City
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={cityInputRef}
              type="text"
              value={city}
              onChange={handleCityChange}
              onFocus={() => city.length >= 2 && setShowCitySuggestions(true)}
              placeholder="e.g., Paris, London, New York..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            />
            {loadingCities && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>
          <AnimatePresence>
            {showCitySuggestions && citySuggestions.length > 0 && (
              <motion.div
                ref={citySuggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {citySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{suggestion.name}</div>
                    {suggestion.country && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.country}</div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Country */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="relative"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Country
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={countryInputRef}
              type="text"
              value={country}
              onChange={handleCountryChange}
              onFocus={() => country.length >= 2 && setShowCountrySuggestions(true)}
              placeholder="e.g., France, United States..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            />
            {loadingCountries && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
            )}
          </div>
          <AnimatePresence>
            {showCountrySuggestions && countrySuggestions.length > 0 && (
              <motion.div
                ref={countrySuggestionsRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {countrySuggestions.map((country, index) => (
                  <button
                    key={index}
                    onClick={() => handleCountrySelect(country)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{country.name.common}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Relocation Preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-6"
        >
          <label className="flex items-center space-x-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={willingToRelocate}
              onChange={(e) => {
                setWillingToRelocate(e.target.checked);
                onUpdate({ willingToRelocate: e.target.checked });
              }}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
            />
            <span>I am willing to relocate for the right opportunity</span>
          </label>
        </motion.div>

        {/* Work Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-6"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Work Location Preference
          </label>
          <div className="grid grid-cols-2 gap-3">
            {workPreferences.map((pref) => (
              <motion.button
                key={pref.id}
                onClick={() => {
                  setWorkPreference(pref.id);
                  onUpdate({ workPreference: pref.id });
                }}
                whileHover={{ scale: 1.02 }}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                  text-center min-h-[48px] flex items-center justify-center
                  ${workPreference === pref.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                {pref.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Travel Preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mt-6"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Travel Preference
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={travelPreference}
              onChange={(e) => {
                setTravelPreference(e.target.value);
                onUpdate({ travelPreference: e.target.value });
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            >
              <option value="">Select travel preference</option>
              <option value="no-travel">No travel</option>
              <option value="occasional">Occasional travel (1-2 times/quarter)</option>
              <option value="frequent">Frequent travel (1-2 times/month)</option>
              <option value="very-frequent">Very frequent travel (weekly)</option>
            </select>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationStep;
