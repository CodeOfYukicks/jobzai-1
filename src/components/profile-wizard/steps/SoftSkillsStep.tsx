import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, X } from 'lucide-react';

interface SoftSkillsStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const softSkillsOptions = [
  'Leadership', 'Communication', 'Problem Solving', 'Collaboration',
  'Adaptability', 'Empathy', 'Time Management', 'Conflict Resolution',
  'Negotiation', 'Public Speaking'
];

const SoftSkillsStep = ({ data, onUpdate }: SoftSkillsStepProps) => {
  const [softSkills, setSoftSkills] = useState(data.softSkills || []);
  const [managementExperience, setManagementExperience] = useState(data.managementExperience || {
    hasExperience: false,
    teamSize: '',
    teamType: ''
  });

  const toggleSkill = (skill: string) => {
    const updated = softSkills.includes(skill)
      ? softSkills.filter((s: string) => s !== skill)
      : [...softSkills, skill];
    setSoftSkills(updated);
    onUpdate({ softSkills: updated });
  };

  const handleManagementChange = (field: string, value: any) => {
    const updated = { ...managementExperience, [field]: value };
    setManagementExperience(updated);
    onUpdate({ managementExperience: updated });
  };

  return (
    <div className="space-y-8">
      {/* Soft Skills */}
      <div>
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Soft Skills (sélection multiple)
        </motion.label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {softSkillsOptions.map((skill, index) => {
            const isSelected = softSkills.includes(skill);
            return (
              <motion.button
                key={skill}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                onClick={() => toggleSkill(skill)}
                whileHover={{ scale: 1.02 }}
                className={`
                  p-3 rounded-2xl border-2 transition-all duration-200 text-sm font-medium 
                  min-h-[56px] flex items-center justify-center text-center
                  ${isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <span className="break-words">{skill}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Expérience managériale */}
      <div className="mt-8 max-w-md mx-auto">
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Management Experience
        </motion.label>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasManagement"
              checked={managementExperience.hasExperience}
              onChange={(e) => handleManagementChange('hasExperience', e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="hasManagement" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              I have management experience
            </label>
          </div>

          {managementExperience.hasExperience && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Team Size
                </label>
                <input
                  type="text"
                  value={managementExperience.teamSize}
                  onChange={(e) => handleManagementChange('teamSize', e.target.value)}
                  placeholder="e.g., 5-10 people"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Team Type
                </label>
                <input
                  type="text"
                  value={managementExperience.teamType}
                  onChange={(e) => handleManagementChange('teamType', e.target.value)}
                  placeholder="e.g., Technical, Product..."
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoftSkillsStep;

