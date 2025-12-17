import { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, Clock, Plus, X, Users, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PremiumInput, 
  PremiumLabel, 
  PremiumAddButton,
  SectionDivider,
  FieldGroup,
  SectionSkeleton
} from '../profile/ui';

interface SectionProps {
  onUpdate: (data: any) => void;
}

interface Reference {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  relationship: string;
}

const WorkAuthorizationSection = ({ onUpdate }: SectionProps) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    fullAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    workAuthorization: '' as '' | 'citizen' | 'permanent_resident' | 'visa_sponsor_required' | 'visa_no_sponsor' | 'other',
    workAuthorizationDetails: '',
    noticePeriod: 0,
    noticePeriodUnit: 'weeks' as 'days' | 'weeks' | 'months',
    veteranStatus: '' as '' | 'veteran' | 'not_veteran' | 'prefer_not_say',
    disabilityStatus: '' as '' | 'yes' | 'no' | 'prefer_not_say',
    references: [] as Reference[]
  });

  const [showAddReference, setShowAddReference] = useState(false);
  const [newReference, setNewReference] = useState<Reference>({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    relationship: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            phone: userData.phone || '',
            fullAddress: userData.fullAddress || {
              street: '',
              city: userData.city || '',
              state: '',
              zipCode: '',
              country: userData.country || ''
            },
            workAuthorization: userData.workAuthorization || '',
            workAuthorizationDetails: userData.workAuthorizationDetails || '',
            noticePeriod: userData.noticePeriod || 0,
            noticePeriodUnit: userData.noticePeriodUnit || 'weeks',
            veteranStatus: userData.veteranStatus || '',
            disabilityStatus: userData.disabilityStatus || '',
            references: userData.references || []
          });
        }
      } catch (error) {
        console.error('Error loading work authorization data:', error);
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

  const handleAddressChange = (field: string, value: string) => {
    const newAddress = {
      ...formData.fullAddress,
      [field]: value
    };
    handleChange('fullAddress', newAddress);
  };

  const handleAddReference = () => {
    if (newReference.name && newReference.email) {
      const updatedRefs = [...formData.references, newReference];
      handleChange('references', updatedRefs);
      setNewReference({
        name: '',
        title: '',
        company: '',
        email: '',
        phone: '',
        relationship: ''
      });
      setShowAddReference(false);
    }
  };

  const handleRemoveReference = (index: number) => {
    const updatedRefs = formData.references.filter((_, i) => i !== index);
    handleChange('references', updatedRefs);
  };

  const workAuthorizationOptions = [
    { id: 'citizen', label: 'Citizen', description: 'Full work authorization' },
    { id: 'permanent_resident', label: 'Permanent Resident', description: 'Green card or equivalent' },
    { id: 'visa_no_sponsor', label: 'Valid Visa', description: 'No sponsorship needed' },
    { id: 'visa_sponsor_required', label: 'Needs Sponsorship', description: 'Requires employer visa' },
    { id: 'other', label: 'Other', description: 'Please specify' }
  ];

  const noticePeriodUnits = [
    { id: 'days', label: 'Days' },
    { id: 'weeks', label: 'Weeks' },
    { id: 'months', label: 'Months' }
  ];

  const relationshipTypes = [
    'Former Manager',
    'Direct Supervisor',
    'Colleague',
    'Client',
    'Mentor',
    'Other'
  ];

  if (isLoading) {
    return <SectionSkeleton />;
  }

  return (
    <FieldGroup className="space-y-8">
      {/* Contact Information */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Contact Information</h3>
        </div>
        
        <div className="space-y-4">
          <PremiumInput
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />

          {/* Full Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <PremiumLabel className="mb-0">Full Address</PremiumLabel>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.fullAddress.street}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                placeholder="Street address"
                className="col-span-full px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
              />
              <input
                type="text"
                value={formData.fullAddress.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="City"
                className="px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
              />
              <input
                type="text"
                value={formData.fullAddress.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="State / Province"
                className="px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
              />
              <input
                type="text"
                value={formData.fullAddress.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                placeholder="ZIP / Postal code"
                className="px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
              />
              <input
                type="text"
                value={formData.fullAddress.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                placeholder="Country"
                className="px-4 py-2.5 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* Work Authorization */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Work Authorization</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {workAuthorizationOptions.map((option) => {
            const isSelected = formData.workAuthorization === option.id;
            
            return (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleChange('workAuthorization', option.id)}
                className={`
                  relative text-left p-4 rounded-xl transition-all duration-200
                  ${isSelected
                    ? 'bg-gray-100 dark:bg-[#4a494b] ring-1 ring-gray-900/10 dark:ring-white/20'
                    : 'bg-gray-50 dark:bg-[#3d3c3e] hover:bg-gray-100 dark:hover:bg-[#4a494b]'
                  }
                `}
              >
                <p className={`font-medium text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {option.description}
                </p>
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

        {formData.workAuthorization === 'other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <textarea
              value={formData.workAuthorizationDetails}
              onChange={(e) => handleChange('workAuthorizationDetails', e.target.value)}
              placeholder="Please describe your work authorization status..."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all resize-none"
            />
          </motion.div>
        )}
      </div>

      <SectionDivider />

      {/* Notice Period */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Availability</h3>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-300">I can start in</span>
          <input
            type="number"
            min="0"
            value={formData.noticePeriod || ''}
            onChange={(e) => handleChange('noticePeriod', parseInt(e.target.value) || 0)}
            className="w-20 px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
          />
          <select
            value={formData.noticePeriodUnit}
            onChange={(e) => handleChange('noticePeriodUnit', e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#2b2a2c] border border-gray-200/80 dark:border-[#3d3c3e]/50 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem] pr-8"
          >
            {noticePeriodUnits.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Set to 0 if immediately available
        </p>
      </div>

      <SectionDivider />

      {/* References */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Professional References</h3>
          </div>
          <PremiumAddButton onClick={() => setShowAddReference(true)} label="Add" />
        </div>

        {/* Existing References */}
        <AnimatePresence mode="popLayout">
          {formData.references.length > 0 && (
            <div className="space-y-3 mb-4">
              {formData.references.map((ref, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                  className="group flex items-start justify-between p-4 bg-gray-50 dark:bg-[#2b2a2c]/50 rounded-xl border border-gray-100 dark:border-[#3d3c3e]/50"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{ref.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{ref.title} at {ref.company}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ref.email}</p>
                    {ref.relationship && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-200/60 dark:bg-[#3d3c3e]/60 text-gray-600 dark:text-gray-300 rounded-full">
                        {ref.relationship}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveReference(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Add Reference Form */}
        <AnimatePresence>
          {showAddReference && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border border-dashed border-gray-200 dark:border-[#3d3c3e] rounded-xl bg-gray-50/50 dark:bg-[#2b2a2c]/30"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newReference.name}
                  onChange={(e) => setNewReference(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name *"
                  className="px-4 py-2.5 bg-white dark:bg-[#3d3c3e] border border-gray-200/80 dark:border-[#4a494b]/50 rounded-xl text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                />
                <input
                  type="text"
                  value={newReference.title}
                  onChange={(e) => setNewReference(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Job title"
                  className="px-4 py-2.5 bg-white dark:bg-[#3d3c3e] border border-gray-200/80 dark:border-[#4a494b]/50 rounded-xl text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                />
                <input
                  type="text"
                  value={newReference.company}
                  onChange={(e) => setNewReference(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company"
                  className="px-4 py-2.5 bg-white dark:bg-[#3d3c3e] border border-gray-200/80 dark:border-[#4a494b]/50 rounded-xl text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                />
                <input
                  type="email"
                  value={newReference.email}
                  onChange={(e) => setNewReference(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email *"
                  className="px-4 py-2.5 bg-white dark:bg-[#3d3c3e] border border-gray-200/80 dark:border-[#4a494b]/50 rounded-xl text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                />
                <input
                  type="tel"
                  value={newReference.phone}
                  onChange={(e) => setNewReference(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                  className="px-4 py-2.5 bg-white dark:bg-[#3d3c3e] border border-gray-200/80 dark:border-[#4a494b]/50 rounded-xl text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all"
                />
                <select
                  value={newReference.relationship}
                  onChange={(e) => setNewReference(prev => ({ ...prev, relationship: e.target.value }))}
                  className="px-4 py-2.5 bg-white dark:bg-[#3d3c3e] border border-gray-200/80 dark:border-[#4a494b]/50 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-10"
                >
                  <option value="">Relationship</option>
                  {relationshipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowAddReference(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3d3c3e] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddReference}
                  disabled={!newReference.name || !newReference.email}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Add Reference
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {formData.references.length === 0 && !showAddReference && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No references added yet</p>
            <p className="text-xs mt-1">Optional but recommended</p>
          </div>
        )}
      </div>
    </FieldGroup>
  );
};

export default WorkAuthorizationSection;
