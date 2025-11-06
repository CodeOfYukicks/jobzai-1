import { useState, useEffect } from 'react';
import { MapPin, Globe } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const LocationMobilitySection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // On garde la location existante et on ajoute les nouveaux champs
  const [formData, setFormData] = useState({
    location: '', // Champ existant
    // Nouveaux champs
    willingToRelocate: false,
    workPreference: '',
    travelPreference: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            location: userData.location || '',
            willingToRelocate: userData.willingToRelocate || false,
            workPreference: userData.workPreference || '',
            travelPreference: userData.travelPreference || ''
          });
        }
      } catch (error) {
        console.error('Error loading mobility data:', error);
        toast.error('Failed to load mobility preferences');
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

  const workPreferences = [
    { id: 'onsite', label: 'On Site' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'remote', label: 'Full Remote' },
    { id: 'international', label: 'International' }
  ];

  return (
    <section id="location" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Location & Mobility</h2>
      </div>

      <div className="space-y-6">
        {/* Current Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Current City
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Enter your city"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Enter your country"
            />
          </div>
        </div>

        {/* Relocation Preference */}
        <div>
          <label className="flex items-center space-x-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={formData.willingToRelocate}
              onChange={(e) => handleChange('willingToRelocate', e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span>I am willing to relocate for the right opportunity</span>
          </label>
        </div>

        {/* Work Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Work Location Preference
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workPreferences.map((pref) => (
              <button
                key={pref.id}
                onClick={() => handleChange('workPreference', pref.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200
                  ${formData.workPreference === pref.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                {pref.label}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Travel Preference
          </label>
          <select
            value={formData.travelPreference}
            onChange={(e) => handleChange('travelPreference', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">Select travel preference</option>
            <option value="no-travel">No travel</option>
            <option value="occasional">Occasional travel (1-2 times/quarter)</option>
            <option value="frequent">Frequent travel (1-2 times/month)</option>
            <option value="very-frequent">Very frequent travel (weekly)</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default LocationMobilitySection; 