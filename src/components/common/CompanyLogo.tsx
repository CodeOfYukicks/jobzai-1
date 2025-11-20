import { useState, useEffect, useRef } from 'react';
import { getCompanyDomain, getClearbitUrl, getGoogleFaviconUrl, getCompanyInitials } from '../../utils/logo';

interface CompanyLogoProps {
  companyName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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

export function CompanyLogo({
  companyName,
  size = 'md',
  className = '',
  showInitials = true,
}: CompanyLogoProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const triedGoogle = useRef(false);
  const isMounted = useRef(true);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
    xl: 'h-16 w-16',
  };

  const logoSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-sm',
    xl: 'text-xl',
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!companyName) {
      setIsLoading(false);
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

  return (
    <div
      className={`${sizeClasses[size]} rounded flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-[#2A2A2E] ${className}`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${companyName} logo`}
          onError={handleLogoError}
          onLoad={handleLogoLoad}
          className={`${logoSizeClasses[size]} rounded object-cover`}
        />
      ) : showInitials ? (
        <span className={`${textSizeClasses[size]} font-semibold text-gray-600 dark:text-gray-400`}>
          {initials}
        </span>
      ) : null}
    </div>
  );
}

