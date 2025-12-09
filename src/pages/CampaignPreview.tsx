import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Loader2, Briefcase, FileText, Settings, Target, ArrowRight, CheckCircle2, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '@/lib/notify';
import { TemplateSelector } from '../components/TemplateSelector';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import CompanySearch from '../components/CompanySearch';
import CVSelection from '../components/CVSelection';

interface CampaignPreviewProps {
  onBack: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface FormData {
  title: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  description: string;
  blacklistedCompanies: { id: string; name: string }[];
  credits: number;
  cv: string | File | null;
  templateId: string;
}

// Definition of steps
const steps = [
  {
    id: 'basics',
    title: 'Basic Information',
    subtitle: 'Define your search',
    icon: Briefcase
  },
  {
    id: 'targeting',
    title: 'Advanced Targeting',
    subtitle: 'Customize your criteria',
    icon: Target
  },
  {
    id: 'template',
    title: 'Communication',
    subtitle: 'Define your message',
    icon: FileText
  }
];

// Options for selectors
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

export default function CampaignPreview({ onBack }: CampaignPreviewProps) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<'basics' | 'targeting' | 'template'>('basics');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    jobTitle: '',
    industry: '',
    jobType: '',
    location: '',
    description: '',
    blacklistedCompanies: [],
    credits: 0,
    cv: null,
    templateId: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [availableCredits, setAvailableCredits] = useState(0);

  // Load user credits
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserCredits = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setAvailableCredits(userSnap.data()?.credits || 0);
      }
    };

    fetchUserCredits();
  }, [currentUser]);

  const validateStep = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (currentStep === 'basics') {
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
    } else if (currentStep === 'targeting') {
      if (!formData.description?.trim()) {
        newErrors.description = 'Description is required';
      }
      if (!formData.credits || formData.credits <= 0) {
        newErrors.credits = 'Please allocate credits';
      } else if (formData.credits > availableCredits) {
        newErrors.credits = `You only have ${availableCredits} credits available`;
      }
    } else if (currentStep === 'template') {
      if (!formData.templateId) {
        // This error will be handled visually rather than in a specific field
        notify.error('Please select an email template');
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep()) return;

    if (currentStep === 'basics') {
      setCurrentStep('targeting');
    } else if (currentStep === 'targeting') {
      setCurrentStep('template');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'targeting') {
      setCurrentStep('basics');
    } else if (currentStep === 'template') {
      setCurrentStep('targeting');
    }
  };

  const handleCreateCampaign = async () => {
    if (!validateStep() || !currentUser || !selectedTemplate) {
      return;
    }

    try {
      setIsCreating(true);

      let cvUrl = formData.cv;
      
      // If it's a file, upload it
      if (formData.cv instanceof File) {
        const storageRef = ref(storage, `users/${currentUser.uid}/cvs/${formData.cv.name}`);
        await uploadBytes(storageRef, formData.cv);
        cvUrl = await getDownloadURL(storageRef);
      }

      const campaignData = {
        ...formData,
        cv: cvUrl,
        status: 'pending',
        emailsSent: 0,
        responses: 0,
        createdAt: serverTimestamp(),
        templateId: selectedTemplate.id,
        template: {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          subject: selectedTemplate.subject,
          content: selectedTemplate.content,
        }
      };

      const campaignsCollection = collection(db, 'users', currentUser.uid, 'campaigns');
      await addDoc(campaignsCollection, campaignData);

      notify.success('Campaign created successfully!');
      onBack();
    } catch (error) {
      console.error('Error creating campaign:', error);
      notify.error('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user modifies a field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // Render content specific to each step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Essential Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Define the basic parameters of your job search
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  label="Campaign Title"
                  error={errors.title}
                  placeholder="e.g.: Senior developer positions in Europe"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  icon={Briefcase}
                />
                <FormField
                  label="Job Title"
                  error={errors.jobTitle}
                  placeholder="e.g.: Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  icon={Briefcase}
                />
                <FormField
                  label="Industry"
                  error={errors.industry}
                  type="select"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  options={industryOptions}
                />
                <FormField
                  label="Job Type"
                  error={errors.jobType}
                  type="select"
                  value={formData.jobType}
                  onChange={(e) => handleInputChange('jobType', e.target.value)}
                  options={jobTypeOptions}
                />
                <div className="lg:col-span-2">
                  <FormField
                    label="Location"
                    error={errors.location}
                    placeholder="e.g.: Remote, New York, London"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'targeting':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Profile Description
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Describe in detail the ideal profile for this position
                </p>
              </div>

              <FormField
                label="Detailed Description"
                error={errors.description}
                type="textarea"
                placeholder="Describe what you're looking for in this campaign..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />

              <CVSelection
                currentCV={formData.cv}
                onCVChange={(cv) => handleInputChange('cv', cv)}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Advanced Settings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure your campaign preferences
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                  Companies to Exclude
                </label>
                <CompanySearch
                  selectedCompanies={formData.blacklistedCompanies}
                  onSelect={(company) => {
                    handleInputChange('blacklistedCompanies', [
                      ...formData.blacklistedCompanies, 
                      company
                    ]);
                  }}
                  onRemove={(companyId) => {
                    handleInputChange(
                      'blacklistedCompanies',
                      formData.blacklistedCompanies.filter(c => c.id !== companyId)
                    );
                  }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                    Credit Allocation
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Available: {availableCredits} credits
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.credits || ''}
                    onChange={(e) => handleInputChange('credits', parseInt(e.target.value) || 0)}
                    placeholder="Number of credits to use"
                    className="w-full rounded-xl bg-gray-50/50 dark:bg-gray-700/50 
                      border border-gray-200/50 dark:border-gray-600/50
                      text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
                      focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
                      px-4 py-3"
                  />
                  {errors.credits && (
                    <p className="mt-2 text-sm text-red-500">{errors.credits}</p>
                  )}
                </div>

                {formData.credits > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Usage</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {Math.min(100, (formData.credits / availableCredits) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (formData.credits / availableCredits) * 100)}%` }}
                      />
                    </div>
                    <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        1 credit = 1 job application
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Remaining credits after allocation: {availableCredits - formData.credits}
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Estimated applications: {formData.credits} companies
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'template':
        return (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Email Template
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select or create an email template for your applications
                </p>
              </div>
              
              <TemplateSelector
                key={`template-selector-${formData.templateId || 'new'}`}
                onSelect={(template) => {
                  console.log("Template selected:", template);
                  setSelectedTemplate(template);
                  handleInputChange('templateId', template.id);
                }}
                selectedTemplateId={formData.templateId}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Campaign Summary
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review the details before launching your campaign
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h3>
                    <ul className="space-y-2">
                      <SummaryItem label="Campaign Title" value={formData.title} />
                      <SummaryItem label="Job Title" value={formData.jobTitle} />
                      <SummaryItem label="Industry" value={getOptionLabel(industryOptions, formData.industry)} />
                      <SummaryItem label="Job Type" value={getOptionLabel(jobTypeOptions, formData.jobType)} />
                      <SummaryItem label="Location" value={formData.location} />
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Targeting and Settings</h3>
                    <ul className="space-y-2">
                      <SummaryItem 
                        label="Excluded Companies" 
                        value={formData.blacklistedCompanies.length > 0 
                          ? `${formData.blacklistedCompanies.length} companies` 
                          : 'None'} 
                      />
                      <SummaryItem label="Allocated Credits" value={`${formData.credits} credits`} />
                      <SummaryItem 
                        label="CV/Resume" 
                        value={formData.cv instanceof File 
                          ? formData.cv.name 
                          : formData.cv 
                            ? 'Existing CV' 
                            : 'None'} 
                      />
                      <SummaryItem 
                        label="Email Template" 
                        value={selectedTemplate?.name || 'Not selected'} 
                      />
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Campaign
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure your new job application campaign
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center bg-white dark:bg-gray-800 
          backdrop-blur-sm p-3 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between w-full mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shadow
                    ${currentStepIndex === index 
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-500/50' 
                      : currentStepIndex > index
                        ? 'bg-green-600 text-white shadow-md shadow-green-500/30'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                    {currentStepIndex > index ? <Check className="h-3 w-3 sm:h-5 sm:w-5" /> : <step.icon className="h-3 w-3 sm:h-5 sm:w-5" />}
                  </div>
                  <p className={`mt-1 sm:mt-3 text-[11px] sm:text-sm font-medium truncate max-w-[70px] sm:max-w-none text-center
                    ${currentStepIndex === index 
                      ? 'text-purple-700 dark:text-purple-300 font-bold' 
                      : currentStepIndex > index
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-300'}`}>
                    {step.title}
                  </p>
                  <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                    {step.subtitle}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 sm:w-20 md:w-28 h-1 mx-1 sm:mx-4 md:mx-6">
                    <div className={`h-full rounded-full transition-all duration-500
                      ${currentStepIndex > index 
                        ? 'bg-green-600' 
                        : 'bg-gray-300 dark:bg-gray-600'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between">
          <button
            onClick={currentStep === 'basics' ? onBack : handlePreviousStep}
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {currentStep === 'basics' ? 'Cancel' : 'Previous'}
          </button>
          
          {currentStep === 'template' ? (
            <button
              onClick={handleCreateCampaign}
              disabled={isCreating || !selectedTemplate}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  <span>Launch Campaign</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl shadow-md shadow-purple-500/20 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Component for form fields
interface FormFieldProps {
  label: string;
  error?: string;
  type?: 'text' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
  icon?: React.ElementType;
  [key: string]: any;
}

function FormField({ label, error, type = 'text', icon: Icon, options, className = '', ...props }: FormFieldProps) {
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
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
              placeholder:text-gray-400
              transition-all duration-200
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          >
            <option value="">Select...</option>
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
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
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
              focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600/50
              placeholder:text-gray-400
              transition-all duration-200
              ${Icon ? "pl-10 pr-4 py-3" : "px-4 py-3"}`}
            {...props}
          />
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Component for summary
function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </li>
  );
}

// Utility function to get label of an option
function getOptionLabel(options: { value: string; label: string }[], value: string): string {
  const option = options.find(opt => opt.value === value);
  return option?.label || value;
}
