import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Code } from 'lucide-react';

interface RolePreferencesStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const roleTypes = [
  { id: 'ic', label: 'IC', description: 'Individual Contributor', icon: Code },
  { id: 'manager', label: 'Manager', description: 'Management', icon: Users },
  { id: 'lead', label: 'Lead', description: 'Tech Lead', icon: Code },
  { id: 'flexible', label: 'Flexible', description: 'IC or Management', icon: Building2 }
];

const environments = [
  { id: 'startup', label: 'Startup', description: '1-50 employees' },
  { id: 'scale-up', label: 'Scale-up', description: '51-200 employees' },
  { id: 'mid-size', label: 'Mid-size', description: '201-1000 employees' },
  { id: 'enterprise', label: 'Enterprise', description: '1000+ employees' },
  { id: 'all', label: 'All', description: 'All sizes' }
];

const RolePreferencesStep = ({ data, onUpdate }: RolePreferencesStepProps) => {
  const [roleType, setRoleType] = useState(data.roleType || '');
  const [preferredEnvironment, setPreferredEnvironment] = useState(data.preferredEnvironment || []);

  const handleRoleTypeChange = (type: string) => {
    setRoleType(type);
    onUpdate({ roleType: type });
  };

  const toggleEnvironment = (envId: string) => {
    const updated = preferredEnvironment.includes(envId)
      ? preferredEnvironment.filter((e: string) => e !== envId)
      : [...preferredEnvironment, envId];
    setPreferredEnvironment(updated);
    onUpdate({ preferredEnvironment: updated });
  };

  return (
    <div className="space-y-6">
      {/* Type de rôle */}
      <div>
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Preferred Role Type
        </motion.label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {roleTypes.map((role, index) => {
            const Icon = role.icon;
            const isSelected = roleType === role.id;
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                onClick={() => handleRoleTypeChange(role.id)}
                whileHover={{ scale: 1.02 }}
                className={`
                  p-6 rounded-2xl border-2 transition-all duration-200 overflow-hidden isolate
                  ${isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <Icon className="w-8 h-8 mx-auto mb-3" />
                <div className="font-bold text-lg mb-1">{role.label}</div>
                <div className={`
                  text-xs
                  ${isSelected ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {role.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Environnement préféré */}
      <div className="mt-8">
        <motion.label
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4"
        >
          Preferred Company Environment (multiple selection)
        </motion.label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {environments.map((env, index) => {
            const isSelected = preferredEnvironment.includes(env.id);
            return (
              <motion.button
                key={env.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                onClick={() => toggleEnvironment(env.id)}
                whileHover={{ scale: 1.02 }}
                className={`
                  p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden isolate
                  ${isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }
                `}
              >
                <div className="font-semibold text-sm mb-1">{env.label}</div>
                <div className={`
                  text-xs
                  ${isSelected ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {env.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RolePreferencesStep;

