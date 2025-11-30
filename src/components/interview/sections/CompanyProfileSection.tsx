import { memo, useMemo } from 'react';
import { Building2, MapPin, Briefcase, ExternalLink } from 'lucide-react';
import { JobApplication, Interview } from '../../../types/interview';
import { getCompanyDomain } from '../../../utils/logo';

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

  // Get company website URL (not the job posting URL)
  const companyWebsiteUrl = useMemo(() => {
    // First, try to extract domain from job posting URL if it exists
    if (application.url) {
      try {
        const url = new URL(application.url);
        // Return the base domain (e.g., https://company.com)
        return `${url.protocol}//${url.hostname}`;
      } catch (e) {
        // If URL parsing fails, continue to fallback
      }
    }
    
    // Fallback: construct URL from company name using getCompanyDomain
    const domain = getCompanyDomain(application.companyName);
    if (domain) {
      return `https://${domain}`;
    }
    
    return null;
  }, [application.url, application.companyName]);

  return (
    <article className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-inset ring-indigo-100 dark:ring-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">
              Company Profile
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{application.companyName}</span>
              {companyWebsiteUrl && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <a 
                    href={companyWebsiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    Visit website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headline Quote */}
          <div className="relative pl-5 border-l-4 border-indigo-500/30 dark:border-indigo-400/30">
            <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed italic">
              "{headline}."
            </p>
          </div>

          {/* Detailed Info */}
          {details && (
            <div className="prose prose-sm prose-gray dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>{details}</p>
            </div>
          )}
        </div>

        {/* Sidebar Stats - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-5 space-y-4 border border-gray-100 dark:border-gray-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-normal uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white pl-5.5">
                {application.location || 'Remote / Not specified'}
              </div>
            </div>

            <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-normal uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <Briefcase className="w-3.5 h-3.5" />
                Position
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white pl-5.5">
                {application.position}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

export default CompanyProfileSection;
