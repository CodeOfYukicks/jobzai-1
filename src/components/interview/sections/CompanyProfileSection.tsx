import { memo, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Globe, Briefcase } from 'lucide-react';
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
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-slate-800/60 p-8 transition-all hover:shadow-premium-soft"
    >
      
      {/* Top: Logo + Company Name inline */}
      <div className="flex items-start gap-5 mb-8">
        {/* Logo - Premium glassmorphism */}
        <motion.div 
          className="flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div 
            className="
              h-14 w-14 rounded-xl 
              backdrop-blur-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900
              ring-1 ring-slate-200/80 dark:ring-slate-700/80
              flex items-center justify-center
              transition-all duration-200
              hover:ring-jobzai-300/50 dark:hover:ring-jobzai-600/50
              shadow-sm
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
        </motion.div>

        {/* Company Name + Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {application.companyName}
            </h2>
            {companyWebsiteUrl && (
              <a 
                href={companyWebsiteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-jobzai-500 hover:text-jobzai-600 dark:text-jobzai-400 dark:hover:text-jobzai-300 transition-colors"
              >
                <Globe className="w-3 h-3" />
                Website
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          
          {/* Location tag */}
          {application.location && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                <MapPin className="w-3 h-3 text-jobzai-500" />
                {application.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Insight */}
      <div className="space-y-4">
        {/* Primary Insight - Bold modern typography */}
        <p className="text-xl md:text-2xl font-semibold leading-[1.35] tracking-[-0.01em] text-slate-900 dark:text-white">
          {headline}.
        </p>

        {/* Supporting Details */}
        {details && (
          <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
            {details}.
          </p>
        )}
      </div>

      {/* Divider - subtle gradient */}
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Bottom: Quick Stats Row */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="p-1.5 rounded-lg bg-jobzai-50 dark:bg-jobzai-950/30">
            <Briefcase className="w-4 h-4 text-jobzai-500" />
          </div>
          <span className="text-slate-600 dark:text-slate-400">
            Position: <span className="font-semibold text-slate-900 dark:text-white">{application.position}</span>
          </span>
        </div>
      </div>
    </motion.article>
  );
});

export default CompanyProfileSection;
