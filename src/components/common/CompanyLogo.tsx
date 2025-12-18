import { useState, useEffect, useRef } from 'react';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl, getCompanyInitials } from '../../utils/logo';

interface CompanyLogoProps {
  companyName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showInitials?: boolean;
}

// Cache en mémoire pour éviter les requêtes répétées
const logoCache = new Map<string, string | null>();
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
  const triedGoogle = useRef(false);
  const isMounted = useRef(true);
  const prevCompanyName = useRef(companyName);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
    '2xl': 'h-16 w-16',
  };

  const logoSizeClasses = {
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
    triedGoogle.current = false;
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

    // Si on n'a pas encore essayé Google Favicon, l'essayer
    if (!triedGoogle.current) {
      triedGoogle.current = true;
      const googleUrl = getGoogleFaviconUrl(companyDomain);
      setLogoSrc(googleUrl);
    } else {
      // Les deux APIs ont échoué, utiliser les initiales
      setLogoSrc(null);
      setIsLoading(false);
      
      // Mettre en cache le résultat négatif
      const cacheKey = companyName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: null, timestamp: Date.now() });
    }
  };

  const handleLogoLoad = () => {
    if (!isMounted.current) return;
    
    setIsLoading(false);
    
    // Mettre en cache l'URL qui a fonctionné
    if (logoSrc) {
      const cacheKey = companyName.toLowerCase().trim();
      urlCache.set(cacheKey, { url: logoSrc, timestamp: Date.now() });
    }
  };

  const initials = getCompanyInitials(companyName);

  // Premium square logo style - logo fills the entire container with rounded corners
  return (
    <div
      className={`${sizeClasses[size]} rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#2b2a2c] border border-gray-200 dark:border-[#3d3c3e] ${className}`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${companyName} logo`}
          onError={handleLogoError}
          onLoad={handleLogoLoad}
          className={`${logoSizeClasses[size]} object-contain`}
        />
      ) : showInitials ? (
        <span className={`${textSizeClasses[size]} font-bold text-gray-700 dark:text-gray-300`}>
          {initials}
        </span>
      ) : null}
    </div>
  );
}

