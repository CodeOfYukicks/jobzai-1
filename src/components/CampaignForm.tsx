import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Briefcase, MapPin, FileText, Settings, AlertCircle, Building, Clock, Search, X, Loader2 } from 'lucide-react';
import CompanySearch from './CompanySearch';
import CreditAllocation from './CreditAllocation';
import CVSelection from './CVSelection';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface FormData {
  title: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  description: string;
  blacklistedCompanies: { id: string; name: string; }[];
  credits: number;
  cv: string | File | null;
  templateId: string;
}

interface CampaignFormProps {
  formData: FormData;
  onFormChange: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  currentStepIndex: number;
}

// Ajouter ces constantes au début du fichier, avant le composant
const steps = [
  { 
    title: 'Campaign Details', 
    subtitle: 'Basic information',
    icon: Briefcase 
  },
  { 
    title: 'Email Template', 
    subtitle: 'Customize message',
    icon: FileText 
  }
];

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' }
];

const jobTypeOptions = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' }
];

export default function CampaignForm({ 
  formData, 
  onFormChange, 
  onNext, 
  onBack,
  currentStepIndex = 0
}: CampaignFormProps) {
  const { currentUser } = useAuth();
  const [availableCredits, setAvailableCredits] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les crédits de l'utilisateur
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      const userData = doc.data();
      setAvailableCredits(userData?.credits || 0);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleNext = async () => {
    // Validation de base
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (currentStepIndex === 0) {
      if (!formData.title?.trim()) {
        newErrors.title = 'Campaign title is required';
      }
      if (!formData.jobTitle?.trim()) {
        newErrors.jobTitle = 'Job title is required';
      }
      if (!formData.industry) {
        newErrors.industry = 'Industry is required';
      }
      if (!formData.jobType) {
        newErrors.jobType = 'Job type is required';
      }
      if (!formData.location?.trim()) {
        newErrors.location = 'Location is required';
      }
      if (!formData.description?.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!formData.credits || formData.credits <= 0) {
        newErrors.credits = 'Please allocate some credits';
      }
    }

    setErrors(newErrors);

    // Si il y a des erreurs, on ne continue pas
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onNext();
    } catch (error) {
      console.error('Error while submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/90 
          backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/30">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                  ${currentStepIndex === index 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400'}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <p className={`mt-3 text-sm font-medium
                  ${currentStepIndex === index ? 'text-purple-600' : 'text-gray-500'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">
                  {step.subtitle}
                </p>
              </div>
              {index < 1 && (
                <div className="flex-1 h-0.5 mx-8">
                  <div className={`h-full rounded-full transition-all duration-500
                    ${currentStepIndex > index 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                      : 'bg-gray-200 dark:bg-gray-700'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}>
        <AnimatePresence mode="wait">
          {currentStepIndex === 0 && (
            <motion.div
              key="campaign-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Basic Information */}
              <div className="bg-white/80 dark:bg-gray-800/90 rounded-2xl p-6 border 
                border-gray-100/50 dark:border-gray-700/30 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Basic Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Define your campaign's core details
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    label="Campaign Title"
                    error={errors.title}
                    placeholder="e.g., Senior Developer Positions in Europe"
                    value={formData.title}
                    onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
                    icon={Briefcase}
                  />
                  <FormField
                    label="Job Title"
                    error={errors.jobTitle}
                    placeholder="e.g., Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => onFormChange({ ...formData, jobTitle: e.target.value })}
                    icon={Briefcase}
                  />
                  <FormField
                    label="Industry"
                    error={errors.industry}
                    type="select"
                    value={formData.industry}
                    onChange={(e) => onFormChange({ ...formData, industry: e.target.value })}
                    options={industryOptions}
                    icon={Building}
                  />
                  <FormField
                    label="Job Type"
                    error={errors.jobType}
                    type="select"
                    value={formData.jobType}
                    onChange={(e) => onFormChange({ ...formData, jobType: e.target.value })}
                    options={jobTypeOptions}
                    icon={Clock}
                  />
                  <div className="lg:col-span-2">
                    <FormField
                      label="Location"
                      error={errors.location}
                      placeholder="e.g., Remote, New York, London"
                      value={formData.location}
                      onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
                      icon={MapPin}
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Details */}
              <div className="bg-white/80 dark:bg-gray-800/90 rounded-2xl p-6 border 
                border-gray-100/50 dark:border-gray-700/30 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Campaign Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    Describe your ideal candidates
                  </p>
                </div>

                <div className="space-y-6">
                  <FormField
                    label="Description"
                    type="textarea"
                    error={errors.description}
                    placeholder="Describe what you're looking for in this campaign..."
                    value={formData.description}
                    onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                    icon={FileText}
                  />
                  
                  <CVSelection
                    onFileSelect={(file) => onFormChange({ ...formData, cv: file })}
                    onExistingCVSelect={(cvUrl) => onFormChange({ ...formData, cv: cvUrl })}
                    currentCV={formData.cv}
                  />
                </div>
              </div>

              {/* Campaign Settings */}
              <div className="bg-white/80 dark:bg-gray-800/90 rounded-2xl p-6 border 
                border-gray-100/50 dark:border-gray-700/30 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Campaign Settings
                  </h2>
                  <p className="text-sm text-gray-500">
                    Configure campaign preferences
                  </p>
                </div>

                <div className="space-y-6">
                  <CompanyBlacklist
                    selectedCompanies={formData.blacklistedCompanies}
                    onSelect={(company) => onFormChange({
                      ...formData,
                      blacklistedCompanies: [...formData.blacklistedCompanies, company]
                    })}
                    onRemove={(companyId) => onFormChange({
                      ...formData,
                      blacklistedCompanies: formData.blacklistedCompanies.filter(c => c.id !== companyId)
                    })}
                  />

                  <CreditAllocation
                    availableCredits={availableCredits}
                    currentCredits={formData.credits}
                    onChange={(credits) => onFormChange({ ...formData, credits })}
                    error={errors.credits}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {currentStepIndex === 1 && (
            <EmailTemplateStep
              formData={formData}
              onFormChange={onFormChange}
              errors={errors}
            />
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 
              dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 
              text-white rounded-lg shadow-lg shadow-purple-600/20 
              hover:shadow-xl hover:shadow-purple-600/30 
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {currentStepIndex === 1 ? 'Create Campaign' : 'Next Step'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, error, type = 'text', icon: Icon, options, className = '', ...props }: FormFieldProps & { icon?: any }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2 bg-gradient-to-r 
        from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 
        bg-clip-text text-transparent">
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        
        {type === 'select' ? (
          <select
            className={`w-full rounded-xl bg-gray-50/50 dark:bg-gray-800/50 
              border border-gray-200/50 dark:border-gray-700/30
              focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]/50
              placeholder:text-gray-400
              transition-all duration-200
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            className={`w-full rounded-xl bg-gray-50/50 dark:bg-gray-800/50 
              border border-gray-200/50 dark:border-gray-700/30
              focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]/50
              placeholder:text-gray-400
              transition-all duration-200
              min-h-[120px] resize-y
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          />
        ) : (
          <input
            type="text"
            className={`w-full rounded-xl bg-gray-50/50 dark:bg-gray-800/50 
              border border-gray-200/50 dark:border-gray-700/30
              focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]/50
              placeholder:text-gray-400
              transition-all duration-200
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          />
        )}
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 text-red-500"
        >
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

function CompanyBlacklist({ 
  selectedCompanies = [], 
  onSelect, 
  onRemove 
}: {
  selectedCompanies: { id: string; name: string; }[];
  onSelect: (company: { id: string; name: string; }) => void;
  onRemove: (companyId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; }[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simuler une recherche d'API
      const results = [
        { id: '1', name: 'Google' },
        { id: '2', name: 'Microsoft' },
        { id: '3', name: 'Apple' },
        { id: '4', name: 'Amazon' },
        { id: '5', name: 'Meta' }
      ].filter(company => 
        company.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 bg-gradient-to-r 
          from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 
          bg-clip-text text-transparent">
          Company Blacklist
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search companies to blacklist..."
            className="w-full rounded-xl bg-gray-50/50 dark:bg-gray-800/50 
              border border-gray-200/50 dark:border-gray-700/30
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
              pl-10 pr-4 py-2.5"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 rounded-lg border 
            border-gray-200 dark:border-gray-700 shadow-lg z-10 max-h-48 overflow-auto">
            {searchResults.map(company => (
              <button
                key={company.id}
                onClick={() => {
                  onSelect(company);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700
                  text-sm text-gray-700 dark:text-gray-300"
              >
                {company.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entreprises sélectionnées */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCompanies.map(company => (
            <div
              key={company.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
            >
              <span>{company.name}</span>
              <button
                onClick={() => onRemove(company.id)}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
