import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Briefcase, MapPin, FileText, Settings, AlertCircle } from 'lucide-react';
import CompanySearch from './CompanySearch';
import CreditAllocation from './CreditAllocation';
import CVSelection from './CVSelection';
import { cn } from '../lib/utils';

interface FormData {
  title: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  description: string;
  blacklistedCompanies: { id: string; name: string; }[];
  credits: number;
  cv?: File | null;
}

interface CampaignFormProps {
  formData: FormData;
  onFormChange: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  currentStepIndex: number;
}

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

export default function CampaignForm({ 
  formData, 
  onFormChange, 
  onNext, 
  onBack,
  currentStepIndex = 0
}: CampaignFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const requiredFields: (keyof FormData)[] = [
      'title',
      'jobTitle',
      'industry',
      'jobType',
      'location',
      'description',
      'credits'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.credits <= 0) {
      newErrors.credits = 'Must allocate at least 1 credit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handleBack = () => {
    onBack();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormChange({ ...formData, cv: file });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between bg-white/80 dark:bg-[#353040]/90 
          backdrop-blur-sm p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/30">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStepIndex === index ? 1.1 : 1,
                    opacity: currentStepIndex >= index ? 1 : 0.5
                  }}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200",
                    currentStepIndex === index 
                      ? "bg-gradient-to-r from-[#8D75E6] to-[#A990FF] shadow-lg shadow-[#8D75E6]/20" 
                      : "bg-gray-100 dark:bg-gray-800"
                  )}
                >
                  <step.icon className={cn(
                    "h-5 w-5",
                    currentStepIndex >= index ? "text-white" : "text-gray-400"
                  )} />
                </motion.div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStepIndex === index ? "text-[#8D75E6]" : "text-gray-500"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400">{step.subtitle}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-8">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-500",
                    currentStepIndex > index 
                      ? "bg-gradient-to-r from-[#8D75E6] to-[#A990FF]" 
                      : "bg-gray-200 dark:bg-gray-700"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

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
              className="space-y-6"
            >
              <FormSection
                title="Basic Information"
                icon={Briefcase}
                description="Define your campaign's core details"
              >
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
                    options={[
                      { value: "", label: "Select Industry" },
                      { value: "technology", label: "Technology" },
                      { value: "healthcare", label: "Healthcare" },
                      { value: "finance", label: "Finance" },
                      { value: "education", label: "Education" },
                      { value: "other", label: "Other" }
                    ]}
                    icon={Briefcase}
                  />
                  <FormField
                    label="Job Type"
                    error={errors.jobType}
                    type="select"
                    value={formData.jobType}
                    onChange={(e) => onFormChange({ ...formData, jobType: e.target.value })}
                    options={[
                      { value: "", label: "Select Job Type" },
                      { value: "full-time", label: "Full-time" },
                      { value: "part-time", label: "Part-time" },
                      { value: "contract", label: "Contract" },
                      { value: "internship", label: "Internship" }
                    ]}
                    icon={Briefcase}
                  />
                  <FormField
                    label="Location"
                    error={errors.location}
                    placeholder="e.g., Remote, New York, London"
                    value={formData.location}
                    onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
                    className="lg:col-span-2"
                    icon={MapPin}
                  />
                </div>
              </FormSection>

              <FormSection
                title="Campaign Details"
                icon={FileText}
                description="Describe your ideal candidates"
              >
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
                    onExistingCVSelect={(cvUrl) => onFormChange({ ...formData, cv: cvUrl as unknown as File })}
                  />
                </div>
              </FormSection>

              <FormSection
                title="Campaign Settings"
                icon={Settings}
                description="Configure campaign preferences"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Company Blacklist</label>
                    <CompanySearch
                      onSelect={(company) => onFormChange({
                        ...formData,
                        blacklistedCompanies: [...formData.blacklistedCompanies, company]
                      })}
                      onRemove={(companyId) => onFormChange({
                        ...formData,
                        blacklistedCompanies: formData.blacklistedCompanies.filter(c => c.id !== companyId)
                      })}
                      selectedCompanies={formData.blacklistedCompanies}
                    />
                  </div>

                  <CreditAllocation
                    availableCredits={100}
                    onChange={(credits) => onFormChange({ ...formData, credits })}
                  />
                </div>
              </FormSection>
            </motion.div>
          )}
          
          {currentStepIndex === 1 && (
            <motion.div
              key="email-template"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Contenu de la deuxième étape */}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="flex justify-between mt-8">
          <motion.button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            Back
          </motion.button>
          
          <motion.button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#8D75E6] to-[#A990FF]
              text-white rounded-xl shadow-lg shadow-[#8D75E6]/20
              hover:shadow-xl hover:shadow-[#8D75E6]/30
              transition-all duration-200
              flex items-center gap-2"
          >
            {currentStepIndex === steps.length - 1 ? 'Create Campaign' : 'Next Step'}
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
}

function FormSection({ title, icon: Icon, description, children }: {
  title: string;
  icon: any;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div 
      className="bg-white/80 dark:bg-[#353040]/90 backdrop-blur-sm 
        rounded-2xl border border-gray-100/50 dark:border-gray-700/30 
        p-6 transition-all hover:shadow-lg hover:shadow-[#8D75E6]/5"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[#8D75E6]/10">
          <Icon className="h-5 w-5 text-[#8D75E6]" />
        </div>
        <div>
          <h2 className="text-lg font-medium bg-gradient-to-r from-gray-900 to-gray-600 
            dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
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
              focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]/50
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
              focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]/50
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
              focus:ring-2 focus:ring-[#8D75E6]/20 focus:border-[#8D75E6]/50
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
