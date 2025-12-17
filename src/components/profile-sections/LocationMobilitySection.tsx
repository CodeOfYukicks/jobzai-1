import { useState, useEffect } from 'react';
import { MapPin, Globe, Building2, Home, Plane, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { motion } from 'framer-motion';
import { 
  PremiumInput, 
  PremiumLabel, 
  PremiumSelectNative,
  PremiumToggle,
  SectionDivider,
  FieldGroup,
  SectionSkeleton
} from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const LocationMobilitySection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    city: '',
    country: '',
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
            city: userData.city || userData.location?.split(',')[0]?.trim() || '',
            country: userData.country || userData.location?.split(',')[1]?.trim() || '',
            willingToRelocate: userData.willingToRelocate || false,
            workPreference: userData.workPreference || '',
            travelPreference: userData.travelPreference || ''
          });
        }
      } catch (error) {
        console.error('Error loading mobility data:', error);
        notify.error('Failed to load mobility preferences');
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
    { id: 'onsite', label: 'On Site', icon: Building2, description: 'Work from office' },
    { id: 'hybrid', label: 'Hybrid', icon: Home, description: 'Mix of both' },
    { id: 'remote', label: 'Remote', icon: Globe, description: 'Work from anywhere' },
    { id: 'international', label: 'International', icon: Plane, description: 'Global opportunities' }
  ];

  const travelOptions = [
    { value: '', label: 'Select preference' },
    { value: 'no-travel', label: 'No travel' },
    { value: 'occasional', label: 'Occasional (1-2 times/quarter)' },
    { value: 'frequent', label: 'Frequent (1-2 times/month)' },
    { value: 'very-frequent', label: 'Very frequent (weekly)' }
  ];

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Current Location */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Current Location</PremiumLabel>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PremiumInput
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="City"
          />
          <PremiumInput
            value={formData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Country"
          />
        </div>
      </div>

      <SectionDivider />

      {/* Work Location Preference */}
      <div>
        <PremiumLabel>Work Location Preference</PremiumLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
          {workPreferences.map((pref) => {
            const isSelected = formData.workPreference === pref.id;
            
            return (
              <motion.button
                key={pref.id}
                onClick={() => handleChange('workPreference', pref.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-4 rounded-xl text-center transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-100 dark:bg-[#4a494b] ring-1 ring-gray-900/10 dark:ring-white/20'
                    : 'bg-gray-50 dark:bg-[#3d3c3e] hover:bg-gray-100 dark:hover:bg-[#4a494b]'
                  }
                `}
              >
                <pref.icon className={`w-5 h-5 mx-auto mb-2 ${
                  isSelected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                }`} />
                <span className={`block text-sm font-medium ${
                  isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {pref.label}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {pref.description}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white dark:text-gray-900" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Relocation & Travel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <PremiumToggle
            checked={formData.willingToRelocate}
            onChange={(checked) => handleChange('willingToRelocate', checked)}
            label="Open to relocation"
            description="Willing to move for the right opportunity"
          />
        </div>
        
        <div>
          <PremiumSelectNative
            label="Travel Preference"
            value={formData.travelPreference}
            onChange={(e) => handleChange('travelPreference', e.target.value)}
            options={travelOptions}
          />
        </div>
      </div>
    </FieldGroup>
  );
};

export default LocationMobilitySection;
