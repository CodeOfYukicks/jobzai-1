import { useState, useEffect } from 'react';
import { Settings, Star } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const PreferencesPrioritiesSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    workLifeBalance: 0,
    companyCulture: '',
    careerGrowth: '',
    sectorsToAvoid: [] as string[],
    desiredCulture: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newFormData = {
            workLifeBalance: userData.workLifeBalance || 0,
            companyCulture: userData.companyCulture || '',
            careerGrowth: userData.careerGrowth || '',
            sectorsToAvoid: userData.sectorsToAvoid || [],
            desiredCulture: userData.desiredCulture || []
          };
          setFormData(newFormData);
          onUpdate(newFormData);
        }
      } catch (error) {
        console.error('Error loading preferences data:', error);
      }
    };

    loadData();
  }, [currentUser]);

  const cultureValues = [
    'Innovation', 'Work-Life Balance', 'Diversity', 'Sustainability',
    'Learning & Development', 'Remote-First', 'Data-Driven', 'Customer-Centric',
    'Collaborative', 'Autonomous', 'Results-Oriented', 'Social Impact'
  ];

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  return (
    <section id="preferences" className="bg-white dark:bg-[#2b2a2c] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preferences & Priorities</h2>
      </div>

      <div className="space-y-6">
        {/* Work-Life Balance Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Work-Life Balance Priority (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleChange('workLifeBalance', value)}
                className={`
                  flex-1 py-2 rounded-lg border-2 transition-all duration-200
                  ${formData.workLifeBalance === value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-[#4a494b] hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-[#3d3c3e]'
                  }
                `}
              >
                <Star className={`w-5 h-5 mx-auto ${formData.workLifeBalance >= value ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Company Culture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Company Culture Importance
          </label>
          <textarea
            value={formData.companyCulture}
            onChange={(e) => handleChange('companyCulture', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            rows={3}
            placeholder="Describe your ideal company culture..."
          />
        </div>

        {/* Career Growth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Career Growth Expectations
          </label>
          <textarea
            value={formData.careerGrowth}
            onChange={(e) => handleChange('careerGrowth', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            rows={3}
            placeholder="Describe your career growth expectations..."
          />
        </div>

        {/* Sectors to Avoid */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Sectors to Avoid (Industries you don't want to work in)
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Different from Target Sectors - these are excluded)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Add a sector to avoid and press Enter"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-[#4a494b] bg-white dark:bg-[#3d3c3e] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  handleChange('sectorsToAvoid', [...formData.sectorsToAvoid, e.currentTarget.value.trim()]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.sectorsToAvoid.map((sector, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-50 text-red-700 rounded-full flex items-center gap-2"
              >
                {sector}
                <button
                  onClick={() => handleChange('sectorsToAvoid', formData.sectorsToAvoid.filter((_, i) => i !== index))}
                  className="hover:text-red-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Desired Culture Values */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Desired Culture Values
          </label>
          <div className="flex flex-wrap gap-2">
            {cultureValues.map((value) => (
              <button
                key={value}
                onClick={() => {
                  handleChange('desiredCulture', formData.desiredCulture.includes(value)
                    ? formData.desiredCulture.filter(v => v !== value)
                    : [...formData.desiredCulture, value]);
                }}
                className={`
                  px-4 py-2 rounded-full transition-all duration-200
                  ${formData.desiredCulture.includes(value)
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreferencesPrioritiesSection; 