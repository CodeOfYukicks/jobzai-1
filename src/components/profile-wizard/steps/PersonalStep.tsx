import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail } from 'lucide-react';

interface PersonalStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

const PersonalStep = ({ data, onUpdate }: PersonalStepProps) => {
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [email, setEmail] = useState(data.email || '');

  const handleChange = (field: string, value: string) => {
    const updates: any = {};
    updates[field] = value;
    onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 max-w-md mx-auto">
        {/* First Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                handleChange('firstName', e.target.value);
              }}
              placeholder="Your first name"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            />
          </div>
        </motion.div>

        {/* Last Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                handleChange('lastName', e.target.value);
              }}
              placeholder="Your last name"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
            />
          </div>
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              readOnly
              disabled
              placeholder="your@email.com"
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 placeholder-gray-400 cursor-not-allowed"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PersonalStep;

