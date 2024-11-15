import { useState } from 'react';
import { motion } from 'framer-motion';
import CompanySearch from './CompanySearch';
import CreditAllocation from './CreditAllocation';
import CVSelection from './CVSelection';

interface FormData {
  title: string;
  jobTitle: string;
  industry: string;
  jobType: string;
  location: string;
  description: string;
  blacklistedCompanies: Array<{ id: string; name: string; }>;
  credits: number;
  cv?: File;
  cvUrl?: string;
}

interface CampaignFormProps {
  formData: FormData;
  onFormChange: (data: FormData) => void;
  onNext: () => void;
}

export default function CampaignForm({ formData, onFormChange, onNext }: CampaignFormProps) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Senior Developer Positions in Europe"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={formData.jobTitle}
            onChange={(e) => onFormChange({ ...formData, jobTitle: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] ${
              errors.jobTitle ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Software Engineer"
          />
          {errors.jobTitle && (
            <p className="mt-1 text-xs text-red-500">{errors.jobTitle}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            value={formData.industry}
            onChange={(e) => onFormChange({ ...formData, industry: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] ${
              errors.industry ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Industry</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
          {errors.industry && (
            <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Type
          </label>
          <select
            value={formData.jobType}
            onChange={(e) => onFormChange({ ...formData, jobType: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] ${
              errors.jobType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Job Type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
          {errors.jobType && (
            <p className="mt-1 text-xs text-red-500">{errors.jobType}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => onFormChange({ ...formData, location: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Remote, New York, London"
        />
        {errors.location && (
          <p className="mt-1 text-xs text-red-500">{errors.location}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-[#8D75E6] focus:border-[#8D75E6] ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe what you're looking for in this campaign..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description}</p>
        )}
      </div>

      <CVSelection
        onFileSelect={(file) => onFormChange({ ...formData, cv: file })}
        onExistingCVSelect={(cvUrl) => onFormChange({ ...formData, cvUrl })}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Blacklist
        </label>
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
        availableCredits={100} // This should come from user data
        onChange={(credits) => onFormChange({ ...formData, credits })}
      />

      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          className="px-6 py-2 bg-[#8D75E6] text-white rounded-lg hover:bg-[#8D75E6]/90 transition-colors"
        >
          Next: Select Template
        </button>
      </div>
    </form>
  );
}