import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { SEOArticleConfig } from '../../services/blogAI';

interface AIArticleGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: SEOArticleConfig) => Promise<void>;
    isGenerating: boolean;
}

const AUDIENCE_OPTIONS = [
    { value: 'job_seekers', label: 'Chercheurs d\'emploi', labelEn: 'Job Seekers' },
    { value: 'hr_professionals', label: 'RH / Recruteurs', labelEn: 'HR / Recruiters' },
    { value: 'career_coaches', label: 'Coachs carrière', labelEn: 'Career Coaches' },
    { value: 'general', label: 'Public général', labelEn: 'General' },
] as const;

const LENGTH_OPTIONS = [
    { value: 'short', label: 'Court', time: '5 min' },
    { value: 'medium', label: 'Moyen', time: '8 min' },
    { value: 'long', label: 'Long', time: '15 min' },
] as const;

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professionnel' },
    { value: 'casual', label: 'Décontracté' },
    { value: 'authoritative', label: 'Expert' },
    { value: 'friendly', label: 'Chaleureux' },
] as const;

export default function AIArticleGeneratorModal({
    isOpen,
    onClose,
    onGenerate,
    isGenerating
}: AIArticleGeneratorModalProps) {
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [audience, setAudience] = useState<SEOArticleConfig['targetAudience']>('job_seekers');
    const [length, setLength] = useState<SEOArticleConfig['articleLength']>('medium');
    const [language, setLanguage] = useState<SEOArticleConfig['language']>('fr');
    const [tone, setTone] = useState<SEOArticleConfig['tone']>('professional');

    const handleSubmit = async () => {
        if (!topic.trim()) return;

        const config: SEOArticleConfig = {
            topic: topic.trim(),
            targetKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            targetAudience: audience,
            articleLength: length,
            language,
            tone
        };

        await onGenerate(config);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop - Notion style subtle overlay */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Modal - Notion style clean white */}
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* Header - Minimal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h2 className="text-[15px] font-semibold text-gray-900">
                            Générer un article SEO
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content - Notion-style form */}
                <div className="px-6 py-5 space-y-5">
                    {/* Topic */}
                    <div>
                        <label className="block text-[13px] font-medium text-gray-500 mb-1.5">
                            Sujet de l'article
                        </label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Comment décrocher un job en 2025..."
                            className="w-full px-3 py-2 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all placeholder:text-gray-400"
                            autoFocus
                        />
                    </div>

                    {/* Keywords */}
                    <div>
                        <label className="block text-[13px] font-medium text-gray-500 mb-1.5">
                            Mots-clés SEO
                        </label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="CV, entretien, recruteur, LinkedIn..."
                            className="w-full px-3 py-2 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all placeholder:text-gray-400"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">
                            Séparez par des virgules
                        </p>
                    </div>

                    {/* Grid: Audience + Length */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Audience */}
                        <div>
                            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">
                                Audience
                            </label>
                            <select
                                value={audience}
                                onChange={(e) => setAudience(e.target.value as SEOArticleConfig['targetAudience'])}
                                className="w-full px-3 py-2 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all appearance-none cursor-pointer"
                            >
                                {AUDIENCE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Length */}
                        <div>
                            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">
                                Longueur
                            </label>
                            <div className="flex gap-1 p-1 bg-gray-100 rounded-md">
                                {LENGTH_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setLength(option.value)}
                                        className={`flex-1 py-1.5 text-[12px] font-medium rounded transition-all ${length === option.value
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid: Language + Tone */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Language */}
                        <div>
                            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">
                                Langue
                            </label>
                            <div className="flex gap-1 p-1 bg-gray-100 rounded-md">
                                <button
                                    onClick={() => setLanguage('fr')}
                                    className={`flex-1 py-1.5 text-[12px] font-medium rounded transition-all ${language === 'fr'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    🇫🇷 Français
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`flex-1 py-1.5 text-[12px] font-medium rounded transition-all ${language === 'en'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    🇬🇧 English
                                </button>
                            </div>
                        </div>

                        {/* Tone */}
                        <div>
                            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">
                                Ton
                            </label>
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value as SEOArticleConfig['tone'])}
                                className="w-full px-3 py-2 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all appearance-none cursor-pointer"
                            >
                                {TONE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer - Minimal */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[11px] text-gray-400">
                        Génère titre, contenu, image et SEO
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!topic.trim() || isGenerating}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-[13px] font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Générer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
