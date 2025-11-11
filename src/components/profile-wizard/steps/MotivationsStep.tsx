import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Heart, X } from 'lucide-react';

interface MotivationsStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const priorities = [
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'money', label: 'Salary', icon: Heart },
  { id: 'impact', label: 'Impact', icon: Heart },
  { id: 'work-life', label: 'Work-Life Balance', icon: Heart },
  { id: 'learning', label: 'Learning', icon: Heart },
  { id: 'autonomy', label: 'Autonomy', icon: Heart },
  { id: 'leadership', label: 'Leadership', icon: Heart }
];

const MotivationsStep = ({ data, onUpdate }: MotivationsStepProps) => {
  const [careerPriorities, setCareerPriorities] = useState(data.careerPriorities || []);
  const [primaryMotivator, setPrimaryMotivator] = useState(data.primaryMotivator || '');

  const togglePriority = (priorityId: string) => {
    const updated = careerPriorities.includes(priorityId)
      ? careerPriorities.filter((p: string) => p !== priorityId)
      : [...careerPriorities, priorityId];
    setCareerPriorities(updated);
    onUpdate({ careerPriorities: updated });
  };

  const setMotivator = (motivatorId: string) => {
    setPrimaryMotivator(motivatorId);
    onUpdate({ primaryMotivator: motivatorId });
  };

  return (
    <div className="space-y-8">
      {/* Career Priorities */}
      <div>
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Your career priorities (multiple selection)
        </motion.label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {priorities.map((priority, index) => {
            const Icon = priority.icon;
            const isSelected = careerPriorities.includes(priority.id);
            return (
              <motion.button
                key={priority.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                onClick={() => togglePriority(priority.id)}
                whileHover={{ scale: 1.02 }}
                    className={`
                  p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden isolate
                  ${isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium text-sm">{priority.label}</div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Motivateur principal */}
      {careerPriorities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            What is your primary motivation?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {careerPriorities.map((priorityId: string, index: number) => {
              const priority = priorities.find(p => p.id === priorityId);
              if (!priority) return null;
              const Icon = priority.icon;
              const isSelected = primaryMotivator === priorityId;
              return (
                <motion.button
                  key={priorityId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  onClick={() => setMotivator(priorityId)}
                  whileHover={{ scale: 1.02 }}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                    }
                  `}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium text-sm">{priority.label}</div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2 text-xs"
                    >
                      ⭐ Primary
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MotivationsStep;

