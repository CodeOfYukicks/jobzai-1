import { memo, useMemo, useRef, useState } from 'react';
import { ExternalLink, MapPin, Globe, Users } from 'lucide-react';
import { Interview } from '../../../types/interview';
import { JobApplication } from '../../../types/job';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl } from '../../../utils/logo';

interface CompanyProfileSectionProps {
  application: JobApplication;
  interview: Interview;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CompanyProfileSection = memo(function CompanyProfileSection({
  application,
  interview,
}: CompanyProfileSectionProps) {
  const companyInfo = interview?.preparation?.companyInfo;
  const companyDomain = getCompanyDomain(application.companyName);
  const initialLogo = companyDomain ? getClearbitUrl(companyDomain) : null;
  const [logoSrc, setLogoSrc] = useState<string | null>(initialLogo);
  const triedGoogle = useRef(false);

  function handleLogoError() {
    if (companyDomain && !triedGoogle.current) {
      triedGoogle.current = true;
      setLogoSrc(getGoogleFaviconUrl(companyDomain));
    } else {
      setLogoSrc(null);
    }
  }
  
  // Extract headline and details
  const headline = companyInfo?.split('.')[0] || `${application.companyName} is a leading company in its industry`;
  const details = companyInfo?.split('.').slice(1, 3).join('. ').trim();

  // Get company website URL
  const companyWebsiteUrl = useMemo(() => {
    if (application.url) {
      try {
        const url = new URL(application.url);
        return `${url.protocol}//${url.hostname}`;
      } catch (e) {
        // fallback
      }
    }
    const domain = getCompanyDomain(application.companyName);
    if (domain) return `https://${domain}`;
    return null;
  }, [application.url, application.companyName]);

  return (
    <article className="h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 transition-colors">
      
      {/* Top: Logo + Company Name inline */}
      <div className="flex items-start gap-5 mb-8">
        {/* Logo - Glassmorphism style */}
        <div className="flex-shrink-0">
          <div 
            className="
              h-14 w-14 rounded-xl 
              backdrop-blur-xl bg-slate-50 dark:bg-slate-800 
              ring-1 ring-slate-200/80 dark:ring-slate-700/80
              flex items-center justify-center
              transition-all duration-200
            "
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${application.companyName} logo`}
                onError={handleLogoError}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                {getInitials(application.companyName)}
              </span>
            )}
          </div>
        </div>

        {/* Company Name + Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {application.companyName}
            </h2>
            {companyWebsiteUrl && (
              <a 
                href={companyWebsiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <Globe className="w-3 h-3" />
                Website
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          
          {/* Location + Industry tags */}
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            {application.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {application.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Insight */}
      <div className="space-y-4">
        {/* Primary Insight - Display Typography */}
        <p className="font-display text-2xl md:text-[1.75rem] font-normal leading-[1.3] tracking-[-0.01em] text-slate-900 dark:text-white">
          {headline}.
        </p>

        {/* Supporting Details */}
        {details && (
          <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            {details}.
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="my-6 h-px bg-slate-100 dark:bg-slate-800" />

      {/* Bottom: Quick Stats Row */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Position: <span className="font-medium text-slate-900 dark:text-white">{application.position}</span>
          </span>
        </div>
      </div>
    </article>
  );
});

export default CompanyProfileSection;
