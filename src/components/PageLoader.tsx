import { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export default function PageLoader() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const prevPathnameRef = useRef<string>(location.pathname);

  // Charger le logo depuis Firebase Storage
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const storage = getStorage();
        const logoRef = ref(storage, 'images/logo-only.png');
        const url = await getDownloadURL(logoRef);
        setLogoUrl(url);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    };

    loadLogo();
  }, []);

  // Utiliser useLayoutEffect pour déclencher l'animation de manière synchrone (avant le paint)
  useLayoutEffect(() => {
    // Vérifier si le pathname a changé
    if (prevPathnameRef.current !== location.pathname) {
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

  if (!logoUrl) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white dark:bg-gray-900"
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
            src={logoUrl}
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

