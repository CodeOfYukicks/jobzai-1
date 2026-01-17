import { useLanguage } from '../contexts/LanguageContext';
import en from '../i18n/en.json';
import fr from '../i18n/fr.json';

type TranslationKeys = typeof en;

const translations: Record<'en' | 'fr', TranslationKeys> = {
    en,
    fr,
};

/**
 * Get a nested value from an object using a dot-notation path
 * Example: getNestedValue(obj, 'hero.headline1') => obj.hero.headline1
 */
function getNestedValue(obj: unknown, path: string): string {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return path; // Return the key as fallback
        }
        current = (current as Record<string, unknown>)[key];
    }

    if (typeof current === 'string') {
        return current;
    }

    return path; // Return the key as fallback
}

export function useTranslation() {
    const { language } = useLanguage();

    const t = (key: string): string => {
        const translation = getNestedValue(translations[language], key);
        return translation;
    };

    return { t, language };
}
