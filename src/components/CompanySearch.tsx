import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  name: string;
}

interface CompanySearchProps {
  onSelect: (company: Company) => void;
  onRemove: (companyId: string) => void;
  selectedCompanies: Company[];
  placeholder?: string;
}

// Mock companies data
const MOCK_COMPANIES = [
  { id: '1', name: 'Apple Inc.' },
  { id: '2', name: 'Microsoft Corporation' },
  { id: '3', name: 'Google LLC' },
  { id: '4', name: 'Amazon.com Inc.' },
  { id: '5', name: 'Meta Platforms Inc.' },
  { id: '6', name: 'Netflix Inc.' },
  { id: '7', name: 'Tesla Inc.' },
  { id: '8', name: 'Adobe Inc.' },
  { id: '9', name: 'Salesforce.com Inc.' },
  { id: '10', name: 'Intel Corporation' },
];

export default function CompanySearch({ 
  onSelect, 
  onRemove, 
  selectedCompanies,
  placeholder = 'Search companies...'
}: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchCompanies = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // In a real application, this would be an API call
        // For now, we'll use the mock data
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        const filteredResults = MOCK_COMPANIES.filter(company => 
          company.name.toLowerCase().includes(query.toLowerCase()) &&
          !selectedCompanies.some(selected => selected.id === company.id)
        );
        
        setResults(filteredResults);
      } catch (error) {
        console.error('Error searching companies:', error);
        setResults([]); // Clear results on error
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchCompanies, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query, selectedCompanies]);

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-[#6956A8] focus:border-[#6956A8] text-sm"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {/* Selected Companies */}
      {selectedCompanies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCompanies.map((company) => (
            <motion.span
              key={company.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#6956A8] text-white"
            >
              {company.name}
              <button
                onClick={() => onRemove(company.id)}
                className="ml-2 focus:outline-none hover:text-white/80"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.span>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.trim() || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin h-5 w-5 border-2 border-[#6956A8] border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm">Searching companies...</p>
              </div>
            ) : results.length > 0 ? (
              <ul className="py-2">
                {results.map((company) => (
                  <li key={company.id}>
                    <button
                      onClick={() => {
                        onSelect(company);
                        setQuery('');
                        setIsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                    >
                      {company.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No companies found matching "{query}"
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Start typing to search companies
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
