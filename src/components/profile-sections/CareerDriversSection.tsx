import { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Heart, BookOpen, Zap, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

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
    { id: 'growth', label: 'Career Growth', icon: TrendingUp, description: 'Opportunities for advancement and skill development' },
    { id: 'money', label: 'Compensation', icon: DollarSign, description: 'Salary, equity, and financial rewards' },
    { id: 'impact', label: 'Impact', icon: Target, description: 'Making a meaningful difference' },
    { id: 'work-life', label: 'Work-Life Balance', icon: Heart, description: 'Flexible hours and time for personal life' },
    { id: 'learning', label: 'Learning & Development', icon: BookOpen, description: 'Continuous learning and skill building' },
    { id: 'autonomy', label: 'Autonomy', icon: Zap, description: 'Independence and decision-making freedom' },
    { id: 'leadership', label: 'Leadership Opportunities', icon: Users, description: 'Managing teams and leading projects' }
  ];

  const dealBreakerOptions = [
    'No remote work options',
    'Poor work-life balance',
    'Toxic company culture',
    'Low compensation',
    'No growth opportunities',
    'Excessive travel required',
    'Unstable company',
    'No learning opportunities',
    'Micromanagement',
    'Lack of diversity'
  ];

  const niceToHaveOptions = [
    'Equity/Stock options',
    'Flexible hours',
    'Learning budget',
    'Gym membership',
    'Health insurance',
    'Remote work flexibility',
    'Conference attendance',
    'Mentorship programs',
    'Company events',
    'Professional development'
  ];

  const togglePriority = (driverId: string) => {
    const current = formData.careerPriorities;
    const index = current.indexOf(driverId);
    let updated: string[];
    
    if (index === -1) {
      // Add to priorities (max 5)
      if (current.length < 5) {
        updated = [...current, driverId];
      } else {
        updated = current; // Don't add if already 5
      }
    } else {
      // Remove from priorities
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
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="career-drivers" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="space-y-6">
        {/* Career Priorities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Career Priorities (Select up to 5, ranked by importance) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {careerDrivers.map((driver) => {
              const isSelected = formData.careerPriorities.includes(driver.id);
              const rank = isSelected ? formData.careerPriorities.indexOf(driver.id) + 1 : null;
              const isDisabled = !isSelected && formData.careerPriorities.length >= 5;
              
              return (
                <button
                  key={driver.id}
                  onClick={() => togglePriority(driver.id)}
                  disabled={isDisabled}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <driver.icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{driver.label}</span>
                        {rank && (
                          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                            #{rank}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{driver.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {formData.careerPriorities.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Selected: {formData.careerPriorities.length}/5 priorities
            </p>
          )}
        </div>

        {/* Primary Motivator */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Primary Motivator (What drives you most?)
          </label>
          <select
            value={formData.primaryMotivator}
            onChange={(e) => handleChange('primaryMotivator', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">Select your primary motivator</option>
            {careerDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>{driver.label}</option>
            ))}
          </select>
        </div>

        {/* Deal Breakers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Deal Breakers (What would make you reject an offer?)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dealBreakerOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleDealBreaker(option)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm
                  ${formData.dealBreakers.includes(option)
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Nice to Haves */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Nice to Haves (Would be great but not essential)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {niceToHaveOptions.map((option) => (
              <button
                key={option}
                onClick={() => toggleNiceToHave(option)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm
                  ${formData.niceToHaves.includes(option)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-200 dark:hover:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareerDriversSection;

