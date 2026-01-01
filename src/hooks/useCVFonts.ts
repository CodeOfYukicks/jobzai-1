import { useEffect, useState } from 'react';

// CV Editor fonts - loaded only when CV editor pages are visited
const CV_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Montserrat:wght@300;400;500;600;700;800&family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&family=Merriweather:wght@300;400;700;900&family=Poppins:wght@300;400;500;600;700;800&family=Source+Sans+Pro:wght@300;400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Inter+Tight:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';

let fontsLoaded = false;
let fontsLoadPromise: Promise<void> | null = null;

/**
 * Lazy-loads CV editor fonts (Playfair, Merriweather, Lora, etc.)
 * Only loads once, subsequent calls are no-ops
 */
export function loadCVFonts(): Promise<void> {
    if (fontsLoaded) {
        return Promise.resolve();
    }

    if (fontsLoadPromise) {
        return fontsLoadPromise;
    }

    fontsLoadPromise = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CV_FONTS_URL;
        link.onload = () => {
            fontsLoaded = true;
            resolve();
        };
        link.onerror = () => {
            fontsLoadPromise = null;
            reject(new Error('Failed to load CV fonts'));
        };
        document.head.appendChild(link);
    });

    return fontsLoadPromise;
}

/**
 * React hook to lazy-load CV fonts
 * Returns loading state so components can show fallback while loading
 */
export function useCVFonts(): { isLoading: boolean; isLoaded: boolean } {
    const [isLoading, setIsLoading] = useState(!fontsLoaded);
    const [isLoaded, setIsLoaded] = useState(fontsLoaded);

    useEffect(() => {
        if (fontsLoaded) {
            setIsLoaded(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        loadCVFonts()
            .then(() => {
                setIsLoaded(true);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, []);

    return { isLoading, isLoaded };
}

export default useCVFonts;
