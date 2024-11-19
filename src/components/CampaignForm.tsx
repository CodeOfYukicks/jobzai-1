import { useState } from 'react';
import CompanySearch from './CompanySearch';
import CreditAllocation from './CreditAllocation';
import CVSelection from './CVSelection';
import { cn } from '../lib/utils';
import { ArrowRight, ArrowLeft } from 'lucide-react';

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
}

export default function CampaignForm({ formData, onFormChange, onNext, onBack }: CampaignFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormChange({ ...formData, cv: file });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create Campaign</h1>
          <p className="text-sm text-gray-500">Set up your new job application campaign</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8 bg-white dark:bg-[#353040] p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#8D75E6] text-white flex items-center justify-center">
              1
            </div>
            <div>
              <span className="text-sm font-medium text-[#8D75E6]">Campaign Details</span>
              <p className="text-xs text-gray-500">Basic information and settings</p>
            </div>
          </div>
        </div>

        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
              2
            </div>
            <div>
              <span className="text-sm text-gray-400">Email Template</span>
              <p className="text-xs text-gray-500">Customize your message</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-[#353040] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              label="Campaign Title"
              error={errors.title}
              placeholder="e.g., Senior Developer Positions in Europe"
              value={formData.title}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            />
            <FormField
              label="Job Title"
              error={errors.jobTitle}
              placeholder="e.g., Software Engineer"
              value={formData.jobTitle}
              onChange={(e) => onFormChange({ ...formData, jobTitle: e.target.value })}
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
            />
            <FormField
              label="Location"
              error={errors.location}
              placeholder="e.g., Remote, New York, London"
              value={formData.location}
              onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
              className="lg:col-span-2"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#353040] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Campaign Details</h2>
          <div className="space-y-6">
            <FormField
              label="Description"
              type="textarea"
              error={errors.description}
              placeholder="Describe what you're looking for in this campaign..."
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
            />
            
            <CVSelection
              onFileSelect={(file) => onFormChange({ ...formData, cv: file })}
              onExistingCVSelect={(cvUrl) => onFormChange({ ...formData, cv: cvUrl as unknown as File })}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#353040] rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Campaign Settings</h2>
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
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-[#8D75E6] text-white rounded-lg 
              hover:bg-[#8D75E6]/90 transition-colors flex items-center gap-2"
          >
            Next: Select Template
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  type?: 'text' | 'select' | 'textarea';
  options?: { value: string; label: string; }[];
  className?: string;
  [key: string]: any;
}

function FormField({ label, error, type = 'text', options, className = '', ...props }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        {label}
      </label>
      
      {type === 'select' ? (
        <select
          className="form-field w-full px-4 py-2 rounded-lg"
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
          className="form-field w-full px-4 py-2 rounded-lg"
          rows={4}
          {...props}
        />
      ) : (
        <input
          type="text"
          className="form-field w-full px-4 py-2 rounded-lg"
          {...props}
        />
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
