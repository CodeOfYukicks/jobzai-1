import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Heart, BookOpen, Zap, Users, Target, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumLabel, SectionDivider, FieldGroup, SectionSkeleton } from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const CareerDriversSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    careerPriorities: [] as string[],
    primaryMotivator: '',
    dealBreakers: [] as string[],
    niceToHaves: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            careerPriorities: userData.careerPriorities || [],
            primaryMotivator: userData.primaryMotivator || '',
            dealBreakers: userData.dealBreakers || [],
            niceToHaves: userData.niceToHaves || []
          });
          onUpdate({
            careerPriorities: userData.careerPriorities || [],
            primaryMotivator: userData.primaryMotivator || '',
            dealBreakers: userData.dealBreakers || [],
            niceToHaves: userData.niceToHaves || []
          });
        }
      } catch (error) {
        console.error('Error loading career drivers:', error);
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

  const careerDrivers = [
    { id: 'growth', label: 'Career Growth', icon: TrendingUp, description: 'Advancement & skill development' },
    { id: 'money', label: 'Compensation', icon: DollarSign, description: 'Salary & financial rewards' },
    { id: 'impact', label: 'Impact', icon: Target, description: 'Making a meaningful difference' },
    { id: 'work-life', label: 'Work-Life Balance', icon: Heart, description: 'Flexibility & personal time' },
    { id: 'learning', label: 'Learning', icon: BookOpen, description: 'Continuous skill building' },
    { id: 'autonomy', label: 'Autonomy', icon: Zap, description: 'Independence in decisions' },
    { id: 'leadership', label: 'Leadership', icon: Users, description: 'Team & project leadership' }
  ];

  const dealBreakerOptions = [
    'No remote work',
    'Poor work-life balance',
    'Toxic culture',
    'Low compensation',
    'No growth opportunities',
    'Excessive travel',
    'Unstable company',
    'Micromanagement',
    'Lack of diversity'
  ];

  const niceToHaveOptions = [
    'Equity/Stock',
    'Flexible hours',
    'Learning budget',
    'Gym membership',
    'Health insurance',
    'Remote flexibility',
    'Conference attendance',
    'Mentorship',
    'Company events'
  ];

  const togglePriority = (driverId: string) => {
    const current = formData.careerPriorities;
    const index = current.indexOf(driverId);
    let updated: string[];
    
    if (index === -1) {
      if (current.length < 5) {
        updated = [...current, driverId];
      } else {
        updated = current;
      }
    } else {
      updated = current.filter(id => id !== driverId);
    }
    
    handleChange('careerPriorities', updated);
  };

  const toggleDealBreaker = (item: string) => {
    const current = formData.dealBreakers;
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleChange('dealBreakers', updated);
  };

  const toggleNiceToHave = (item: string) => {
    const current = formData.niceToHaves;
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleChange('niceToHaves', updated);
  };

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Career Priorities */}
      <div>
        <PremiumLabel required description="Select up to 5 priorities, ranked by selection order">
          Career Priorities
        </PremiumLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          {careerDrivers.map((driver) => {
            const isSelected = formData.careerPriorities.includes(driver.id);
            const rank = isSelected ? formData.careerPriorities.indexOf(driver.id) + 1 : null;
            const isDisabled = !isSelected && formData.careerPriorities.length >= 5;
            
            return (
              <motion.button
                key={driver.id}
                onClick={() => togglePriority(driver.id)}
                disabled={isDisabled}
                whileHover={{ scale: isDisabled ? 1 : 1.01 }}
                whileTap={{ scale: isDisabled ? 1 : 0.99 }}
                className={`
                  relative p-3.5 rounded-xl text-left transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-100 dark:bg-[#4a494b] ring-1 ring-gray-900/10 dark:ring-white/20'
                    : 'bg-gray-50 dark:bg-[#3d3c3e] hover:bg-gray-100 dark:hover:bg-[#4a494b]'
                  }
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  <driver.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isSelected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-[15px] tracking-tight ${
                        isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {driver.label}
                      </span>
                      {rank && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full">
                          {rank}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{driver.description}</p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0"
                    >
                      <Check className="w-3 h-3 text-white dark:text-gray-900" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
        {formData.careerPriorities.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {formData.careerPriorities.length}/5 selected
          </p>
        )}
      </div>

      <SectionDivider />

      {/* Deal Breakers */}
      <div>
        <PremiumLabel description="What would make you reject an offer?">
          Deal Breakers
        </PremiumLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {dealBreakerOptions.map((option) => {
            const isSelected = formData.dealBreakers.includes(option);
            
            return (
              <motion.button
                key={option}
                onClick={() => toggleDealBreaker(option)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                  }
                `}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Nice to Haves */}
      <div>
        <PremiumLabel description="Would be great but not essential">
          Nice to Haves
        </PremiumLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {niceToHaveOptions.map((option) => {
            const isSelected = formData.niceToHaves.includes(option);
            
            return (
              <motion.button
                key={option}
                onClick={() => toggleNiceToHave(option)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                  }
                `}
              >
                {option}
              </motion.button>
            );
          })}
        </div>
      </div>
    </FieldGroup>
  );
};

export default CareerDriversSection;
