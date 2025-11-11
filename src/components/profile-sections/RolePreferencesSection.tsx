import { useState, useEffect } from 'react';
import { User, Building2, Rocket, Briefcase, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

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
    { id: 'ic', label: 'Individual Contributor (IC)', icon: User, description: 'Focus on hands-on work, no management responsibilities' },
    { id: 'manager', label: 'Manager', icon: Users, description: 'Lead and manage a team' },
    { id: 'lead', label: 'Lead / Tech Lead', icon: Briefcase, description: 'Technical leadership without direct reports' },
    { id: 'principal', label: 'Principal / Staff', icon: Rocket, description: 'Senior IC with high impact' },
    { id: 'executive', label: 'Executive / Director+', icon: Building2, description: 'Senior leadership role' },
    { id: 'flexible', label: 'Flexible', icon: Briefcase, description: 'Open to both IC and management roles' }
  ];

  const environments = [
    { id: 'startup', label: 'Startup (1-50 employees)', description: 'Fast-paced, high risk/reward' },
    { id: 'scale-up', label: 'Scale-up (51-200 employees)', description: 'Growing company, building processes' },
    { id: 'mid-size', label: 'Mid-size (201-1000 employees)', description: 'Established but still agile' },
    { id: 'enterprise', label: 'Enterprise (1000+ employees)', description: 'Large, structured organization' },
    { id: 'all', label: 'All Sizes', description: 'Open to any company size' }
  ];

  const productTypes = [
    { id: 'b2b', label: 'B2B', description: 'Business-to-business products' },
    { id: 'b2c', label: 'B2C', description: 'Business-to-consumer products' },
    { id: 'b2b2c', label: 'B2B2C', description: 'Business-to-business-to-consumer' },
    { id: 'internal', label: 'Internal Tools', description: 'Tools for internal use' },
    { id: 'all', label: 'All Types', description: 'Open to any product type' }
  ];

  const functionalDomains = [
    { id: 'product', label: 'Product', description: 'Product management and strategy' },
    { id: 'engineering', label: 'Engineering', description: 'Software development and tech' },
    { id: 'design', label: 'Design', description: 'UX/UI and product design' },
    { id: 'data', label: 'Data & Analytics', description: 'Data science and analytics' },
    { id: 'sales', label: 'Sales', description: 'Sales and business development' },
    { id: 'marketing', label: 'Marketing', description: 'Marketing and growth' },
    { id: 'operations', label: 'Operations', description: 'Operations and business ops' },
    { id: 'finance', label: 'Finance', description: 'Finance and accounting' },
    { id: 'hr', label: 'HR / People', description: 'Human resources and people ops' },
    { id: 'other', label: 'Other', description: 'Other functional areas' }
  ];

  const toggleArrayItem = (field: 'preferredEnvironment' | 'productType' | 'functionalDomain', itemId: string) => {
    const current = formData[field];
    const updated = current.includes(itemId)
      ? current.filter(id => id !== itemId)
      : [...current, itemId];
    handleChange(field, updated);
  };

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="role-preferences" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="space-y-6">
        {/* Role Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Preferred Role Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleTypes.map((role) => (
              <button
                key={role.id}
                onClick={() => handleChange('roleType', role.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.roleType === role.id
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <role.icon className={`w-5 h-5 mt-0.5 ${formData.roleType === role.id ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium">{role.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{role.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Environment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Preferred Company Environment (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => toggleArrayItem('preferredEnvironment', env.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.preferredEnvironment.includes(env.id)
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{env.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{env.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Preferred Product Type (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleArrayItem('productType', type.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.productType.includes(type.id)
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Functional Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
            Functional Domain (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {functionalDomains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => toggleArrayItem('functionalDomain', domain.id)}
                className={`
                  p-3 rounded-lg border-2 transition-all duration-200 text-left
                  ${formData.functionalDomain.includes(domain.id)
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-200 dark:hover:border-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                <div className="font-medium">{domain.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{domain.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RolePreferencesSection;

