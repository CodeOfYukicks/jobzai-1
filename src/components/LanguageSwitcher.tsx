import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

// Stylized flag components
const UKFlag = () => (
    <svg viewBox="0 0 60 30" className="w-5 h-3.5 rounded-sm overflow-hidden">
        <clipPath id="uk">
            <rect width="60" height="30" rx="2" />
        </clipPath>
        <g clipPath="url(#uk)">
            <rect width="60" height="30" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
        </g>
    </svg>
);

const FRFlag = () => (
    <svg viewBox="0 0 60 40" className="w-5 h-3.5 rounded-sm overflow-hidden">
        <rect width="20" height="40" fill="#002654" />
        <rect x="20" width="20" height="40" fill="#fff" />
        <rect x="40" width="20" height="40" fill="#CE1126" />
    </svg>
);

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-gray-200/60">
            <button
                onClick={() => setLanguage('en')}
                className={`relative flex items-center justify-center w-8 h-7 rounded-full transition-all duration-200 ${language === 'en'
                    ? ''
                    : 'opacity-50 hover:opacity-75'
                    }`}
                aria-label="Switch to English"
            >
                {language === 'en' && (
                    <motion.div
                        layoutId="langIndicator"
                        className="absolute inset-0 bg-gray-100 rounded-full shadow-sm"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                )}
                <span className="relative z-10">
                    <UKFlag />
                </span>
            </button>
            <button
                onClick={() => setLanguage('fr')}
                className={`relative flex items-center justify-center w-8 h-7 rounded-full transition-all duration-200 ${language === 'fr'
                    ? ''
                    : 'opacity-50 hover:opacity-75'
                    }`}
                aria-label="Switch to French"
            >
                {language === 'fr' && (
                    <motion.div
                        layoutId="langIndicator"
                        className="absolute inset-0 bg-gray-100 rounded-full shadow-sm"
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                )}
                <span className="relative z-10">
                    <FRFlag />
                </span>
            </button>
        </div>
    );
}
