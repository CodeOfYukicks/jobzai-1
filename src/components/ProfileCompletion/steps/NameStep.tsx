import { useState, useEffect } from 'react';
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
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
            className={`w-full px-0 py-3 bg-transparent border-0 border-b transition-colors ${errors.firstName
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white'
              } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-lg`}
            placeholder="Enter your first name"
            autoFocus
          />
          {errors.firstName && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
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
            className={`w-full px-0 py-3 bg-transparent border-0 border-b transition-colors ${errors.lastName
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white'
              } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 text-lg`}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Navigation Footer - Right aligned */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium
            hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

