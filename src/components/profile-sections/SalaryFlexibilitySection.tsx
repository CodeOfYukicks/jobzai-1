import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Heart, Zap } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const SalaryFlexibilitySection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    salaryFlexibility: '',
    compensationPriorities: [] as string[],
    willingToTrade: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            salaryFlexibility: userData.salaryFlexibility || '',
            compensationPriorities: userData.compensationPriorities || [],
            willingToTrade: userData.willingToTrade || []
          });
          onUpdate({
            salaryFlexibility: userData.salaryFlexibility || '',
            compensationPriorities: userData.compensationPriorities || [],
            willingToTrade: userData.willingToTrade || []
          });
        }
      } catch (error) {
        console.error('Error loading salary flexibility:', error);
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

  const flexibilityLevels = [
    { id: 'very-flexible', label: 'Very Flexible', description: 'Open to significant salary variations for the right opportunity', icon: Zap },
    { id: 'flexible', label: 'Flexible', description: 'Willing to negotiate within a reasonable range', icon: TrendingUp },
    { id: 'moderate', label: 'Moderate', description: 'Some flexibility but salary is important', icon: DollarSign },
    { id: 'strict', label: 'Strict', description: 'Salary is non-negotiable, must meet expectations', icon: Heart }
  ];

  const compensationOptions = [
    { id: 'base-salary', label: 'Base Salary', description: 'Fixed annual/monthly salary' },
    { id: 'equity', label: 'Equity / Stock Options', description: 'Company shares or stock options' },
    { id: 'bonus', label: 'Performance Bonus', description: 'Variable bonus based on performance' },
    { id: 'benefits', label: 'Benefits Package', description: 'Health insurance, retirement, etc.' },
    { id: 'learning', label: 'Learning Budget', description: 'Budget for courses, conferences, etc.' },
    { id: 'remote', label: 'Remote Work', description: 'Flexibility to work remotely' }
  ];

  const tradeOptions = [
    { id: 'equity-for-salary', label: 'Equity for Lower Salary', description: 'Accept lower base for equity' },
    { id: 'remote-for-salary', label: 'Remote for Lower Salary', description: 'Accept lower salary for remote work' },
    { id: 'growth-for-salary', label: 'Growth for Lower Salary', description: 'Accept lower salary for growth opportunities' },
    { id: 'learning-for-salary', label: 'Learning for Lower Salary', description: 'Accept lower salary for learning opportunities' },
    { id: 'impact-for-salary', label: 'Impact for Lower Salary', description: 'Accept lower salary for meaningful impact' },
    { id: 'work-life-for-salary', label: 'Work-Life Balance for Lower Salary', description: 'Accept lower salary for better balance' }
  ];

  const toggleArrayItem = (field: 'compensationPriorities' | 'willingToTrade', itemId: string) => {
    const current = formData[field];
    const updated = current.includes(itemId)
      ? current.filter(id => id !== itemId)
      : [...current, itemId];
    handleChange(field, updated);
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
    <section id="salary-flexibility" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Salary Flexibility & Compensation
        </h2>
      </div>

      <div className="space-y-6">
        {/* Salary Flexibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Salary Flexibility
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flexibilityLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleChange('salaryFlexibility', level.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.salaryFlexibility === level.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <level.icon className={`w-5 h-5 mt-0.5 ${formData.salaryFlexibility === level.id ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Compensation Priorities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Compensation Priorities (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {compensationOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleArrayItem('compensationPriorities', option.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.compensationPriorities.includes(option.id)
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Willing to Trade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Would You Trade Salary For...? (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tradeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleArrayItem('willingToTrade', option.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.willingToTrade.includes(option.id)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-200 dark:hover:border-green-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalaryFlexibilitySection;



