import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface MobileLocationStepProps {
    value: string;
    onDataChange: (data: { city: string; country: string }) => void;
}

interface CitySuggestion {
    name: string;
    country: string;
    displayName: string;
}

const popularCities: CitySuggestion[] = [
    { name: 'London', country: 'United Kingdom', displayName: 'London, UK' },
    { name: 'Paris', country: 'France', displayName: 'Paris, France' },
    { name: 'Berlin', country: 'Germany', displayName: 'Berlin, Germany' },
    { name: 'New York', country: 'United States', displayName: 'New York, US' },
    { name: 'Amsterdam', country: 'Netherlands', displayName: 'Amsterdam, NL' },
    { name: 'Toronto', country: 'Canada', displayName: 'Toronto, Canada' },
    { name: 'Sydney', country: 'Australia', displayName: 'Sydney, Australia' },
    { name: 'Tokyo', country: 'Japan', displayName: 'Tokyo, Japan' },
];

export default function MobileLocationStep({ value, onDataChange }: MobileLocationStepProps) {
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Parse initial value
    useEffect(() => {
        if (value) {
            const parts = value.split(',').map(s => s.trim());
            if (parts.length === 2) {
                setCity(parts[0]);
                setCountry(parts[1]);
            }
        }
    }, [value]);

    // Notify parent of changes
    useEffect(() => {
        if (city && country) {
            onDataChange({ city, country });
        }
    }, [city, country, onDataChange]);

    // Search for cities
    const searchCities = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`
            );
            if (response.ok) {
                const data = await response.json();
                const results: CitySuggestion[] = (data.features || [])
                    .filter((item: any) => {
                        const osmKey = item.properties?.osm_key;
                        const placeType = item.properties?.osm_value;
                        return osmKey === 'place' && ['city', 'town', 'village'].includes(placeType);
                    })
                    .map((item: any) => ({
                        name: item.properties?.name || '',
                        country: item.properties?.country || '',
                        displayName: `${item.properties?.name}, ${item.properties?.country}`,
                    }))
                    .filter((s: CitySuggestion) => s.name)
                    .slice(0, 8);
                setSuggestions(results);
            }
        } catch (error) {
            console.error('City search error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchCities(query);
        }, 300);
    };

    const selectLocation = (suggestion: CitySuggestion) => {
        setCity(suggestion.name);
        setCountry(suggestion.country);
        setShowBottomSheet(false);
        setSearchQuery('');
        setSuggestions([]);
    };

    const clearSelection = () => {
        setCity('');
        setCountry('');
        onDataChange({ city: '', country: '' });
    };

    const openSheet = () => {
        setShowBottomSheet(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    return (
        <div className="space-y-6">
            {/* Question */}
            <h1 className="text-[28px] font-semibold text-gray-900 dark:text-white leading-tight">
                Where do you want to work?
            </h1>

            {/* Search trigger / Selected chip */}
            {city && country ? (
                <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#635bff]/10 dark:bg-[#635bff]/20 rounded-xl">
                        <MapPin className="w-4 h-4 text-[#635bff]" />
                        <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                            {city}, {country}
                        </span>
                        <button
                            onClick={clearSelection}
                            className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                    <button
                        onClick={openSheet}
                        className="text-[14px] text-[#635bff] font-medium"
                    >
                        Change
                    </button>
                </div>
            ) : (
                <button
                    onClick={openSheet}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-gray-50 dark:bg-white/[0.04] 
            rounded-xl border border-gray-200 dark:border-white/10
            text-gray-400 dark:text-white/40 text-left"
                >
                    <Search className="w-5 h-5" />
                    <span>Search for a city...</span>
                </button>
            )}

            {/* Bottom Sheet */}
            <AnimatePresence>
                {showBottomSheet && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowBottomSheet(false)}
                            className="fixed inset-0 bg-black/50 z-[100]"
                        />

                        {/* Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed inset-x-0 bottom-0 z-[101] bg-white dark:bg-[#1a1a1a] rounded-t-3xl max-h-[80vh] overflow-hidden"
                        >
                            {/* Handle */}
                            <div className="flex justify-center py-3">
                                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                            </div>

                            {/* Search input */}
                            <div className="px-4 pb-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        placeholder="Search cities..."
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-white/[0.06] rounded-xl
                      text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40
                      border-0 outline-none focus:ring-2 focus:ring-[#635bff]/30"
                                    />
                                    {isLoading && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                                    )}
                                </div>
                            </div>

                            {/* Results / Popular */}
                            <div className="px-4 pb-8 max-h-[50vh] overflow-y-auto">
                                {searchQuery.length >= 2 && suggestions.length > 0 ? (
                                    <div className="space-y-1">
                                        {suggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => selectLocation(suggestion)}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                          hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-left"
                                            >
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-[15px] font-medium text-gray-900 dark:text-white">
                                                        {suggestion.name}
                                                    </p>
                                                    <p className="text-[13px] text-gray-500 dark:text-white/50">
                                                        {suggestion.country}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-[13px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wide mb-3">
                                            Popular
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {popularCities.map((city) => (
                                                <button
                                                    key={city.displayName}
                                                    onClick={() => selectLocation(city)}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-white/[0.06] rounded-full
                            text-[14px] text-gray-700 dark:text-white/80
                            hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                                                >
                                                    {city.displayName}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
