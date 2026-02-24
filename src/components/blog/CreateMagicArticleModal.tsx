import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Globe, FileText, Clock, Check, Image as ImageIcon, Calendar, Zap } from 'lucide-react';
import CoverPhotoGallery from '../profile/CoverPhotoGallery';

interface CreateMagicArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (type: 'standard' | 'news', language: 'fr' | 'en', publishMode: 'publish' | 'draft' | 'schedule', scheduledAt?: Date) => Promise<{ id: string, title: string } | null>;
    onUploadImage?: (file: File) => Promise<string | null>;
    onUpdatePost?: (postId: string, data: any) => Promise<void>;
}

export default function CreateMagicArticleModal({
    isOpen,
    onClose,
    onGenerate,
    onUploadImage,
    onUpdatePost
}: CreateMagicArticleModalProps) {
    const [step, setStep] = useState<'config' | 'generating' | 'success'>('config');
    const [createdPostId, setCreatedPostId] = useState<string | null>(null);
    const [createdPostTitle, setCreatedPostTitle] = useState<string | null>(null);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);
    const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    // Config
    const [articleType, setArticleType] = useState<'standard' | 'news'>('standard');
    const [language, setLanguage] = useState<'fr' | 'en'>('fr');

    // Action phases during generation
    const [generationPhase, setGenerationPhase] = useState(0);

    // Scheduling states for success view
    const [publishMode, setPublishMode] = useState<'publish' | 'draft' | 'schedule'>('publish');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'generating') {
            setGenerationPhase(0);
            interval = setInterval(() => {
                setGenerationPhase(prev => (prev < 2 ? prev + 1 : prev));
            }, 8000); // Change phrase every 8 seconds
        }
        return () => clearInterval(interval);
    }, [step]);

    const handleSubmit = async () => {
        setStep('generating');

        try {
            const result = await onGenerate(articleType, language, 'draft'); // Default to draft for magic
            if (result) {
                setCreatedPostId(result.id);
                setCreatedPostTitle(result.title);
                setStep('success');
            } else {
                setStep('config');
            }
        } catch (error) {
            console.error(error);
            setStep('config');
        }
    };

    const handleImageUploadBlob = async (blob: Blob) => {
        if (!createdPostId || !onUploadImage || !onUpdatePost) return;

        setIsUpdatingImage(true);
        try {
            const file = new File([blob], "custom-cover.jpg", { type: blob.type || "image/jpeg" });
            const url = await onUploadImage(file);
            if (url) {
                await onUpdatePost(createdPostId, { image: url });
                alert(language === 'fr' ? 'Image ajoutée avec succès !' : 'Image uploaded successfully!');
            }
        } catch (error) {
            console.error('Failed to upload image', error);
            alert('Failed to upload image');
        } finally {
            setIsUpdatingImage(false);
            setShowGallery(false);
        }
    };

    const handleReschedule = async () => {
        if (!createdPostId || !onUpdatePost) return;

        setIsUpdatingSchedule(true);
        try {
            let statusToSave = 'draft';
            let scheduledAtTimestamp = null;

            if (publishMode === 'publish') statusToSave = 'published';
            if (publishMode === 'schedule' && scheduleDate && scheduleTime) {
                statusToSave = 'scheduled';
                scheduledAtTimestamp = new Date(`${scheduleDate}T${scheduleTime}`);
            }

            const updateData: any = { status: statusToSave };
            if (scheduledAtTimestamp) updateData.scheduledAt = scheduledAtTimestamp;
            else updateData.scheduledAt = null;

            await onUpdatePost(createdPostId, updateData);
            alert(language === 'fr' ? 'Agenda mis à jour !' : 'Schedule updated successfully!');
        } catch (error) {
            console.error('Failed to reschedule', error);
            alert('Failed to update schedule');
        } finally {
            setIsUpdatingSchedule(false);
        }
    };

    if (!isOpen) return null;

    const generatingPhrasesFr = [
        "🧠 Notre IA réfléchit à un sujet ultra-tendance...",
        "🔍 Recherche des meilleures données en cours...",
        "✍️ Rédaction experte de l'article...",
        "✨ Finitions et optimisation SEO..."
    ];

    const generatingPhrasesEn = [
        "🧠 Our AI is brainstorming a viral topic...",
        "🔍 Researching the latest data...",
        "✍️ Writing the article organically...",
        "✨ Finalizing SEO optimization..."
    ];

    const currentPhrases = language === 'fr' ? generatingPhrasesFr : generatingPhrasesEn;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-inner">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">
                                {language === 'fr' ? 'AutoPilot Article' : 'AutoPilot Article'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {language === 'fr' ? '1-clic magique par l\'IA' : '1-click AI magic'}
                            </p>
                        </div>
                    </div>
                    {step !== 'generating' && (
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {step === 'config' && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500">
                                {language === 'fr'
                                    ? 'C\'est l\'heure de la magie. Choisissez le format, on s\'occupe de l\'idée, de la recherche et de la rédaction.'
                                    : 'Time for magic. Pick the format, we handle the ideation, research, and writing.'}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? 'Format de l\'article' : 'Article Format'}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setArticleType('standard')}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${articleType === 'standard'
                                                ? 'border-indigo-500 bg-indigo-50/50'
                                                : 'border-gray-200 bg-white hover:border-indigo-200'}`}
                                        >
                                            <FileText className={`w-6 h-6 mb-2 ${articleType === 'standard' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <div className={`font-bold ${articleType === 'standard' ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                {language === 'fr' ? 'Standard / Guide' : 'Standard / Guide'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {language === 'fr' ? 'Conseils CV, carrière, entretiens.' : 'Resumes, career, interviews.'}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setArticleType('news')}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${articleType === 'news'
                                                ? 'border-indigo-500 bg-indigo-50/50'
                                                : 'border-gray-200 bg-white hover:border-indigo-200'}`}
                                        >
                                            <Globe className={`w-6 h-6 mb-2 ${articleType === 'news' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            <div className={`font-bold ${articleType === 'news' ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                {language === 'fr' ? 'News Tendance' : 'Trending News'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {language === 'fr' ? 'Actu RH chaude via Perplexity.' : 'Hot HR news via Perplexity.'}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
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
                            </div>
                        </div>
                    )}

                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center text-center py-12 space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border border-indigo-100 relative z-10 animate-bounce">
                                    <Sparkles className="w-10 h-10 text-indigo-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {language === 'fr' ? 'Génération Magique...' : 'Magic Generation...'}
                                </h3>
                                <div className="h-6">
                                    <p className="text-sm font-medium text-indigo-600 animate-in fade-in slide-in-from-bottom-2" key={generationPhase}>
                                        {currentPhrases[Math.min(generationPhase, currentPhrases.length - 1)]}
                                    </p>
                                </div>
                            </div>

                            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-[progress_20s_ease-in-out_infinite]"></div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center text-center py-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                <Check className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {language === 'fr' ? 'Article généré avec succès !' : 'Article successfully generated!'}
                                </h3>
                                {createdPostTitle && (
                                    <p className="text-sm font-medium text-indigo-600 items-center justify-center mb-3 bg-indigo-50 py-1.5 px-3 rounded-full inline-flex max-w-[90%] break-words leading-tight">
                                        ✨ {createdPostTitle}
                                    </p>
                                )}
                                <p className="text-gray-500">
                                    {language === 'fr'
                                        ? 'Votre chef d\'œuvre est prêt ! Que souhaitez-vous faire ensuite ?'
                                        : 'Your masterpiece is ready! What would you like to do next?'}
                                </p>
                            </div>

                            <div className="w-full space-y-4 pt-4 border-t border-gray-100">
                                {/* Image Upload */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {language === 'fr' ? 'Ajouter une image' : 'Add Cover Image'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {language === 'fr' ? 'Personnalisez l\'image générée' : 'Override the AI-generated image'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowGallery(true)}
                                        disabled={isUpdatingImage}
                                        className="cursor-pointer px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        {isUpdatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'fr' ? 'Parcourir' : 'Browse'}
                                    </button>
                                </div>

                                {/* Reschedule */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPublishMode('publish')}
                                            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${publishMode === 'publish'
                                                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Sparkles className={`w-4 h-4 mb-1 ${publishMode === 'publish' ? 'text-indigo-500' : 'text-gray-400'}`} />
                                            <span className="text-xs font-semibold">{language === 'fr' ? 'Maintenant' : 'Publish Now'}</span>
                                        </button>
                                        <button
                                            onClick={() => setPublishMode('draft')}
                                            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${publishMode === 'draft'
                                                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <FileText className={`w-4 h-4 mb-1 ${publishMode === 'draft' ? 'text-indigo-500' : 'text-gray-400'}`} />
                                            <span className="text-xs font-semibold">{language === 'fr' ? 'Brouillon' : 'Draft'}</span>
                                        </button>
                                        <button
                                            onClick={() => setPublishMode('schedule')}
                                            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${publishMode === 'schedule'
                                                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Clock className={`w-4 h-4 mb-1 ${publishMode === 'schedule' ? 'text-indigo-500' : 'text-gray-400'}`} />
                                            <span className="text-xs font-semibold">{language === 'fr' ? 'Programmer' : 'Schedule'}</span>
                                        </button>
                                    </div>

                                    {publishMode === 'schedule' && (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                            <input
                                                type="date"
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            />
                                            <input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={(e) => setScheduleTime(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleReschedule}
                                        disabled={isUpdatingSchedule || (publishMode === 'schedule' && (!scheduleDate || !scheduleTime))}
                                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors flex items-center justify-center"
                                    >
                                        {isUpdatingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'fr' ? 'Enregistrer le statut' : 'Update status'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
                    {step === 'config' ? (
                        <button
                            onClick={handleSubmit}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Zap className="w-4 h-4" />
                            {language === 'fr' ? 'Lancer l\'AutoPilot' : 'Launch AutoPilot'}
                        </button>
                    ) : step === 'success' ? (
                        <button
                            onClick={onClose}
                            className="w-full flex justify-center items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-all shadow-lg shadow-gray-900/20"
                        >
                            {language === 'fr' ? 'Fermer & Terminer' : 'Close & Finish'}
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Gallery Modal */}
            <CoverPhotoGallery
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                onSelectBlob={handleImageUploadBlob}
            />
        </div>
    );
}
