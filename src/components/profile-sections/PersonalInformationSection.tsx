import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface PersonalInformationSectionProps {
  onUpdate: (data: any) => void;
}

const PersonalInformationSection = ({ onUpdate }: PersonalInformationSectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    city: '',
    country: '',
    contractType: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Convertir l'ancien champ location en city et country si nécessaire
          let city = userData.city || '';
          let country = userData.country || '';
          if ((!city || !country) && userData.location) {
            const parts = userData.location.split(',').map((s: string) => s.trim());
            if (parts.length === 2) {
              city = city || parts[0];
              country = country || parts[1];
            } else if (parts.length === 1 && !city) {
              city = parts[0];
            }
          }
          const newFormData = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || currentUser.email || '',
            gender: userData.gender || '',
            city: city,
            country: country,
            contractType: userData.contractType || ''
          };
          setFormData(newFormData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  const handleChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    
    onUpdate(newFormData);
  };

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="personal" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Personal Information
        </h2>
      </div>

      <div className="space-y-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Enter your first name"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Enter your last name"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>

        {/* Full Name (Read Only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={`${formData.firstName} ${formData.lastName}`.trim()}
            readOnly
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Location - City and Country */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g., Paris"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="e.g., France"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Contract Type
          </label>
          <select
            value={formData.contractType}
            onChange={(e) => handleChange('contractType', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          >
            <option value="">Select contract type</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="freelance">Freelance</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default PersonalInformationSection; 