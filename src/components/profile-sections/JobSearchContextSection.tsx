import { useState, useEffect } from 'react';
import { Search, Clock, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const JobSearchContextSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    currentSituation: '',
    searchUrgency: '',
    searchReason: '',
    searchIntensity: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            currentSituation: userData.currentSituation || '',
            searchUrgency: userData.searchUrgency || '',
            searchReason: userData.searchReason || '',
            searchIntensity: userData.searchIntensity || ''
          });
          onUpdate({
            currentSituation: userData.currentSituation || '',
            searchUrgency: userData.searchUrgency || '',
            searchReason: userData.searchReason || '',
            searchIntensity: userData.searchIntensity || ''
          });
        }
      } catch (error) {
        console.error('Error loading job search context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  const situations = [
    { id: 'employed', label: 'Employed (with notice period)', icon: '💼' },
    { id: 'unemployed', label: 'Unemployed / Between jobs', icon: '🔍' },
    { id: 'freelance', label: 'Freelance / Consultant', icon: '💻' },
    { id: 'student', label: 'Student / Recent graduate', icon: '🎓' },
    { id: 'transitioning', label: 'Career transitioning', icon: '🔄' }
  ];

  const urgencyLevels = [
    { id: 'very-urgent', label: 'Very Urgent (1 month)', description: 'Need a job within 1 month', icon: '🚨' },
    { id: 'urgent', label: 'Urgent (3 months)', description: 'Need a job within 3 months', icon: '⏰' },
    { id: 'moderate', label: 'Moderate (6 months)', description: 'Looking for opportunities in next 6 months', icon: '📅' },
    { id: 'exploring', label: 'Exploring', description: 'Not urgent, just exploring options', icon: '🔎' }
  ];

  const reasons = [
    { id: 'career-growth', label: 'Career Growth', description: 'Looking for advancement opportunities' },
    { id: 'company-change', label: 'Company Change', description: 'Want to work for a different company' },
    { id: 'relocation', label: 'Relocation', description: 'Moving to a new location' },
    { id: 'contract-end', label: 'Contract Ending', description: 'Current contract is ending' },
    { id: 'better-fit', label: 'Better Fit', description: 'Looking for better culture/values fit' },
    { id: 'salary', label: 'Salary Increase', description: 'Seeking better compensation' },
    { id: 'other', label: 'Other', description: 'Other reasons' }
  ];

  const intensities = [
    { id: 'very-active', label: 'Very Active', description: 'Applying daily, multiple applications per week' },
    { id: 'active', label: 'Active', description: 'Applying regularly, 2-5 applications per week' },
    { id: 'moderate', label: 'Moderate', description: 'Applying occasionally, 1-2 applications per week' },
    { id: 'passive', label: 'Passive', description: 'Open to opportunities but not actively applying' }
  ];

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="job-search-context" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Job Search Context
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
          Helps us personalize recommendations
        </span>
      </div>

      <div className="space-y-6">
        {/* Current Situation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Current Situation <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {situations.map((situation) => (
              <button
                key={situation.id}
                onClick={() => handleChange('currentSituation', situation.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.currentSituation === situation.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{situation.icon}</span>
                  <span className="font-medium">{situation.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Search Urgency <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgencyLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => handleChange('searchUrgency', level.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.searchUrgency === level.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">{level.icon}</span>
                  <div>
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Main Reason for Job Search
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleChange('searchReason', reason.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.searchReason === reason.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{reason.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reason.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Intensity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Search Intensity
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {intensities.map((intensity) => (
              <button
                key={intensity.id}
                onClick={() => handleChange('searchIntensity', intensity.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.searchIntensity === intensity.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{intensity.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{intensity.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Why we ask:</strong> This information helps us prioritize opportunities, adjust recommendation timing, and personalize your job search strategy.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobSearchContextSection;


