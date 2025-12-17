import { useState, useEffect } from 'react';
import { MapPin, Plus, X, Globe } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const DetailedLocationSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    preferredCities: [] as string[],
    preferredCountries: [] as string[],
    geographicFlexibility: ''
  });

  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            preferredCities: userData.preferredCities || [],
            preferredCountries: userData.preferredCountries || [],
            geographicFlexibility: userData.geographicFlexibility || ''
          });
          onUpdate({
            preferredCities: userData.preferredCities || [],
            preferredCountries: userData.preferredCountries || [],
            geographicFlexibility: userData.geographicFlexibility || ''
          });
        }
      } catch (error) {
        console.error('Error loading detailed location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const addCity = () => {
    if (newCity.trim() && !formData.preferredCities.includes(newCity.trim())) {
      handleChange('preferredCities', [...formData.preferredCities, newCity.trim()]);
      setNewCity('');
    }
  };

  const removeCity = (index: number) => {
    handleChange('preferredCities', formData.preferredCities.filter((_, i) => i !== index));
  };

  const addCountry = () => {
    if (newCountry.trim() && !formData.preferredCountries.includes(newCountry.trim())) {
      handleChange('preferredCountries', [...formData.preferredCountries, newCountry.trim()]);
      setNewCountry('');
    }
  };

  const removeCountry = (index: number) => {
    handleChange('preferredCountries', formData.preferredCountries.filter((_, i) => i !== index));
  };

  const flexibilityLevels = [
    { id: 'very-flexible', label: 'Very Flexible', description: 'Open to many locations worldwide' },
    { id: 'flexible', label: 'Flexible', description: 'Open to multiple regions/countries' },
    { id: 'moderate', label: 'Moderate', description: 'Prefer specific regions but open to others' },
    { id: 'strict', label: 'Strict', description: 'Only specific cities/regions' }
  ];

  const commonCountries = [
    'France', 'United States', 'United Kingdom', 'Germany', 'Spain', 'Italy',
    'Netherlands', 'Belgium', 'Switzerland', 'Canada', 'Australia', 'Singapore',
    'Japan', 'South Korea', 'United Arab Emirates', 'Portugal', 'Sweden', 'Denmark'
  ];

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="detailed-location" className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Detailed Location Preferences
        </h2>
      </div>

      <div className="space-y-6">
        {/* Geographic Flexibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Geographic Flexibility
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flexibilityLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleChange('geographicFlexibility', level.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.geographicFlexibility === level.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-[#4a494b] hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Cities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Preferred Cities / Regions
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCity()}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Enter city or region (e.g., Paris, San Francisco, London)"
            />
            <button
              onClick={addCity}
              disabled={!newCity.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {formData.preferredCities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.preferredCities.map((city, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {city}
                  <button
                    onClick={() => removeCity(index)}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Countries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Preferred Countries
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCountry()}
              list="countries-list"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Enter country name"
            />
            <datalist id="countries-list">
              {commonCountries.map((country) => (
                <option key={country} value={country} />
              ))}
            </datalist>
            <button
              onClick={addCountry}
              disabled={!newCountry.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {formData.preferredCountries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.preferredCountries.map((country, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {country}
                  <button
                    onClick={() => removeCountry(index)}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DetailedLocationSection;






