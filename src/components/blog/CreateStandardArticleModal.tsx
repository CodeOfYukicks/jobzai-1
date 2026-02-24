import { useState } from 'react';
import { X, Sparkles, Loader2, FileText, Clock, Check, Image as ImageIcon, Calendar } from 'lucide-react';
import { SEOArticleConfig } from '../../services/blogAI';
import CoverPhotoGallery from '../profile/CoverPhotoGallery';

interface CreateStandardArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: SEOArticleConfig, publishMode: 'publish' | 'draft' | 'schedule', scheduledAt?: Date) => Promise<{ id: string, title: string } | null>;
    onUploadImage?: (file: File) => Promise<string | null>;
    onUpdatePost?: (postId: string, data: any) => Promise<void>;
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

export default function CreateStandardArticleModal({
    isOpen,
    onClose,
    onGenerate,
    onUploadImage,
    onUpdatePost,
    isGenerating
}: CreateStandardArticleModalProps) {
    const [step, setStep] = useState<'config' | 'success'>('config');
    const [createdPostId, setCreatedPostId] = useState<string | null>(null);
    const [createdPostTitle, setCreatedPostTitle] = useState<string | null>(null);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);
    const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [audience, setAudience] = useState<SEOArticleConfig['targetAudience']>('job_seekers');
    const [length, setLength] = useState<SEOArticleConfig['articleLength']>('medium');
    const [language, setLanguage] = useState<SEOArticleConfig['language']>('fr');
    const [tone, setTone] = useState<SEOArticleConfig['tone']>('professional');

    // Scheduling states
    const [publishMode, setPublishMode] = useState<'publish' | 'draft' | 'schedule'>('publish');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

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

        let scheduledAtDate: Date | undefined = undefined;
        if (publishMode === 'schedule' && scheduleDate && scheduleTime) {
            scheduledAtDate = new Date(`${scheduleDate}T${scheduleTime}`);
        }

        const result = await onGenerate(config, publishMode, scheduledAtDate);
        if (result) {
            setCreatedPostId(result.id);
            setCreatedPostTitle(result.title);
            setStep('success');
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
            else updateData.scheduledAt = null; // Clear if not scheduled

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
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">
                                {language === 'fr' ? 'Article Standard' : 'Standard Article'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {language === 'fr' ? 'Propulsé par GPT-5' : 'Powered by GPT-5'}
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
                    {step === 'config' && (
                        <div className="space-y-6">
                            {/* Topic Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {language === 'fr' ? 'Sujet de l\'article' : 'Article Topic'}
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    rows={4}
                                    placeholder={language === 'fr' ? 'Ex: Les 5 tendances du recrutement en 2025. Décris ce que tu veux comme article...' : 'Ex: 5 recruitment trends in 2025. Describe what you want...'}
                                    className="w-full px-4 py-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 resize-none"
                                    autoFocus
                                />
                            </div>

                            {/* Additional SEO settings */}
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

                            {/* Scheduling Section */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    {language === 'fr' ? 'Publication' : 'Publication'}
                                </label>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPublishMode('publish')}
                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${publishMode === 'publish'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Sparkles className={`w-5 h-5 mb-1 ${publishMode === 'publish' ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <span className="text-sm font-semibold">{language === 'fr' ? 'Publier direct' : 'Publish Now'}</span>
                                        </button>
                                        <button
                                            onClick={() => setPublishMode('draft')}
                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${publishMode === 'draft'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <FileText className={`w-5 h-5 mb-1 ${publishMode === 'draft' ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <span className="text-sm font-semibold">{language === 'fr' ? 'Brouillon' : 'Draft'}</span>
                                        </button>
                                        <button
                                            onClick={() => setPublishMode('schedule')}
                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${publishMode === 'schedule'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Clock className={`w-5 h-5 mb-1 ${publishMode === 'schedule' ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <span className="text-sm font-semibold">{language === 'fr' ? 'Programmer' : 'Schedule'}</span>
                                        </button>
                                    </div>

                                    {publishMode === 'schedule' && (
                                        <div className="flex gap-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex-1">
                                                <input
                                                    type="date"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="time"
                                                    value={scheduleTime}
                                                    onChange={(e) => setScheduleTime(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center text-center py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                <Check className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {language === 'fr' ? 'Article généré avec succès !' : 'Article successfully generated!'}
                                </h3>
                                {createdPostTitle && (
                                    <p className="text-sm font-medium text-blue-600 mb-3 bg-blue-50 py-1.5 px-3 rounded-full inline-block">
                                        ✨ {createdPostTitle}
                                    </p>
                                )}
                                <p className="text-gray-500">
                                    {language === 'fr'
                                        ? 'Votre article est prêt. Que souhaitez-vous faire ensuite ?'
                                        : 'Your article is ready. What would you like to do next?'}
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
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {language === 'fr' ? 'Modifier la date' : 'Update Schedule'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {language === 'fr' ? 'Publiez maintenant ou changez la date' : 'Publish now or choose a different date'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPublishMode('publish')}
                                            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${publishMode === 'publish'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Sparkles className={`w-4 h-4 mb-1 ${publishMode === 'publish' ? 'text-blue-500' : 'text-gray-400'}`} />
                                            <span className="text-xs font-semibold">{language === 'fr' ? 'Maintenant' : 'Publish Now'}</span>
                                        </button>
                                        <button
                                            onClick={() => setPublishMode('schedule')}
                                            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${publishMode === 'schedule'
                                                ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Clock className={`w-4 h-4 mb-1 ${publishMode === 'schedule' ? 'text-blue-500' : 'text-gray-400'}`} />
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
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            />
                                            <input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={(e) => setScheduleTime(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleReschedule}
                                        disabled={isUpdatingSchedule || (publishMode === 'schedule' && (!scheduleDate || !scheduleTime))}
                                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors flex items-center justify-center"
                                    >
                                        {isUpdatingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'fr' ? 'Valider les changements' : 'Update changes'}
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
                            disabled={!topic.trim() || isGenerating || (publishMode === 'schedule' && (!scheduleDate || !scheduleTime))}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-900/20"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {language === 'fr' ? 'Génération...' : 'Generating...'}
                                </>
                            ) : publishMode === 'schedule' ? (
                                <>
                                    <Clock className="w-4 h-4" />
                                    {language === 'fr' ? 'Programmer' : 'Schedule'}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    {language === 'fr' ? 'Générer l\'Article' : 'Generate Article'}
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full flex justify-center items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-all shadow-lg shadow-gray-900/20"
                        >
                            {language === 'fr' ? 'Fermer & Terminer' : 'Close & Finish'}
                        </button>
                    )}
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
