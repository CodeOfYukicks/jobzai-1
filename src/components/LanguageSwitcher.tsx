import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
    scrolled?: boolean;
}

export default function LanguageSwitcher({ scrolled = false }: LanguageSwitcherProps) {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (lang: 'en' | 'fr') => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 px-2 py-1.5 text-sm font-medium transition-colors ${scrolled ? 'text-gray-900 hover:text-gray-600' : 'text-white hover:text-white/80'
                    }`}
                aria-label="Change language"
            >
                <span className="uppercase">{language}</span>
                <svg
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[60px] z-50">
                    <button
                        onClick={() => handleSelect('en')}
                        className={`w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 transition-colors ${language === 'en' ? 'font-semibold text-gray-900' : 'text-gray-600'
                            }`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => handleSelect('fr')}
                        className={`w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 transition-colors ${language === 'fr' ? 'font-semibold text-gray-900' : 'text-gray-600'
                            }`}
                    >
                        FR
                    </button>
                </div>
            )}
        </div>
    );
}
