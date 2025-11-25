import { useState } from 'react';
import { Briefcase, Building } from 'lucide-react';

interface CompanyHeaderProps {
  companyName?: string;
  jobTitle?: string;
  appliedDate?: string;
}

export default function CompanyHeader({ companyName, jobTitle, appliedDate }: CompanyHeaderProps) {
  const [logoError, setLogoError] = useState(false);

  // Get company logo from Clearbit API
  const getCompanyLogo = (company: string): string => {
    const domain = getCompanyDomain(company);
    return `https://logo.clearbit.com/${domain}`;
  };

  // Extract domain from company name (basic heuristic)
  const getCompanyDomain = (company: string): string => {
    const cleaned = company.toLowerCase().trim();
    
    // Common company name to domain mappings
    const domainMap: Record<string, string> = {
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'meta': 'meta.com',
      'facebook': 'meta.com',
      'amazon': 'amazon.com',
      'netflix': 'netflix.com',
      'tesla': 'tesla.com',
      'spotify': 'spotify.com',
      'uber': 'uber.com',
      'airbnb': 'airbnb.com',
      'stripe': 'stripe.com',
      'slack': 'slack.com',
      'notion': 'notion.so',
      'figma': 'figma.com',
      'linkedin': 'linkedin.com',
      'twitter': 'twitter.com',
      'salesforce': 'salesforce.com',
      'adobe': 'adobe.com',
      'oracle': 'oracle.com',
      'ibm': 'ibm.com',
      'intel': 'intel.com',
      'cisco': 'cisco.com',
      'netflix': 'netflix.com',
      'paypal': 'paypal.com',
      'shopify': 'shopify.com',
      'zoom': 'zoom.us',
    };

    if (domainMap[cleaned]) {
      return domainMap[cleaned];
    }

    // Remove common suffixes and add .com
    const sanitized = cleaned
      .replace(/\s+(inc|llc|ltd|corp|corporation|company|co)\.?$/i, '')
      .replace(/\s+/g, '');
    
    return `${sanitized}.com`;
  };

  // Get initials for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate color from company name
  const getCompanyColor = (name: string): string => {
    const colors = [
      'bg-emerald-500',
      'bg-teal-500',
      'bg-blue-500',
      'bg-slate-600',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-indigo-500',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

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
      <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        {!logoError && companyName ? (
          <img
            src={getCompanyLogo(companyName)}
            alt={companyName}
            className="w-full h-full object-cover"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${getCompanyColor(companyName || '')} text-white font-bold text-sm`}>
            {companyName ? getInitials(companyName) : <Building className="w-5 h-5" />}
          </div>
        )}
      </div>

      {/* Company & Job Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            {companyName || 'Company Name'}
          </h1>
          {appliedDate && (
            <span className="hidden sm:inline-flex text-xs text-gray-400 dark:text-gray-500">
              •
            </span>
          )}
          {appliedDate && (
            <span className="hidden sm:inline-flex text-xs text-gray-500 dark:text-gray-400">
              Applied {new Date(appliedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {jobTitle || 'Job Title'}
        </p>
      </div>
    </div>
  );
}

