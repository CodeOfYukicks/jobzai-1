import { Briefcase } from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';

interface CompanyHeaderProps {
  companyName?: string;
  jobTitle?: string;
  appliedDate?: string;
}

export default function CompanyHeader({ companyName, jobTitle, appliedDate }: CompanyHeaderProps) {


  // If no company context, show generic resume builder
  if (!companyName && !jobTitle) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            Resume Builder
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Create your perfect CV
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Company Logo */}
      {companyName ? (
        <CompanyLogo
          companyName={companyName}
          size="md"
          className="w-10 h-10 rounded-lg shadow-sm"
          showInitials={true}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#3d3c3e] flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {/* Company & Job Info */}
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">
          {companyName || 'Company Name'}
        </h1>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {jobTitle || 'Job Title'}
        </p>

        {appliedDate && (
          <>
            <span className="hidden sm:inline-flex text-xs text-gray-400 dark:text-gray-500 ml-2">
              •
            </span>
            <span className="hidden sm:inline-flex text-xs text-gray-500 dark:text-gray-400">
              Applied {new Date(appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

