import { useState, useEffect } from 'react';
import { Target, Calendar, DollarSign, Briefcase, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PremiumInput, 
  PremiumLabel,
  PremiumSelectNative,
  PremiumTagInput,
  SectionDivider,
  FieldGroup,
  SectionSkeleton
} from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const ProfessionalObjectivesSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    targetPosition: '',
    targetSectors: [] as string[],
    contractType: '',
    salaryExpectations: {
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
          const salaryData = userData.salaryExpectations || userData.salaryRange || {
            min: '',
            max: '',
            currency: 'EUR'
          };
          const newFormData = {
            targetPosition: userData.targetPosition || '',
            targetSectors: userData.targetSectors || [],
            contractType: userData.contractType || '',
            salaryExpectations: salaryData,
            availabilityDate: userData.availabilityDate || ''
          };
          setFormData(newFormData);
          onUpdate(newFormData);
        }
      } catch (error) {
        console.error('Error loading objectives data:', error);
      } finally {
        setIsLoading(false);
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

  const currencies = [
    { value: 'EUR', label: '€ EUR' },
    { value: 'USD', label: '$ USD' },
    { value: 'GBP', label: '£ GBP' }
  ];

  const handleChange = (field: string, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    onUpdate(newFormData);
  };

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Target Position */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Target Position</PremiumLabel>
        </div>
        <PremiumInput
          value={formData.targetPosition}
          onChange={(e) => handleChange('targetPosition', e.target.value)}
          placeholder="e.g., Senior Product Manager"
        />
      </div>

      {/* Target Sectors */}
      <div>
        <PremiumLabel description="Industries you're interested in">
          Target Sectors
        </PremiumLabel>
        <PremiumTagInput
          tags={formData.targetSectors}
          onChange={(tags) => handleChange('targetSectors', tags)}
          placeholder="Add sectors (e.g., FinTech, Healthcare)"
          suggestions={[
            'FinTech', 'Healthcare', 'E-commerce', 'SaaS', 'EdTech',
            'AI/ML', 'Cybersecurity', 'Gaming', 'Logistics', 'Media'
          ]}
        />
      </div>

      <SectionDivider />

      {/* Contract Type */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Contract Type</PremiumLabel>
        </div>
        <div className="flex flex-wrap gap-2">
          {contractTypes.map((type) => {
            const isSelected = formData.contractType === type.id;
            
            return (
              <motion.button
                key={type.id}
                onClick={() => handleChange('contractType', type.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-[#3d3c3e] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4a494b]'
                  }
                `}
              >
                {type.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Salary Expectations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Expected Salary Range (Annual)</PremiumLabel>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <input
              type="number"
              value={formData.salaryExpectations.min}
              onChange={(e) => handleChange('salaryExpectations', { 
                ...formData.salaryExpectations, 
                min: e.target.value 
              })}
              placeholder="Min"
              className="w-full px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
            />
          </div>
          <div>
            <input
              type="number"
              value={formData.salaryExpectations.max}
              onChange={(e) => handleChange('salaryExpectations', { 
                ...formData.salaryExpectations, 
                max: e.target.value 
              })}
              placeholder="Max"
              className="w-full px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
            />
          </div>
          <div>
            <select
              value={formData.salaryExpectations.currency}
              onChange={(e) => handleChange('salaryExpectations', { 
                ...formData.salaryExpectations, 
                currency: e.target.value 
              })}
              className="w-full px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-10"
            >
              {currencies.map((curr) => (
                <option key={curr.value} value={curr.value}>{curr.label}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Your expectations are confidential and help match you with suitable opportunities
        </p>
      </div>

      <SectionDivider />

      {/* Availability Date */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <PremiumLabel className="mb-0">Availability Date</PremiumLabel>
        </div>
        <input
          type="date"
          value={formData.availabilityDate}
          onChange={(e) => handleChange('availabilityDate', e.target.value)}
          className="w-full md:w-auto px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          When can you start a new position?
        </p>
      </div>
    </FieldGroup>
  );
};

export default ProfessionalObjectivesSection;
