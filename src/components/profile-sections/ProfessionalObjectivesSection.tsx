import { useState, useEffect } from 'react';
import { Target, Calendar } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const ProfessionalObjectivesSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    targetPosition: '',
    targetSectors: [] as string[],
    contractType: '',
    salaryRange: {
      min: '',
      max: '',
      currency: 'EUR'
    },
    availabilityDate: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newFormData = {
            targetPosition: userData.targetPosition || '',
            targetSectors: userData.targetSectors || [],
            contractType: userData.contractType || '',
            salaryRange: userData.salaryRange || {
              min: '',
              max: '',
              currency: 'EUR'
            },
            availabilityDate: userData.availabilityDate || ''
          };
          setFormData(newFormData);
          onUpdate(newFormData);
        }
      } catch (error) {
        console.error('Error loading objectives data:', error);
      }
    };

    loadData();
  }, [currentUser]);

  const contractTypes = [
    { id: 'permanent', label: 'CDI' },
    { id: 'fixed-term', label: 'CDD' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'internship', label: 'Stage' },
    { id: 'apprenticeship', label: 'Alternance' }
  ];

  const currencies = ['EUR', 'USD', 'GBP'];

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  return (
    <section id="objectives" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Professional Objectives</h2>
      </div>

      <div className="space-y-6">
        {/* Target Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Target Position
          </label>
          <input
            type="text"
            value={formData.targetPosition}
            onChange={(e) => handleChange('targetPosition', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            placeholder="e.g., Senior Product Manager"
          />
        </div>

        {/* Target Sectors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Target Sectors
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Add a sector and press Enter"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  e.preventDefault();
                  handleChange('targetSectors', [...formData.targetSectors, e.currentTarget.value.trim()]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.targetSectors.map((sector, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full flex items-center gap-2"
              >
                {sector}
                <button
                  onClick={() => handleChange('targetSectors', formData.targetSectors.filter((_, i) => i !== index))}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Contract Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {contractTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleChange('contractType', type.id)}
                className={`
                  p-2 rounded-lg border-2 transition-all duration-200 text-sm
                  ${formData.contractType === type.id
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-200'
                  }
                `}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Expected Salary Range
          </label>
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="number"
                value={formData.salaryRange.min}
                onChange={(e) => handleChange('salaryRange', { ...formData.salaryRange, min: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Min"
              />
            </div>
            <div className="flex-1">
              <input
                type="number"
                value={formData.salaryRange.max}
                onChange={(e) => handleChange('salaryRange', { ...formData.salaryRange, max: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Max"
              />
            </div>
            <div className="flex-1">
              <select
                value={formData.salaryRange.currency}
                onChange={(e) => handleChange('salaryRange', { ...formData.salaryRange, currency: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Availability Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Availability Date
          </label>
          <input
            type="date"
            value={formData.availabilityDate}
            onChange={(e) => handleChange('availabilityDate', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>
      </div>
    </section>
  );
};

export default ProfessionalObjectivesSection; 