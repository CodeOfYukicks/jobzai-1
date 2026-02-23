import { useState } from 'react';
import { X, Sparkles, Loader2, Globe, Search, FileText } from 'lucide-react';
import { SEOArticleConfig } from '../../services/blogAI';
import { getTrendingTopics } from '../../services/perplexity';
import { findTrendingNews } from '../../services/perplexity';

interface CreateNewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: SEOArticleConfig, newsContext: string) => Promise<void>;
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

export default function CreateNewsModal({
    isOpen,
    onClose,
    onGenerate,
    isGenerating
}: CreateNewsModalProps) {
    const [step, setStep] = useState<'topic' | 'review'>('topic');
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [audience, setAudience] = useState<SEOArticleConfig['targetAudience']>('job_seekers');
    const [length, setLength] = useState<SEOArticleConfig['articleLength']>('medium');
    const [language, setLanguage] = useState<SEOArticleConfig['language']>('fr');
    const [tone, setTone] = useState<SEOArticleConfig['tone']>('professional');

    // News specific states
    const [isSearching, setIsSearching] = useState(false);
    const [newsSummary, setNewsSummary] = useState('');

    // Suggestion states
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);

    const handleSuggest = async () => {
        setIsSuggesting(true);
        try {
            const topics = await getTrendingTopics('Recrutement, Carrière, Future of Work', language);
            setSuggestedTopics(topics);
        } catch (error) {
            console.error('Failed to suggest topics:', error);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSearch = async () => {
        if (!topic.trim()) return;

        setIsSearching(true);
        try {
            const summary = await findTrendingNews(topic, language);
            setNewsSummary(summary);
            setStep('review');
        } catch (error) {
            console.error('Search failed:', error);
            alert('Failed to find news. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async () => {
        const config: SEOArticleConfig = {
            topic: topic.trim(),
            targetKeywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            targetAudience: audience,
            articleLength: length,
            language,
            tone
        };

        await onGenerate(config, newsSummary);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">
                                {language === 'fr' ? 'Actualités & Tendances' : 'News & Trends'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {language === 'fr' ? 'Propulsé par Perplexity + GPT-5' : 'Powered by Perplexity + GPT-5'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {step === 'topic' ? (
                        <>
                            {/* Topic Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {language === 'fr' ? 'Sujet d\'actualité' : 'News Topic'}
                                </label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder={language === 'fr' ? 'Ex: IA dans le recrutement, Marché du travail 2025...' : 'Ex: AI in recruiting, Job market 2025...'}
                                            className="w-full pl-10 pr-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>

                                    {/* Suggestions Area */}
                                    <div>
                                        {suggestedTopics.length > 0 ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        {language === 'fr' ? 'Idées tendances' : 'Trending Ideas'}
                                                    </span>
                                                    <button
                                                        onClick={() => setSuggestedTopics([])}
                                                        className="text-xs text-gray-400 hover:text-gray-600"
                                                    >
                                                        {language === 'fr' ? 'Masquer' : 'Hide'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {suggestedTopics.map((t, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setTopic(t)}
                                                            className="text-left px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleSuggest}
                                                disabled={isSuggesting}
                                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {isSuggesting ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3" />
                                                )}
                                                {isSuggesting ? (language === 'fr' ? 'Recherche d\'idées...' : 'Searching for ideas...') : (language === 'fr' ? 'Suggérer des sujets tendances' : 'Suggest trending topics')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                                    <Globe className="w-3 h-3 text-gray-400" />
                                    {language === 'fr' ? 'Perplexity va scanner le web pour les infos récentes sur ce sujet.' : 'Perplexity will scan the web for recent info on this topic.'}
                                </p>
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? 'Langue' : 'Language'}
                                    </label>
                                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                                        <button
                                            onClick={() => setLanguage('fr')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${language === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Français
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            English
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? 'Audience' : 'Audience'}
                                    </label>
                                    <select
                                        value={audience}
                                        onChange={(e) => setAudience(e.target.value as SEOArticleConfig['targetAudience'])}
                                        className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                    >
                                        {AUDIENCE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {language === 'fr' ? option.label : option.labelEn}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? 'Longueur' : 'Length'}
                                    </label>
                                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                                        {LENGTH_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setLength(option.value)}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${length === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Review Step
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    {language === 'fr' ? 'Résultats de recherche' : 'Search Results'}
                                </h3>
                                <textarea
                                    value={newsSummary}
                                    onChange={(e) => setNewsSummary(e.target.value)}
                                    rows={8}
                                    className="w-full text-sm text-blue-800 bg-transparent border-0 p-0 focus:ring-0 resize-none font-medium leading-relaxed"
                                />
                                <p className="mt-2 text-xs text-blue-600/70 border-t border-blue-200/50 pt-2">
                                    {language === 'fr' ? 'Vous pouvez éditer ce résumé avant de générer l\'article.' : 'You can edit this summary before generating the article.'}
                                </p>
                            </div>

                            {/* Additional SEO settings for step 2 */}
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? 'Mots-clés cibles' : 'Target Keywords'}
                                    </label>
                                    <input
                                        type="text"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder={language === 'fr' ? 'Ex: recrutement, avenir...' : 'Ex: recruiting, future...'}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? 'Ton' : 'Tone'}
                                    </label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as SEOArticleConfig['tone'])}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        {TONE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                    {step === 'topic' ? (
                        <>
                            <p className="text-xs text-gray-500">
                                {language === 'fr' ? 'Étape 1/2 : Recherche d\'actualités' : 'Step 1/2: News Research'}
                            </p>
                            <button
                                onClick={handleSearch}
                                disabled={!topic.trim() || isSearching}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {language === 'fr' ? 'Recherche en cours...' : 'Searching...'}
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4" />
                                        {language === 'fr' ? 'Rechercher l\'actualité' : 'Search News'}
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep('topic')}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                {language === 'fr' ? 'Retour' : 'Back'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-900/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {language === 'fr' ? 'Rédaction...' : 'Writing...'}
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-4 h-4" />
                                        {language === 'fr' ? 'Générer l\'Article' : 'Generate Article'}
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
