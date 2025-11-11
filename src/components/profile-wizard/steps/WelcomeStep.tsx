import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, UserX, GraduationCap, TrendingUp, Check } from 'lucide-react';

interface WelcomeStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const situations = [
  {
    id: 'employed',
    label: 'Employed',
    description: 'I am currently working',
    icon: Briefcase,
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'unemployed',
    label: 'Unemployed',
    description: 'Between jobs',
    icon: UserX,
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
  },
  {
    id: 'student',
    label: 'Student',
    description: 'In training',
    icon: GraduationCap,
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  },
  {
    id: 'transitioning',
    label: 'In Transition',
    description: 'Career change',
    icon: TrendingUp,
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  }
];

const urgencies = [
  { id: 'very-urgent', label: 'Very Urgent', description: '1 month' },
  { id: 'urgent', label: 'Urgent', description: '3 months' },
  { id: 'moderate', label: 'Moderate', description: '6 months' },
  { id: 'exploring', label: 'Exploring', description: 'No pressure' }
];

const WelcomeStep = ({ data, onUpdate }: WelcomeStepProps) => {
  const [currentSituation, setCurrentSituation] = useState(data.currentSituation || '');
  const [searchUrgency, setSearchUrgency] = useState(data.searchUrgency || '');

  const handleSituationChange = (situation: string) => {
    setCurrentSituation(situation);
    onUpdate({ currentSituation: situation });
  };

  const handleUrgencyChange = (urgency: string) => {
    setSearchUrgency(urgency);
    onUpdate({ searchUrgency: urgency });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Current Situation */}
      <div>
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center"
        >
          What is your current situation?
        </motion.label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {situations.map((situation, index) => {
            const Icon = situation.icon;
            const isSelected = currentSituation === situation.id;
            
            return (
              <motion.button
                key={situation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                onClick={() => handleSituationChange(situation.id)}
                whileHover={{ scale: 1.02 }}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-200 overflow-hidden isolate
                  ${isSelected
                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 dark:border-purple-400 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    p-3 rounded-xl transition-all duration-200 overflow-hidden
                    ${isSelected
                      ? 'bg-purple-100 dark:bg-purple-900/40'
                      : 'bg-gray-100 dark:bg-gray-700'
                    }
                  `}>
                    <Icon className={`
                      w-6 h-6
                      ${isSelected
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-600 dark:text-gray-400'
                      }
                    `} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`
                      font-semibold mb-1
                      ${isSelected
                        ? 'text-purple-900 dark:text-purple-100'
                        : 'text-gray-900 dark:text-white'
                      }
                    `}>
                      {situation.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {situation.description}
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Search Urgency */}
      {currentSituation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="mt-8"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 text-center">
            What is the urgency of your job search?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {urgencies.map((urgency, index) => {
              const isSelected = searchUrgency === urgency.id;
              
              return (
                <motion.button
                  key={urgency.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  onClick={() => handleUrgencyChange(urgency.id)}
                  whileHover={{ scale: 1.02 }}
                    className={`
                    p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden isolate
                    ${isSelected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                    }
                  `}
                >
                  <div className="font-medium text-sm mb-1">{urgency.label}</div>
                  <div className={`
                    text-xs
                    ${isSelected
                      ? 'text-purple-100'
                      : 'text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {urgency.description}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WelcomeStep;

