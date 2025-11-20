import { memo } from 'react';
import { Building2, MapPin, Briefcase } from 'lucide-react';
import { JobApplication, Interview } from '../../../types/interview';

interface CompanyProfileSectionProps {
  application: JobApplication;
  interview: Interview;
}

const CompanyProfileSection = memo(function CompanyProfileSection({
  application,
  interview,
}: CompanyProfileSectionProps) {
  const companyInfo = interview?.preparation?.companyInfo;
  
  // Extract first sentence as headline
  const headline = companyInfo?.split('.')[0] || `${application.companyName} is a leading company in its industry`;
  const details = companyInfo?.split('.').slice(1).join('.').trim();

  return (
    <article className="rounded-xl bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-6 shadow-sm transition-all duration-200">
      <header className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Company Profile
          </h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 ml-9">
          {application.companyName}
        </p>
      </header>

      {/* Company Headline */}
      <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-[#1A1A1D] dark:to-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E]">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
          {headline}.
        </p>
      </div>

      {/* Company Info */}
      {details && (
        <div className="mb-5 p-4 rounded-lg bg-gray-50/50 dark:bg-[#1A1A1D]/50 border border-gray-100 dark:border-[#2A2A2E]">
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {details}
          </p>
        </div>
      )}

      {/* Quick Facts */}
      <div className="grid grid-cols-3 gap-3">
        {/* Location */}
        {application.location && (
          <div className="rounded-lg bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Location</div>
            </div>
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {application.location}
            </div>
          </div>
        )}

        {/* Company */}
        <div className="rounded-lg bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Company</div>
          </div>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
            {application.companyName}
          </div>
        </div>

        {/* Position */}
        <div className="rounded-lg bg-white dark:bg-[#1E1F22] border border-gray-100 dark:border-[#2A2A2E] p-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Role</div>
          </div>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
            {application.position}
          </div>
        </div>
      </div>
    </article>
  );
});

export default CompanyProfileSection;
