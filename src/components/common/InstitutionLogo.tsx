import { useState, useEffect, useRef } from 'react';
import { GraduationCap } from 'lucide-react';
import { getSchoolDomainVariants, getClearbitUrl, getLogoDevUrl, getGoogleFaviconUrl, getSchoolInitials } from '../../utils/logo';

interface InstitutionLogoProps {
  institutionName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackIcon?: boolean;
}

// Cache for institution logos
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

const urlCache = new Map<string, CacheEntry>();

// Helper function to get initial state from cache
const getInitialLogoState = (institutionName: string): { logoSrc: string | null; isLoading: boolean; domainIndex: number } => {
  if (!institutionName) {
    return { logoSrc: null, isLoading: false, domainIndex: 0 };
  }

  const cacheKey = institutionName.toLowerCase().trim();
  const cached = urlCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { logoSrc: cached.url, isLoading: false, domainIndex: 0 };
  }

  const domains = getSchoolDomainVariants(institutionName);
  if (domains.length === 0) {
    return { logoSrc: null, isLoading: false, domainIndex: 0 };
  }

  // Return Clearbit URL for first domain to try
  return { logoSrc: getClearbitUrl(domains[0]), isLoading: true, domainIndex: 0 };
};

export function InstitutionLogo({
  institutionName,
  size = 'md',
  className = '',
  showFallbackIcon = true,
}: InstitutionLogoProps) {
  // Initialize state synchronously from cache to avoid flicker
  const initialState = getInitialLogoState(institutionName);
  const [logoSrc, setLogoSrc] = useState<string | null>(initialState.logoSrc);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [currentDomainIndex, setCurrentDomainIndex] = useState(initialState.domainIndex);
  // Track fallback level per domain: 0 = Clearbit, 1 = Logo.dev, 2 = Google Favicon
  const fallbackLevelForCurrentDomain = useRef(0);
  const isMounted = useRef(true);
  const prevInstitutionName = useRef(institutionName);
  const domainsRef = useRef<string[]>([]);

  // Size configurations - matching CompanyLogo style
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-16 w-16',
  };

  const logoSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-sm',
    xl: 'text-xl',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-8 h-8',
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only run if institutionName actually changed
    if (prevInstitutionName.current === institutionName) {
      return;
    }
    prevInstitutionName.current = institutionName;

    if (!institutionName) {
      setIsLoading(false);
      setLogoSrc(null);
      setCurrentDomainIndex(0);
      domainsRef.current = [];
      return;
    }

    const cacheKey = institutionName.toLowerCase().trim();

    // Check cache
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setLogoSrc(cached.url);
      setIsLoading(false);
      return;
    }

    // Get all possible domains to try
    const domains = getSchoolDomainVariants(institutionName);
    domainsRef.current = domains;

    if (domains.length === 0) {
      setLogoSrc(null);
      setIsLoading(false);
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
      return;
    }

    // Reset state for new load
    fallbackLevelForCurrentDomain.current = 0;
    setCurrentDomainIndex(0);
    setIsLoading(true);

    // Try Clearbit first with the first domain
    const clearbitUrl = getClearbitUrl(domains[0]);
    setLogoSrc(clearbitUrl);
  }, [institutionName]);

  const handleLogoError = () => {
    if (!isMounted.current) return;

    const domains = domainsRef.current;
    const currentDomain = domains[currentDomainIndex];

    if (!currentDomain) {
      // No more domains to try
      setLogoSrc(null);
      setIsLoading(false);
      const cacheKey = institutionName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
      return;
    }

    // Fallback cascade for current domain: Clearbit (0) → Logo.dev (1) → Google Favicon (2)
    fallbackLevelForCurrentDomain.current += 1;

    if (fallbackLevelForCurrentDomain.current === 1) {
      // Try Logo.dev
      const logoDevUrl = getLogoDevUrl(currentDomain);
      setLogoSrc(logoDevUrl);
      return;
    }

    if (fallbackLevelForCurrentDomain.current === 2) {
      // Try Google Favicon
      const googleUrl = getGoogleFaviconUrl(currentDomain);
      setLogoSrc(googleUrl);
      return;
    }

    // All fallbacks failed for this domain, try next domain
    const nextIndex = currentDomainIndex + 1;

    if (nextIndex < domains.length) {
      // Reset fallback level and try next domain with Clearbit
      fallbackLevelForCurrentDomain.current = 0;
      setCurrentDomainIndex(nextIndex);
      const clearbitUrl = getClearbitUrl(domains[nextIndex]);
      setLogoSrc(clearbitUrl);
    } else {
      // All domains exhausted, use fallback
      setLogoSrc(null);
      setIsLoading(false);

      // Cache the negative result
      const cacheKey = institutionName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
    }
  };

  const handleLogoLoad = () => {
    if (!isMounted.current) return;

    setIsLoading(false);

    // Cache the successful URL
    if (logoSrc) {
      const cacheKey = institutionName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: logoSrc, timestamp: Date.now() });
    }
  };

  const initials = getSchoolInitials(institutionName);

  return (
    <div
      className={`${sizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-[#2A2A2E] ${className}`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${institutionName} logo`}
          onError={handleLogoError}
          onLoad={handleLogoLoad}
          className={`${logoSizeClasses[size]} rounded object-contain`}
        />
      ) : showFallbackIcon ? (
        initials.length <= 3 ? (
          <span className={`${textSizeClasses[size]} font-semibold text-gray-600 dark:text-gray-400`}>
            {initials}
          </span>
        ) : (
          <GraduationCap className={`${iconSizes[size]} text-gray-600 dark:text-gray-400`} />
        )
      ) : null}
    </div>
  );
}

export default InstitutionLogo;
