import { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export default function PageLoader() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [darkLogoUrl, setDarkLogoUrl] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const prevPathnameRef = useRef<string>(location.pathname);

  // Détecter le mode sombre
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Observer les changements de classe sur le document
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Charger les logos depuis Firebase Storage
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const storage = getStorage();

        // Logo normal (light mode)
        const logoRef = ref(storage, 'images/logo-only.png');
        const url = await getDownloadURL(logoRef);
        setLogoUrl(url);

        // Logo dark mode
        try {
          const darkLogoRef = ref(storage, 'images/logo-only-dark.png');
          const darkUrl = await getDownloadURL(darkLogoRef);
          setDarkLogoUrl(darkUrl);
        } catch {
          // Si le logo dark n'existe pas, utiliser le logo normal
          setDarkLogoUrl(url);
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogos();
  }, []);

  // Utiliser useLayoutEffect pour déclencher l'animation de manière synchrone (avant le paint)
  useLayoutEffect(() => {
    // Routes à exclure de l'animation de chargement
    const EXCLUDED_PATHS = [
      '/resume-builder/new',
      '/resume-builder/tailor',
      '/cv-analysis'
    ];

    // Vérifier si le pathname a changé
    if (prevPathnameRef.current !== location.pathname) {
      // Si la nouvelle route OU l'ancienne route est dans les exclus, ne pas afficher le loader
      const isExcluded = EXCLUDED_PATHS.some(path => location.pathname === path) ||
        EXCLUDED_PATHS.some(path => prevPathnameRef.current === path);

      if (isExcluded) {
        prevPathnameRef.current = location.pathname;
        return;
      }

      // Démarrer l'animation immédiatement, de manière synchrone
      setIsLoading(true);
      prevPathnameRef.current = location.pathname;

      // Arrêter l'animation après la durée complète
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600); // Durée de l'animation

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const currentLogo = isDarkMode ? (darkLogoUrl || logoUrl) : logoUrl;

  if (!currentLogo) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white dark:bg-[#333234]"
          style={{
            pointerEvents: 'auto',
            willChange: 'opacity',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <motion.img
            src={currentLogo}
            alt="Logo"
            className="w-16 h-16 object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [0.8, 1.1, 1],
              opacity: [0, 1, 1],
            }}
            exit={{
              scale: 0.9,
              opacity: 0,
            }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
              scale: {
                times: [0, 0.5, 1],
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

