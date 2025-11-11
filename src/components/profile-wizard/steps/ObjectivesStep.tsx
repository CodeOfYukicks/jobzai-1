import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, DollarSign } from 'lucide-react';
import MonthPicker from '../../ui/MonthPicker';

interface ObjectivesStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const contractTypes = [
  { id: 'permanent', label: 'Permanent' },
  { id: 'fixed-term', label: 'Fixed-term' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'internship', label: 'Internship' },
  { id: 'apprenticeship', label: 'Apprenticeship' }
];

const ObjectivesStep = ({ data, onUpdate }: ObjectivesStepProps) => {
  const [targetPosition, setTargetPosition] = useState(data.targetPosition || '');
  const [targetSectors, setTargetSectors] = useState(data.targetSectors || []);
  const [contractType, setContractType] = useState(data.contractType || '');
  const [salaryExpectations, setSalaryExpectations] = useState(data.salaryExpectations || {
    min: '',
    max: '',
    currency: 'EUR'
  });
  const [availabilityDate, setAvailabilityDate] = useState(data.availabilityDate || '');
  const [newSector, setNewSector] = useState('');

  const handleUpdate = (updates: any) => {
    onUpdate(updates);
  };

  const addSector = () => {
    if (newSector.trim() && !targetSectors.includes(newSector.trim())) {
      const updated = [...targetSectors, newSector.trim()];
      setTargetSectors(updated);
      handleUpdate({ targetSectors: updated });
      setNewSector('');
    }
  };

  const removeSector = (sector: string) => {
    const updated = targetSectors.filter((s: string) => s !== sector);
    setTargetSectors(updated);
    handleUpdate({ targetSectors: updated });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Section 1: What you're looking for */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
            What are you looking for?
          </h3>
          
          {/* Target Position */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Target Position *
            </label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={targetPosition}
                onChange={(e) => {
                  setTargetPosition(e.target.value);
                  handleUpdate({ targetPosition: e.target.value });
                }}
                placeholder="e.g., Senior Product Manager"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
              />
            </div>
          </div>

          {/* Sectors of Interest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Sectors of Interest
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSector()}
                placeholder="e.g., FinTech, Healthcare..."
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all text-sm"
              />
              <motion.button
                onClick={addSector}
                whileHover={{ scale: 1.02 }}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm"
              >
                Add
              </motion.button>
            </div>
            {targetSectors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {targetSectors.map((sector: string, index: number) => (
                  <motion.span
                    key={sector}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium"
                  >
                    {sector}
                    <button
                      onClick={() => removeSector(sector)}
                      className="hover:text-purple-900 dark:hover:text-purple-100 transition-colors text-base leading-none"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Section 2: Work Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
          Work Conditions
        </h3>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Preferred Contract Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {contractTypes.map((type) => {
              const isSelected = contractType === type.id;
              return (
                <motion.button
                  key={type.id}
                  onClick={() => {
                    setContractType(type.id);
                    handleUpdate({ contractType: type.id });
                  }}
                  whileHover={{ scale: 1.02 }}
                  className={`
                    p-3 rounded-xl border-2 transition-all duration-200 font-medium text-sm text-center
                    ${isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                    }
                  `}
                >
                  {type.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Availability Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Availability Date
          </label>
          <MonthPicker
            value={availabilityDate}
            onChange={(value) => {
              setAvailabilityDate(value);
              handleUpdate({ availabilityDate: value });
            }}
            placeholder="Select availability month"
          />
        </div>
      </motion.div>

      {/* Section 3: Compensation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="border-t border-gray-200 dark:border-gray-700 pt-6"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
          Compensation
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Expected Salary Range
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Minimum
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={salaryExpectations.min}
                  onChange={(e) => {
                    const updated = { ...salaryExpectations, min: e.target.value };
                    setSalaryExpectations(updated);
                    handleUpdate({ salaryExpectations: updated });
                  }}
                  placeholder="e.g., 50000"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Maximum
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={salaryExpectations.max}
                  onChange={(e) => {
                    const updated = { ...salaryExpectations, max: e.target.value };
                    setSalaryExpectations(updated);
                    handleUpdate({ salaryExpectations: updated });
                  }}
                  placeholder="e.g., 80000"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                Currency
              </label>
              <select
                value={salaryExpectations.currency}
                onChange={(e) => {
                  const updated = { ...salaryExpectations, currency: e.target.value };
                  setSalaryExpectations(updated);
                  handleUpdate({ salaryExpectations: updated });
                }}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all text-sm"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ObjectivesStep;

