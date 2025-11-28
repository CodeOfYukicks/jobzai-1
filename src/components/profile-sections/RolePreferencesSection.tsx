import { useState, useEffect } from 'react';
import { User, Building2, Rocket, Briefcase, Users, Check, Target } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { PremiumLabel, SectionDivider, FieldGroup, SectionSkeleton } from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

const RolePreferencesSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    roleType: '',
    preferredEnvironment: [] as string[],
    productType: [] as string[],
    functionalDomain: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            roleType: userData.roleType || '',
            preferredEnvironment: userData.preferredEnvironment || [],
            productType: userData.productType || [],
            functionalDomain: userData.functionalDomain || []
          });
          onUpdate({
            roleType: userData.roleType || '',
            preferredEnvironment: userData.preferredEnvironment || [],
            productType: userData.productType || [],
            functionalDomain: userData.functionalDomain || []
          });
        }
      } catch (error) {
        console.error('Error loading role preferences:', error);
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

  const roleTypes = [
    { id: 'ic', label: 'Individual Contributor', icon: User, description: 'Hands-on work' },
    { id: 'manager', label: 'Manager', icon: Users, description: 'Lead a team' },
    { id: 'lead', label: 'Tech Lead', icon: Briefcase, description: 'Technical leadership' },
    { id: 'principal', label: 'Principal / Staff', icon: Rocket, description: 'Senior IC' },
    { id: 'executive', label: 'Executive', icon: Building2, description: 'Senior leadership' },
    { id: 'flexible', label: 'Flexible', icon: Target, description: 'Open to both' }
  ];

  const environments = [
    { id: 'startup', label: 'Startup', description: '1-50 employees' },
    { id: 'scale-up', label: 'Scale-up', description: '51-200 employees' },
    { id: 'mid-size', label: 'Mid-size', description: '201-1000 employees' },
    { id: 'enterprise', label: 'Enterprise', description: '1000+ employees' }
  ];

  const productTypes = [
    { id: 'b2b', label: 'B2B' },
    { id: 'b2c', label: 'B2C' },
    { id: 'b2b2c', label: 'B2B2C' },
    { id: 'internal', label: 'Internal Tools' }
  ];

  const functionalDomains = [
    'Product', 'Engineering', 'Design', 'Data', 'Sales',
    'Marketing', 'Operations', 'Finance', 'HR', 'Other'
  ];

  const toggleArrayItem = (field: 'preferredEnvironment' | 'productType' | 'functionalDomain', itemId: string) => {
    const current = formData[field];
    const updated = current.includes(itemId)
      ? current.filter(id => id !== itemId)
      : [...current, itemId];
    handleChange(field, updated);
  };

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Role Type */}
      <div>
        <PremiumLabel required>Preferred Role Type</PremiumLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mt-3">
          {roleTypes.map((role) => {
            const isSelected = formData.roleType === role.id;
            
            return (
              <motion.button
                key={role.id}
                onClick={() => handleChange('roleType', role.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  relative p-4 rounded-xl text-left transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-100 dark:bg-gray-700/60 ring-1 ring-gray-900/10 dark:ring-white/10'
                    : 'bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100/80 dark:hover:bg-gray-700/40'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <role.icon className={`w-5 h-5 flex-shrink-0 ${
                    isSelected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className={`block text-sm font-medium tracking-tight ${
                      isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {role.label}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {role.description}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white dark:text-gray-900" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <SectionDivider />

      {/* Preferred Environment */}
      <div>
        <PremiumLabel description="Select all company sizes you're interested in">
          Company Size
        </PremiumLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
          {environments.map((env) => {
            const isSelected = formData.preferredEnvironment.includes(env.id);
            
            return (
              <motion.button
                key={env.id}
                onClick={() => toggleArrayItem('preferredEnvironment', env.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  p-3 rounded-xl text-center transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span className="block text-sm font-medium">{env.label}</span>
                <span className={`block text-xs mt-0.5 ${
                  isSelected ? 'text-gray-300 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {env.description}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Product Type */}
      <div>
        <PremiumLabel description="What type of products interest you?">
          Product Type
        </PremiumLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {productTypes.map((type) => {
            const isSelected = formData.productType.includes(type.id);
            
            return (
              <motion.button
                key={type.id}
                onClick={() => toggleArrayItem('productType', type.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {type.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      <SectionDivider />

      {/* Functional Domain */}
      <div>
        <PremiumLabel description="Select all domains that match your expertise">
          Functional Domain
        </PremiumLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {functionalDomains.map((domain) => {
            const isSelected = formData.functionalDomain.includes(domain.toLowerCase());
            
            return (
              <motion.button
                key={domain}
                onClick={() => toggleArrayItem('functionalDomain', domain.toLowerCase())}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {domain}
              </motion.button>
            );
          })}
        </div>
      </div>
    </FieldGroup>
  );
};

export default RolePreferencesSection;
