import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface NameStepProps {
  firstName?: string;
  lastName?: string;
  onNext: (data: { firstName: string; lastName: string }) => void;
}

export default function NameStep({ firstName: initialFirstName, lastName: initialLastName, onNext }: NameStepProps) {
  const { currentUser, userData } = useAuth();
  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [lastName, setLastName] = useState(initialLastName || '');
  const [errors, setErrors] = useState({ firstName: '', lastName: '' });

  // Pré-remplir depuis userData ou displayName si disponible
  useEffect(() => {
    if (!firstName && !lastName) {
      // Essayer depuis userData
      if (userData?.firstName) {
        setFirstName(userData.firstName);
      }
      if (userData?.lastName) {
        setLastName(userData.lastName);
      }
      
      // Si toujours vide, essayer depuis displayName
      if (!firstName && !lastName && currentUser?.displayName) {
        const nameParts = currentUser.displayName.split(' ').filter(part => part.trim() !== '');
        if (nameParts.length > 0) {
          setFirstName(nameParts[0] || '');
          if (nameParts.length > 1) {
            setLastName(nameParts.slice(1).join(' ') || '');
          }
        }
      }
    }
  }, [currentUser, userData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors = { firstName: '', lastName: '' };
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      onNext({ firstName: firstName.trim(), lastName: lastName.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">What's your name?</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We'll use this to personalize your experience
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
            }}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
              errors.firstName
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#8D75E6] focus:ring-2 focus:ring-[#8D75E6]/20'
            } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
            placeholder="Enter your first name"
            autoFocus
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
            }}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
              errors.lastName
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#8D75E6] focus:ring-2 focus:ring-[#8D75E6]/20'
            } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-3 bg-[#8D75E6] text-white rounded-lg font-medium hover:bg-[#7D65D6] transition-colors duration-200 shadow-lg hover:shadow-xl"
      >
        Continue
      </motion.button>
    </form>
  );
}

