import { useState, useEffect, useRef } from 'react';
import { getCompanyDomain, getClearbitUrl, getLogoDevUrl, getGoogleFaviconUrl, getCompanyInitials, getCompanyGradient } from '../../utils/logo';

interface CompanyLogoProps {
  companyName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showInitials?: boolean;
}

// Cache en mémoire pour éviter les requêtes répétées
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

const urlCache = new Map<string, CacheEntry>();

// Helper function to get initial state from cache
const getInitialLogoState = (companyName: string): { logoSrc: string | null; isLoading: boolean } => {
  if (!companyName) {
    return { logoSrc: null, isLoading: false };
  }

  const cacheKey = companyName.toLowerCase().trim();
  const cached = urlCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { logoSrc: cached.url, isLoading: false };
  }

  const companyDomain = getCompanyDomain(companyName);
  if (!companyDomain) {
    return { logoSrc: null, isLoading: false };
  }

  // Return Clearbit URL to try first
  return { logoSrc: getClearbitUrl(companyDomain), isLoading: true };
};

export function CompanyLogo({
  companyName,
  size = 'md',
  className = '',
  showInitials = true,
}: CompanyLogoProps) {
  // Initialize state synchronously from cache to avoid flicker
  const initialState = getInitialLogoState(companyName);
  const [logoSrc, setLogoSrc] = useState<string | null>(initialState.logoSrc);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const isMounted = useRef(true);
  const prevCompanyName = useRef(companyName);
  // Track fallback level: 0 = Clearbit, 1 = Logo.dev, 2 = Google Favicon, 3 = Give up
  const fallbackLevel = useRef(0);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
    '2xl': 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only run if companyName actually changed
    if (prevCompanyName.current === companyName) {
      return;
    }
    prevCompanyName.current = companyName;

    if (!companyName) {
      setIsLoading(false);
      setLogoSrc(null);
      return;
    }

    const cacheKey = companyName.toLowerCase().trim();

    // Vérifier le cache
    const cached = urlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setLogoSrc(cached.url);
      setIsLoading(false);
      return;
    }

    // Reset l'état pour un nouveau chargement
    fallbackLevel.current = 0;
    setIsLoading(true);

    const companyDomain = getCompanyDomain(companyName);
    if (!companyDomain) {
      setLogoSrc(null);
      setIsLoading(false);
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
      return;
    }

    // Essayer Clearbit d'abord
    const clearbitUrl = getClearbitUrl(companyDomain);
    setLogoSrc(clearbitUrl);
  }, [companyName]);

  const handleLogoError = () => {
    if (!isMounted.current) return;

    const companyDomain = getCompanyDomain(companyName);
    if (!companyDomain) {
      setLogoSrc(null);
      setIsLoading(false);
      return;
    }

    // Fallback cascade: Clearbit (0) → Logo.dev (1) → Google Favicon (2) → Give up (3)
    fallbackLevel.current += 1;

    if (fallbackLevel.current === 1) {
      // Try Logo.dev
      const logoDevUrl = getLogoDevUrl(companyDomain);
      setLogoSrc(logoDevUrl);
    } else if (fallbackLevel.current === 2) {
      // Try Google Favicon
      const googleUrl = getGoogleFaviconUrl(companyDomain);
      setLogoSrc(googleUrl);
    } else {
      // All APIs failed, use gradient fallback with initials
      setLogoSrc(null);
      setIsLoading(false);

      // Cache the negative result
      const cacheKey = companyName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
    }
  };

  const handleLogoLoad = () => {
    if (!isMounted.current) return;

    setIsLoading(false);

    // Cache the URL that worked
    if (logoSrc) {
      const cacheKey = companyName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: logoSrc, timestamp: Date.now() });
    }
  };

  const initials = getCompanyInitials(companyName);
  const gradient = getCompanyGradient(companyName);

  // Premium square logo style - clean rounded corners, no border artifacts
  // When no logo is found, show a gradient background with initials (Notion/Linear style)
  return (
    <div
      className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 ${className}`}
      style={
        !logoSrc && showInitials
          ? { background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }
          : logoSrc
            ? { backgroundColor: 'white' }
            : undefined
      }
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${companyName} logo`}
          onError={handleLogoError}
          onLoad={handleLogoLoad}
          className="w-full h-full object-cover"
        />
      ) : showInitials ? (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`${textSizeClasses[size]} font-semibold text-white drop-shadow-sm`}>
            {initials}
          </span>
        </div>
      ) : null}
    </div>
  );
}

