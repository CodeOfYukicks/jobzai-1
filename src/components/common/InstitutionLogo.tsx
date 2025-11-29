import { useState, useEffect, useRef } from 'react';
import { GraduationCap } from 'lucide-react';
import { getSchoolDomain, getClearbitUrl, getGoogleFaviconUrl, getSchoolInitials } from '../../utils/logo';

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
const getInitialLogoState = (institutionName: string): { logoSrc: string | null; isLoading: boolean } => {
  if (!institutionName) {
    return { logoSrc: null, isLoading: false };
  }
  
  const cacheKey = institutionName.toLowerCase().trim();
  const cached = urlCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { logoSrc: cached.url, isLoading: false };
  }
  
  const schoolDomain = getSchoolDomain(institutionName);
  if (!schoolDomain) {
    return { logoSrc: null, isLoading: false };
  }
  
  // Return Clearbit URL to try first
  return { logoSrc: getClearbitUrl(schoolDomain), isLoading: true };
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
  const triedGoogle = useRef(false);
  const isMounted = useRef(true);
  const prevInstitutionName = useRef(institutionName);

  // Size configurations for premium look
  const containerSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const logoSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
    xl: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-lg',
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

    // Reset state for new load
    triedGoogle.current = false;
    setIsLoading(true);

    const schoolDomain = getSchoolDomain(institutionName);
    if (!schoolDomain) {
      setLogoSrc(null);
      setIsLoading(false);
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
      return;
    }

    // Try Clearbit first
    const clearbitUrl = getClearbitUrl(schoolDomain);
    setLogoSrc(clearbitUrl);
  }, [institutionName]);

  const handleLogoError = () => {
    if (!isMounted.current) return;

    const schoolDomain = getSchoolDomain(institutionName);
    if (!schoolDomain) {
      setLogoSrc(null);
      setIsLoading(false);
      return;
    }

    // If haven't tried Google Favicon yet, try it
    if (!triedGoogle.current) {
      triedGoogle.current = true;
      const googleUrl = getGoogleFaviconUrl(schoolDomain);
      setLogoSrc(googleUrl);
    } else {
      // Both APIs failed, use fallback
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
      className={`
        ${containerSizes[size]} 
        rounded-xl 
        flex items-center justify-center 
        flex-shrink-0 
        transition-all duration-200
        ${logoSrc 
          ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm' 
          : 'bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700'
        }
        ${isLoading ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${institutionName} logo`}
          onError={handleLogoError}
          onLoad={handleLogoLoad}
          className={`${logoSizes[size]} rounded-lg object-contain`}
        />
      ) : showFallbackIcon ? (
        <div className="flex items-center justify-center">
          {initials.length <= 3 ? (
            <span className={`${textSizes[size]} font-bold text-white tracking-tight`}>
              {initials}
            </span>
          ) : (
            <GraduationCap className={`${iconSizes[size]} text-white`} />
          )}
        </div>
      ) : null}
    </div>
  );
}

export default InstitutionLogo;


